export default function Pagination({ page = 1, pageSize = 10, total = null, onPageChange = () => { }, onPageSizeChange = () => { }, hidePageSize = false }) {
    const totalPages = total ? Math.max(1, Math.ceil(total / pageSize)) : null;

    const goto = (p) => {
        if (p < 1) p = 1;
        if (totalPages && p > totalPages) p = totalPages;
        onPageChange(p);
    };

    const pageSizes = [10, 20, 50];

    return (
        <div className="flex items-center justify-center gap-4 pt-4 text-sm">
            <div className="flex items-center gap-2">
                <button
                    onClick={() => goto(1)}
                    disabled={page === 1}
                    className={`px-3 py-1.5 rounded-xl border border-slate-700 text-slate-300 hover:border-emerald-500 hover:text-emerald-300 transition ${page === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    First
                </button>
                <button
                    onClick={() => goto(page - 1)}
                    className="px-3 py-1.5 rounded-xl border border-slate-700 text-slate-300 hover:border-emerald-500 hover:text-emerald-300 transition"
                >
                    Previous
                </button>

                <div className="flex items-center gap-1">
                    {totalPages ? (
                        Array.from({ length: Math.min(7, totalPages) }).map((_, i) => {
                            // center current page in the small pager when possible
                            let start = Math.max(1, page - 3);
                            if (start + 6 > totalPages) start = Math.max(1, totalPages - 6);
                            const pageNum = start + i;
                            if (pageNum > totalPages) return null;
                            const isActive = pageNum === page;
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => goto(pageNum)}
                                    className={
                                        `h-8 w-8 rounded-xl ${isActive ? 'bg-emerald-500 text-slate-950 font-semibold' : 'border border-slate-700 text-slate-300 hover:border-emerald-500 hover:text-emerald-300 transition'}`
                                    }
                                >
                                    {pageNum}
                                </button>
                            );
                        })
                    ) : (
                        <span className="text-slate-400">Loading pages…</span>
                    )}
                    {totalPages && totalPages > 7 && (
                        <>
                            <span className="px-1 text-slate-500">…</span>
                            <button
                                onClick={() => goto(totalPages)}
                                className="h-8 w-8 rounded-xl border border-slate-700 text-slate-300 hover:border-emerald-500 hover:text-emerald-300 transition"
                            >
                                {totalPages}
                            </button>
                        </>
                    )}
                </div>

                <button
                    onClick={() => goto(page + 1)}
                    className="px-3 py-1.5 rounded-xl border border-slate-700 text-slate-300 hover:border-emerald-500 hover:text-emerald-300 transition"
                >
                    Next
                </button>
                <button
                    onClick={() => goto(totalPages || 1)}
                    disabled={totalPages ? page === totalPages : true}
                    className={`px-3 py-1.5 rounded-xl border border-slate-700 text-slate-300 hover:border-emerald-500 hover:text-emerald-300 transition ${totalPages && page === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    Last
                </button>
            </div>

            {!hidePageSize && (
                <div className="flex items-center gap-2">
                    <label className="text-slate-400 text-xs">Per page</label>
                    <select
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1 text-slate-200"
                    >
                        {pageSizes.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
}