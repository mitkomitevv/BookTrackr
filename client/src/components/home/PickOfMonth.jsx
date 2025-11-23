export default function PickOfMonth() {
    return (
        <section className="mt-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 flex flex-col md:flex-row gap-6 md:gap-8">
            {/* Book cover */}
            <div className="w-full md:w-48 flex-shrink-0 flex items-center justify-center">
                <div className="relative w-40 h-60 rounded-xl bg-slate-800 overflow-hidden shadow-2xl shadow-emerald-500/20">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-emerald-500 to-sky-500" />
                    <div className="absolute inset-3 rounded-lg border border-white/10 bg-slate-950/40 flex flex-col justify-end p-3">
                        <p className="text-[11px] uppercase tracking-[0.25em] text-emerald-200">
                            Pick of the month
                        </p>
                        <h3 className="text-sm font-semibold text-slate-50">
                            Cities Made of Paper
                        </h3>
                        <p className="text-[11px] text-slate-200">Rhea Das</p>
                    </div>
                </div>
            </div>

            {/* Review content */}
            <div className="flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
                        Pick of the month
                    </span>
                    <span className="text-xs text-slate-400">
                        Curated by BookTrackr editors
                    </span>
                </div>

                <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-semibold text-slate-50">
                        Cities Made of Paper
                    </h2>
                    <p className="text-sm text-slate-400">
                        by Rhea Das · Literary fiction
                    </p>
                    <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1 text-amber-300">
                            ★ 4.71
                        </div>
                        <span className="h-3 w-px bg-slate-700" />
                        <span className="text-slate-400">1,824 ratings · 420 reviews</span>
                    </div>
                </div>

                {/* Review snippet */}
                <div className="relative mt-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 sm:p-5">
                    <svg
                        className="absolute -top-4 left-3 h-8 w-8 text-emerald-500/20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                    >
                        <path d="M7.17 6.17C5.76 7.59 5 9.39 5 11.5V18h6v-7H8.5c0-1.21.38-2.12 1.17-2.83C10.46 7.46 11 6.3 11 5c0-1.07-.32-2-1-2.83C9.32 1.32 8.43 1 7.25 1 6.07 1 5.1 1.39 4.33 2.17 3.56 2.94 3.17 3.93 3.17 5.12c0 1.19.39 2.18 1.17 3.05l2.83-2z" />
                        <path d="M17.17 6.17C15.76 7.59 15 9.39 15 11.5V18h6v-7h-2.5c0-1.21.38-2.12 1.17-2.83C20.46 7.46 21 6.3 21 5c0-1.07-.32-2-1-2.83C19.32 1.32 18.43 1 17.25 1 16.07 1 15.1 1.39 14.33 2.17c-.77.77-1.16 1.76-1.16 2.95 0 1.19.39 2.18 1.17 3.05l2.83-2z" />
                    </svg>
                    <p className="text-sm text-slate-200 leading-relaxed">
                        “This is one of those rare novels that feels like wandering a city
                        at night with a friend who knows every hidden corner. Melancholic
                        without being bleak, hopeful without being naive — I’ve thought
                        about it every day since finishing.”
                    </p>
                    <div className="mt-4 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center text-[11px] font-semibold text-slate-950">
                                MK
                            </div>
                            <div className="flex flex-col">
                                <span className="font-medium text-slate-100">Mira Koleva</span>
                                <span className="text-[11px] text-slate-400">
                                    Senior editor · 324 books logged
                                </span>
                            </div>
                        </div>
                        <button className="hidden sm:inline-flex items-center rounded-xl border border-slate-700 px-3 py-1.5 text-[11px] font-medium text-slate-200 hover:border-emerald-500 hover:text-emerald-300 transition">
                            Read full review
                        </button>
                    </div>
                </div>

                {/* CTA buttons */}
                <div className="flex flex-wrap gap-3 pt-2">
                    <button className="inline-flex items-center rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow hover:bg-emerald-400 transition">
                        Add to “To Read”
                    </button>
                    <button className="inline-flex items-center rounded-2xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:border-emerald-500 hover:text-emerald-300 transition">
                        See similar books
                    </button>
                </div>
            </div>
        </section>
    );
}
