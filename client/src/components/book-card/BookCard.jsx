import { Link } from "react-router";

export default function BookCard({
    _id,
    title,
    author,
    coverUrl,
    description,
    series,
    numberInSeries,
    tags = [],
    rating = null,
    ratingsCount = null,
    showDescription = true,
    compact = false,
}) {
    return (
        <article className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-4 hover:border-emerald-500/70 transition group">
            <div className="flex gap-4">
                {/* Cover */}
                <Link
                    to={`/catalog/${_id}/details`}
                    className="w-28 h-44 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0 group-hover:ring-2 group-hover:ring-emerald-500/60 transition"
                >
                    {coverUrl ? (
                        <img
                            src={coverUrl}
                            alt={title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-[11px] text-slate-400">
                            No cover
                        </div>
                    )}
                </Link>

                {/* Content */}
                <div className="flex-1 flex flex-col">
                    <header className="space-y-1">
                        <Link to={`/catalog/${_id}/details`}>
                            <h3 className="text-sm font-semibold text-slate-100 line-clamp-2 group-hover:text-emerald-300">
                                {title}
                                {series && (
                                    <span className="text-sm text-slate-400 font-normal ml-2">
                                        ({series}{numberInSeries ? `, #${numberInSeries}` : ""})
                                    </span>
                                )}
                            </h3>
                        </Link>
                        {author ? (
                            <Link
                                to={`/catalog?author=${encodeURIComponent(author)}`}
                                className="text-xs text-slate-400 hover:underline"
                                aria-label={`Search by author ${author}`}
                            >
                                {author}
                            </Link>
                        ) : (
                            <p className="text-xs text-slate-400">Unknown author</p>
                        )}

                        {/* Tags */}
                        {!compact && tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                                {tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </header>

                    {/* Description */}
                    {showDescription && description && (
                        <p className="mt-2 text-xs text-slate-300 line-clamp-3 flex-1 leading-relaxed">
                            {description}
                        </p>
                    )}

                    {/* Footer: rating + CTA */}
                    <footer className="mt-3 flex items-center justify-between text-[11px]">
                        {rating ? (
                            <div className="flex items-center gap-1 text-amber-300">
                                ★ {rating}
                                {ratingsCount && (
                                    <span className="text-slate-500">· {ratingsCount} ratings</span>
                                )}
                            </div>
                        ) : (
                            <div className="text-slate-500 italic">Not yet rated</div>
                        )}

                        <Link
                            to={`/catalog/${_id}/details`}
                            className="text-emerald-400 hover:text-emerald-300 font-medium"
                        >
                            Details
                        </Link>
                    </footer>
                </div>
            </div>
        </article>
    );
}
