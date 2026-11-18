import * as stories from './FunctionalComponent.stories';
import { storybookTestRunner } from '@presource/test';

// Standard story runner: every story exported from the paired .stories file becomes a test case.
describe('FunctionalComponent Interaction Test', () => {
    // Runs each story's render + play steps through storybookTestRunner.
    storybookTestRunner(stories);
});
