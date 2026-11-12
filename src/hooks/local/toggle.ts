import { useStateHook } from './state';
import { isBoolean } from '@presource/core';

// For toggling the hook
export const useToggleHook = (initialValue?: any) => {
    // Get the Toggle Function
    const toggle = useStateHook(!!initialValue);

    // Return the Accessor Function
    return (updatedValue?: boolean) => {
        // Getting the Toggle Value
        const currentValue = toggle();
        if (updatedValue === undefined) return currentValue;
        // Can Only Accept Boolean Value
        if (isBoolean(updatedValue) && currentValue !== updatedValue) {
            // Update Toggle with new Value
            toggle(updatedValue);
        }
    };
};
