// Standard Breakpoints
export type StandardBreakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// For combination styling
export type StandardBreakpointList<T = string | number> = {
    [key in StandardBreakpoint]?: { [key: string]: T };
};
