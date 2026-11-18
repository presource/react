import { isInvalid, objectExtract, stringSwitch } from '@presource/core';
import { useEffect, useState } from 'react';
import { propsSpy } from '../utilities';

// The 'state' / 'data' overloads below are declared but not implemented. `propsSpy`
// (../utilities/props/spy.ts) installs only `get` and `set` traps, so calling the returned
// store — `store('data')`, `store('state')` — falls straight through to `useData`, which
// ignores its argument. Outside a render that fails immediately: React logs its
// "Invalid hook call" warning and the `useState` inside `useData` then throws
// `TypeError: Cannot read properties of null (reading 'useState')` because the dispatcher is
// null (both observed on this React/ReactDOM build). Inside a render `useData` hands back the
// raw state object, which carries no `reset`/`initial`/`refresh` member, so
// `store('data').reset` is undefined and calling it fails. Only the no-argument read and the
// direct property writes (`store.counter++`) work. See context/global.stories.tsx, where the
// Reset play step is commented out for exactly this reason.

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
