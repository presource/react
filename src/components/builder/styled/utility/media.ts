import { StandardBreakpoint, StandardBreakpointList } from '../types';
import { objectEach } from '@presource/core';

type Breakpoints = {
    [key in StandardBreakpoint]: number;
};

export const styleMedia = (breakpoints: Breakpoints, ...combinedList: StandardBreakpointList[]) => {
    const result: {
        [key: string]: {
            [key: string]: string | number;
        };
    } = {};

    objectEach(breakpoints, ({ key, value: breakpoint }) => {
        combinedList.forEach((list) => {
            if (list[key]) {
                const mediaQuery = `@media (min-width: ${breakpoint}px)`;
                result[mediaQuery] = { ...result[mediaQuery], ...list[key] };
            }
        });
    });
    return result;
};
