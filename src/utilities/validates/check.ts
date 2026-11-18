// Duck-typed check for "something React has stamped": true for any value carrying a
// `$$typeof` marker. Against this React build that means React.memo and forwardRef results
// and React elements from createElement (the marker is present on all three); plain function
// components carry no marker and answer false, as do plain objects, arrays, strings, numbers,
// booleans, null and undefined.
// Unit tests: check.test.tsx pins those outcomes.
// NOTE: `$$typeof` is a React-internal marker, so the true cases could change across React
// versions. `React.isValidElement` is not a substitute: it compares the same marker against
// REACT_ELEMENT_TYPE only, so it answers false for the memo/forwardRef values this returns
// true for.
export const isReactComponent = (input: any) => {
    return !!input?.$$typeof;
};
