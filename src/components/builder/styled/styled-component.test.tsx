// ── Unit tests for styledComponent ──
//
// The list below is the coverage map: every item has a like-named case further down this file, and
// together they exercise both phases documented in styled-component.tsx (build-time classification
// and render-time resolution). Sections 4, 9 and 10 pin extra behaviour this list does not name:
// the falsy branch of a function entry, all three value types combined, and a non-CSS prop reaching
// a custom function entry.
//   - Default styling when no breakpoint props are passed
//   - Custom string props ('custom' sentinel → read from component props)
//   - Custom function props (computed from props at render time)
//   - Number-to-rem conversion via styleStructure (for customStyling path)
//   - 'custom' sentinel skip when prop is undefined
//   - Breakpoint-based @media query generation
//   - Theme prop destructured and not forwarded to DOM
//
// ── How the implementation works (styled-component.tsx) ──
//
// Phase 1 (build-time): input values are classified into two buckets:
//   defaultStyling — static CSS values (strings, numbers, objects) spread
//                    directly at the top level of the returned style object.
//                    Numbers are NOT run through styleStructure; they pass
//                    through as-is (React eventually serialises them as px).
//   customStyling  — 'custom' sentinels and functions that must be resolved
//                    at render time. These ARE run through styleStructure
//                    (wrapping in { xs: ... } and converting numbers → rem),
//                    then styleCombine, then styleMedia → all end up behind
//                    @media (min-width: Npx) queries.
//
// Phase 2 (render-time): the style callback destructures `theme` from props,
// resolves custom entries, and merges defaultStyling + styleMedia output.
//
// Because customStyling entries always flow through styleMedia (which
// generates an @media entry for every breakpoint, even empty), custom-
// derived values appear under `@media (min-width: 0px)` and NOT in the
// base inline style object.
//
// ── Mock strategy ──
// We mock @emotion/styled to apply generated styles as inline styles
// (base CSS props) and to store @media-query portions in a
// `data-test-media` JSON attribute. This avoids depending on Emotion's
// CSSOM injection in jsdom while still exercising the full logic of the
// style callback.

import React from 'react';
import { render, screen } from '@testing-library/react';
import { styledComponent } from './styled-component';

// ---------------------------------------------------------------------------
// Mock @emotion/styled — replaces CSSOM style injection with inline styles
// and a data-test-media attribute for @media-query assertions.
//
// Emotion's styled()(styleFn) returns a component. The styleFn receives
// all props (including theme via React context) and returns a style object.
// Emotion normally converts this to CSS rules; our mock applies base
// properties as inline styles and captures @media queries in a data attr.
//
// This mirrors the `styled(component)((props) => ...) as any` call at the end
// of styledComponent in styled-component.tsx.
// ---------------------------------------------------------------------------
vi.mock('@emotion/styled', () => {
    const mockStyled = (component: any) => {
        // styled(component) returns a function expecting a style callback.
        return (styleFn: any) => {
            // Returned component — mirrors Emotion's wrapper behaviour.
            const MockStyledComponent = (props: any) => {
                // Mirror the `const { theme, ...rest } = props` destructure in the
                // styledComponent style callback so theme never reaches the DOM element.
                const { theme, ...rest } = props;

                // Call the original style callback with all props (incl. theme).
                const style = styleFn(props);

                // Split into base CSS properties and @media query entries.
                // @media keys cannot be applied as inline styles, so we store
                // them in a data attribute for test assertions.
                const baseStyles: Record<string, any> = {};
                const mediaStyles: Record<string, any> = {};
                Object.entries(style).forEach(([key, value]) => {
                    if (key.startsWith('@media')) {
                        mediaStyles[key] = value;
                    } else {
                        baseStyles[key] = value;
                    }
                });

                // Attach @media queries as JSON (omit attribute if none).
                const mediaAttr =
                    Object.keys(mediaStyles).length > 0 ? { 'data-test-media': JSON.stringify(mediaStyles) } : {};

                // Render the underlying element with inline styles + media data.
                // React.createElement handles both string tags ('div') and components.
                return React.createElement(component, { ...rest, style: baseStyles, ...mediaAttr }, rest.children);
            };
            MockStyledComponent.displayName = 'MockStyled';
            return MockStyledComponent;
        };
    };
    return { default: mockStyled };
});

