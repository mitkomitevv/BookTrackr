// src/components/details/BookReviewsSection.jsx
import ReviewCard from "./ReviewCard";

const REVIEWS = [
    {
        id: 1,
        initials: "MK",
        name: "Mira Koleva",
        ratingLabel: "Rated it ★★★★★",
        date: "2 days ago",
        highlight:
            "I didn't expect a cozy fantasy to wreck me like this. The house itself feels like a character — kind, but also brutally honest about what people leave behind. If you like slow, introspective books with just a thread of the uncanny, this is it.",
        helpfulCount: 24,
    },
    {
        id: 2,
        initials: "JT",
        name: "Jordan T.",
        ratingLabel: "Rated it ★★★★☆",
        date: "1 week ago",
        highlight:
            "Really beautiful writing and atmosphere. I knocked off a star just because I wanted a tiny bit more plot momentum in the middle, but the last hundred pages were perfection.",
        helpfulCount: 11,
        variant: "neutral",
    },
];

export default function BookReviewsSection() {
    return (
        <div className="space-y-4">
            {/* Tabs (visual only) */}
            <div className="flex items-center gap-4 text-xs sm:text-sm border-b border-slate-800">
                <button className="pb-2 border-b-2 border-emerald-500 text-slate-100 font-medium">
                    Reviews ({REVIEWS.length})
                </button>
                <button className="pb-2 border-b-2 border-transparent text-slate-400 hover:text-emerald-300">
                    Highlights
                </button>
                <button className="pb-2 border-b-2 border-transparent text-slate-400 hover:text-emerald-300">
                    Editions
                </button>
            </div>

            {/* Write review CTA */}
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
                <div className="space-y-1">
                    <p className="text-slate-200 font-medium">What did you think?</p>
                    <p className="text-slate-400">
                        Share a quick reaction or a full review — it helps other readers
                        decide if this is for them.
                    </p>
                </div>
                <button className="inline-flex items-center rounded-2xl bg-emerald-500 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-950 shadow hover:bg-emerald-400 transition">
                    Write a review
                </button>
            </div>

            {/* Reviews */}
            <div className="space-y-3">
                {REVIEWS.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                ))}
            </div>
        </div>
    );
}
