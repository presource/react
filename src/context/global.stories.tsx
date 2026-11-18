import { Meta } from '@storybook/react';
import { $dom, asTestStory } from '@presource/test';
import React from 'react';
import { Button } from '@reloaded/material';
import { FlexRow } from '@reloaded/headless';
import { globalContextStore } from './global';

const reactStore = globalContextStore({
    counter: 0
});

// This is configurations
const meta: Meta = {
    title: 'Presource/React/Context/Global Store',
    // Setting the component
    component: React.memo(() => {
        // Demonstration of the context store
        const { counter } = reactStore();
        return (
            <FlexRow wrap={'wrap'}>
                <Button
                    label={`Counter: ${counter}`}
                    onClick={() => {
                        reactStore.counter++;
                    }}
                />
                <Button
                    label={`Reset`}
                    onClick={() => {
                        // Reset is a placeholder: `reactStore('data').reset()` below is the
                        // API the store's type declares, but the store proxy has no apply
                        // trap, so the call falls through to `useData` (see the note on
                        // `globalContextStore` in global.ts). A click is not a render, so the
                        // `useState` inside `useData` throws instead of resetting anything.
                        // The matching play step at the bottom of this file stays commented
                        // out until global.ts implements the 'data' option.
                        reactStore('data').reset();
                    }}
                />
            </FlexRow>
        );
    })
};

export default meta;

// Verifying that counter button works
export const GlobalStore = asTestStory(async () => {
    await $dom.button('Counter: 0').click();
    await $dom.button('Counter: 1').click();
    await $dom.button('Counter: 2').click();
    await $dom.button('Counter: 3').click();
    // The reset assertion this story would make, kept commented out: clicking Reset
    // throws today because the store's 'data' overload is not implemented (see the note
    // on the Reset button above and on `globalContextStore` in global.ts).
    // await $dom.button('Reset').click();
});
