import { Link, useNavigate } from 'react-router';
import { useForm } from '../../hooks/useForm';
import { useContext, useState } from 'react';
import UserContext from '../../contexts/UserContext';

const initialValues = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
};

export default function Register() {
    const navigate = useNavigate();
    const { registerHandler } = useContext(UserContext);
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState(null);

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePassword = (password) => {
        const hasMinLength = password.length >= 6;
        const hasLetter = /[a-zA-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        return hasMinLength && hasLetter && hasNumber;
    };

    const validateForm = ({ name, email, password, confirmPassword }) => {
        const newErrors = {};

        if (!name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!email) {
            newErrors.email = 'Email is required';
        } else if (!validateEmail(email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!password) {
            newErrors.password = 'Password is required';
        } else if (!validatePassword(password)) {
            newErrors.password =
                'Password must be at least 6 characters with a letter and number';
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        return newErrors;
    };

    const handleBlur = (fieldName, value) => {
        let fieldError = null;

        if (fieldName === 'name') {
            if (!value.trim()) {
                fieldError = 'Name is required';
            }
        }

        if (fieldName === 'email') {
            if (!value) {
                fieldError = 'Email is required';
            } else if (!validateEmail(value)) {
                fieldError = 'Please enter a valid email address';
            }
        }

        if (fieldName === 'password') {
            if (!value) {
                fieldError = 'Password is required';
            } else if (!validatePassword(value)) {
                fieldError =
                    'Password must be at least 6 characters with a letter and number';
            }
        }

        if (fieldName === 'confirmPassword') {
            const passwordValue =
                document.getElementById('password')?.value || '';
            if (!value) {
                fieldError = 'Please confirm your password';
            } else if (value !== passwordValue) {
                fieldError = 'Passwords do not match';
            }
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
                await registerHandler(
                    values.email,
                    values.password,
                    values.name,
                );
                navigate('/');
            } catch (err) {
                if (err.status === 409) {
                    setServerError(
                        'This email is already registered. Please use a different email or log in.',
                    );
                } else {
                    setServerError(
                        err.payload?.message ||
                            'Registration failed. Please try again.',
                    );
                }
            }
        },
    });

    return (
        <main className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-md px-4 py-10">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 shadow-xl space-y-6">
                    {/* Heading */}
                    <header className="space-y-2 text-center">
                        <p className="text-xs uppercase tracking-[0.25em] text-emerald-300">
                            Join BookTrackr
                        </p>
                        <h1 className="text-2xl font-semibold text-slate-50">
                            Create an account
                        </h1>
                        <p className="text-sm text-slate-400">
                            Track your reading, rate books, and build your own
                            library.
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

                        {/* Name */}
                        <div className="space-y-1 text-sm">
                            <label
                                htmlFor="name"
                                className="block text-slate-200 text-left"
                            >
                                Full Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                required
                                placeholder="First and last name"
                                className={`w-full rounded-2xl border ${errors.name ? 'border-red-500' : 'border-slate-700'} bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 ${errors.name ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-emerald-500 focus:border-emerald-500'}`}
                                {...registerInput('name')}
                                onBlur={(e) =>
                                    handleBlur('name', e.target.value)
                                }
                            />
                            {errors.name && (
                                <p className="text-xs text-red-400 mt-1">
                                    {errors.name}
                                </p>
                            )}
                        </div>

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
                            <label
                                htmlFor="password"
                                className="block text-slate-200 text-left"
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                required
                                autoComplete="new-password"
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

                        {/* Confirm password */}
                        <div className="space-y-1 text-sm">
                            <label
                                htmlFor="confirmPassword"
                                className="block text-slate-200 text-left"
                            >
                                Confirm password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                required
                                autoComplete="new-password"
                                className={`w-full rounded-2xl border ${errors.confirmPassword ? 'border-red-500' : 'border-slate-700'} bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 ${errors.confirmPassword ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-emerald-500 focus:border-emerald-500'}`}
                                {...registerInput('confirmPassword')}
                                onBlur={(e) =>
                                    handleBlur(
                                        'confirmPassword',
                                        e.target.value,
                                    )
                                }
                            />
                            {errors.confirmPassword && (
                                <p className="text-xs text-red-400 mt-1">
                                    {errors.confirmPassword}
                                </p>
                            )}
                        </div>

                        {/* Terms – visual only */}
                        <div className="flex items-start gap-2 text-xs text-slate-400">
                            <input
                                id="terms"
                                type="checkbox"
                                name="terms"
                                required
                                className="mt-0.5 h-3.5 w-3.5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                            />
                            <label htmlFor="terms">
                                I agree to the{' '}
                                <span
                                    type="button"
                                    className="text-emerald-400 hover:text-emerald-300"
                                >
                                    Terms of Service
                                </span>{' '}
                                and{' '}
                                <span
                                    type="button"
                                    className="text-emerald-400 hover:text-emerald-300"
                                >
                                    Privacy Policy
                                </span>
                                .
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="w-full inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-md hover:bg-emerald-400 transition"
                        >
                            Create account
                        </button>
                    </form>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        <div className="h-px flex-1 bg-slate-800" />
                        <span>or</span>
                        <div className="h-px flex-1 bg-slate-800" />
                    </div>

                    <p className="text-xs text-slate-400 text-center">
                        Already have an account?{' '}
                        <Link
                            to="/login"
                            className="text-emerald-400 hover:text-emerald-300 font-medium"
                        >
                            Log in
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}
