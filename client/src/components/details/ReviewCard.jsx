// src/components/details/ReviewCard.jsx
export default function ReviewCard({ review }) {
    const isColoredAvatar = review.variant !== "neutral";

    return (
        <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3 text-sm">
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
                        <span className="text-sm font-medium text-slate-100">
                            {review.name}
                        </span>
                        <span className="text-[11px] text-slate-400">
                            {review.ratingLabel} · {review.date}
                        </span>
                    </div>
                </div>
                <button className="text-[11px] text-slate-400 hover:text-emerald-300">
                    More
                </button>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed">
                {review.highlight}
            </p>

            <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <button className="inline-flex items-center gap-1 hover:text-emerald-300">
                    <span>👍</span>
                    <span>{review.helpfulCount} found this helpful</span>
                </button>
                <span className="h-3 w-px bg-slate-700" />
                <button className="hover:text-emerald-300">Comment</button>
            </div>
        </article>
    );
}
