import StarRating from "../ui/StarRating";
import { useExpandable } from "../../hooks/useExpandable";

export default function ReviewCard({ review, highlighted = false, isAdmin = false, onEdit, onDelete, onComment }) {
    const { expanded, setExpanded, contentRef, isLong } = useExpandable(review.reviewContent);
    const isColoredAvatar = review.variant !== "neutral";
    const showActions = (highlighted || isAdmin) && (onEdit || onDelete);

    return (
        <article className={`rounded-2xl border p-4 space-y-3 text-sm ${highlighted ? "border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500/50" : "border-slate-800 bg-slate-900/70"}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div
                        className={
                            "h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-semibold " +
                            (isColoredAvatar
                                ? "bg-gradient-to-br from-emerald-500 to-sky-500 text-slate-950"
                                : "bg-slate-800 text-slate-200")
                        }
                    >
                        {review.initials}
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-100">
                                {review.author}
                                {highlighted && <span className="ml-2 text-[10px] text-emerald-400 font-normal">Your review</span>}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                            {review.date}
                            <span className="h-3 w-px bg-slate-700" />
                            <span>{review.rating > 0 && (
                                <StarRating value={review.rating} readonly size="sm" />
                            )}
                            </span>
                        </div>
                    </div>
                </div>
                {showActions && (
                    <div className="flex items-center gap-2">
                        {onEdit && (
                            <button
                                onClick={onEdit}
                                className="text-[13px] text-slate-400 hover:text-emerald-300 transition"
                            >
                                Edit
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={onDelete}
                                className="text-[13px] text-slate-400 hover:text-red-400 transition"
                            >
                                Delete
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div>
                <p
                    ref={contentRef}
                    className={`text-sm text-slate-200 leading-relaxed whitespace-pre-wrap ${!expanded ? "line-clamp-3" : ""}`}
                >
                    {review.reviewContent}
                </p>
                {isLong && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="mt-1 text-emerald-400 hover:text-emerald-300 font-medium text-sm"
                    >
                        {expanded ? "See less" : "See more..."}
                    </button>
                )}
            </div>

            <div className="flex items-center gap-3 text-[13px] text-slate-400">
                <div className="inline-flex items-center gap-1 hover:text-emerald-300">
                    <span>👍</span>
                    <span>{review.helpfulCount} found this helpful</span>
                </div>
                <span className="h-3 w-px bg-slate-700" />
                <button
                    onClick={onComment}
                    disabled={!onComment}
                    className="hover:text-emerald-200 disabled:text-slate-600 disabled:cursor-not-allowed"
                >
                    Comments
                </button>
            </div>
        </article>
    );
}
