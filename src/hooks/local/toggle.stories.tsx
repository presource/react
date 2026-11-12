import { Meta } from '@storybook/react';
import React from 'react';
import { useToggleHook } from '@presource/react';
import { $dom, $expect, asTestStory } from '@library/test';
import { FlexColumn, HeadlessButton } from '@reloaded/headless';

// Simple toggle usage
const StandardUsage = React.memo(() => {
    const toggle = useToggleHook(false);

    const props = {
        label: toggle() ? 'on' : 'off',
        onClick: () => {
            toggle(!toggle());
        }
    };

    return <HeadlessButton {...props} />;
});

// Controlled toggle usage
const ControlledUsage = React.memo(() => {
    const toggle = useToggleHook(false);

    return (
        <FlexColumn>
            <HeadlessButton label="set true" onClick={() => toggle(true)} />
            <HeadlessButton label="set false" onClick={() => toggle(false)} />
            <div>{toggle() ? 'enabled' : 'disabled'}</div>
        </FlexColumn>
    );
});

const meta: Meta = {
    title: 'Presource/React/Hook/Toggle Hook',
    component: React.memo(() => {
        return (
            <FlexColumn>
                <StandardUsage />
                <ControlledUsage />
            </FlexColumn>
        );
    })
};

export default meta;

// Storybook
export const ToggleHook = asTestStory(async () => {
    // Verifying simple toggle
    await $dom.button('off').isValid();
    await $dom.button('off').click();
    await $dom.button('on').isValid();
    await $dom.button('on').click();
    await $dom.button('off').isValid();

    // Verifying controlled toggle
    await $expect.text('disabled');
    await $dom.button('set true').click();
    await $expect.text('enabled');
    await $dom.button('set false').click();
    await $expect.text('disabled');
});
