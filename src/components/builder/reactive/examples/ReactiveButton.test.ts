import * as stories from './ReactiveButton.stories';
import { storybookTestRunner } from '@presource/test';

// Standard story runner: every story exported from the paired .stories file becomes a test case.
describe('ReactiveButton Interaction Test', () => {
    // Runs each story's render + play steps through storybookTestRunner.
    storybookTestRunner(stories);
});
