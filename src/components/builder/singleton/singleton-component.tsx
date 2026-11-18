import React from 'react';
import { signalState } from '../../../hooks';
import { objectProxy, typeSwitch } from '@presource/core';
import { isReactComponent } from '../../../utilities';

// The only automated check is examples/SingletonComponent.test.ts, which runs
// examples/SingletonComponent.stories through storybookTestRunner. That story renders four
// instances of one singleton, so it already pins that handler() renders the component and that
// handler({ ... }) writes the shared signal and re-renders every instance.
// Left unexercised: handler('key') (the string branch that reads one prop back out of the
// signal), the handler.state handle, a componentDesign that is not a function, and the
// isReactComponent branch that wraps an object design in React.createElement.
// NOTE: `handler` is declared `any`, so none of the overloads declared on SingletonComponent's
// return type are checked against this implementation.
export type SingletonComponent = <T extends { [key: string]: any }>(
    component: React.FC<T>,
    initialProps?: Partial<T>
) => {
    (prop: string): any;
    (): React.ReactNode;
    (updateProps?: Partial<T>): void;
    state: ReturnType<typeof signalState<T>>;
};

// Singleton Component binds every instance it renders to one shared props source: the signalState
// created once per `singletonComponent()` call, so a write through any instance re-renders all of
// them — that is what makes the same component reusable in several places.
export const singletonComponent: SingletonComponent = (componentDesign, initialProps = {}) => {
    const state = signalState(initialProps);

    // The one component every instance renders: the no-argument `state()` read below is what
    // subscribes it to the shared signal, and the proxy over the signal's current value turns
    // prop writes into merges back into that signal.
    const Component = () => {
        // Subscribe this instance to the shared signal (the read result itself is unused here).
        state();

        const reactiveProps = objectProxy(state.value(), {
            set: ({ key, value }) => {
                state({
                    ...state.value(),
                    [key]: value
                });
            }
        });

        const renderFunction = typeSwitch(componentDesign, {
            function: ({ value }) => value,
            object: ({ value }) => {
                if (isReactComponent(value)) {
                    // If it is a React Component
                    return (props: any) => {
                        return React.createElement(value as any, props);
                    };
                }
            }
        });

        // Render with reactive props
        return renderFunction(reactiveProps);
    };

    // Building the handler function
    const handler: any = (input: any) => {
        // If there is no input, just render it as it is
        if (input === undefined) return <Component />;

        return typeSwitch(input, {
            string: ({ value: key }) => state.value()[key],
            // An object argument merges into the shared props, so every instance re-renders
            object: () => {
                state({
                    ...state.value(),
                    ...input
                });
            }
        });
    };

    // Adding State to the Handler Function
    Object.assign(handler, {
        state
    });

    return handler;
};
