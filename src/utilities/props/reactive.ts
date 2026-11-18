import { useRef, useState } from 'react';
import { objectProxy } from '@presource/core';

// The proxy registers a `set` trigger only. `objectProxy` (packages/presource/core/src/object/
// proxy.ts) always installs a get trap, but with no `get` trigger registered that trap
// short-circuits to a plain `object[key]` read (the `if (!callback) return object[strKey]`
// branch), so reads stay ordinary property lookups: reading props never re-renders, only
// writing through the proxy does.

export type PropsReactive = <T extends { [key: string]: any }>(input: T) => T;

// Shallow reactivity: only the top-level keys of the wrapped object are proxied, so nested
// objects are handed out as-is and writes inside them are never seen.
export const propsReactive: PropsReactive = (changeableProps) => {
    const [_, refresh] = useState({});

    // The ref is seeded once, on the first render, and is never re-seeded: later renders
    // pass a fresh props object into `useRef`, which React ignores. So the wrapped value is
    // the first render's props plus whatever was written through the proxy — prop changes
    // pushed down by the parent are not picked up.
    const propsRef = useRef(changeableProps);

    // The write reassigns the ref instead of writing the proxy's own target, so reading the
    // same key back through THIS proxy instance still yields the pre-write value; the
    // refresh below re-runs the component, and the new render builds a proxy over the new
    // ref value — that is how the written value surfaces. Returning true is required by the
    // Proxy set trap, and is exactly why frozen targets throw here (see
    // components/builder/reactive/reactive-component.ts).
    return objectProxy(propsRef.current, {
        set: ({ key, value }) => {
            propsRef.current = { ...propsRef.current, [key]: value };

            // Tell the component to refresh
            refresh({});
            return true;
        }
    });
};
