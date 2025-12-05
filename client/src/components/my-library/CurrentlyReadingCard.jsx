export default function CurrentlyReadingCard({ book }) {
    return (
        <article className="flex gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="w-16 h-24 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0">
                {book.coverUrl ? (
                    <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-[11px] text-slate-400">
                        No cover
                    </div>
                )}
            </div>

            <div className="flex-1 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-100">
                            {book.title}
                        </h3>
                        <p className="text-xs text-slate-400">{book.author}</p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                        {book.progressPercent}% read
                    </span>
                </div>

                {book.description && (
                    <p className="text-xs text-slate-300 line-clamp-2">
                        {book.description}
                    </p>
                )}

                <div className="space-y-1 pt-1">
                    <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${book.progressPercent}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>
                            Page {book.currentPage} of {book.totalPages}
                        </span>
                        <button className="text-emerald-400 hover:text-emerald-300 font-medium">
                            Update progress
                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
}
