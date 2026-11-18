import * as stories from './PrototypeButton.stories';
import { storybookTestRunner } from '@presource/test';

// These are standard storybook test.
describe('PrototypeButton Interaction Test', () => {
    // Run all story through storybook test runner
    storybookTestRunner(stories);
});
