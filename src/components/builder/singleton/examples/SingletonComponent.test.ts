import * as stories from './SingletonComponent.stories';
import { storybookTestRunner } from '@presource/test';

// These are standard storybook test.
describe('SingletonComponent Interaction Test', () => {
    // Run all story through storybook test runner
    storybookTestRunner(stories);
});
