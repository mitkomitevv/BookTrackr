import { useContext, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import UserContext from "../../contexts/UserContext";
import Search from "../search/Search";

const navLinkClass = ({ isActive }) =>
    [
        "pb-1 text-sm transition border-b-2",
        isActive
            ? "text-slate-100 border-emerald-500"
            : "text-slate-300 border-transparent hover:text-emerald-400 hover:border-emerald-500/60",
    ].join(" ");

export default function Header() {
    const { isAuthenticated, isAdmin } = useContext(UserContext);
    const [q, setQ] = useState('');
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();

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

                {/* Nav links (desktop) */}
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

                {/* Search (desktop only) */}
                <div className="hidden md:block md:flex-1 md:mx-4 max-w-sm">
                    <Search value={q} onChange={setQ} onSearch={(val) => { setMenuOpen(false); navigate(`/catalog?q=${encodeURIComponent(val)}`); setQ(''); }} placeholder="Search catalog..." />
                </div>

                {/* Auth actions (desktop only) */}
                <div className="hidden md:flex items-center gap-3 text-sm">
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

                {/* Mobile menu toggle */}
                <div className="md:hidden">
                    <button
                        type="button"
                        aria-label={menuOpen ? "Close menu" : "Open menu"}
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen((s) => !s)}
                        className="p-2 rounded-md text-slate-200 hover:bg-slate-800/60"
                    >
                        {menuOpen ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile menu panel */}
            {menuOpen && (
                <div className="md:hidden bg-slate-950/95 border-t border-slate-800 px-4 py-3">
                    <nav className="flex flex-col gap-3 text-sm">
                        <NavLink to="/" onClick={() => setMenuOpen(false)} className={navLinkClass}>
                            Home
                        </NavLink>
                        <NavLink to="/catalog" onClick={() => setMenuOpen(false)} className={navLinkClass}>
                            Browse
                        </NavLink>
                        {isAuthenticated && (
                            <>
                                <NavLink to="/library" onClick={() => setMenuOpen(false)} className={navLinkClass}>
                                    My Library
                                </NavLink>
                                <NavLink to="/catalog/add-book" onClick={() => setMenuOpen(false)} className={navLinkClass}>
                                    Add Book
                                </NavLink>
                            </>
                        )}
                    </nav>

                    <div className="mt-3">
                        <Search value={q} onChange={setQ} onSearch={(val) => { setMenuOpen(false); navigate(`/catalog?q=${encodeURIComponent(val)}`); setQ(''); }} placeholder="Search catalog..." />
                    </div>

                    <div className="mt-3 flex flex-col gap-2">
                        {isAdmin && (
                            <Link to="/admin" onClick={() => setMenuOpen(false)} className="px-3 py-2 rounded-xl bg-slate-700 text-slate-200 font-semibold hover:bg-slate-600 transition shadow-md text-center">
                                Admin
                            </Link>
                        )}

                        {!isAuthenticated ? (
                            <>
                                <Link to="/login" onClick={() => setMenuOpen(false)} className="px-3 py-2 rounded-xl border border-slate-700 text-slate-200 hover:border-emerald-500 hover:text-emerald-300 transition text-center">
                                    Log in
                                </Link>
                                <Link to="/register" onClick={() => setMenuOpen(false)} className="px-3 py-2 rounded-xl bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 transition shadow-md text-center">
                                    Sign up
                                </Link>
                            </>
                        ) : (
                            <Link to="/logout" onClick={() => setMenuOpen(false)} className="px-3 py-2 rounded-xl bg-red-400 text-slate-950 font-semibold hover:bg-emerald-400 transition shadow-md text-center">
                                Sign out
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
