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
            const parsed = stored ? JSON.parse(stored) : null;

            // If rememberMe was false, check if sessionStorage still has the auth
            if (parsed && parsed.rememberMe === false) {
                try {
                    const sessionAuth = sessionStorage.getItem('auth-session');
                    return sessionAuth ? JSON.parse(sessionAuth) : init;
                } catch (err) {
                    console.warn(
                        `useLocalStorage: session read error for key ${key}`,
                        err,
                    );
                    return init;
                }
            }

            return parsed || init;
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
