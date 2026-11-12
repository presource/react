import { Meta } from '@storybook/react';
import { Button } from '@reloaded/material';
import { singletonComponent } from '@presource/react';
import React from 'react';

// TODO: missing-story-test - This story has no `asTestStory` assertions. Add tests to verify:
// - All four buttons render with the same label 'SingletonButton'
// - Clicking one button updates all four buttons to 'All changed'
// - handler.state exposes the underlying signalState

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
export const SingletonButton = {};
