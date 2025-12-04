import { useState, useEffect, useRef, useCallback } from "react";

export const BASE_URL = "http://localhost:3030";

// TODO: fix double requests in some pages (Catalog, AdminPanel etc.)

async function jsonRequest(path, method = "GET", body = null, headers = {}, signal) {
    const options = {
        method,
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...headers,
        },
    };

    if (signal) {
        options.signal = signal;
    }

    if (body !== null) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(BASE_URL + path, options);

    if (!response.ok) {
        const err = new Error("Request failed");
        err.status = response.status;
        try {
            err.payload = await response.json();
        } catch {
            err.payload = null;
        }
        throw err;
    }

    if (response.status === 204) {
        return null;
    }

    const text = await response.text();
    if (!text) {
        return null;
    }

    return JSON.parse(text);
}


// For actions (login, submit, etc.)

export function useRequest() {
    const request = useCallback(
        (path, method = "GET", body = null, headers = {}, signal) =>
            jsonRequest(path, method, body, headers, signal),
        []
    );

    return { request };
}

// For loading data on mount/dependency change

export function useFetch(path, { immediate = true, headers = {} } = {}) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(immediate);
    const [error, setError] = useState(null);

    const controllerRef = useRef(null);

    const fetchData = useCallback(async () => {
        if (!path) return;
        controllerRef.current?.abort();
        const controller = new AbortController();
        controllerRef.current = controller;

        setLoading(true);
        setError(null);

        try {
            const result = await jsonRequest(path, "GET", null, headers, controller.signal);
            if (!controller.signal.aborted) {
                setData(result);
            }
        } catch (err) {
            if (!controller.signal.aborted) {
                setError(err);
            }
        } finally {
            if (!controller.signal.aborted) {
                setLoading(false);
            }
        }
    }, [path, JSON.stringify(headers)]);

    useEffect(() => {
        if (immediate) fetchData();
        return () => controllerRef.current?.abort();
    }, [fetchData, immediate]);

    return { data, loading, error, refetch: fetchData };
}
