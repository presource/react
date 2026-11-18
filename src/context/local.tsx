import React, { createContext, useContext, useEffect, useState } from 'react';
import { dataClone, stringSwitch } from '@presource/core';
import { propsSpy } from '../utilities';

// RUNTIME vs DECLARED TYPE: the `LocalContextStore` type below documents three ways to call
// `contextStore` -- `()` for the live context, `('data')` for `{ clone, update }`, `('state')`
// for `{ reset, refresh }` -- but only the no-argument read exists at runtime. The accessor
// `createContextStore` returns is a zero-parameter arrow, so the argument in
// `contextStore('data')` is dropped and the call yields the same propsSpy-wrapped context object
// as `contextStore()`. Reading `clone`/`update`/`reset`/`refresh` off it only goes through the
// spy's get trap and comes back `undefined` (spy.ts hands back `item[key]`), so none of those
// documented members is callable anywhere; no call site in the repo uses those two forms. The
// declared shape is unreachable for types as well: `propsSpy` is typed as core's `ObjectObserve`
// (packages/presource/core/src/object/observe.ts), whose declared result is `Item`, so this
// accessor's own type is `() => Item` rather than the three overloads returning T. That is why
// the `as any` on this function's return value is load-bearing: dropping it makes
// `yarn tsc --noEmit` fail with TS2322 on the `localContextStore` declaration —
// "Type '... contextStore: () => Item; }' is not assignable to type
// 'LocalContextStore'". What is actually exercised (the story in
// context/local.stories.tsx, and the consumers under packages/react) is the no-argument read plus
// direct property writes such as `store.counter++`.

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
