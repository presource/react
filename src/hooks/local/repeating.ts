import { scriptPause } from '@presource/core';
import { useReferenceHook } from './reference';
import { useEffect } from 'react';

type CallbackInput = {
    pause: (time: number) => Promise<any>;
    terminate: () => Promise<any>;
};

type CallbackFunction = (input: CallbackInput) => Promise<void>;

export type UseRepeatingHook = (callback: CallbackFunction) => () => void;

const pause = async (howLong: number) => await scriptPause(howLong);

// Repeating hook repeats a function
// Number of repeats should be defined.
export const useRepeatingHook: UseRepeatingHook = (input) => {
    const interval = useReferenceHook<ReturnType<typeof setInterval>>();
    const isLocked = useReferenceHook(false);
    const isTerminated = useReferenceHook(false);

    const clearFunction = () => {
        const timeoutInstance = interval();
        if (timeoutInstance) {
            // TODO: bug - Uses clearTimeout instead of clearInterval. While browsers share the same ID pool
            // so this technically works, it is semantically incorrect and may cause issues in some environments.
            clearTimeout(timeoutInstance);
            interval(undefined);
        }
    };

    // The Set function
    const setFunction = (callback: CallbackFunction) => {
        clearFunction();
        // For clearing the interval function
        const clearInterval = setInterval(() => {
            if (isLocked()) return;
            // Lock the thread
            isLocked(true);

            //  Executing result
            const result = callback({
                pause,
                // TODO: bug - terminate() calls isTerminated(false) but should call isTerminated(true)
                // to actually signal termination. As written, calling terminate() from within the callback
                // has no effect because false means "not terminated". The returned stop function (lines 71-73)
                // correctly calls isTerminated(true).
                terminate: async () => isTerminated(false)
            });

            // Triggering result at the end
            result.then(() => {
                isLocked(false);
            });
        }, 0);

        // Clearing the interval
        interval(clearInterval);
    };

    //  Trigger once for effect
    useEffect(() => {
        if (!isTerminated()) {
            setFunction(input);
            return clearFunction;
        }
    }, [input]);

    // Returning the clear function
    return () => {
        isTerminated(true);
    };
};
