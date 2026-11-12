import { Meta } from '@storybook/react';
import { Button, ButtonProps } from '@reloaded/material';
import React from 'react';
import { configureStoryControls } from '@library/test';
import { reactiveComponent } from '../reactive-component';

// TODO: missing-story-test - This story has no `asTestStory` assertions. Add tests to verify:
// - Button renders with initial label from controls
// - Clicking the button changes the label to 'Label Changed!' (reactive prop mutation)
// - Component re-renders when props are mutated via the reactive proxy

// This is configuration
const meta: Meta = {
    title: 'Presource/React/Components/Reactive/Reactive Button',
    // Setting the component
    component: reactiveComponent((props: ButtonProps) => {
        return (
            <Button
                {...props}
                onClick={() => {
                    props.label = 'Label Changed!';
                }}
            />
        );
    })
};

export default meta;

configureStoryControls(meta, {
    label: 'Reactive Button'
});

// Storybook
export const ReactiveButton = {};
