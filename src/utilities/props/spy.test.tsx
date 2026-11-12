// ── Unit tests for propsSpy (spy.ts) ──
//
// propsSpy wraps an object in a reactive Proxy that fires a callback on every
// property get/set operation. Recursively proxies nested objects (except React
// components, which are left as-is).
//
// File ref: spy.ts lines 23-79

import React from 'react';
import { propsSpy } from './spy';

// Helper to collect callback invocations into an array for assertions.
type CallbackEntry = Record<string, any>;
function createCollector(): { entries: CallbackEntry[]; callback: (args: any) => void } {
    const entries: CallbackEntry[] = [];
    const callback = (args: any) => entries.push({ ...args });
    return { entries, callback };
}

describe('propsSpy', () => {
    // ── Returns a Proxy-wrapped version of the input ──
    // The returned value should be a different object (Proxy) wrapping the original.
    it('returns a Proxy-wrapped version of the input', () => {
        const obj = { a: 1 };
        const { callback } = createCollector();
        const proxied = propsSpy(obj, callback);

        // Proxied should not be the same reference as obj (it's a Proxy)
        expect(proxied).not.toBe(obj);
        // But reading the property should work
        expect(proxied.a).toBe(1);
    });

    // ── get trap: callback invoked with correct params ──
    it('invokes callback on get with key, value, current, object, method, depth, path', () => {
        const obj = { name: 'test' };
        const { entries, callback } = createCollector();
        const proxied = propsSpy(obj, callback);

        // Trigger a get
        const _ = proxied.name;

        // Should have exactly one entry
        expect(entries).toHaveLength(1);
        const entry = entries[0];
        expect(entry.key).toBe('name');
        expect(entry.value).toBe('test');
        expect(entry.current).toBe('test');
        expect(entry.object).toBe(obj);
        expect(entry.method).toBe('get');
        expect(entry.depth).toBe(0);
        expect(entry.path).toStrictEqual(['name']);
    });

    // ── get trap: nested objects are recursively proxied ──
    it('recursively proxies nested objects with incremented depth', () => {
        const obj = { nested: { inner: 'value' } };
        const { entries, callback } = createCollector();
        const proxied = propsSpy(obj, callback);

        // Access nested object first (get 'nested')
        const nested = proxied.nested;
        // Then access inner property (get 'inner' on nested proxy)
        const _ = nested.inner;

        // Should have two entries: one for 'nested' (depth 0), one for 'inner' (depth 1)
        expect(entries).toHaveLength(2);
        expect(entries[0].key).toBe('nested');
        expect(entries[0].depth).toBe(0);
        expect(entries[0].path).toStrictEqual(['nested']);

        expect(entries[1].key).toBe('inner');
        expect(entries[1].depth).toBe(1);
        expect(entries[1].path).toStrictEqual(['nested', 'inner']);
        expect(entries[1].value).toBe('value');
    });

    // ── get trap: React components are NOT recursively proxied ──
    // spy.ts line 17-18 skips React components (identified by $$typeof)
    it('does NOT recursively proxy React components', () => {
        // Using a plain function without JSX so the test file stays .ts extension-compatible
        const MemoComp = React.memo(function Div() { return null; });
        // $$typeof is a Symbol, and React.memo sets it on the returned object.

        // Wrap in an object so the React component is a nested value
        const obj = { comp: MemoComp };
        const { entries, callback } = createCollector();
        const proxied = propsSpy(obj, callback);

        // Access the component property
        const comp = proxied.comp;

        // The get callback should fire once for 'comp'
        expect(entries).toHaveLength(1);

        // Accessing anything on 'comp' should NOT fire the spy callback
        // because it was returned as-is (not proxied).
        const _ = (comp as any)?.$$typeof;
        expect(entries).toHaveLength(1); // still 1 — no spy fire
    });

    // ── get trap: primitives returned as-is ──
    it('returns primitive values as-is from get', () => {
        const obj = { str: 'hello', num: 42, bool: true, nothing: null, undef: undefined };
        const { callback } = createCollector();
        const proxied = propsSpy(obj, callback);

        expect(proxied.str).toBe('hello');
        expect(proxied.num).toBe(42);
        expect(proxied.bool).toBe(true);
        expect(proxied.nothing).toBeNull();
        expect(proxied.undef).toBeUndefined();
    });

    // ── set trap: callback invoked with correct params ──
    it('invokes callback on set with key, value, current, object, method, depth, path', () => {
        const obj = { count: 0 };
        const { entries, callback } = createCollector();
        const proxied = propsSpy(obj, callback);

        // Trigger a set
        proxied.count = 5;

        expect(entries).toHaveLength(1);
        const entry = entries[0];
        expect(entry.key).toBe('count');
        expect(entry.value).toBe(5);
        expect(entry.current).toBe(0);
        expect(entry.object).toBe(obj);
        expect(entry.method).toBe('set');
        expect(entry.depth).toBe(0);
        expect(entry.path).toStrictEqual(['count']);
    });

    // ── set trap: value is actually updated ──
    it('updates the property value on set', () => {
        const obj = { count: 0 };
        const { callback } = createCollector();
        const proxied = propsSpy(obj, callback);

        proxied.count = 5;

        // Original object should be mutated
        expect(obj.count).toBe(5);
        // Reading through proxy should also return the new value
        expect(proxied.count).toBe(5);
    });

    // ── set trap: returns true ──
    // Proxy set trap must return a boolean. Truthy means the assignment succeeded.
    it('returns true from set', () => {
        const obj = { a: 1 };
        const { callback } = createCollector();
        const proxied = propsSpy(obj, callback);

        // Object.defineProperty or a direct set will test the return.
        // Using Reflect.set to check the return value.
        const result = Reflect.set(proxied, 'a', 2);
        expect(result).toBe(true);
    });

    // ── set trap: nested set builds correct path ──
    it('builds correct path array on nested set', () => {
        const obj = { nested: { value: 1 } };
        const { entries, callback } = createCollector();
        const proxied = propsSpy(obj, callback);

        // Access nested (get trap fires)
        const nested = proxied.nested;
        // Set inner property (set trap fires on the nested proxy)
        nested.value = 42;

        // Get trap for 'nested' (path: ['nested'])
        // Set trap for 'value' (path: ['nested', 'value'])
        expect(entries.length).toBeGreaterThanOrEqual(2);

        const getEntry = entries[0];
        expect(getEntry.method).toBe('get');
        expect(getEntry.path).toStrictEqual(['nested']);

        const setEntry = entries[entries.length - 1];
        expect(setEntry.method).toBe('set');
        expect(setEntry.key).toBe('value');
        expect(setEntry.value).toBe(42);
        expect(setEntry.current).toBe(1);
        expect(setEntry.path).toStrictEqual(['nested', 'value']);

        // Verify the original object was updated
        expect(obj.nested.value).toBe(42);
    });

    // ── deep nesting: path accumulates correctly ──
    it('accumulates path correctly through multiple nesting levels', () => {
        const obj = { a: { b: { c: 'deep' } } };
        const { entries, callback } = createCollector();
        const proxied = propsSpy(obj, callback);

        // Drill down three levels
        const a = proxied.a;
        const b = a.b;
        const _ = b.c;

        // get 'a': path ['a'], depth 0
        // get 'b': path ['a', 'b'], depth 1
        // get 'c': path ['a', 'b', 'c'], depth 2
        expect(entries).toHaveLength(3);
        expect(entries[0].path).toStrictEqual(['a']);
        expect(entries[0].depth).toBe(0);
        expect(entries[1].path).toStrictEqual(['a', 'b']);
        expect(entries[1].depth).toBe(1);
        expect(entries[2].path).toStrictEqual(['a', 'b', 'c']);
        expect(entries[2].depth).toBe(2);
        expect(entries[2].value).toBe('deep');
    });

    // ── arrays are objects but get proxied further ──
    // Arrays pass isObject() check, so they should be recursively proxied.
    it('recursively proxies array values', () => {
        const obj = { items: [1, 2, 3] };
        const { entries, callback } = createCollector();
        const proxied = propsSpy(obj, callback);

        // Access 'items' - returns a proxy-wrapped array
        const _ = proxied.items;

        // get 'items' fires once
        expect(entries).toHaveLength(1);
        expect(entries[0].key).toBe('items');
    });
});
