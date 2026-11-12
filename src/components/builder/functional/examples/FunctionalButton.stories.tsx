import { Meta } from '@storybook/react';
import { functionalComponent } from '@presource/react';
import { button } from '@reloaded/material';
import { $dom, asTestStory } from '@library/test';

// This is configuration
const meta: Meta = {
    title: 'Presource/React/Components/Functional/Functional Button',
    // Setting the component
    component: functionalComponent(button(), (props) => {
        return {
            ...props,
            // Onclick re-triggers the label
            onClick: () => {
                // Calculating the label
                const counter = props.label || 0;
                props.label = ((isNaN(+counter) ? 0 : +counter) + 1).toString();
            }
        };
    })
};

export default meta;

// Storybook
export const FunctionalButton = asTestStory(async () => {
    // Click the button (it should exist)
    await $dom.button('Material Button').click();
});
