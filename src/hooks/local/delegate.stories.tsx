import { Meta } from '@storybook/react';
import React from 'react';
import { useDelegateHook } from '@presource/react';
import { $dom, asTestStory } from '@presource/test';
import { FlexColumn, FlexRow, HeadlessButton } from '@reloaded/headless';
import { scriptPause } from '@presource/core';

// This is standard usage
const StandardUsage = React.memo(() => {
    // Simple use of delegate hook
    const value = useDelegateHook(() => {
        return 5;
    });

    const buttonProps = {
        // With no arguments the delegate just returns the last stored value
        label: `Standard Value: ${(value() || 0).toString()}`,
        onClick: () => {
            // Any argument runs the callback (even the `null` used below); zero arguments
            // is the read path instead
            value(null);
        }
    };

    return <HeadlessButton {...buttonProps} />;
});

const PromiseUsage = React.memo(() => {
    const value = useDelegateHook(async () => {
        await scriptPause(100);
        return 8;
    });

    const buttonProps = {
        // With no arguments the delegate just returns the last stored value
        label: `Promised Value: ${(value() || 0).toString()}`,
        onClick: () => {
            // Any argument runs the callback (even the `null` used below); zero arguments
            // is the read path instead
            value(null);
        }
    };

    return <HeadlessButton {...buttonProps} />;
});

const AdvancedUsage = React.memo(() => {
    const value = useDelegateHook(async (counter: number) => {
        value.set(counter);
        await scriptPause(200);
        value.set(value.get() + 1);
        await scriptPause(200);
        value.set(value.get() + 1);
    });

    const buttonProps = {
        // With no arguments the delegate just returns the last stored value
        label: `Advanced Value: ${(value() || 0).toString()}`,
        onClick: () => {
            // Any argument runs the callback (even the `null` used below); zero arguments
            // is the read path instead
            value(1);
        }
    };

    return <HeadlessButton {...buttonProps} />;
});

const ComplexUsage = React.memo(() => {
    // Use delegate hook with parameters
    const value = useDelegateHook((a: number, b?: number) => {
        return a + (b || 10);
    });

    const buttonPropsOne = {
        // With no arguments the delegate just returns the last stored value
        label: `ButtonOne: ${(value() || 0).toString()}`,
        onClick: () => {
            // Any argument runs the callback (even the `null` used below); zero arguments
            // is the read path instead
            value(10, 5);
        }
    };

    const buttonPropsTwo = {
        // With no arguments the delegate just returns the last stored value
        label: `ButtonTwo: ${(value() || 0).toString()}`,
        onClick: () => {
            // Any argument runs the callback (even the `null` used below); zero arguments
            // is the read path instead
            value(10);
        }
    };

    return (
        <FlexRow>
            <HeadlessButton {...buttonPropsOne} />
            <HeadlessButton {...buttonPropsTwo} />
        </FlexRow>
    );
});

const meta: Meta = {
    title: 'Presource/React/Hook/Delegate Hook',
    component: React.memo(() => {
        return (
            <FlexColumn>
                <StandardUsage />
                <PromiseUsage />
                <AdvancedUsage />
                <ComplexUsage />
            </FlexColumn>
        );
    })
};

export default meta;

// Storybook
export const DelegateHook = asTestStory(async () => {
    await $dom.button('Standard Value: 0').click();
    await $dom.button('Promised Value: 0').click();
    await $dom.button('ButtonOne: 0').click();
    await $dom.button('ButtonTwo: 15').click();

    // Verifying all the buttons are there
    await $dom.button('Standard Value: 5').isValid();
    await $dom.button('Promised Value: 8').isValid();
    await $dom.button('ButtonOne: 20').isValid();
    await $dom.button('ButtonTwo: 20').isValid();

    // Verifying advanced value
    await $dom.button('Advanced Value: 0').click();
    await $dom.button('Advanced Value: 1').isValid();
    await $dom.button('Advanced Value: 2').isValid();
    await $dom.button('Advanced Value: 3').isValid();
});
