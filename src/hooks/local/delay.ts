import { useStateHook } from './state';
import { useReferenceHook } from './reference';
import { isPromise } from '@presource/core';
import { useEffect } from 'react';

// The returned function is argument-driven: with no argument it returns whatever the last
// scheduled callback produced (undefined until the first timer has fired), and with a callback
// argument it clears any pending timer, re-arms with that callback and returns nothing. The wait
// length only changes when `newDelay` (the accessor's second argument) is provided — omitted, the
// previously stored delay is reused. `undefined` is therefore the read signal, so the hook cannot
// be re-armed by passing an explicit `undefined`. The mount-only effect below captures `input` and
// `waitFor` from the first render only; later re-renders do not re-schedule it.
type Possible<T> = (() => T) | (() => Promise<T>);
export type UseDelayHook = <T>(
    input: Possible<T>,
    waitFor?: number
) => (input?: Possible<T>, waitFor?: number) => Awaited<T> | undefined;
type Callback = () => any;

// One-shot delayed call with manual re-arming: the hook's callback runs once after `waitFor`, and
// calling the accessor with a new callback schedules that one instead, after clearing the pending
// timer. A callback whose promise is already in flight is NOT cancelled, so it still publishes its
// result when it settles.
export const useDelayHook: UseDelayHook = (input, waitFor = 0) => {
    const state = useStateHook();
    const timeout = useReferenceHook<ReturnType<typeof setTimeout>>();
    const delay = useReferenceHook(waitFor);

    const setFunction = (callback: Callback) => {
        // Setting the callback instance
        const timeOutInstance = setTimeout(() => {
            const result = callback();

            if (isPromise(result)) {
                result.then((response: any) => {
                    state(response);
                });
            } else {
                state(result);
            }
        }, delay());

        timeout(timeOutInstance);
    };

    const clearFunction = () => {
        const timeoutInstance = timeout();
        if (timeoutInstance) {
            clearTimeout(timeoutInstance);
            timeout(undefined);
        }
    };

    useEffect(() => {
        delay(waitFor);
        setFunction(input);
        return clearFunction;
    }, []);

    return (newCallback?: Callback, newDelay?: number) => {
        if (newCallback === undefined) {
            return state() as any;
        }
        clearFunction();
        if (newDelay !== undefined) {
            delay(newDelay);
        }
        setFunction(newCallback);
    };
};
