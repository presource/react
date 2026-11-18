import React from 'react';
import { isFunction, objectEach, typeSwitch } from '@presource/core';
import { isReactComponent, propsReactive } from '../../../utilities';

// Inside this package the only automated checks are the example stories, run through
// storybookTestRunner by examples/FunctionalComponent.test.ts and
// examples/FunctionalButton.test.tsx. FunctionalComponent.stories exercises the object form of
// `reactiveLogic` (function entries are rebound so `this` is the reactive props object, and a
// write through it re-renders); FunctionalButton.stories exercises the function form (it receives
// the reactive props and returns a replacement props object).
// Left unexercised: `Component` passed as a string (the branch that renders the string itself),
// and an evaluated logic that is null, a value React has stamped, or void/undefined (the default
// branch, which renders `Component` with the original props).
// The `as any` on the returned React.memo component hides the difference between the props
// React.memo infers and the declared React.FC<Partial<...>> result, so a wrong shape here fails
// no typecheck.
export type FunctionalComponent = <Component extends React.FC<React.ComponentProps<Component>>>(
    Component: Component | string,
    reactiveLogic?:
        | (React.ComponentProps<Component> & ThisType<React.ComponentProps<Component>>)
        | ((input: React.ComponentProps<Component>) => React.ReactNode | void | React.ComponentProps<Component>)
) => React.FC<Partial<React.ComponentProps<Component>>>;

export const functionalComponent: FunctionalComponent = (component, functionalProps) => {
    // Resolve what gets rendered: a string `component` becomes an FC that renders that string by
    // itself (no element is created around it); anything else is taken as the component.
    const Component: React.FC<any> = typeSwitch(component, {
        string: ({ value }) => {
            return () => value;
        },
        default: ({ value }) => value
    });

    return React.memo((props) => {
        // Evaluating the logic
        const evaluatedLogic = typeSwitch(functionalProps, {
            object: ({ value }) => {
                // We don't want to modify the original value
                const magicProps = { ...value };

                // Build it as reactive props
                const reactiveProps = propsReactive(magicProps);

                // Rebind every function entry so its `this` is the reactive props object — the
                // `this.label = ...` handlers in examples/FunctionalComponent.stories depend on it.
                objectEach(magicProps, ({ key, value: originalValue }) => {
                    if (isFunction(originalValue)) {
                        magicProps[key] = (...args: any[]) => originalValue.apply(reactiveProps, args);
                    }
                });

                return reactiveProps;
            },
            function: ({ value }) => {
                return value(propsReactive(props));
            }
        });

        return typeSwitch(evaluatedLogic, {
            null: () => null,
            object: ({ value }) => {
                // A value React has stamped (an element, a memo/forwardRef wrapper) is rendered as
                // it is; a plain object is treated as the props for `Component` instead.
                if (isReactComponent(value)) return value;

                return React.createElement(Component, value);
            },
            default: () => <Component {...props} />
        });
    }) as any;
};
