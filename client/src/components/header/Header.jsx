import { Link } from "react-router";

export default function Header() {
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
                    <Link
                        to="/"
                        className="text-slate-100 font-medium border-b-2 border-emerald-500 pb-1"
                    >
                        Home
                    </Link>
                    <Link to="/catalog" className="text-slate-300 hover:text-emerald-400">
                        Browse
                    </Link>
                    <a href="#" className="text-slate-300 hover:text-emerald-400">
                        My Library
                    </a>
                    <a href="#" className="text-slate-300 hover:text-emerald-400">
                        Community
                    </a>
                </nav>

                {/* Auth actions */}
                <div className="flex items-center gap-3 text-sm">
                    <button className="hidden sm:inline-flex px-3 py-1.5 rounded-xl border border-slate-700 text-slate-200 hover:border-emerald-500 hover:text-emerald-300 transition">
                        Log in
                    </button>
                    <button className="px-3 sm:px-4 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 transition shadow-md">
                        Sign up
                    </button>
                </div>
            </div>
        </header>
    );
}
