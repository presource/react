// Checking if something is a React component
// Unit tests: see check.test.tsx (memo/forwardRef → true; plain functions,
// objects, null/undefined, strings → false).
// NOTE: Relies on React internal `$$typeof` symbol. This is fragile and may break across React versions.
// Consider using a more robust check (e.g. React.isValidElement or checking prototype chain).
export const isReactComponent = (input: any) => {
    return !!input?.$$typeof;
};
