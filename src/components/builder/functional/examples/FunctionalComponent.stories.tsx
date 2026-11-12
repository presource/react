import { Meta } from '@storybook/react';
import { Button } from '@reloaded/material';
import { functionalComponent } from '@presource/react';
import React from 'react';

// You can build reactive button with functional component!
const ReactiveButton = functionalComponent(Button, {
    label: 'Click to Change Label',
    // Use enclosed function to have access to this.
    onClick() {
        this.label = 'Label Changed';
    },
    onMouseEnter() {
        this.label = 'Mouse entered';
    },
    onMouseLeave() {
        this.label = 'Click to Change Label';
    }
});

// This is configuration
const meta: Meta = {
    title: 'Presource/React/Components/Functional/Functional Component',
    // Setting the component
    component: React.memo(() => {
        return (
            <>
                <ReactiveButton />
            </>
        );
    })
};

export default meta;

// Storybook
export const FunctionalComponent = {};
