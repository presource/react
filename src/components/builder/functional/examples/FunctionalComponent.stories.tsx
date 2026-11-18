import { Meta } from '@storybook/react';
import { Button } from '@reloaded/material';
import { functionalComponent } from '@presource/react';
import { $dom, asTestStory } from '@presource/test';
import React from 'react';

// Object-form reactiveLogic: the object becomes the component's reactive props, so a handler that
// writes `this.<prop>` re-renders the button with the new label.
const ReactiveButton = functionalComponent(Button, {
    label: 'Click to Change Label',
    // Method shorthand, not an arrow: functionalComponent rebinds function entries with
    // `originalValue.apply(reactiveProps, args)`, so `this` is the reactive props object and
    // `this.label = ...` is a reactive write. An arrow function would ignore that rebinding.
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
export const FunctionalComponent = asTestStory(async () => {
    // Clicking runs the functional handler, which rewrites the label through
    // the reactive props and must trigger a re-render.
    await $dom.button('Click to Change Label').click();
    await $dom.button('Label Changed').isValid();
});
