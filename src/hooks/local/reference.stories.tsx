import { Meta } from '@storybook/react';
import React from 'react';
import { HeadlessButton, HeadlessButtonProps } from '@reloaded/headless';
import { useReferenceHook } from '@presource/react';
import { $dom, asTestStory } from '@library/test';
import { expect } from 'storybook/test';

const record = {
    count: 0,
    value: 0
};

const meta: Meta = {
    title: 'Presource/React/Hook/Reference Hook',
    component: React.memo(() => {
        // Starting the counter
        const reference = useReferenceHook({
            counter: 0
        });

        record.count++;

        const props: HeadlessButtonProps = {
            label: `Increase Counter`,
            onClick: () => {
                // Increasing the counter
                reference({
                    counter: reference().counter + 1
                });
                record.value = reference().counter;
            }
        };

        return <HeadlessButton {...props} />;
    })
};

export default meta;

// Storybook
export const ReferenceHook = asTestStory(async () => {
    await $dom.button('Increase Counter').click();
    await $dom.button('Increase Counter').click();
    await $dom.button('Increase Counter').click();
    // No matter what happen, render to be 1
    await expect(record.count).toBe(1);
    await expect(record.value).toBe(3);
});
