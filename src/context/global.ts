import { isInvalid, objectExtract, stringSwitch } from '@presource/core';
import { useEffect, useState } from 'react';
import { propsSpy } from '../utilities';

// TODO: clarity - The type signature defines `store('data')` returning `{ reset, initial }` and
// `store('state')` returning `{ refresh }`, but the proxyHandler implementation only handles
// 'get' and 'set' methods. The 'data' and 'state' option overloads are NOT implemented.
// This means `store('data').reset()` will not work as documented. This is a known bug
// (see global.stories.tsx where the reset test is commented out).

export type GlobalContextStore = <T extends { [key: string]: any }>(
    input: T
) => T & {
    (): T;
    (option: 'state'): {
        refresh: () => void;
    };
    (option: 'data'): {
        // For resetting a specific data
        reset: (field?: keyof T) => void;
        // For checking an initial
        initial: () => T;
    };
};

// For Creating a React Context Store
export const globalContextStore: GlobalContextStore = (initialState = {} as any) => {
    // The current state store
    const stateStore = { ...initialState };

    const getCurrentState = () => {
        return stateStore as any;
    };

    // List of all components that need to be refreshed
    const refreshList = new Set<() => void>();

    // Force re-rendering of each app
    const forceRerender = () => {
        setTimeout(() => {
            refreshList.forEach((refresh) => refresh());
        });
    };

    // Use Data Hook
    const useData = () => {
        const setState = useState({})[1];
        useEffect(() => {
            // For forcing a refresh pattern
            const refresh = () => {
                setState({});
            };
            refreshList.add(refresh);
            // Cleaning up
            return () => {
                refreshList.delete(refresh);
            };
        }, []);
        // Return the current state
        return getCurrentState();
    };

    // Proxying the use data handler
    const proxyHandler: any = propsSpy(useData, ({ depth, method, object, value, key, path }) => {
        stringSwitch(method, {
            get: () => {
                const currentValue = objectExtract(getCurrentState(), path.join('.'));
                if (isInvalid(currentValue)) {
                    object[key] = null;
                } else {
                    object[key] = currentValue;
                }
            },
            set: () => {
                if (!depth) {
                    getCurrentState()[key] = value;
                }
                forceRerender();
            }
        });
    });

    // Returning the proxy handler
    return proxyHandler;
};
