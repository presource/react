import { Meta } from '@storybook/react';
import { fn } from 'storybook/test';
import { button } from '@reloaded/material';

// TODO: bug - This story does NOT use prototypeComponent at all. It imports `button` from
// @reloaded/material and renders it directly. The story should be rewritten to demonstrate
// prototypeComponent by wrapping the Button with default props and showing how overrideProps work.
// TODO: missing-story-test - Add `asTestStory` assertions to verify prototype behavior:
// - Default props are applied when no override props are passed
// - Override props take precedence over prototype props
// - Hook-driven props (use-prefixed) are resolved at render time

// This is configuration
const meta: Meta = {
    title: 'Presource/React/Components/Prototype/Prototype Button',
    // Setting the component
    component: button(),
    args: {
        onClick: fn()
    }
};

export default meta;

// Storybook
export const PrototypeButton = {};
