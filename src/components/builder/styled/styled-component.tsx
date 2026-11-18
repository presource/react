import React from 'react';
import { StandardBreakpoint } from './types';
import { objectEach, stringSwitch, typeSwitch } from '@presource/core';
import styled from '@emotion/styled';
import { styleCombine, styleMedia, styleStructure } from './utility';

// TESTS: styled-component.test.tsx unit-tests both phases described below — the build-time
// classification and the render-time resolution — with @emotion/styled mocked so the style
// callback's returned object can be asserted directly (base CSS as inline styles, @media
// entries in a data attribute).
// COVERAGE: this package has no Storybook story for styledComponent, so those tests are its only
// automated check here. Further down the repo the builder is exercised by consumers such as
// packages/react/headless/components (layout/flex.tsx, layout/grid.tsx, dashboard/TwoColumnDashboard.tsx) and
// packages/presource/nexus/src/dashboard/components/nexus-dashboard.tsx.
// NOTE: the breakpoint thresholds used in the style callback are hardcoded literals rather than
// values read from the Emotion theme, so per-app breakpoint overrides currently mean editing
// this file.
// NOTE: the styled() result is cast `as any`, which hides any mismatch between what Emotion
// infers for the component and the declared React.FC<BuilderType<T>>.

/**
 * styledComponent — A factory that creates responsive, theme-aware Emotion styled components
 * from a declarative input object.
 *
 * HOW IT WORKS (two phases):
 *
 * ── Phase 1: Build-time classification ──
 * The `input` object (mapping CSS property names to values) is scanned once at call time.
 * Each entry is classified into one of two buckets:
 *
 *   defaultStyling — Static CSS values applied unconditionally:
 *     • Numbers   e.g. { fontSize: 16 }        → kept as-is (NOT converted; styleStructure
 *                                                   rem conversion applies only to customStyling
 *                                                   values — React serialises numbers as px)
 *     • Strings   e.g. { display: 'flex' }     → kept as-is (except the sentinel value 'custom')
 *     • Objects   e.g. { color: { xs: 'red', md: 'blue' } } → kept as-is (breakpoint map)
 *
 *   customStyling — Values that require render-time prop resolution:
 *     • The string 'custom' (sentinel)  e.g. { color: 'custom' }
 *       → At render time, the actual value is read from the component's props by matching key name.
 *     • Functions  e.g. { color: (props) => props.active ? 'red' : 'gray' }
 *       → At render time, the function is called with all non-theme props to compute the value.
 *
 * ── Phase 2: Render-time style resolution ──
 * The returned styled component is called on every render:
 *   1. `theme` is destructured out, so the style logic reads `rest` only. (Keeping `theme` off the
 *      DOM element is Emotion's own prop filtering; this line only keeps it out of `rest`.)
 *   2. For each customStyling entry:
 *        • string marker → looks up `rest[key]` (the prop value for that CSS property name)
 *        • function     → calls the function with `rest` to compute the value
 *   3. Each resolved value is passed through `styleStructure`, which:
 *        • Wraps primitives in { xs: value } (defaulting to the smallest breakpoint)
 *        • Converts numbers to rem: (value * 8) / 16 → e.g. 16 → "8rem"
 *   4. `styleCombine` groups all resolved styles by breakpoint (xs/sm/md/lg/xl).
 *   5. `styleMedia` wraps each breakpoint's styles in a @media (min-width: ...) query.
 *   6. The final return spreads `defaultStyling` as base styles, then overlays the media queries.
 *
 * USAGE EXAMPLE:
 *   const MyBox = styledComponent('div', {
 *     display: 'flex',           // static → defaultStyling
 *     fontSize: 16,              // number → defaultStyling (kept as-is; styleStructure
 *                                //   rem conversion applies only to custom values)
 *     color: 'custom',          // sentinel → customStyling, resolved from <MyBox color="red" />
 *     bg: (props) => props.dark ? '#000' : '#fff',  // function → customStyling, computed
 *   });
 *
 *   // Responsive usage:
 *   <MyBox color="blue" sm={{ color: 'green' }} md={{ color: 'red' }}>
 *
 * HELPERS USED:
 *   - styleStructure: normalizes primitives into { xs: value } and converts numbers → rem
 *   - styleCombine:   merges multiple { [cssProp]: { [breakpoint]: value } } into { [breakpoint]: { [cssProp]: value } }
 *   - styleMedia:     wraps breakpoint-grouped styles into { "@media (min-width: Xpx)": { ... } }
 */

// A function type for dynamic, prop-driven values: called with `rest` (the props minus `theme`)
// during render. The `void` in the union is load-bearing — a function that returns nothing yields
// `undefined`, and the `value !== undefined` guard in the style callback then skips the key
// entirely instead of emitting a style for it.
type FlexibleFunction<T> = (input: T) => {} | number | string | void;

// The primary input type: maps each CSS property name to one of three value types:
//   1. A direct CSS value (string, number, object with breakpoint keys)
//   2. The literal string 'custom' — a sentinel marking this property as prop-driven
//   3. A function that computes the value from props at render time
type PrimaryInput<T> = {
    [key in keyof React.CSSProperties]: React.CSSProperties[key] | 'custom' | FlexibleFunction<T>;
};

// Standard HTML element attributes plus optional children. This is a compile-time shape only: it
// lets the generated component take every normal HTML attribute, and keys outside this intersection
// and T are rejected by TypeScript's excess-property check. Nothing here filters props at runtime —
// what reaches the element is Emotion's decision (for an HTML-tag base @emotion/styled screens props
// through @emotion/is-prop-valid), and this file only ever narrows the props the style callback
// reasons about.
type StandardReactProps = React.HTMLAttributes<HTMLElement> & {
    children?: React.ReactNode;
};

