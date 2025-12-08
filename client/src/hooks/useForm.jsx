import { useState, useCallback, useMemo } from 'react';

export function useForm({ initialValues = {}, onSubmit } = {}) {
    const [values, setValues] = useState(initialValues);

    const handleChange = useCallback((e) => {
        const { name, type, checked, value } = e.target;
        setValues((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    }, []);

    const registerInput = useCallback(
        (name, extraProps = {}) => ({
            name,
            value: values[name] ?? '',
            onChange: handleChange,
            ...extraProps,
        }),
        [values, handleChange],
    );

    const handleSubmit = useCallback(
        async (e) => {
            e?.preventDefault?.();
            await onSubmit?.(values);
        },
        [values, onSubmit],
    );

    const reset = useCallback(
        (nextValues) => setValues(nextValues ?? initialValues),
        [initialValues],
    );

    const formProps = useMemo(
        () => ({ onSubmit: handleSubmit }),
        [handleSubmit],
    );

    return {
        values,
        setValues,
        registerInput,
        handleChange,
        handleSubmit,
        reset,
        formProps,
    };
}
