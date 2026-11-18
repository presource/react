import { Meta } from '@storybook/react';
import React from 'react';
import { HeadlessButton, HeadlessButtonProps } from '@reloaded/headless';
import { useReferenceHook } from '@presource/react';
import { $dom, asTestStory } from '@presource/test';
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
    // Three clicks, but still exactly one render on the record: the memo component has no
    // changing props and writes through the ref never re-render. The next assertion proves
    // the three writes did land (record.value is 3).
    await expect(record.count).toBe(1);
    await expect(record.value).toBe(3);
});
