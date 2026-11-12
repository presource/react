import { StandardBreakpoint, StandardBreakpointList } from '../types';
import { objectEach } from '@presource/core';

type List<T = string | number> = {
    [key: string]: {
        [key in StandardBreakpoint]?: T;
    };
};

export const styleCombine = (...list: List[]) => {
    const result: StandardBreakpointList = {
        xs: {},
        sm: {},
        md: {},
        lg: {},
        xl: {}
    };

    list.forEach((item) => {
        objectEach(item, ({ key, value }) => {
            objectEach(value, ({ key: breakpoint }) => {
                result[breakpoint]![key] = value[breakpoint] as any;
            });
        });
    });

    return result;
};
