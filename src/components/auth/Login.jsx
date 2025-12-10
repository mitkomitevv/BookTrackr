import { useNavigate, Link } from 'react-router';
import { useForm } from '../../hooks/useForm';
import { useContext, useState } from 'react';
import UserContext from '../../contexts/UserContext';

const initialValues = {
    email: '',
    password: '',
    rememberMe: false,
};

export default function Login() {
    const navigate = useNavigate();
    const { loginHandler } = useContext(UserContext);
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState(null);

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validateForm = ({ email, password }) => {
        const newErrors = {};

        if (!email) {
            newErrors.email = 'Email is required';
        } else if (!validateEmail(email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!password) {
            newErrors.password = 'Password is required';
        }

        return newErrors;
    };

    const handleBlur = (fieldName, value) => {
        let fieldError = null;

        if (fieldName === 'email') {
            if (!value) {
                fieldError = 'Email is required';
            } else if (!validateEmail(value)) {
                fieldError = 'Please enter a valid email address';
            }
        }

        if (fieldName === 'password' && !value) {
            fieldError = 'Password is required';
        }

        setErrors((prev) => {
            const newErrors = { ...prev };
            if (fieldError) {
                newErrors[fieldName] = fieldError;
            } else {
                delete newErrors[fieldName];
            }
            return newErrors;
        });
    };

    const { registerInput, formProps } = useForm({
        initialValues,
        onSubmit: async (values) => {
            const validationErrors = validateForm(values);

            if (Object.keys(validationErrors).length > 0) {
                setErrors(validationErrors);
                return;
            }

            setErrors({});
            setServerError(null);

            try {
                await loginHandler(
                    values.email,
                    values.password,
                    values.rememberMe,
                );
                navigate('/');
            } catch (err) {
                if (err.status === 401) {
                    setServerError(
                        'Invalid email or password. Please try again.',
                    );
                } else {
                    setServerError(
                        err.payload?.message ||
                            'Login failed. Please try again.',
                    );
                }
            }
        },
    });

    return (
        <main className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-md px-4 py-10">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 shadow-xl space-y-6">
                    <header className="space-y-2 text-center">
                        <p className="text-xs uppercase tracking-[0.25em] text-emerald-300">
                            Welcome back
                        </p>
                        <h1 className="text-2xl font-semibold text-slate-50">
                            Log in
                        </h1>
                        <p className="text-sm text-slate-400">
                            Continue tracking your reading and discover new
                            favorites.
                        </p>
                    </header>

                    <form {...formProps} className="space-y-4">
                        {/* Server Error */}
                        {serverError && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                                <p className="text-sm text-red-400">
                                    {serverError}
                                </p>
                            </div>
                        )}

                        {/* Email */}
                        <div className="space-y-1 text-sm">
                            <label
                                htmlFor="email"
                                className="block text-slate-200 text-left"
                            >
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                autoComplete="email"
                                placeholder="you@example.com"
                                className={`w-full rounded-2xl border ${errors.email ? 'border-red-500' : 'border-slate-700'} bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 ${errors.email ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-emerald-500 focus:border-emerald-500'}`}
                                {...registerInput('email')}
                                onBlur={(e) =>
                                    handleBlur('email', e.target.value)
                                }
                            />
                            {errors.email && (
                                <p className="text-xs text-red-400 mt-1">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-1 text-sm">
                            <div className="flex items-center justify-between">
                                <label
                                    htmlFor="password"
                                    className="block text-slate-200 text-left"
                                >
                                    Password
                                </label>
                                <button
                                    type="button"
                                    className="text-[11px] text-emerald-400 hover:text-emerald-300"
                                >
                                    Forgot password?
                                </button>
                            </div>
                            <input
                                id="password"
                                type="password"
                                required
                                autoComplete="current-password"
                                className={`w-full rounded-2xl border ${errors.password ? 'border-red-500' : 'border-slate-700'} bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 ${errors.password ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-emerald-500 focus:border-emerald-500'}`}
                                {...registerInput('password')}
                                onBlur={(e) =>
                                    handleBlur('password', e.target.value)
                                }
                            />
                            {errors.password && (
                                <p className="text-xs text-red-400 mt-1">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        {/* Remember me */}
                        <div className="flex items-center justify-between text-xs">
                            <label className="flex items-center gap-2 text-slate-300">
                                <input
                                    type="checkbox"
                                    className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                                    {...registerInput('rememberMe')}
                                />
                                <span>Keep me logged in</span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="w-full inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-md hover:bg-emerald-400 transition"
                        >
                            Log in
                        </button>
                    </form>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        <div className="h-px flex-1 bg-slate-800" />
                        <span>or</span>
                        <div className="h-px flex-1 bg-slate-800" />
                    </div>

                    <p className="text-xs text-slate-400 text-center">
                        Don&apos;t have an account yet?{' '}
                        <Link
                            to="/register"
                            className="text-emerald-400 hover:text-emerald-300 font-medium"
                        >
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}
