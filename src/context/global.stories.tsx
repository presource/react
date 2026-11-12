import { Meta } from '@storybook/react';
import { $dom, asTestStory } from '@library/test';
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
                        // TODO: bug - Reset functionality is not implemented correctly.
                        // The 'data' option is not handled by the proxyHandler in global.ts.
                        // Currently the proxy only handles 'get' and 'set' methods, but
                        // globalContextStore('data') would trigger a 'get' which returns the value,
                        // not the { reset, initial } API described in the type signature.
                        // This needs to be fixed in global.ts before enabling this test.
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
    // Reset the store
    // await $dom.button('Reset').click(); // This is not implemented correctly yet
});
