import { useState } from 'react';

export default function useLocalStorage(initialState, key) {
    const hasLocalStorage =
        typeof window !== 'undefined' &&
        typeof window.localStorage !== 'undefined';

    const readInitial = () => {
        const init =
            typeof initialState === 'function' ? initialState() : initialState;
        if (!hasLocalStorage) {
            return init;
        }
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : init;
        } catch (err) {
            console.warn(`useLocalStorage: read error for key ${key}`, err);
            return init;
        }
    };

    const [state, setState] = useState(readInitial);

    const setPersistedState = (valueOrFn) => {
        setState((prev) => {
            const next =
                typeof valueOrFn === 'function' ? valueOrFn(prev) : valueOrFn;
            if (!hasLocalStorage) {
                return next;
            }
            try {
                localStorage.setItem(key, JSON.stringify(next));
            } catch (err) {
                console.warn(
                    `useLocalStorage: write error for key ${key}`,
                    err,
                );
            }
            return next;
        });
    };

    return [state, setPersistedState];
}
