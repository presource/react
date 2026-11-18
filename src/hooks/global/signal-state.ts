import { isFunction } from '@presource/core';
import { useEffect, useState } from 'react';

// The returned accessor is argument-driven, and that distinction is what the single
// signature hides: called with no argument it reads AND subscribes (it runs `useState` +
// `useEffect`, so that call has to happen during a render), while a call with a value or
// an updater only writes and notifies every subscriber — it never subscribes itself. The updater's
// RETURN value becomes the new value (the story's `counter((value) => value + 1)` relies on that),
// even though SignalState declares the updater as `(input: T) => void`.
// `undefined` is the read signal, so a signal cannot be written to `undefined`. `signal.value` is
// the same `valueFunction`: with no argument it reads without subscribing, with one it writes —
// the `value: () => T` on SignalState below declares only the read half.

export type SignalState = <T>(initialValue: T) => {
    (updated?: T | ((input: T) => void)): T;
    value: () => T;
};

// One value plus a subscriber Set closed over by the returned accessor: a no-argument call reads
// it and subscribes the calling component (a write by anyone else re-renders it through the
// `setState` captured below), and `value` reads or writes without subscribing at all.
export const signalState: SignalState = (initialValue) => {
    let value = initialValue;
    const list = new Set<() => void>();

    const valueFunction = (newValue: any) => {
        if (newValue === undefined) {
            return value;
        }

        // If it is function, triggers the function
        if (isFunction(newValue)) {
            newValue = newValue(value);
        }

        value = newValue;
        list.forEach((refresh) => refresh());
        return value;
    };

    const handlerFunction: any = (newValue: undefined) => {
        if (newValue === undefined) {
            const setState = useState({})[1];
            useEffect(() => {
                const refresh = () => setState({});
                list.add(refresh);
                // Clean up
                return () => {
                    list.delete(refresh);
                };
            }, []);
            return value;
        }
        return valueFunction(newValue);
    };

    Object.assign(handlerFunction, {
        value: valueFunction
    });

    // Return the handler function
    return handlerFunction;
};
