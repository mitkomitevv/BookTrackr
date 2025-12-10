import { useContext, useState } from 'react';
import { useForm } from './useForm';
import { useRequest } from './useRequest';
import UserContext from '../contexts/UserContext';

export function useFormRequest({
    path,
    method = 'POST',
    initialValues = {},
    mapValues,
    onSuccess,
    onError,
    withAuth = false,
}) {
    const { request } = useRequest();
    const { user } = useContext(UserContext);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const form = useForm({
        initialValues,
        onSubmit: async (values) => {
            const payload = mapValues ? mapValues(values) : values;
            console.log('Submitting form to', path, 'with payload', payload);

            setLoading(true);
            setError(null);

            try {
                const headers =
                    withAuth && user?.accessToken
                        ? { 'X-Authorization': user.accessToken }
                        : {};

                console.log('Using headers:', path, method, payload, headers);
                const result = await request(path, method, payload, headers);
                onSuccess?.(result, form.reset);
            } catch (err) {
                setError(err);
                onError?.(err);
            } finally {
                setLoading(false);
            }
        },
    });

    return { ...form, loading, error };
}
