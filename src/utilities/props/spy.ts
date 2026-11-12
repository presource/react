// This is modified specifically for local, as ReactObject is also an object constructor
import { isObject, ObjectObserve, objectProxy } from '@presource/core';
import { isReactComponent } from '../validates';

// Unit tests: see spy.test.tsx, which covers the behaviours below.
// - Returns a Proxy-wrapped version of the input
// - get trap: callback is invoked with { key, value, current, object, method, depth, path }
// - get trap: nested objects are recursively proxied with incremented depth and accumulated path
// - get trap: React components (isReactComponent) are NOT recursively proxied
// - get trap: primitives are returned as-is
// - set trap: callback is invoked with correct params including the new value
// - set trap: item[key] is updated with the new value
// - set trap: returns true (proxy set requirement)
// - set trap: nested set correctly builds the path array
const isValidObject = (item: any) => {
    // If it is a React object, then returns false immediately
    if (isReactComponent(item)) return false;
    // Otherwise returns object check
    return isObject(item);
};

export const propsSpy: ObjectObserve = (item, callback, chain = { depth: 0, path: [] }) => {
    // Return the Proxy Object
    return objectProxy(item, {
        // Get Observer
        get: ({ object, key, value, method }) => {
            const { depth } = chain;
            const path = [...chain.path];
            // Adding Key into Path
            path.push(key);
            // This is the curent value
            const current = item[key];
            // Setting the Params
            const params = { key, value, current, object: item, method, depth, path };
            // The Actual Raw Values
            callback(params);
            // Get the updated value
            const updatedValue = object[key];

            // Return another proxied object for recursion
            return isValidObject(updatedValue)
                ? propsSpy(updatedValue, callback, {
                      depth: depth + 1,
                      path
                  })
                : updatedValue;
        },

        // Set observer
        set: ({ key, value, method }) => {
            // Only Process if Callback exists
            // the passed method
            const { depth } = chain;
            const path = [...chain.path];
            // Adding Key into Path
            path.push(key);
            // The current value
            const current = item[key];
            // Updating value
            item[key] = value;
            // Creating the Params
            const params = {
                key,
                value,
                current,
                object: item,
                method,
                depth,
                path
            };
            // Calling the Params
            callback(params);

            // Return the necessary boolean value
            return true;
        }
    });
};
