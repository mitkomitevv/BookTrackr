export default function StaffRecommendationCard({ book }) {
    return (
        <article className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-4 hover:border-emerald-500/70 transition group">
            <div className="flex gap-4">
                <div className="w-20 h-32 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0 group-hover:ring-2 group-hover:ring-emerald-500/60 transition">
                    <div className={`w-full h-full ${book.coverGradient}`} />
                </div>
                <div className="flex-1 flex flex-col">
                    <header className="space-y-1">
                        <h3 className="text-sm font-semibold text-slate-100 line-clamp-2">
                            {book.title}
                        </h3>
                        <p className="text-xs text-slate-400">{book.author}</p>
                        <div className="flex flex-wrap gap-1 pt-1">
                            {book.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </header>
                    <p className="mt-2 text-xs text-slate-300 line-clamp-3 flex-1 leading-relaxed">
                        {book.description}
                    </p>
                    <footer className="mt-3 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1 text-amber-300">
                            ★ {book.rating}
                            <span className="text-slate-500">· {book.ratingsCount} ratings</span>
                        </div>
                        <button className="text-emerald-400 hover:text-emerald-300 font-medium">
                            Details
                        </button>
                    </footer>
                </div>
            </div>
        </article>
    );
}
