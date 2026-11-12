import * as stories from './FunctionalButton.stories';
import { storybookTestRunner } from '@library/test';

// These are standard storybook test.
describe('FunctionalButton Interaction Test', () => {
    // Run all story through storybook test runner
    storybookTestRunner(stories);
});
