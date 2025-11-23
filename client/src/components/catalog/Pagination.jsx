export default function Pagination() {
    return (
        <div className="flex items-center justify-center gap-2 pt-4 text-sm">
            <button className="px-3 py-1.5 rounded-xl border border-slate-700 text-slate-300 hover:border-emerald-500 hover:text-emerald-300 transition">
                Previous
            </button>
            <div className="flex items-center gap-1">
                <button className="h-8 w-8 rounded-xl bg-emerald-500 text-slate-950 font-semibold">
                    1
                </button>
                <button className="h-8 w-8 rounded-xl border border-slate-700 text-slate-300 hover:border-emerald-500 hover:text-emerald-300 transition">
                    2
                </button>
                <button className="h-8 w-8 rounded-xl border border-slate-700 text-slate-300 hover:border-emerald-500 hover:text-emerald-300 transition">
                    3
                </button>
                <span className="px-1 text-slate-500">…</span>
                <button className="h-8 w-8 rounded-xl border border-slate-700 text-slate-300 hover:border-emerald-500 hover:text-emerald-300 transition">
                    10
                </button>
            </div>
            <button className="px-3 py-1.5 rounded-xl border border-slate-700 text-slate-300 hover:border-emerald-500 hover:text-emerald-300 transition">
                Next
            </button>
        </div>
    );
}