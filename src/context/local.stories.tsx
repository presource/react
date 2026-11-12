import { Meta } from '@storybook/react';
import { $dom, asTestStory } from '@library/test';
import React from 'react';
import { Button, ButtonProps } from '@reloaded/material';
import { FlexRow } from '@reloaded/headless';
import { localContextStore } from './local';

const { ContextProvider, contextStore } = localContextStore({
    counter: 0
});

const ButtonCounter = React.memo((props: { id: string }) => {
    const { id } = props;
    const store = contextStore();
    const buttonProps: ButtonProps = {
        label: `${id}: ${store.counter}`,
        onClick: () => {
            // Incremental
            store.counter++;
        }
    };
    return <Button {...buttonProps} />;
});

const ResetButton = React.memo(() => {
    const store = contextStore();
    // TODO: clarity - ResetButton's onClick is empty `() => {}`.
    // The local context store type signature defines `contextStore('state').reset()` and
    // `contextStore('data').clone()`/`contextStore('data').update()`, but these are never demonstrated
    // in the story. The ResetButton should call contextStore('state').reset() to show reset functionality.
    const buttonProps: ButtonProps = {
        label: 'Reset',
        onClick: () => {
            // TODO: Implement reset
        }
    };
    return <Button {...buttonProps} />;
});

// This is configurations
const meta: Meta = {
    title: 'Presource/React/Context/Local Store',
    // Setting the component
    component: React.memo(() => {
        return (
            <FlexRow wrap={'wrap'}>
                <ContextProvider>
                    <ContextProvider>
                        <ButtonCounter id={'first'} />
                    </ContextProvider>

                    <ContextProvider>
                        <ButtonCounter id={'second'} />
                    </ContextProvider>

                    <ButtonCounter id={'third'} />
                    <ButtonCounter id={'fourth'} />
                </ContextProvider>
            </FlexRow>
        );
    })
};

export default meta;

// Verifying that counter button works
export const LocalStore = asTestStory(async () => {
    // Play around with the first button
    await $dom.button('first: 0').click();
    await $dom.button('first: 1').click();
    await $dom.button('first: 2').click();
    await $dom.button('first: 3').click();
    // Second button should not be linked to the first button
    await $dom.button('second: 0').click();
    await $dom.button('second: 1').click();
    // Third and Fourth Button are linked because under same context
    await $dom.button('third: 0').click();
    await $dom.button('fourth: 1').click();
});
