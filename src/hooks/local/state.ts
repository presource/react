import { useRef, useState } from 'react';
import { useReferenceHook } from './reference';

export type UseStateHook = <T>(initialValue?: T) => {
    (): T;
    (value?: T): void;
};

// This is not the same as normal useState.
// Values are remembered across re-rendered
export const useStateHook: UseStateHook = (initialValue) => {
    const reference = useReferenceHook({
        value: initialValue
    });

    const [_, setState] = useState({});

    // Create the accessor ONCE per component lifetime, exactly like
    // useReferenceHook does (see reference.ts): consumers rely on a STABLE
    // handle identity in effect/callback dep lists (ChatAssistantApp's
    // scroll-jump cancellation was the live incident). Both captured handles
    // are safe to close over permanently: `reference` is the stable accessor
    // from useReferenceHook above, and React's useState setter is guaranteed
    // identity-stable by React itself.
    const accessor = useRef<{ (updatedValue?: any): any } | null>(null);
    if (accessor.current === null) {
        accessor.current = ((updatedValue: any) => {
            if (updatedValue === undefined) return reference().value;

            // Updated new value
            reference({
                value: updatedValue
            });

            setState({});
        }) as any;
    }

    return accessor.current as any;
};
