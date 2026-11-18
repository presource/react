import { useRef } from 'react';

// The accessor is argument-driven and keys off `updatedValue === undefined`: with no
// argument (or with an explicit `undefined`) it reads the ref, so the setter path can never
// clear the ref back to `undefined`.

export type UseReferenceHook = <T>(initialValue?: T) => {
    (): T;
    (value?: T): void;
};

// Ref-backed accessor: the value survives re-renders, and writes never re-render (nothing
// here calls a state setter).
export const useReferenceHook: UseReferenceHook = (initialValue) => {
    const reference = useRef(initialValue);

    // Create the accessor ONCE per component lifetime: consumers pass these
    // handles into useEffect/useCallback dependency lists under the documented
    // contract that state-hook handles are STABLE (see the mount-only and
    // cleanup effects in distribution/chat-assistant's ChatAssistantApp). A
    // per-render identity re-fires every effect that lists the handle as a
    // dep — for ChatAssistantApp's unmount-cleanup effect this CANCELLED the
    // in-flight scroll-jump rAF on the first mid-flight re-render, leaving the
    // message list scrolled only PART of the way to the target section edge
    // (the "up chevron goes partially, second click completes" glitch).
    // The closure captures the stable useRef box, so a first-render accessor
    // keeps reading/writing the live value for the whole lifetime.
    const accessor = useRef<{ (updatedValue?: any): any } | null>(null);
    if (accessor.current === null) {
        accessor.current = ((updatedValue: any) => {
            if (updatedValue === undefined) return reference.current;

            reference.current = updatedValue;
        }) as any;
    }

    return accessor.current as any;
};
