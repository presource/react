import { useRef, useState } from 'react';
import { objectProxy } from '@presource/core';

// TODO: clarity - The type `PropsReactive` is `<T>(input: T) => T` which is correct, but
// the proxy only intercepts `set` operations. `get` operations return the stored value directly
// without any special handling. This means reading props doesn't trigger re-renders;
// only writing to the proxy does.

export type PropsReactive = <T extends { [key: string]: any }>(input: T) => T;

// This i s shallow props reactivity
export const propsReactive: PropsReactive = (changeableProps) => {
    const [_, refresh] = useState({});

    // ref always holds the latest props, never stale
    const propsRef = useRef(changeableProps);

    //  Standard Proxy
    return objectProxy(propsRef.current, {
        set: ({ key, value }) => {
            propsRef.current = { ...propsRef.current, [key]: value };

            // Tell the component to refresh
            refresh({});
            return true;
        }
    });
};
