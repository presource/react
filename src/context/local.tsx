import React, { createContext, useContext, useEffect, useState } from 'react';
import { dataClone, stringSwitch } from '@presource/core';
import { propsSpy } from '../utilities';

// TODO: clarity - The `localContextStore` type defines three overloads for contextStore:
// - `contextStore()` returns T (subscribes to updates)
// - `contextStore('data')` returns `{ clone, update }`
// - `contextStore('state')` returns `{ reset, refresh }`
// However, the `createContextStore` function (line 57) only implements the no-argument case.
// The 'data' and 'state' options are NOT implemented. The story demonstrates `contextStore()`
// but never tests `contextStore('data')` or `contextStore('state')`.

type ContextProviderProps = {
    data?: { [key: string]: any };
    children: React.ReactNode;
};

export type LocalContextStore = <T extends { [key: string]: any }>(
    initialContext: T
) => {
    ContextProvider: React.FC<ContextProviderProps>;
    contextStore: {
        (): T;
        (input: 'data'): {
            clone: () => T;
            update: (input: T) => void;
        };
        (input: 'state'): {
            reset: () => void;
            refresh: () => void;
        };
    };
};

// This is designed for component/module basis context store type
export const localContextStore: LocalContextStore = (initialContext) => {
    // Creating the context object to edit
    const Context = createContext(null);

    // The context provider wraps around everything
    const ContextProvider: React.FC<ContextProviderProps> = React.memo(({ children, data }) => {
        const currentContext: any = {
            ...dataClone(initialContext),
            ...data
        };

        return <Context.Provider value={currentContext}>{children}</Context.Provider>;
    });

    return {
        ContextProvider,
        contextStore: createContextStore(Context, initialContext)
    } as any;
};

// For Creating the initial context functionality
const createContextStore = (Context: any, initialContext: any) => {
    const list = new Set<() => void>();

    // For triggering all the refresh
    const triggerRefresh = () => {
        setTimeout(() => {
            list.forEach((refresh) => refresh());
        });
    };

    return () => {
        const current: any = useContext(Context) || {};
        const setState = useState({})[1];

        useEffect(() => {
            const refresh = () => setState({});
            list.add(refresh);
            return () => {
                list.delete(refresh);
            };
        }, []);

        // Modifying the current context
        return propsSpy(current, ({ method }) => {
            stringSwitch(method, {
                set: () => triggerRefresh()
            });
        });
    };
};
