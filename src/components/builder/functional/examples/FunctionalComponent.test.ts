import * as stories from './FunctionalComponent.stories';
import { storybookTestRunner } from '@presource/test';

// These are standard storybook test.
describe('FunctionalComponent Interaction Test', () => {
    // Run all story through storybook test runner
    storybookTestRunner(stories);
});