// Reset DOM between tests to avoid cross-contamination.
beforeEach(() => {
    document.body.innerHTML = '';
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('styledComponent', () => {
    // ── 1. Default styling without breakpoint props ──
    // Exercises the defaultStyling bucket produced by the build-time scan and the
    // defaultStyling spread at the top level of the style callback's return object.
    it('should apply default styling when no breakpoint props are passed', () => {
        // Arrange: static CSS values → defaultStyling
        const Box = styledComponent('div', {
            display: 'flex',
            alignItems: 'center',
            color: 'red'
        });

        // Act: no breakpoint overrides
        render(<Box data-testid="box">content</Box>);
        const box = screen.getByTestId('box');

        // Assert: defaultStyling values are spread at the top level of the
        // returned style object (the `...defaultStyling` in the style callback's
        // return), so they appear as inline styles on the element.
        expect(box.style.display).toBe('flex');
        expect(box.style.alignItems).toBe('center');
        expect(box.style.color).toBe('red');
    });

    // ── 2. Custom string props → read from component props ──
    // Exercises the 'custom' sentinel: the string case of the render-time customStyling
    // resolution reads the value back from the same-named key of `rest`.
    it('should resolve custom string props from component props', () => {
        // Arrange: the 'custom' sentinel marks this key for prop-based resolution.
        // At render time, rest.color provides the value.
        const Box = styledComponent('div', {
            color: 'custom'
        });

        // Act: pass color as a component prop
        render(
            <Box data-testid="box" color="blue">
                content
            </Box>
        );
        const box = screen.getByTestId('box');

        // Assert: custom values flow through styleStructure → styleCombine →
        // styleMedia, so they end up behind @media (min-width: 0px) and NOT
        // in the base inline styles. We verify via data-test-media.
        // styleStructure('blue') returns { xs: 'blue' }, which combine/media
        // place inside @media (min-width: 0px).
        const media = JSON.parse(box.getAttribute('data-test-media')!);
        expect(media['@media (min-width: 0px)']).toStrictEqual({ color: 'blue' });
    });

    // ── 3. Custom function props → computed from rest ──
    // Exercises the function case of the render-time customStyling resolution: the entry
    // is invoked with `rest` and its return value is what gets styled.
    it('should resolve custom function props with component props', () => {
        // Arrange: function receives rest props, returns computed value
        const Box = styledComponent('div', {
            color: (props: any) => (props.active ? 'green' : 'gray')
        });

        // Act: active={true} → function returns 'green'
        render(
            <Box data-testid="box" active={true}>
                content
            </Box>
        );
        const box = screen.getByTestId('box');

        // Assert: computed 'green' is in @media (min-width: 0px)
        const media = JSON.parse(box.getAttribute('data-test-media')!);
        expect(media['@media (min-width: 0px)']).toStrictEqual({ color: 'green' });
    });

    // ── 4. Function prop — falsy condition branch ──
    it('should resolve custom function props correctly when condition is false', () => {
        const Box = styledComponent('div', {
            color: (props: any) => (props.active ? 'green' : 'gray')
        });

        render(
            <Box data-testid="box" active={false}>
                content
            </Box>
        );
        const box = screen.getByTestId('box');

        const media = JSON.parse(box.getAttribute('data-test-media')!);
        expect(media['@media (min-width: 0px)']).toStrictEqual({ color: 'gray' });
    });

    // ── 5. Number → rem conversion via styleStructure ──
    //
    // NOTE: Numbers in defaultStyling pass through WITHOUT styleStructure
    // conversion (the number case of the build-time classification delegates to
    // defaultStyling with the raw value). Only customStyling values (functions and
    // the 'custom' sentinel) go through styleStructure. To test the rem path we use
    // a function that returns a number.
    it('should convert number values to rem via styleStructure', () => {
        // Arrange: function returns a number → customStyling → styleStructure
        const Box = styledComponent('div', {
            fontSize: (props: any) => props.size || 16
        });

        // Act: without size prop, defaults to 16
        render(<Box data-testid="box">content</Box>);
        const box = screen.getByTestId('box');

        // Assert: 16 → (16 * 8) / 16 = 8 → '8rem' (the number branch of
        // styleStructure in utility/structure.ts).
        // This lands in @media (min-width: 0px) because it flows through styleMedia.
        const media = JSON.parse(box.getAttribute('data-test-media')!);
        expect(media['@media (min-width: 0px)']).toStrictEqual({ fontSize: '8rem' });
    });

    // ── 5b. DefaultStyling numbers are NOT converted (pass-through) ──
    it('should pass defaultStyling numbers as raw values without conversion', () => {
        // Numbers in defaultStyling are NOT run through styleStructure: the number
        // case of the build-time classification delegates to defaultStyling with the
        // raw value. They are spread directly at the top level of the style object.
        const Box = styledComponent('div', {
            fontSize: 16
        });

        render(<Box data-testid="box">content</Box>);
        const box = screen.getByTestId('box');

        // Assert: raw number 16 is passed as-is; React serialises it as 16px.
        // No rem conversion occurs for defaultStyling values.
        expect(box.style.fontSize).toBe('16px');
    });

    // ── 6. 'custom' sentinel → skipped when prop is undefined ──
    // Exercises the `value !== undefined` guard in the render-time customStyling loop:
    // a sentinel whose prop is absent contributes nothing to the resolved styles.
    it('should skip custom sentinel when the corresponding prop is undefined', () => {
        // Arrange: color is marked 'custom' but no color prop is passed.
        // display is static (defaultStyling).
        const Box = styledComponent('div', {
            color: 'custom',
            display: 'flex'
        });

        render(<Box data-testid="box">content</Box>);
        const box = screen.getByTestId('box');

        // Assert: display is applied (defaultStyling at top level).
        expect(box.style.display).toBe('flex');

        // Color was undefined → skipped by the `value !== undefined` guard in the
        // customStyling loop.
        // The @media queries from styleMedia are still generated (all breakpoints)
        // but they should NOT contain a 'color' entry.
        const media = JSON.parse(box.getAttribute('data-test-media')!);
        // Every breakpoint entry should be empty (no color because undefined was skipped)
        expect(media['@media (min-width: 0px)']).toStrictEqual({});
        expect(media['@media (min-width: 600px)']).toStrictEqual({});
        expect(media['@media (min-width: 900px)']).toStrictEqual({});
        expect(media['@media (min-width: 1200px)']).toStrictEqual({});
        expect(media['@media (min-width: 1600px)']).toStrictEqual({});
    });

    // ── 7. Breakpoint-based @media queries ──
    // Exercises styleMedia with breakpoint props: the `sm`/`md` keys of `rest` become
    // @media (min-width: 600px)/@media (min-width: 900px) groups. styleCombine always
    // emits all five breakpoints, so the untouched ones stay in the output as empty groups.
    it('should generate correct @media queries for breakpoint-based styles', () => {
        // Arrange: static base + breakpoint overrides via rest props
        const Box = styledComponent('div', {
            display: 'flex'
        });

        // Act: sm and md breakpoint overrides are in rest (not in customStyling)
        render(
            <Box data-testid="box" sm={{ color: 'green' }} md={{ color: 'blue' }}>
                content
            </Box>
        );
        const box = screen.getByTestId('box');

        // Assert: base inline style works
        expect(box.style.display).toBe('flex');

        // Assert: @media queries from styleMedia
        // rest.sm is `{ color: 'green' }` → appears at @media (min-width: 600px)
        // rest.md is `{ color: 'blue' }` → appears at @media (min-width: 900px)
        // styleCombine(style) for empty style gives all-empty breakpoints
        const media = JSON.parse(box.getAttribute('data-test-media')!);

        // xs breakpoint (0px) — no rest.xs, combined result is empty
        expect(media['@media (min-width: 0px)']).toStrictEqual({});
        // sm breakpoint (600px) — from rest.sm
        expect(media['@media (min-width: 600px)']).toStrictEqual({ color: 'green' });
        // md breakpoint (900px) — from rest.md
        expect(media['@media (min-width: 900px)']).toStrictEqual({ color: 'blue' });
        // lg (1200px) — empty
        expect(media['@media (min-width: 1200px)']).toStrictEqual({});
        // xl (1600px) — empty
        expect(media['@media (min-width: 1600px)']).toStrictEqual({});
    });

    // ── 8. Theme prop is not forwarded to DOM ──
    // Exercises the `const { theme, ...rest } = props` destructure at the top of the
    // style callback.
    it('should not pass theme prop to the DOM element', () => {
        const Box = styledComponent('div', { display: 'flex' });

        // Act: pass theme as a prop (as Emotion's ThemeProvider would)
        render(
            <Box data-testid="box" theme={{ primary: '#000' }}>
                content
            </Box>
        );
        const box = screen.getByTestId('box');

        // Assert: no 'theme' HTML attribute on the rendered element. With @emotion/styled mocked,
        // the element props come from the mock's own `theme` destructure (it mirrors the
        // implementation's), so this case pins that destructure contract rather than Emotion's
        // handling; unmocked, Emotion drops `theme` as well because it is not a valid HTML
        // attribute for @emotion/is-prop-valid.
        expect(box.getAttribute('theme')).toBeNull();

        // Base styling still works
        expect(box.style.display).toBe('flex');
    });

    // ── 9. Integration: default + custom string + function ──
    // All three value types working together
    it('should combine default, custom string, and function props correctly', () => {
        const Box = styledComponent('div', {
            display: 'flex', // defaultStyling
            backgroundColor: (props: any) => (props.dark ? '#333' : '#fff'), // custom function
            color: 'custom' // custom sentinel
        });

        render(
            <Box data-testid="box" color="purple" dark={true}>
                content
            </Box>
        );
        const box = screen.getByTestId('box');

        // Base inline style (from defaultStyling)
        expect(box.style.display).toBe('flex');

        // @media queries from custom entries
        const media = JSON.parse(box.getAttribute('data-test-media')!);
        // color='purple' and dark=true→'#333' both land under @media (min-width: 0px)
        expect(media['@media (min-width: 0px)']).toStrictEqual({
            backgroundColor: '#333',
            color: 'purple'
        });
    });

    // ── 10. Boolean props reach the style function ──
    // Regression guard for a consumer pattern that passes a boolean prop
    // consumed ONLY by a custom function entry (e.g. a `muted` flag picked
    // up inside the function). The boolean must survive the props flow and
    // reach the function; the resolved string value ends up in the media
    // styles. (The mock's `rest` spread also hands `muted` to the element,
    // where React writes it as a DOM property rather than an attribute —
    // `muted` is in React's mustUseProperty list — and no assertion here
    // depends on that.)
    it('should pass boolean props through to custom function entries', () => {
        const Box = styledComponent('div', {
            color: (props: any) => (props.muted ? '#475569' : '#fbbf24')
        });

        render(
            <Box data-testid="box" muted={true}>
                content
            </Box>
        );
        const box = screen.getByTestId('box');

        // muted=true → '#475569' under @media (min-width: 0px)
        const media = JSON.parse(box.getAttribute('data-test-media')!);
        expect(media['@media (min-width: 0px)']).toStrictEqual({ color: '#475569' });
    });
});
