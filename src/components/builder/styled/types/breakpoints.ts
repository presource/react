// The five breakpoint keys the styled helpers understand, smallest first.
export type StandardBreakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Shape `styleCombine` produces and `styleMedia` consumes: each breakpoint holds one bag of CSS
// declarations (property name -> value).
export type StandardBreakpointList<T = string | number> = {
    [key in StandardBreakpoint]?: { [key: string]: T };
};
