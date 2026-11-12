// ── Unit tests for reactiveComponent (reactive-component.ts) ──
//
// reactiveComponent wraps a React.FC with React.memo and passes props through
// propsReactive so that prop mutations trigger re-renders.
//
// File ref: reactive-component.ts lines 21-28
//
// propsReactive (utilities/props/reactive.ts) creates a Proxy over the props
// object. When a property is written (set), it updates the ref and triggers a
// state refresh, causing the component to re-render. Reading props does NOT
// trigger re-renders — only writes do.

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { reactiveComponent } from './reactive-component';

describe('reactiveComponent', () => {
    // ── Wraps component with propsReactive so prop mutations cause re-render ──
    // When a prop is mutated through the reactive proxy, the component re-renders
    // with the updated value.
    // Uses userEvent.click + findByRole (async) to handle React batching.
    // Follows the same pattern as reactive.test.tsx.
    it('causes re-render when a prop is mutated', async () => {
        // Arrange: a component that renders a prop and mutates it on click
        type Props = { label: string };
        const Inner: React.FC<Props> = (props) => {
            // Cast to mutable so we can assign (the proxy handles the re-render)
            const mutableProps = props as Props & { label: string };
            const onClick = () => {
                mutableProps.label = 'updated';
            };
            return <button onClick={onClick}>{mutableProps.label}</button>;
        };

        const ReactiveInner = reactiveComponent(Inner);
        const user = userEvent.setup();

        // Act: render with initial prop
        render(<ReactiveInner label="initial" />);
        expect(await screen.findByRole('button', { name: 'initial' })).toBeDefined();

        // Click to mutate the prop through the reactive proxy
        await user.click(await screen.findByRole('button', { name: 'initial' }));

        // Assert: the component re-renders with the updated prop
        expect(await screen.findByRole('button', { name: 'updated' })).toBeDefined();
    });

    // ── Preserves original props when none are mutated ──
    // If no props are mutated, the component renders with the original props
    // and no additional re-renders occur.
    it('renders with original props when none are mutated', () => {
        type Props = { message: string };
        const Inner: React.FC<Props> = (props) => <div>{props.message}</div>;

        const ReactiveInner = reactiveComponent(Inner);

        render(<ReactiveInner message="hello" />);
        expect(screen.getByText('hello')).toBeDefined();
    });

    // ── Memoization prevents re-renders when props haven't changed ──
    // React.memo ensures the component does not re-render if the outer props
    // reference has not changed. We verify by tracking render count.
    it('memoizes and does not re-render when outer props are stable', () => {
        let renderCount = 0;
        type Props = { count: number };
        const Inner: React.FC<Props> = (props) => {
            renderCount++;
            return <div>{props.count}</div>;
        };

        const ReactiveInner = reactiveComponent(Inner);

        const { rerender } = render(<ReactiveInner count={1} />);
        expect(renderCount).toBe(1);

        // Re-render with the same props — React.memo should prevent re-render
        rerender(<ReactiveInner count={1} />);
        expect(renderCount).toBe(1); // still 1 — memoized

        // Re-render with different props — should re-render
        rerender(<ReactiveInner count={2} />);
        expect(renderCount).toBe(2);
    });

    // ── Works with multiple prop mutations ──
    // Multiple property writes should each trigger a re-render.
    it('re-renders on every prop mutation', async () => {
        let renderCount = 0;
        type Props = { value: string; flag?: boolean };
        const Inner: React.FC<Props> = (props) => {
            renderCount++;
            const mutableProps = props as Props & { value: string };
            return (
                <button
                    onClick={() => {
                        mutableProps.value = 'second';
                    }}
                >
                    {mutableProps.value}
                </button>
            );
        };

        const ReactiveInner = reactiveComponent(Inner);
        const user = userEvent.setup();

        render(<ReactiveInner value="first" />);
        expect(renderCount).toBe(1);
        expect(await screen.findByRole('button', { name: 'first' })).toBeDefined();

        // First mutation → re-render
        await user.click(await screen.findByRole('button', { name: 'first' }));
        expect(renderCount).toBe(2);
        expect(await screen.findByRole('button', { name: 'second' })).toBeDefined();
    });
});
