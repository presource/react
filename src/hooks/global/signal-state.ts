import { isFunction } from '@presource/core';
import { useEffect, useState } from 'react';

// TODO: clarity - The type signature `(updated?: T | ((input: T) => void)): T` suggests the function
// returns T in all cases, but when called with an updater it actually returns T (the new value).
// The `value` accessor is a separate function that reads without subscribing.
// Consider documenting this distinction more clearly or splitting the overloads.

export type SignalState = <T>(initialValue: T) => {
    (updated?: T | ((input: T) => void)): T;
    value: () => T;
};

// Signal State
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
