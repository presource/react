import { useStateHook } from './state';
import { isPromise } from '@presource/core';

type Possible<T, P extends unknown[]> = ((...input: P) => Promise<T>) | ((...input: P) => T);

export type UseDelegateHook = <T, P extends unknown[]>(callback: Possible<T, P>) => Executor<T, P> & ExtendedHandler<T>;

type Executor<T, P extends unknown[]> = (
    ...input: [] | [null] | P
) => T extends void ? any | Promise<any> : T | Promise<T>;

type ExtendedHandler<T> = {
    set: (input: T extends void ? any | Promise<any> : T | Promise<T>) => void;
    get: () => T extends void ? any | Promise<any> : T | Promise<T>;
};

// Delegate hook is build now and execute later.
// It also allows you to run async function easier

export const useDelegateHook: UseDelegateHook = (callback) => {
    const state = useStateHook();

    // This is the designated executor
    const executor = (args: Parameters<typeof callback>) => {
        // Executing function
        const result = callback(...args);
        if (isPromise(result)) {
            // Getting the final response
            result.then((response: any) => {
                // Updating the final response
                state(response);
            });
        } else {
            state(result);
        }
    };

    const handler: any = (...parameters: any[]) => {
        if (!parameters.length) {
            return state();
        }

        // Why is this: TS2556: A spread argument must either have a tuple type or be passed to a rest parameter
        executor(parameters as Parameters<typeof callback>);
    };

    // Assigning new functionality
    Object.assign(handler, {
        get: () => state(),
        set: (input: any) => {
            state(input);
        }
    });

    return handler;
};
