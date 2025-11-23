export default function TrendingCard() {
    return (
        <div className="w-full md:w-80 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3 backdrop-blur">
            <p className="text-xs font-medium text-emerald-300 uppercase">
                Trending this week
            </p>
            <div className="flex gap-3">
                <div className="h-24 w-16 rounded-md bg-slate-800 overflow-hidden flex-shrink-0">
                    <div className="h-full w-full bg-gradient-to-br from-emerald-500 via-cyan-500 to-indigo-500" />
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-semibold text-slate-50">
                        The Silent Archive
                    </h3>
                    <p className="text-xs text-slate-400">Lena Harrow</p>
                    <p className="mt-2 text-xs text-slate-300 line-clamp-3">
                        A mysterious library where books rewrite themselves every night — and
                        a reader who notices.
                    </p>
                </div>
            </div>
            <div className="flex items-center justify-between text-xs pt-2">
                <div className="flex items-center gap-1 text-amber-300">
                    ★ 4.26
                    <span className="text-slate-400">· 8.2k ratings</span>
                </div>
                <button className="text-emerald-400 hover:text-emerald-300 font-medium">
                    Add to shelf
                </button>
            </div>
        </div>
    );
}
