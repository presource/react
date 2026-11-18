import * as stories from './signal-state.stories';
import { storybookTestRunner } from '@presource/test';

describe('Global Signal Interaction Test', () => {
    storybookTestRunner(stories);
});
