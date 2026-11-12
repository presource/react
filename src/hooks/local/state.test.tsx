import { storybookTestRunner } from '@library/test';
import { act, render } from '@testing-library/react';
import React from 'react';
import { useStateHook } from './state';
import * as stories from './state.stories';

describe('React StateHook Interaction Test', () => {
    storybookTestRunner(stories);
});

// Identity contract: same guarantee useReferenceHook makes (see
// reference.test.tsx) — a stable accessor identity is what effect and
// useCallback dep lists of every consumer are built against; a per-render
// identity re-fired ChatAssistantApp's jump-cleanup effect and cancelled
// the in-flight scroll animation mid-flight.
describe('useStateHook identity stability', () => {
    it('returns the same accessor instance across re-renders and keeps read/write/trigger semantics', () => {
        // Captures the accessor identity, the read value, and the render count.
        const renders: { accessor: (value?: any) => any; value: number }[] = [];
        const Probe: React.FC = () => {
            const state = useStateHook(3);
            renders.push({ accessor: state as any, value: state() });
            return null;
        };

        const probe = render(<Probe />);
        probe.rerender(<Probe />);
        probe.rerender(<Probe />);
        // Every render surfaces the EXACT same function object.
        expect(renders.length).toBe(3);
        expect(renders[1].accessor).toBe(renders[0].accessor);
        expect(renders[2].accessor).toBe(renders[0].accessor);

        // Writes still trigger a re-render and the fresh render reads the
        // new value through the SAME accessor identity. act() flushes the
        // setState the write performs.
        act(() => {
            renders[0].accessor(9);
        });
        expect(renders.length).toBe(4);
        expect(renders[3].value).toBe(9);
        expect(renders[3].accessor).toBe(renders[0].accessor);
    });
});
