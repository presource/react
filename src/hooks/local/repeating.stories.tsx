import { Meta } from '@storybook/react';
import React from 'react';
import { HeadlessButton, HeadlessButtonProps } from '@reloaded/headless';
import { useRepeatingHook, useStateHook } from '@presource/react';
import { $dom, asTestStory } from '@library/test';

const record = {
    count: 0,
    value: 0
};

const meta: Meta = {
    title: 'Presource/React/Hook/Repeating Hook',
    component: React.memo(() => {
        const state = useStateHook(0);

        // Starting the counter
        const stopHook = useRepeatingHook(async ({ pause }) => {
            await pause(100);
            state(state() + 1);
        });

        record.count++;

        const props: HeadlessButtonProps = {
            label: state().toString(),
            onClick: () => {
                stopHook();
            }
        };

        return <HeadlessButton {...props} />;
    })
};

export default meta;

// Storybook
export const RepeatingHook = asTestStory(async () => {
    await $dom.button('10').click();
});
