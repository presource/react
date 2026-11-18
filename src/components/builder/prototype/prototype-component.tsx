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

// Prototype Component is for fast prototyping: the default props are declared up front, so each
// usage only states what it overrides.
// Inside this package the only automated check is examples/PrototypeButton.test.ts, which runs
// examples/PrototypeButton.stories through storybookTestRunner. That story builds one
// prototypeComponent factory and renders it with and without overrideProps, so it pins the
// prototype defaults applying, the override props winning over them, and the `use`-prefixed key
// (`useDisabled` -> `disabled`) losing its prefix and lower-casing the next letter while resolving
// against the merged props at render time. Left unexercised: the component's own instance props
// winning over the fixed prototype props (the story renders both components with no props), i.e.
// the full prototypeProps -> overrideProps -> instance props precedence.
// Outside this package it is the builder behind many @reloaded/headless and @reloaded/material
// components (clickable/button.tsx, drawer/BasicDrawer.tsx, …), so those packages' story-driven
// tests exercise paths this file's own story does not.

// Declared shape of the builder: (Component + prototype props) -> factory -> (override props) -> component.
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
