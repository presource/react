import { Meta } from '@storybook/react';
import React from 'react';
import { useDelayHook } from '@presource/react';
import { $dom, $expect, asTestStory } from '@library/test';
import { FlexColumn, HeadlessButton } from '@reloaded/headless';
import { scriptPause } from '@presource/core';

// This is standard usage
const StandardUsage = React.memo(() => {
    // Starting the counter
    const value = useDelayHook(() => {
        return 'loaded';
    }, 100);

    // The text will display "loading..." then it will display "loaded"
    return <div>{value() || 'loading...'}</div>;
});

const ComplexUsage = React.memo(() => {
    const delay = useDelayHook(async () => {
        await scriptPause(100);
        return 'processing';
    });

    const props = {
        label: delay() || 'pending',
        onClick: () => {
            // When clicked. It will override
            delay(async () => {
                await scriptPause(100);
                return 'completed';
            });
        }
    };

    // The text will display "pending" then it will display "processing"
    return <HeadlessButton {...props} />;
});

const meta: Meta = {
    title: 'Presource/React/Hook/Delay Hook',
    component: React.memo(() => {
        return (
            <FlexColumn>
                <StandardUsage />
                <ComplexUsage />
            </FlexColumn>
        );
    })
};

export default meta;

// Storybook
export const DelayHook = asTestStory(async () => {
    // Verifying simple case
    await $expect.text('loading...');
    await $dom.button('pending').isValid();

    await $expect.text('loaded');
    // Verifying complex case
    await $dom.button('processing').click();
    await $dom.button('completed').isValid();
});
