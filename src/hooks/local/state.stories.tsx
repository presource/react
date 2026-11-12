import { Meta } from '@storybook/react';
import React from 'react';
import { HeadlessButton, HeadlessButtonProps } from '@reloaded/headless';
import { useStateHook } from '@presource/react';
import { $dom, asTestStory } from '@library/test';

const meta: Meta = {
    title: 'Presource/React/Hook/State Hook',
    component: React.memo(() => {
        // Starting the counter
        const state = useStateHook({
            counter: 0
        });

        const props: HeadlessButtonProps = {
            label: `Counter: ${state().counter}`,
            onClick: () => {
                // Increasing the counter
                state({
                    counter: state().counter + 1
                });
            }
        };

        return <HeadlessButton {...props} />;
    })
};

export default meta;

// Storybook
export const StateHook = asTestStory(async () => {
    await $dom.button('Counter: 0').click();
    await $dom.button('Counter: 1').click();
    await $dom.button('Counter: 2').click();
});
