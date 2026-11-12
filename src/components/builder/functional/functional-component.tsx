import React from 'react';
import { isFunction, objectEach, typeSwitch } from '@presource/core';
import { isReactComponent, propsReactive } from '../../../utilities';

// TODO: missing-test - Add unit tests for functionalComponent.
// Tests to add:
// - When component is a string, wraps it as a simple FC returning that string
// - When component is an FC, wraps it with memoization
// - When functionalProps is an object, values are resolved as reactive props; functions bind `this` to reactiveProps
// - When functionalProps is a function, receives propsReactive(props) and can return new props or ReactNode
// - When evaluatedLogic is null, renders null
// - When evaluatedLogic is a React component (isReactComponent), renders it directly
// - When evaluatedLogic is a plain object, creates element with Component and that object
// - When evaluatedLogic is undefined (default case), renders Component with original props
// NOTE: The return type is cast `as any` (line 66) which hides type mismatches. Consider tightening this.
export type FunctionalComponent = <Component extends React.FC<React.ComponentProps<Component>>>(
    Component: Component | string,
    reactiveLogic?:
        | (React.ComponentProps<Component> & ThisType<React.ComponentProps<Component>>)
        | ((input: React.ComponentProps<Component>) => React.ReactNode | void | React.ComponentProps<Component>)
) => React.FC<Partial<React.ComponentProps<Component>>>;

export const functionalComponent: FunctionalComponent = (component, functionalProps) => {
    // Wrapping the Component correctly
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

                // Modifying the magic props, remapping all the values
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
                // If it is React component, returns it as is
                if (isReactComponent(value)) return value;

                return React.createElement(Component, value);
            },
            default: () => <Component {...props} />
        });
    }) as any;
};
