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

// Repeats `input` on a `setInterval(..., 0)` tick until the loop is stopped: there is no
// repeat count, and the interval runs until the returned `stop`, an in-callback `terminate`,
// or unmount. Each iteration is locked (`isLocked`) so a new one cannot start before the
// previous callback settles.
export const useRepeatingHook: UseRepeatingHook = (input) => {
    const interval = useReferenceHook<ReturnType<typeof setInterval>>();
    const isLocked = useReferenceHook(false);
    const isTerminated = useReferenceHook(false);

    const clearFunction = () => {
        const intervalInstance = interval();
        if (intervalInstance) {
            // `clearInterval` — the handle comes from `setInterval`, so it must be
            // released through the API that created it (the previous revision cleared it
            // with `clearTimeout`; jsdom happens to accept that because its
            // browser/Window.js registers timeouts and intervals in one shared
            // `listOfActiveTimers` map, which both `clearTimeout` and `clearInterval`
            // look up — so the old call worked by luck, not by contract).
            clearInterval(intervalInstance);
            interval(undefined);
        }
    };

    // The Set function: restarts the loop by clearing any live interval and installing a
    // fresh 0ms interval over `callback`.
    const setFunction = (callback: CallbackFunction) => {
        clearFunction();
        // The tick that drives every iteration; the handle is stored below so
        // `clearFunction`/`stop` can release it.
        const intervalInstance = setInterval(() => {
            // Termination is checked here as well as in `stop`/unmount: a tick can be
            // queued before the cleanup runs, and gating only on `isLocked` let a
            // "stopped" loop keep driving the callback.
            if (isTerminated() || isLocked()) return;
            // Lock this iteration: no further tick runs the callback until the current
            // promise settles.
            isLocked(true);

            //  Runs the callback with the pause/terminate controls
            const result = callback({
                // Waits `howLong` and only then resumes the caller — unless the loop has
                // been terminated in the meantime.
                pause: async (howLong: number) => {
                    if (isTerminated()) return park();

                    await scriptPause(howLong);

                    // Post-`await` termination guard. Without it, a `pause` that is
                    // already in flight when `stop()`/unmount happens still resolves and
                    // the caller resumes onto a tree that is gone: the story's
                    // `state(state() + 1)` (src/hooks/local/repeating.stories.tsx) drives
                    // React's `setState` (the write path of `useStateHook` in
                    // src/hooks/local/state.ts) after the test environment has dropped its
                    // `window` global, which rejects with `ReferenceError: window is not
                    // defined` out of react-dom's `getCurrentEventPriority`
                    // (react-dom.development.js reads a bare `window`) — an unhandled
                    // rejection that fails an otherwise green vitest run.
                    if (isTerminated()) {
                        // The loop is over: release the lock so the parked iteration does
                        // not leave a dangling "still running" state behind.
                        isLocked(false);

                        return park();
                    }
                },
                // `terminate()` signals the loop to stop from inside the callback
                // (knowledge.md, the `useRepeatingHook` key-concepts list): flag it and cancel
                // the interval, the same two things the returned `stop` function does. The
                // previous revision wrote `isTerminated(false)` — an inverted flag that made
                // this a no-op.
                terminate: async () => {
                    isTerminated(true);
                    clearFunction();
                }
            });

            // Releases the per-iteration lock when the callback settles. A callback parked
            // by a terminated `pause` never settles, so its lock is released only by the
            // guard inside `pause` itself.
            result.then(() => {
                isLocked(false);
            });
        }, 0);

        // Clearing the interval
        interval(intervalInstance);
    };

    // Unmount signal, in a mount-only effect: `pause` must be able to tell that the
    // component is gone, and the `[input]` effect below cannot double as that signal — it is
    // driven by callback identity, and the inline closures consumers pass (the story's
    // included) make it re-run on every re-render, so its cleanup also fires on plain
    // re-renders. The setup side re-arms the flag so a remount (React 18
    // StrictMode / Fast Refresh runs setup -> cleanup -> setup on the same instance)
    // starts a live loop again instead of inheriting the previous teardown's flag.
    useEffect(() => {
        isTerminated(false);
        return () => {
            isTerminated(true);
        };
    }, []);

    //  Re-arms the loop whenever the callback identity changes. Consumers pass inline
    //  closures (the story included), so in practice this effect tears the interval down and
    //  starts a new one on every render; a memoised callback would keep the loop running
    //  instead. Either way it is deliberately not the unmount signal (see the mount-only
    //  effect above). Once `isTerminated` is set it stays set, so nothing restarts after
    //  `stop()`.
    useEffect(() => {
        if (!isTerminated()) {
            setFunction(input);
            return clearFunction;
        }
    }, [input]);

    //  Returning the clear function: `stop()` terminates the loop for good
    //  (knowledge.md, the `useRepeatingHook` key-concepts list). Both the flag AND the
    //  interval handle are released — the previous revision only flipped the flag and left
    //  the interval ticking, so a stopped hook kept driving the callback (and its state
    //  updates) until the component unmounted.
    return () => {
        isTerminated(true);
        clearFunction();
    };
};
