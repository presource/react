import React from 'react';
import { propsReactive } from '../../../utilities';

export type ReactiveComponent = <T extends {}>(component: React.FC<T>) => React.FC<T>;

// For building a reactive component
//
// Wraps `component` with `React.memo` and passes props through `propsReactive`
// so that prop mutations (assignments to the props object) trigger a re-render.
//
// File ref: reactive-component.ts
//
// IMPORTANT: React props objects passed by React.createElement may be frozen
// (non-writable data properties). A Proxy `set` trap on a frozen target throws
// if the handler returns `true` but the value differs. To avoid this, we spread
// `props` into a plain mutable object before passing to `propsReactive`.
// See: reactive.test.tsx and reactive-component.test.tsx for usage patterns.
//
// NOTE: `propsReactive` only intercepts `set` operations. Reading props does
// not trigger re-renders; only writing to the proxied props does.
export const reactiveComponent: ReactiveComponent = (component) => {
    return React.memo((props: any) => {
        // Spread props into a mutable copy before wrapping in the reactive proxy.
        // This avoids Proxy set trap errors when React provides frozen props objects.
        // See reactive-component.test.tsx for the failing case this fixes.
        return component(propsReactive({ ...props }));
    });
};
