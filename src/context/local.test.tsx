import * as stories from './local.stories';
import { storybookTestRunner } from '@library/test';
// import userEvent from '@testing-library/user-event';

describe('Local React Context Store Interaction Test', () => {
    storybookTestRunner(stories);
});
