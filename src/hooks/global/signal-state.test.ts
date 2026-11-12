import * as stories from './signal-state.stories';
import { storybookTestRunner } from '@library/test';
// import userEvent from '@testing-library/user-event';

describe('Global Signal Interaction Test', () => {
    storybookTestRunner(stories);
});
