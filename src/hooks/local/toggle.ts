import { useStateHook } from './state';
import { isBoolean } from '@presource/core';

// Boolean accessor built on useStateHook: no argument reads, a boolean argument writes. Despite
// the name nothing flips on its own — `toggle(!toggle())` (src/hooks/local/toggle.stories.tsx) is
// what inverts the value. `initialValue` goes through `!!`, so the stored value is always boolean.
export const useToggleHook = (initialValue?: any) => {
    // Get the Toggle Function
    const toggle = useStateHook(!!initialValue);

    // Return the Accessor Function
    return (updatedValue?: boolean) => {
        // Getting the Toggle Value
        const currentValue = toggle();
        if (updatedValue === undefined) return currentValue;
        // Only a boolean that differs from the current value is written: any other argument, or
        // the value it already holds, is dropped and re-renders nothing.
        if (isBoolean(updatedValue) && currentValue !== updatedValue) {
            // Update Toggle with new Value
            toggle(updatedValue);
        }
    };
};
