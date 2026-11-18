import React from 'react';
import { propsReactive } from '../../../utilities';

export type ReactiveComponent = <T extends {}>(component: React.FC<T>) => React.FC<T>;

// Builds a reactive component: wraps `component` in `React.memo` and hands it the props
// object run through `propsReactive` (utilities/props/reactive.ts), so assigning to a prop
// inside the component triggers a re-render. Reads are plain lookups — only writes re-render.
//
// IMPORTANT: React's development build freezes the element props — `Object.freeze(element.props)`
// runs inside the internal `ReactElement` factory (node_modules/react/cjs/react.development.js),
// which `createElement` delegates to, so the props object that reaches this wrapper is frozen:
// non-writable, non-configurable data properties. The set trap `propsReactive` installs returns
// true without ever writing the trap's own target, and a Proxy rejects that outcome for such a
// property ("'set' on proxy: trap returned truish for property '…' which exists in the proxy
// target as a non-configurable and non-writable data property with a different value"). Spreading
// `props` into a plain mutable object first is what makes the trap legal.
// reactive-component.test.tsx and utilities/props/reactive.test.tsx do exercise this path on the
// dev build (so the spread does run against frozen props there), but neither asserts the failure
// mode itself: nothing pins that dropping the spread makes a prop write throw.
export const reactiveComponent: ReactiveComponent = (component) => {
    return React.memo((props: any) => {
        // Spread props into a mutable copy before wrapping them in the reactive proxy, which
        // is what keeps the set trap legal against React's frozen element props
        // (see the note above `reactiveComponent`).
        return component(propsReactive({ ...props }));
    });
};
