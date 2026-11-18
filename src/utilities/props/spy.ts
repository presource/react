import { isObject, ObjectObserve, objectProxy } from '@presource/core';
import { isReactComponent } from '../validates';

// Local object check rather than core's `isObject` alone: `isObject` compares the
// constructor to `Object`, and React's memo/forwardRef wrappers and React elements are
// plain object literals, so they pass it and would be proxied and descended into. Checking
// `isReactComponent` (../validates/check.ts, keyed off React's `$$typeof` stamp) first hands
// components back unproxied.
const isValidObject = (item: any) => {
    // Components and elements bail out before the object check
    if (isReactComponent(item)) return false;
    // Everything else is decided by the plain-object check
    return isObject(item);
};

// Unit tests: see spy.test.tsx. It pins that the result is a Proxy over the input; that the get
// trap fires with { key, value, current, object, method, depth, path } and recursively proxifies
// nested plain objects (depth + 1, path extended); that primitives and React components are handed
// back unproxied; that the set trap fires with the new value, writes through to the target and
// returns true; and that a nested write extends the path (['nested', 'value']). Its array case
// only asserts that the get trap fires once for the array key, so it does NOT pin arrays as
// unproxied — that arrays bail out comes from isValidObject above, not from a test. `chain`
// carries that depth/path context into the recursive calls.
export const propsSpy: ObjectObserve = (item, callback, chain = { depth: 0, path: [] }) => {
    // Return the Proxy Object
    return objectProxy(item, {
        // Get Observer
        get: ({ object, key, value, method }) => {
            const { depth } = chain;
            const path = [...chain.path];
            // Adding Key into Path
            path.push(key);
            // `current` is the value stored on the target — it duplicates the trap's own `value`
            // here: core's objectProxy builds `value` from `object[key]`, and `object` is this same
            // `item` target, so both callback fields carry the identical read.
            const current = item[key];
            // Setting the Params
            const params = { key, value, current, object: item, method, depth, path };
            // The Actual Raw Values
            callback(params);
            // Get the updated value: re-read AFTER the callback ran, so a callback that
            // assigns to `object[key]` changes what the read yields — context/global.ts
            // routes reads into its state store that way
            const updatedValue = object[key];

            // Nested plain objects are proxied again with the accumulated path; everything
            // else (primitives, arrays, React components) is handed back as-is
            return isValidObject(updatedValue)
                ? propsSpy(updatedValue, callback, {
                      depth: depth + 1,
                      path
                  })
                : updatedValue;
        },

        // Set observer
        set: ({ key, value, method }) => {
            // Same depth/path bookkeeping as the get trap: depth comes from the chain and
            // the written key is appended to the path
            const { depth } = chain;
            const path = [...chain.path];
            // Adding Key into Path
            path.push(key);
            // The value stored before the write, reported to the callback as `current`
            const current = item[key];
            // The write lands on the raw target before the callback runs, so the callback
            // sees the already-updated object
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
