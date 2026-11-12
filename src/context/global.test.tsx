import * as stories from './global.stories';
import { storybookTestRunner } from '@library/test';
// import userEvent from '@testing-library/user-event';

describe('Global React Context Store Interaction Test', () => {
    storybookTestRunner(stories);
});
