// Module summary: normalises a CSS value into a breakpoint-keyed map (non-objects become { xs:
// value }) and rewrites the numeric entries as rem — the (n * 8) / 16 scale used across the repo.
import { objectMap, typeSwitch } from '@presource/core';

export const styleStructure = (input: any) => {
    const correctStructure = typeSwitch(input, {
        object: ({ value }) => value,
        default: ({ value }) => ({ xs: value })
    });

    // Remapping the style
    return objectMap(correctStructure, (entry) => {
        return typeSwitch(entry.value, {
            // String: the coercion below is only a zero test. '0', '0.0' and even '' or
            // whitespace-only strings answer the number 0 (Number('') is 0), while '2' and '0px'
            // are non-zero / NaN and are returned untouched.
            string: ({ value }) => {
                // If the string represents zero, return 0
                if (+value === 0 && !isNaN(+value)) return 0;
                // Otherwise simply return the string as-is (e.g. '2', '0px')
                return value;
            },
            // Number → rem: (value * 8) / 16, so 16 becomes '8rem' and 5 becomes '2.5rem';
            // a zero stays the number 0 (both pinned in structure.test.ts)
            number: ({ value }) => {
                const num = (value * 8) / 16;
                if (num) return `${num}rem`;
                // Otherwise, returns 0
                return 0;
            },
            default: ({ value }) => value
        });
    });
};
