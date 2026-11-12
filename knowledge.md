# @presource/react Knowledge

All imports from `@presource/react` — React hooks, context stores, and builder utilities.

> **Last verified:** 2026-06-19
> **Package name:** `@presource/react`
> **Workspace dependencies:** `@presource/core` (used internally)
> **Workspace consumers:** `@reloaded/headless`, `@reloaded/material`, `@reloaded/design`, `@library/workflow`, `@library/test`, `@reloaded/pages`

---

## How to Update This File

1. Read `index.ts` to find current exports
2. Check each sub-module for new hooks, stores, or components
3. Verify function signatures against source files
4. Update the "Last verified" date
5. Keep code examples short — focus on the most common usage pattern

---

## Index

### Builder
- [Prototype Component](#prototype-component)

### Context
- [Global Context Store](#global-context-store)
- [Local Context Store](#local-context-store)

### Hooks
- [useStateHook](#usestatehook)
- [useReferenceHook](#usereferencehook)
- [useDelegateHook](#usedelegatehook)
- [useToggleHook](#usetogglehook)
- [useDelayHook](#usedelayhook)
- [useRepeatingHook](#userepeatinghook)
- [signalState](#signalstate)

---

## Builder

### Prototype Component
Wraps an existing component with preset default props for fast prototyping. Supports fixed props and hook-driven props (prefixed with `use`).

```tsx
import { prototypeComponent } from '@presource/react';
import { Button } from '@reloaded/material';

// Step 1: bind a component with prototype (default) props
const button = prototypeComponent(Button, {
    label: 'Click Me',
    useDisabled: (props) => props.label === '', // hook-driven: resolved at render time
});

// Step 2: create a variant by optionally overriding props
const PrimaryButton = button({ variant: 'contained' });

// Step 3: use it like a normal component — all props are optional
function App() {
    return <PrimaryButton />;            // uses all prototype defaults
    return <PrimaryButton label="Go" />; // overrides just the label
}
```

**Key concepts:**
- `prototypeComponent(Component, prototypeProps?)` — binds a component with default prototype props
- Calling the result `(overrideProps?)` — layers override props on top, returns a `React.FC` with all props optional
- **Hook-driven props** — any prop key prefixed with `use` (e.g. `useDisabled`) is treated as a callback `(resolvedProps) => value` and resolved during render, after all static props are merged
- `prototypeProps` and `overrideProps` are merged in order: prototype → override → component instance props

---

## Context

### Global Context Store
Shared state across the entire app. All components share the same instance.

```tsx
import { globalContextStore } from '@presource/react';

const store = globalContextStore({ counter: 0 });

function MyComponent() {
    const { counter } = store(); // subscribe to state

    return (
        <button onClick={() => store.counter++}>
            Counter: {counter}
        </button>
    );
}
```

**Options:**
- `store()` — returns current state and subscribes component to updates
- `store('data').reset(field?)` — reset all or a specific field to initial value
- `store('state').refresh()` — force re-render all subscribers

---

### Local Context Store
Scoped state per `ContextProvider` instance. Components under the same provider share state; separate providers are independent.

```tsx
import { localContextStore } from '@presource/react';

const { ContextProvider, contextStore } = localContextStore({ counter: 0 });

function MyComponent() {
    const store = contextStore(); // subscribe to nearest provider's state

    return (
        <button onClick={() => store.counter++}>
            Counter: {store.counter}
        </button>
    );
}

function App() {
    return (
        <>
            <ContextProvider>  {/* independent scope */}
                <MyComponent />
            </ContextProvider>

            <ContextProvider>  {/* independent scope */}
                <MyComponent />
            </ContextProvider>
        </>
    );
}
```

**Options:**
- `contextStore()` — returns scoped state and subscribes component to updates
- `contextStore('state').reset()` — reset state to initial values
- `contextStore('state').refresh()` — force re-render all subscribers in scope
- `contextStore('data').clone()` — returns a deep clone of current state

---

## Hooks

### useStateHook
A local state hook where the value persists across re-renders. Unlike React's `useState`, reading and writing are done through a single accessor function.

```tsx
import { useStateHook } from '@presource/react';

function MyComponent() {
    const state = useStateHook({ counter: 0 });

    return (
        <button onClick={() => state({ counter: state().counter + 1 })}>
            Counter: {state().counter}
        </button>
    );
}
```

**Key concepts:**
- `state()` — returns the current value
- `state(newValue)` — updates the value and triggers a re-render

---

### useReferenceHook
A ref-backed accessor that reads and writes a value without triggering re-renders. Useful for tracking values that should not cause component updates.

```tsx
import { useReferenceHook } from '@presource/react';

function MyComponent() {
    const reference = useReferenceHook({ counter: 0 });

    return (
        <button onClick={() => reference({ counter: reference().counter + 1 })}>
            Increase Counter
        </button>
    );
}
```

**Key concepts:**
- `reference()` — returns the current value
- `reference(newValue)` — updates the stored value without re-rendering

---

### useDelegateHook
Separates the definition of a function from its execution. The delegate is defined once and invoked later, with its return value stored as state. Supports both sync and async callbacks.

```tsx
import { useDelegateHook } from '@presource/react';

// Standard usage
function StandardExample() {
    const value = useDelegateHook(() => 5);

    return (
        <button onClick={() => value(null)}>
            Value: {value() || 0}
        </button>
    );
}

// With parameters
function ParameterExample() {
    const value = useDelegateHook((a: number, b?: number) => a + (b || 10));

    return (
        <button onClick={() => value(10, 5)}>
            Value: {value() || 0}
        </button>
    );
}

// Async with manual set/get
function AsyncExample() {
    const value = useDelegateHook(async (counter: number) => {
        value.set(counter);
        await someAsyncWork();
        value.set(value.get() + 1);
    });

    return (
        <button onClick={() => value(1)}>
            Value: {value() || 0}
        </button>
    );
}
```

**Key concepts:**
- `value()` — returns the current stored result (no arguments = read)
- `value(...args)` — invokes the delegate with arguments and stores the result
- `value(null)` — invokes the delegate with no meaningful argument (for zero-parameter callbacks)
- `value.get()` — reads the current value (useful inside the async callback itself)
- `value.set(newValue)` — manually sets the stored value mid-execution (useful in async flows)

---

### useToggleHook
A boolean state hook for toggling on/off values.

```tsx
import { useToggleHook } from '@presource/react';

// Standard toggle
function ToggleExample() {
    const toggle = useToggleHook(false);

    return (
        <button onClick={() => toggle(!toggle())}>
            {toggle() ? 'on' : 'off'}
        </button>
    );
}

// Controlled toggle
function ControlledExample() {
    const toggle = useToggleHook(false);

    return (
        <>
            <button onClick={() => toggle(true)}>Enable</button>
            <button onClick={() => toggle(false)}>Disable</button>
            <div>{toggle() ? 'enabled' : 'disabled'}</div>
        </>
    );
}
```

**Key concepts:**
- `toggle()` — returns the current boolean value
- `toggle(boolean)` — sets the toggle to the given value; only updates if the value actually changes

---

### useDelayHook
Executes a function (sync or async) after a delay. The result is stored as state and accessible via the returned accessor. The callback can be replaced at any time to reset the delay.

```tsx
import { useDelayHook } from '@presource/react';

// Standard: runs once after mount with a delay
function DelayExample() {
    const value = useDelayHook(() => 'loaded', 100);

    return <div>{value() || 'loading...'}</div>;
}

// Complex: callback can be replaced on demand
function ComplexExample() {
    const delay = useDelayHook(async () => {
        await scriptPause(100);
        return 'processing';
    });

    return (
        <button
            onClick={() =>
                delay(async () => {
                    await scriptPause(100);
                    return 'completed';
                })
            }
        >
            {delay() || 'pending'}
        </button>
    );
}
```

**Key concepts:**
- `value()` — returns the current result (undefined until the delay resolves)
- `value(newCallback, newDelay?)` — cancels any pending delay and starts a new one with an optional new delay duration

---

### useRepeatingHook
Repeatedly executes an async callback in a loop until stopped. Each iteration waits for the previous one to finish before starting the next.

```tsx
import { useRepeatingHook, useStateHook } from '@presource/react';

function RepeatingExample() {
    const state = useStateHook(0);

    const stop = useRepeatingHook(async ({ pause }) => {
        await pause(100);
        state(state() + 1);
    });

    return (
        <button onClick={() => stop()}>
            {state()}
        </button>
    );
}
```

**Key concepts:**
- The callback receives `{ pause, terminate }` as its argument
  - `pause(ms)` — waits for the given number of milliseconds before continuing
  - `terminate()` — signals the loop to stop from within the callback
- The hook returns a `stop` function — calling it terminates the repeating loop
- Each iteration is locked: a new iteration will not start until the previous one completes

---

### signalState
A global reactive value that lives outside of React components. Any component that calls it subscribes to updates and re-renders when the value changes.

```tsx
import { signalState } from '@presource/react';

// Defined outside any component — shared across the entire app
const counter = signalState(0);

function MyComponent() {
    return (
        <button onClick={() => counter((value) => value + 1)}>
            Signal: {counter()}
        </button>
    );
}
```

**Key concepts:**
- `signal()` — subscribes the current component and returns the current value
- `signal(newValue)` — updates the value and re-renders all subscribers
- `signal(fn)` — updater function form: receives the current value and returns the new value (e.g. `counter(v => v + 1)`)
- `signal.value()` — reads the current value **without** subscribing (safe to use outside components)
- The signal instance is created once and can be shared across any number of components or modules
