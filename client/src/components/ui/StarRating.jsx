import { useState } from "react";

const STAR_OPTIONS = [1, 2, 3, 4, 5];

export default function StarRating({
    value = 0,
    onChange,
    readonly = false,
    size = "md",
    showLabel = false,
}) {
    const [hoverRating, setHoverRating] = useState(0);
    const displayRating = hoverRating || value;

    const sizeClasses = {
        sm: "text-lg",
        md: "text-2xl",
        lg: "text-3xl",
    };

    const starClass = sizeClasses[size] || sizeClasses.md;

    if (readonly) {
        return (
            <div className="flex items-center gap-0.5">
                {STAR_OPTIONS.map((star) => (
                    <span key={star} className={`${starClass} text-amber-400`}>
                        {star <= value ? "★" : "☆"}
                    </span>
                ))}
                {showLabel && value > 0 && (
                    <span className="ml-2 text-sm text-slate-400">{value}/5</span>
                )}
            </div>
        );
    }

    return (
        <div className="flex items-center gap-0.5">
            {STAR_OPTIONS.map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange?.(star === value ? 0 : star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className={`${starClass} text-amber-400 transition hover:scale-110 focus:outline-none`}
                >
                    {star <= displayRating ? "★" : "☆"}
                </button>
            ))}
            {showLabel && value > 0 && (
                <span className="ml-2 text-sm text-slate-400">{value}/5</span>
            )}
        </div>
    );
}