// Breakpoint-level style overrides: optional keys for each StandardBreakpoint (xs/sm/md/lg/xl)
// whose values are CSS property objects applied via @media queries.
type BreakpointProps = {
    [key in StandardBreakpoint]?: React.CSSProperties;
};

// Wraps a base type T so it can also accept per-breakpoint overrides.
// E.g., Breakpoints<string> can be just "red" or { xs: "red", md: "blue" }.
type Breakpoints<T = string | number> = T & {
    [key in StandardBreakpoint]?: T;
};

// The full props type for the generated component:
//   - StandardReactProps (HTML attributes + children)
//   - BreakpointProps (xs/sm/md/lg/xl style overrides)
//   - theme — accepted but consumed internally by Emotion (never forwarded to DOM)
//   - Plus any custom prop keys from T, each accepting a Breakpoints<T[key]> value
type BuilderType<T> = StandardReactProps &
    BreakpointProps & { theme?: any } & {
        [P in keyof T]?: Breakpoints<T[P]>;
    };

// Public type signature for styledComponent.
// Generic T represents the custom props the consumer wants to expose.
export type StyledComponent = <T>(component: string | React.FC<T>, input: PrimaryInput<T>) => React.FC<BuilderType<T>>;

/**
 * Creates a responsive Emotion styled component from a declarative input map.
 *
 * @param component - The base component or HTML tag name to style (e.g. 'div', or a React component)
 * @param input - A map of CSS property names to static values, 'custom' sentinels, or compute functions
 * @returns A React functional component with responsive breakpoint and custom-prop support
 */
export const styledComponent: StyledComponent = (component: any, input) => {
    // ── Phase 1: Build-time classification ──
    // Scan the input object once and classify each CSS property into:
    //   defaultStyling — static values applied unconditionally as base styles
    //   customStyling  — values requiring render-time resolution from props
    const defaultStyling: any = {};
    const customStyling: any = {};

    objectEach(input, ({ key, value: data }) => {
        typeSwitch(data, {
            // Number → delegated to the `default` case below, so it lands in defaultStyling
            // as a raw number: styleStructure never sees it (that rem conversion applies only
            // to customStyling values), and the number is serialised as px when React applies
            // the style. The case titled `should pass defaultStyling numbers as raw values
            // without conversion` in styled-component.test.tsx pins it: input `{ fontSize: 16 }`
            // renders box.style.fontSize === '16px', not '8rem'.
            number: ({ value, default: defaultCallback }) => {
                defaultCallback(value);
            },
            // String → either the 'custom' sentinel or a plain CSS value
            string: ({ value, default: defaultCallback }) => {
                stringSwitch(value, {
                    // 'custom' sentinel → marks this key for prop-based resolution at render time
                    custom: () => {
                        customStyling[key] = 'custom';
                    },
                    // Any other string → static CSS value (e.g. 'flex', 'red', '10px')
                    default: () => {
                        defaultCallback(value);
                    }
                });
            },
            // Function → will be called at render time with the component's props
            // e.g. { color: (props) => props.active ? 'red' : 'gray' }
            function: ({ value }) => {
                customStyling[key] = (props: any) => {
                    return value(props);
                };
            },
            // Default (objects, booleans, etc.) → treat as static CSS value
            // e.g. { color: { xs: 'red', md: 'blue' } } — already breakpoint-structured
            default: ({ value }) => {
                defaultStyling[key] = value;
            }
        });
    });

    // ── Phase 2: Return the styled component ──
    // The Emotion styled() call creates a component that runs the style function on every render.
    return styled(component)((props) => {
        // Strip `theme` out of the props this callback reasons about; `rest` is the single source
        // for custom prop values and breakpoint overrides. Keeping `theme` off the DOM element is
        // Emotion's own prop filtering rather than this destructure — see the StandardReactProps
        // note above.
        const { theme, ...rest } = props;

        // Responsive breakpoint thresholds in pixels, rebuilt from these literals on every
        // render. They are not read from the Emotion theme (see the NOTE above
        // `styledComponent`), and they are handed to `styleMedia` to build the @media queries.
        const breakpoints = {
            xs: 0,
            sm: 600,
            md: 900,
            lg: 1200,
            xl: 1600
        };

        // Collect resolved custom property values (those marked 'custom' or function-based)
        const style: any = {};

        objectEach(customStyling, ({ key }) => {
            // Resolve the custom value based on its type:
            const value = typeSwitch(customStyling[key], {
                // String sentinel ('custom') → read the prop value directly from rest
                // e.g. if key is 'color', this reads rest.color
                string: () => rest[key],
                // Function → call it with all non-theme props to compute the value
                function: ({ value: func }) => func(rest)
            });

            // Only include if the prop was actually provided (undefined means no prop was passed)
            if (value !== undefined) {
                // styleStructure normalizes the value:
                //   - Primitives (string/number) → wrapped in { xs: value } (default breakpoint)
                //   - Numbers → converted to rem: (value * 8) / 16
                //   - Objects with breakpoint keys → passed through as-is
                style[key] = styleStructure(value);
            }
        });

        // Merge and return the final style object:
        //   1. Spread defaultStyling as base (unconditional CSS properties)
        //   2. Overlay responsive media queries generated from custom styles + breakpoint overrides
        //      - styleCombine groups all { cssProp: { breakpoint: value } } into { breakpoint: { cssProp: value } }
        //      - styleMedia wraps each breakpoint group in @media (min-width: Xpx) queries
        return {
            ...defaultStyling,
            ...styleMedia(breakpoints, rest, styleCombine(style))
        };
    }) as any;
};
