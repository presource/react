// ── Unit tests for isReactComponent (check.ts) ──
//
// Checks whether a given value is a React component by testing for the
// presence of React's internal `$$typeof` symbol.
//
// `$$typeof` is set by React on objects returned from:
//   - React.memo()       → REACT_MEMO_TYPE symbol
//   - React.forwardRef() → REACT_FORWARD_REF_TYPE symbol
//
// Plain function components (React.FC) do NOT have $$typeof set directly,
// so isReactComponent returns false for them.
//
// File ref: check.ts line 12-13

import React from 'react';
import { isReactComponent } from './check';

describe('isReactComponent', () => {
    // ── React.memo() components ──
    // React.memo wraps a function component and sets $$typeof on the result.
    it('returns true for React.memo() components', () => {
        const MemoComp = React.memo(() => <div />);
        expect(isReactComponent(MemoComp)).toBe(true);
    });

    // ── React.forwardRef() components ──
    // forwardRef sets $$typeof on the returned object.
    it('returns true for React.forwardRef() components', () => {
        const ForwardRefComp = React.forwardRef<HTMLDivElement>((_props, _ref) => <div ref={_ref} />);
        expect(isReactComponent(ForwardRefComp)).toBe(true);
    });

    // ── Plain objects (no $$typeof) ──
    it('returns false for plain objects', () => {
        expect(isReactComponent({})).toBe(false);
        expect(isReactComponent({ key: 'value' })).toBe(false);
    });

    // ── null / undefined ──
    // null?.$$typeof is undefined → false. undefined?.$$typeof is undefined → false.
    it('returns false for null', () => {
        expect(isReactComponent(null)).toBe(false);
    });

    it('returns false for undefined', () => {
        expect(isReactComponent(undefined)).toBe(false);
    });

    // ── Strings ──
    // Strings do not have a $$typeof property.
    it('returns false for strings', () => {
        expect(isReactComponent('div')).toBe(false);
        expect(isReactComponent('hello')).toBe(false);
    });

    // ── Numbers ──
    // Numbers are not objects, so ?.$$typeof is undefined.
    it('returns false for numbers', () => {
        expect(isReactComponent(42)).toBe(false);
        expect(isReactComponent(0)).toBe(false);
    });

    // ── Booleans ──
    it('returns false for booleans', () => {
        expect(isReactComponent(true)).toBe(false);
        expect(isReactComponent(false)).toBe(false);
    });

    // ── Arrays ──
    // Arrays are objects but have no $$typeof.
    it('returns false for arrays', () => {
        expect(isReactComponent([])).toBe(false);
        expect(isReactComponent([1, 2, 3])).toBe(false);
    });

    // ── Plain function components (React.FC) ──
    // A plain function component does NOT have $$typeof set. Only memo/forwardRef
    // wrappers set that symbol. This is a known limitation noted in check.ts line 10.
    it('returns false for plain function components (no memo/forwardRef)', () => {
        const PlainComp: React.FC<{ label?: string }> = () => <div />;
        expect(isReactComponent(PlainComp)).toBe(false);
    });
});
