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

// "Build now, execute later": the callback is captured once when the hook is created, and every
// call WITH arguments runs it with those arguments and publishes the result — a promise result is
// published when it settles, which is what makes an async callback need no `await` at the call
// site. A call with NO arguments skips the callback and returns the last published value — and
// because `useStateHook` (./state.ts) reads `undefined` as its read signal, a callback that
// resolves to `undefined` publishes nothing and re-renders nothing.

export const useDelegateHook: UseDelegateHook = (callback) => {
    const state = useStateHook();

    // The executor: runs the captured callback with the forwarded arguments and publishes
    // whatever it returns (a promise is published as its resolved value, see the note above).
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

        // The cast is load-bearing: `parameters` is a plain `any[]` while `executor`'s parameter
        // is the callback's fixed-arity tuple, and without the cast this call fails with TS2345
        // ("Argument of type 'any[]' is not assignable to parameter of type 'P'" — observed; the
        // sibling TS2556 is the error for spreading a non-tuple straight into a call, and typing
        // the value as the tuple is also what keeps `callback(...args)` inside `executor` legal).
        executor(parameters as Parameters<typeof callback>);
    };

    // Extra handles on the same accessor: `get` reads the published value and `set` writes one
    // directly — neither of them runs the callback.
    Object.assign(handler, {
        get: () => state(),
        set: (input: any) => {
            state(input);
        }
    });

    return handler;
};
