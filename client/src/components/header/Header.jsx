import { useContext } from "react";
import { Link, NavLink } from "react-router";
import UserContext from "../../contexts/UserContext";

const navLinkClass = ({ isActive }) =>
    [
        "pb-1 text-sm transition border-b-2", // base styles
        isActive
            ? "text-slate-100 border-emerald-500"
            : "text-slate-300 border-transparent hover:text-emerald-400 hover:border-emerald-500/60",
    ].join(" ");

export default function Header() {
    const { isAuthenticated, isAdmin } = useContext(UserContext);

    return (
        <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-20">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-6">
                {/* Logo / brand */}
                <Link to="/" className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-900 font-bold text-lg shadow-lg">
                        B
                    </div>
                    <div className="flex flex-col leading-tight">
                        <span className="font-semibold tracking-wide text-slate-50">
                            BookTrackr
                        </span>
                        <span className="text-xs text-slate-400">
                            Your reading life, organized
                        </span>
                    </div>
                </Link>

                {/* Nav links */}
                <nav className="hidden md:flex items-center gap-6 text-sm">
                    <NavLink
                        to="/"
                        className={navLinkClass}
                    >
                        Home
                    </NavLink>
                    <NavLink to="/catalog" end className={navLinkClass}>
                        Browse
                    </NavLink>
                    {isAuthenticated && (
                        <>
                            <NavLink to="/library" className={navLinkClass}>
                                My Library
                            </NavLink>
                            <NavLink to="/catalog/add-book" className={navLinkClass}>
                                Add Book
                            </NavLink>
                        </>
                    )}
                </nav>

                {/* Auth actions */}
                <div className="flex items-center gap-3 text-sm">
                    {isAdmin && (
                        <Link to="/admin" className="px-3 sm:px-4 py-1.5 rounded-xl bg-slate-700 text-slate-200 font-semibold hover:bg-slate-600 transition shadow-md">
                            Admin
                        </Link>
                    )}
                    {!isAuthenticated
                        ? (
                            <div>
                                <Link to="/login" className="hidden sm:inline-flex px-3 py-1.5 rounded-xl border border-slate-700 text-slate-200 hover:border-emerald-500 hover:text-emerald-300 transition mr-2">
                                    Log in
                                </Link>
                                <Link to="/register" className="px-3 sm:px-4 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 transition shadow-md">
                                    Sign up
                                </Link>
                            </div>
                        )
                        : (
                            <Link to="/logout" className="px-3 sm:px-4 py-1.5 rounded-xl bg-red-400 text-slate-950 font-semibold hover:bg-emerald-400 transition shadow-md">
                                Sign out
                            </Link>
                        )}
                </div>
            </div>
        </header>
    );
}
