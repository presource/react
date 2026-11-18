import * as stories from './ReactiveButton.stories';
import { storybookTestRunner } from '@presource/test';

// These are standard storybook test.
describe('ReactiveButton Interaction Test', () => {
    // Run all story through storybook test runner
    storybookTestRunner(stories);
});
