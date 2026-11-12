import { objectEach } from '@presource/core';
import React from 'react';

// Inlined from @presource/structure (packages/presource/structure/src/react-types/reactive-props.ts)
// so this package has no dependency on the unpublished @presource/structure
// package. Type-only — erased at build time. Keep any dependency the source
// imports declared in package.json: this package ships TypeScript source, so
// consumer typechecks compile every file.
type WithoutUsePrefix<T> = T extends `use${infer P}` ? P : T;
type CleanInput<P> = { [key in Uncapitalize<string & WithoutUsePrefix<keyof P>>]: P[keyof P] };
export type ReactiveComponentProps<P> = { [key in keyof P]?: P[key] } & {
    [key in `use${Capitalize<string & keyof P>}`]?: (inputs: CleanInput<P>) => P[keyof P];
};

// TODO: missing-test - Add unit tests for prototypeComponent.
// Tests to add:
// - Returns a factory function that accepts optional overrideProps
// - Factory returns a React.memo FC with all props optional
// - Fixed props (non-use prefixed) are merged with instance props; instance props win
// - Hook-driven props (use prefixed) are resolved at render time via (resolvedProps) => value
// - use-prefixed key strips 'use' prefix and lowercases first letter (e.g. useDisabled -> disabled)
// - Merge order is: prototypeProps -> overrideProps -> component instance props
// NOTE: The existing story (PrototypeButton.stories.tsx) does NOT use prototypeComponent at all - it uses
// `button()` directly from `@reloaded/material`. The story should be rewritten to demonstrate the builder.
// Prototype Component is designed for fast prototyping
// That is, its default props should be set at the get go for easy usage.

// The PrototypeComponent Props
export type PrototypeComponent = <
    PrototypeProps extends ReactiveComponentProps<React.ComponentProps<Component>> &
        ReactiveComponentProps<PrototypeComponent>,
    Component extends React.FC<React.ComponentProps<Component>>
>(
    Component: Component,
    prototypeProps?: PrototypeProps
) => (
    overrideProps?: ReactiveComponentProps<React.ComponentProps<Component>>
) => React.FC<Partial<React.ComponentProps<Component>>>;

// Prototype Components
export const prototypeComponent: PrototypeComponent = (Component, prototypeProps) => {
    // Returning the factory function
    return (overrideProps: any) => {
        // Building the merged props
        const mergedProps = {
            ...prototypeProps,
            ...overrideProps
        };

        const fixedProps: any = {};
        const hookDrivenProps: any = {};

        // Calculating all the props
        objectEach(mergedProps, ({ key, value }) => {
            const propsKey = key.toString();
            if (propsKey.startsWith('use')) {
                const strippedKey = propsKey[3].toLowerCase() + propsKey.substring(4);
                hookDrivenProps[strippedKey] = value;
            } else {
                fixedProps[propsKey] = value;
            }
        });

        // Return a React component
        return React.memo((props) => {
            // Resolving the props
            const resolvedProps: any = {
                ...fixedProps,
                ...props
            };

            objectEach(hookDrivenProps, ({ key, value }) => {
                resolvedProps[key] = (value as any)(resolvedProps);
            });

            return <Component {...resolvedProps} />;
        });
    };
};
