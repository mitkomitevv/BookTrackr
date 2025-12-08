import { useEffect, useState } from 'react';
import StarRating from './StarRating';

export default function ReviewModal({
    visible,
    initialText = '',
    initialRating = 0,
    onClose,
    onSave,
    onRatingChange,
    saving = false,
    showRating = false,
}) {
    const [text, setText] = useState(initialText);
    const [rating, setRating] = useState(initialRating);

    useEffect(() => {
        if (visible) {
            setText(initialText ?? '');
            setRating(initialRating ?? 0);
        }
    }, [visible, initialText, initialRating]);

    if (!visible) return null;

    const handleRatingChange = (newRating) => {
        setRating(newRating);
        onRatingChange?.(newRating);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-3xl w-full text-slate-100 shadow-lg">
                <h3 className="text-lg font-semibold mb-2">Add review</h3>
                <p className="text-sm text-slate-300 mb-4">
                    Add a short review that will appear with the book.
                </p>

                {showRating && (
                    <div className="mb-4">
                        <label className="block text-sm text-slate-300 mb-2">
                            Your rating
                        </label>
                        <StarRating
                            value={rating}
                            onChange={handleRatingChange}
                            size="xl"
                            showLabel
                        />
                    </div>
                )}

                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={6}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-slate-100 mb-4"
                    placeholder="Write a short review or blurb for this book..."
                />

                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-1 rounded-2xl border border-slate-700 text-sm text-slate-200 hover:border-slate-500 transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => onSave && onSave(text, rating)}
                        disabled={saving || !text.trim()}
                        className="px-3 py-1 rounded-2xl bg-emerald-500 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transition"
                    >
                        {saving ? 'Saving...' : 'Post review'}
                    </button>
                </div>
            </div>
        </div>
    );
}
