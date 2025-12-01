// pages/Register.jsx
import { Link, useNavigate } from "react-router";
import { useForm } from "../../hooks/useForm";
import { useContext } from "react";
import UserContext from "../../contexts/UserContext";

const initialValues = {
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
};

export default function Register() {
    const navigate = useNavigate();
    const { registerHandler } = useContext(UserContext);

    const { registerInput, formProps } = useForm({
        initialValues,
        onSubmit: async ({ email, password, confirmPassword, name }) => {
            if (password !== confirmPassword) {
                // TODO: show some UI error instead
                alert("Passwords do not match");
                return;
            }

            await registerHandler(email, password, name);
            // You are now logged in (because context setUser) – choose where to go:
            navigate("/"); // or "/books"
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
                            Track your reading, rate books, and build your own library.
                        </p>
                    </header>

                    <form {...formProps} className="space-y-4">
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
                                className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                {...registerInput("name")}
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-1 text-sm">
                            <label htmlFor="email" className="block text-slate-200 text-left">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                autoComplete="email"
                                placeholder="you@example.com"
                                className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                {...registerInput("email")}
                            />
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
                                className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                {...registerInput("password")}
                            />
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
                                className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                {...registerInput("confirmPassword")}
                            />
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
                                I agree to the{" "}
                                <button
                                    type="button"
                                    className="text-emerald-400 hover:text-emerald-300 underline-offset-2 hover:underline"
                                >
                                    Terms of Service
                                </button>{" "}
                                and{" "}
                                <button
                                    type="button"
                                    className="text-emerald-400 hover:text-emerald-300 underline-offset-2 hover:underline"
                                >
                                    Privacy Policy
                                </button>
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
                        Already have an account?{" "}
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
