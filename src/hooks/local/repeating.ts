import { scriptPause } from '@presource/core';
import { useReferenceHook } from './reference';
import { useEffect } from 'react';

type CallbackInput = {
    pause: (time: number) => Promise<any>;
    terminate: () => Promise<any>;
};

type CallbackFunction = (input: CallbackInput) => Promise<void>;

export type UseRepeatingHook = (callback: CallbackFunction) => () => void;

// A promise that never settles. Returning it from `pause` parks the awaiting
// callback: its post-`await` body (in practice a state update, see the comment in
// `setFunction`) never runs, which is what "stop/terminate the loop" means. Parking
// rather than rejecting is deliberate — a rejected `pause` would surface as an
// unhandled rejection of the callback promise, i.e. the very noise this hook must not
// add to a test run.
const park = () => new Promise<any>(() => undefined);

// Repeating hook repeats a function
// Number of repeats should be defined.
export const useRepeatingHook: UseRepeatingHook = (input) => {
    const interval = useReferenceHook<ReturnType<typeof setInterval>>();
    const isLocked = useReferenceHook(false);
    const isTerminated = useReferenceHook(false);

    const clearFunction = () => {
        const intervalInstance = interval();
        if (intervalInstance) {
            // `clearInterval` — the handle comes from `setInterval`, so it must be
            // released through the API that created it (the previous revision cleared it
            // with `clearTimeout`; jsdom registers both kinds in one `listOfActiveTimers`
            // map, so clearTimeout happened to work — see
            // jsdom/lib/jsdom/browser/Window.js, and the TODO this replaces).
            clearInterval(intervalInstance);
            interval(undefined);
        }
    };

    // The Set function
    const setFunction = (callback: CallbackFunction) => {
        clearFunction();
        // For clearing the interval function
        const intervalInstance = setInterval(() => {
            // Termination is checked here as well as in `stop`/unmount: a tick can be
            // queued before the cleanup runs, and gating only on `isLocked` let a
            // "stopped" loop keep driving the callback.
            if (isTerminated() || isLocked()) return;
            // Lock the thread
            isLocked(true);

            //  Executing result
            const result = callback({
                // Waits `howLong` and only then resumes the caller — unless the loop has
                // been terminated in the meantime.
                pause: async (howLong: number) => {
                    if (isTerminated()) return park();

                    await scriptPause(howLong);

                    // Post-`await` termination guard. Without it, a `pause` that is
                    // already in flight when `stop()`/unmount happens still resolves and
                    // the caller resumes onto a tree that is gone: the story's
                    // `state(state() + 1)` (src/hooks/local/repeating.stories.tsx:20)
                    // calls React's `setState` (src/hooks/local/state.ts:35) after the
                    // test environment has dropped its `window` global, which rejects
                    // with `ReferenceError: window is not defined` out of react-dom's
                    // `getCurrentEventPriority` (react-dom.development.js:10993 reads a
                    // bare `window`) — an unhandled rejection that fails an otherwise
                    // green vitest run.
                    if (isTerminated()) {
                        // The loop is over: release the lock so the parked iteration does
                        // not leave a dangling "still running" state behind.
                        isLocked(false);

                        return park();
                    }
                },
                // `terminate()` signals the loop to stop from inside the callback
                // (knowledge.md:348): flag it and cancel the interval, the same two
                // things the returned `stop` function does. The previous revision wrote
                // `isTerminated(false)` — an inverted flag that made this a no-op.
                terminate: async () => {
                    isTerminated(true);
                    clearFunction();
                }
            });

            // Triggering result at the end
            result.then(() => {
                isLocked(false);
            });
        }, 0);

        // Clearing the interval
        interval(intervalInstance);
    };

    // Unmount signal, in a mount-only effect: `pause` must be able to tell that the
    // component is gone, and the `[input]` effect below re-runs on EVERY re-render (the
    // callback argument is a fresh closure each render), so its cleanup cannot double as
    // the unmount signal. The setup side re-arms the flag so a remount (React 18
    // StrictMode / Fast Refresh runs setup -> cleanup -> setup on the same instance)
    // starts a live loop again instead of inheriting the previous teardown's flag.
    useEffect(() => {
        isTerminated(false);
        return () => {
            isTerminated(true);
        };
    }, []);

    //  Trigger once for effect
    useEffect(() => {
        if (!isTerminated()) {
            setFunction(input);
            return clearFunction;
        }
    }, [input]);

    //  Returning the clear function: `stop()` terminates the loop for good
    //  (knowledge.md:349). Both the flag AND the interval handle are released — the
    //  previous revision only flipped the flag and left the interval ticking, so a
    //  stopped hook kept driving the callback (and its state updates) until the
    //  component unmounted.
    return () => {
        isTerminated(true);
        clearFunction();
    };
};
