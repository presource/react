import * as stories from './FunctionalButton.stories';
import { storybookTestRunner } from '@presource/test';

// Standard story runner: every story exported from the paired .stories file becomes a test case.
describe('FunctionalButton Interaction Test', () => {
    // Runs each story's render + play steps through storybookTestRunner.
    storybookTestRunner(stories);
});
