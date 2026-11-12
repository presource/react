// For converting something to rem
import { objectMap, typeSwitch } from '@presource/core';

export const styleStructure = (input: any) => {
    const correctStructure = typeSwitch(input, {
        object: ({ value }) => value,
        default: ({ value }) => ({ xs: value })
    });

    // Remapping the style
    return objectMap(correctStructure, (entry) => {
        return typeSwitch(entry.value, {
            // If it is string
            string: ({ value }) => {
                // If the string represents zero, return 0
                if (+value === 0 && !isNaN(+value)) return 0;
                // Otherwise simply return the string as-is (e.g. '2', '0px')
                return value;
            },
            // Number decoding
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
