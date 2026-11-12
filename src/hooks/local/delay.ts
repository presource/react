import { useStateHook } from './state';
import { useReferenceHook } from './reference';
import { isPromise } from '@presource/core';
import { useEffect } from 'react';

// TODO: clarity - The return type `(input?: Possible<T>, waitFor?: number) => Awaited<T> | undefined`
// implies it always returns a value, but it only returns a value when called with NO arguments (the getter).
// When called with arguments, it starts a new delay and returns undefined.
// Consider splitting into two overloads for clarity.
type Possible<T> = (() => T) | (() => Promise<T>);
export type UseDelayHook = <T>(
    input: Possible<T>,
    waitFor?: number
) => (input?: Possible<T>, waitFor?: number) => Awaited<T> | undefined;
type Callback = () => any;

// Delay hook design for delay a call
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
