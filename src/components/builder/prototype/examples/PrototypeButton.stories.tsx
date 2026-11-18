import { Meta } from '@storybook/react';
import React from 'react';
import { $dom, asTestStory } from '@presource/test';
import { expect } from 'storybook/test';
import { Button } from '@reloaded/material';
import { prototypeComponent } from '@presource/react';

// Prototype Component binds a component with default props up front, so every
// variant only declares what it overrides.
const createPrototypeButton = prototypeComponent(Button, {
    label: 'Prototype Button',
    variant: 'contained',
    // Hook-driven prop: resolved from the render-time props after static merging.
    useDisabled: (props) => props.label === 'Prototype Button'
});

// No override props: all prototype defaults apply.
const DefaultButton = createPrototypeButton();

// Override props are layered over the prototype defaults.
const OverrideButton = createPrototypeButton({ label: 'Override Button' });

// This is configuration
const meta: Meta = {
    title: 'Presource/React/Components/Prototype/Prototype Button',
    // Setting the component
    component: React.memo(() => {
        return (
            <>
                <DefaultButton />
                <OverrideButton />
            </>
        );
    })
};

export default meta;

// Storybook
export const PrototypeButton = asTestStory(async () => {
    // Defaults apply when no override props are passed; useDisabled resolves
    // against the default label and disables the button.
    const defaultButton = await $dom.button('Prototype Button').element();
    await expect(defaultButton).toBeDisabled();

    // The override label wins over the prototype label, and useDisabled
    // re-resolves at render time against the overridden value.
    const overrideButton = await $dom.button('Override Button').element();
    await expect(overrideButton).toBeEnabled();
});
