import { useEffect, useMemo, useState, useContext } from "react";
import { useFetch, useRequest } from "../../hooks/useRequest";
import UserContext from "../../contexts/UserContext";
import { formatDate } from "../../utils/formatDate";

export default function CommentModal({ visible, review, bookTitle, onClose }) {
    const reviewId = review?.id;
    const { user } = useContext(UserContext);
    const { request } = useRequest();
    const [text, setText] = useState("");
    const [posting, setPosting] = useState(false);

    const path = reviewId ? `/data/comments?where=${encodeURIComponent(`reviewId="${reviewId}"`)}` + `&load=${encodeURIComponent('authorInfo=_ownerId:users')}` : null;
    const { data, loading, refetch } = useFetch(path, { immediate: false });

    useEffect(() => {
        if (visible && reviewId) {
            refetch?.();
        }
    }, [visible, reviewId, refetch]);

    useEffect(() => {
        if (visible) setText("");
    }, [visible]);

    const comments = useMemo(() => {
        if (!Array.isArray(data)) return [];
        return [...data].sort((a, b) => (b._createdOn || 0) - (a._createdOn || 0));
    }, [data]);

    const commentSubmitHandler = async () => {
        if (!text.trim() || !reviewId) return;
        setPosting(true);
        try {
            const headers = user?.accessToken ? { "X-Authorization": user.accessToken } : {};
            await request("/data/comments", "POST", { reviewId, content: text.trim() }, headers);
            setText("");
            refetch?.();
        } catch (err) {
            console.error("Failed to post comment:", err);
        } finally {
            setPosting(false);
        }
    };

    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full text-slate-100 shadow-lg space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-semibold">Comments</h3>
                        {review?.author && bookTitle && (
                            <p className="text-sm text-slate-400">for
                                <span className="text-emerald-400"> {review.author}</span>
                                's review of
                                <span className="text-emerald-400"> {bookTitle}</span>
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-sm text-slate-400 hover:text-slate-200"
                    >
                        Close
                    </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {loading && <p className="text-sm text-slate-400">Loading comments...</p>}
                    {!loading && comments.length === 0 && (
                        <p className="text-sm text-slate-400">No comments yet. Start the conversation.</p>
                    )}
                    {comments.map((c) => {
                        const authorName = c.authorInfo?.username || c.authorInfo?.email || "Anonymous";
                        return (
                            <div key={c._id || c.id} className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-sm space-y-1">
                                <div className="flex items-center justify-between text-xs text-slate-400">
                                    <span>{authorName}</span>
                                    <span>{formatDate(c._createdOn)}</span>
                                </div>
                                <p className="text-slate-100 whitespace-pre-wrap leading-relaxed">{c.content}</p>
                            </div>
                        );
                    })}
                </div>

                <div className="space-y-2">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        rows={3}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-slate-100"
                        placeholder="Write a comment..."
                    />
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={commentSubmitHandler}
                            disabled={posting || !text.trim()}
                            className="px-4 py-2 rounded-2xl bg-emerald-500 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transition"
                        >
                            {posting ? "Posting..." : "Post comment"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
