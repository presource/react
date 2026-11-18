import { Meta } from '@storybook/react';
import React from 'react';
import { $screen, $user, asTestStory } from '@presource/test';
import { expect } from 'storybook/test';
import { Button } from '@reloaded/material';
import { singletonComponent } from '@presource/react';

// You can build reactive button with functional component!
const singletonButton = singletonComponent(Button, {
    label: 'SingletonButton',
    onClick: () => {
        singletonButton({
            label: 'All changed'
        });
    }
});

// This is configuration
const meta: Meta = {
    title: 'Presource/React/Components/Singleton/Singleton Component',
    // Setting the component
    component: React.memo(() => {
        return (
            <>
                {singletonButton()}
                {singletonButton()}
                {singletonButton()}
                {singletonButton()}
            </>
        );
    })
};

export default meta;

// Storybook
export const SingletonButton = asTestStory(async () => {
    // Every instance shares the same state, so all four render the initial label.
    const initialButtons = await $screen.findAllByRole('button', { name: 'SingletonButton' });
    await expect(initialButtons).toHaveLength(4);

    // A single click updates the shared singleton state for every instance.
    await $user.click(initialButtons[0]);
    const updatedButtons = await $screen.findAllByRole('button', { name: 'All changed' });
    await expect(updatedButtons).toHaveLength(4);
});
