import TrendingCard from "./TrendingCard";

export default function Hero() {
    return (
        <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 px-6 py-8 sm:px-10 sm:py-10">
            <div className="absolute inset-y-0 -right-32 w-72 bg-emerald-500/10 blur-3xl" />
            <div className="relative flex flex-col md:flex-row gap-8 md:items-center">
                <div className="flex-1 space-y-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-emerald-300">
                        Welcome to BookTrackr
                    </p>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-slate-50">
                        Discover your next{" "}
                        <span className="text-emerald-400">favorite book</span>.
                    </h1>
                    <p className="text-sm sm:text-base text-slate-300 max-w-xl">
                        Track what you’re reading, explore tailored recommendations, and
                        see what everyone else is loving right now.
                    </p>
                    <div className="flex flex-wrap gap-3 pt-2">
                        <button className="inline-flex items-center rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow hover:bg-emerald-400 transition">
                            Browse catalog
                            <span className="ml-2 text-lg">→</span>
                        </button>
                        <button className="inline-flex items-center rounded-2xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:border-emerald-500 hover:text-emerald-300 transition">
                            Import my books
                        </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 pt-4 text-xs">
                        <div className="flex items-center gap-1 text-slate-400">
                            <span className="text-amber-300">★</span>
                            <span>Smart ratings &amp; reviews</span>
                        </div>
                        <span className="h-4 w-px bg-slate-700 hidden sm:inline-block" />
                        <div className="flex items-center gap-1 text-slate-400">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            <span>Realtime reading status</span>
                        </div>
                    </div>
                </div>

                {/* Right side trending card */}
                <TrendingCard />
            </div>
        </section>
    );
}
