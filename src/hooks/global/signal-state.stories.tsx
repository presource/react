import { Meta } from '@storybook/react';
import { $dom, asTestStory } from '@presource/test';
import React from 'react';
import { Button } from '@reloaded/material';
import { FlexRow } from '@reloaded/headless';
import { signalState } from './signal-state';

// The signal lives at module scope, outside any React component: a component that calls it
// subscribes, and any write re-renders every subscriber.
const counter = signalState(0);

// This is configurations
const meta: Meta = {
    title: 'Presource/React/Hook/Signal State',
    // Setting the component
    component: React.memo(() => {
        return (
            <FlexRow wrap={'wrap'}>
                <Button
                    label={`Signal: ${counter()}`}
                    onClick={() => {
                        counter((value) => value + 1);
                    }}
                />
            </FlexRow>
        );
    })
};

export default meta;

// Verifying that counter button works
export const SignalState = asTestStory(async () => {
    await $dom.button('Signal: 0').click();
    await $dom.button('Signal: 1').click();
    await $dom.button('Signal: 2').click();
    await $dom.button('Signal: 3').click();
});
