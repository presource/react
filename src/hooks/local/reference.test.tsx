import { storybookTestRunner } from '@library/test';
import { render } from '@testing-library/react';
import React from 'react';
import { useReferenceHook } from './reference';
import * as stories from './reference.stories';

describe('React ReferenceHook Interaction Test', () => {
    // Executing the necessary test
    storybookTestRunner(stories);
});

// Identity contract: the accessor MUST keep one stable function identity
// across re-renders. Consumers list these handles in useEffect/useCallback
// dep arrays under exactly that documented assumption (ChatAssistantApp's
// scroll-jump unmount-cleanup effect is the canonical case: a per-render
// identity re-fired the effect's cleanup mid-animation and
// cancelAnimationFrame'd the in-flight rAF — the "up chevron scrolls only
// partially" glitch, fixed in reference.ts by creating the accessor once
// per component lifetime over the stable useRef box).
describe('useReferenceHook identity stability', () => {
    it('returns the same accessor instance across re-renders and keeps reads/writes live', () => {
        // Captures the accessor identity (and the value it reads) on every render.
        const renders: { accessor: (value?: any) => any; value: number }[] = [];
        const Probe: React.FC = () => {
            const reference = useReferenceHook(7);
            renders.push({ accessor: reference as any, value: reference() });
            return null;
        };

        const probe = render(<Probe />);
        // Two bare re-renders (no writes in between).
        probe.rerender(<Probe />);
        probe.rerender(<Probe />);
        // Every render must surface the EXACT same function object.
        expect(renders.length).toBe(3);
        expect(renders[1].accessor).toBe(renders[0].accessor);
        expect(renders[2].accessor).toBe(renders[0].accessor);

        // A write through the FIRST captured accessor must be visible to a
        // later render's read — the frozen closure targets the live ref.
        renders[0].accessor(42);
        probe.rerender(<Probe />);
        expect(renders[3].value).toBe(42);
    });
});
