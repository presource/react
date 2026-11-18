import { Meta } from '@storybook/react';
import { Button, ButtonProps } from '@reloaded/material';
import { $dom, asTestStory, configureStoryControls } from '@presource/test';
import React from 'react';
import { reactiveComponent } from '../reactive-component';

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
export const ReactiveButton = asTestStory(async () => {
    // The initial label comes from the configured story controls.
    await $dom.button('Reactive Button').isValid();

    // The click mutates the proxied prop, which must re-render the component.
    await $dom.button('Reactive Button').click();
    await $dom.button('Label Changed!').isValid();
});
