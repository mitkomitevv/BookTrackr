import { useState, useContext, useEffect, useMemo } from "react";
import ReviewCard from "./ReviewCard";
import ReviewModal from "../ui/ReviewModal";
import ConfirmModal from "../ui/ConfirmModal";
import Pagination from "../ui/Pagination";
import CommentModal from "./CommentModal";
import { useRequest, useFetch } from "../../hooks/useRequest";
import UserContext from "../../contexts/UserContext";
import { formatDate } from "../../utils/formatDate";

const PAGE_SIZE = 10;

function getInitials(name) {
    if (!name) return "??";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function BookReviewsSection({ bookId, bookTitle }) {
    const { user, isAdmin } = useContext(UserContext);
    const { request } = useRequest();

    const [showReviewModal, setShowReviewModal] = useState(false);
    const [savingReview, setSavingReview] = useState(false);
    const [userReview, setUserReview] = useState(null);
    const [page, setPage] = useState(1);
    const [editingReview, setEditingReview] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletingReview, setDeletingReview] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [userRating, setUserRating] = useState(0);
    const [userRatingId, setUserRatingId] = useState(null);
    const [commentsReview, setCommentsReview] = useState(null);

    // Fetch reviews for this book
    const reviewsPath = bookId ? `/data/reviews?where=${encodeURIComponent(`bookId="${bookId}"`)}` + `&load=${encodeURIComponent('authorInfo=_ownerId:users')}` : null;
    const { data: reviewsData, loading, refetch } = useFetch(reviewsPath, { immediate: !!bookId });

    // Fetch ratings for this book (to prefill modal rating)
    const ratingsPath = bookId ? `/data/ratings?where=${encodeURIComponent(`bookId="${bookId}"`)}` : null;
    const { data: ratingsData, refetch: refetchRatings } = useFetch(ratingsPath, { immediate: !!bookId });

    // Normalize reviews to display format
    const allReviews = useMemo(() => {
        if (!reviewsData) return [];
        const list = Array.isArray(reviewsData) ? reviewsData : [];
        const ratingsMap = new Map();
        if (ratingsData && Array.isArray(ratingsData)) {
            ratingsData.forEach(r => {
                if (r._ownerId) ratingsMap.set(r._ownerId, r.stars || 0);
            });
        }
        return list.map(r => {
            const authorName = r.authorInfo?.username || r.authorInfo?.email || "Anonymous";
            return {
                id: r._id || r.id,
                initials: getInitials(authorName),
                author: authorName,
                date: formatDate(r._createdOn || r.createdAt),
                reviewContent: r.reviewContent || "",
                helpfulCount: r.helpfulCount ?? 0,
                variant: r.variant,
                _ownerId: r._ownerId,
                rating: ratingsMap.get(r._ownerId) || 0,
            };
        });
    }, [reviewsData, ratingsData]);

    // Check if user already has a review
    useEffect(() => {
        if (user && allReviews.length > 0) {
            const existing = allReviews.find(r => r._ownerId === user._id);
            setUserReview(existing || null);
        } else {
            setUserReview(null);
        }
    }, [user, allReviews]);

    // User rating (for modal)
    useEffect(() => {
        if (user && ratingsData && Array.isArray(ratingsData)) {
            const existing = ratingsData.find(r => r._ownerId === user._id);
            if (existing) {
                setUserRating(existing.stars || 0);
                setUserRatingId(existing._id || existing.id || null);
            } else {
                setUserRating(0);
                setUserRatingId(null);
            }
        } else {
            setUserRating(0);
            setUserRatingId(null);
        }
    }, [user, ratingsData]);

    // Pagination
    const totalPages = Math.ceil(allReviews.length / PAGE_SIZE);
    const paginatedReviews = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return allReviews.slice(start, start + PAGE_SIZE);
    }, [allReviews, page]);

    const changeRatingHandler = async (stars) => {
        if (!user?.accessToken) return;
        try {
            const headers = { "X-Authorization": user.accessToken };
            if (userRatingId) {
                if (stars === 0) {
                    await request(`/data/ratings/${userRatingId}`, "DELETE", null, headers);
                    setUserRatingId(null);
                } else {
                    await request(`/data/ratings/${userRatingId}`, "PUT", { bookId, stars }, headers);
                }
            } else if (stars > 0) {
                const res = await request("/data/ratings", "POST", { bookId, stars }, headers);
                setUserRatingId(res._id || res.id || null);
            }
            setUserRating(stars);
            refetchRatings?.();
        } catch (err) {
            console.error("Failed to save rating:", err);
        }
    };

    const saveReviewHandler = async (text) => {
        if (!text.trim()) return;
        setSavingReview(true);
        try {
            const payload = {
                bookId,
                reviewContent: text,
                helpfulCount: 0,
            };

            const headers = user?.accessToken ? { "X-Authorization": user.accessToken } : {};

            let result;
            if (editingReview) {
                // Update existing review
                result = await request(`/data/reviews/${editingReview.id}`, "PUT", payload, headers);
            } else {
                // Create new review
                result = await request("/data/reviews", "POST", payload, headers);
            }

            // Set as user's review to highlight it
            const authorName = user?.username || user?.email || "Anonymous";
            setUserReview({
                id: result._id || result.id || editingReview?.id,
                initials: getInitials(authorName),
                author: authorName,
                date: editingReview ? userReview?.date : "Today",
                reviewContent: text,
                helpfulCount: editingReview ? userReview?.helpfulCount : 0,
                _ownerId: user?._id,
            });

            setShowReviewModal(false);
            setEditingReview(null);
            refetch?.();
        } catch (err) {
            console.error("Failed to save review:", err);
        } finally {
            setSavingReview(false);
        }
    };

    const editReviewHandler = (review) => {
        setEditingReview(review);
        setShowReviewModal(true);
    };

    const confirmDeleteReviewHandler = (review) => {
        setDeletingReview(review);
        setShowDeleteConfirm(true);
    };

    const deleteReviewHandler = async () => {
        const reviewToDelete = deletingReview;
        if (!reviewToDelete?.id) return;
        setDeleting(true);
        try {
            const headers = user?.accessToken ? { "X-Authorization": user.accessToken } : {};
            await request(`/data/reviews/${reviewToDelete.id}`, "DELETE", null, headers);
            if (reviewToDelete.id === userReview?.id) {
                setUserReview(null);
            }
            setShowDeleteConfirm(false);
            setDeletingReview(null);
            refetch?.();
        } catch (err) {
            console.error("Failed to delete review:", err);
        } finally {
            setDeleting(false);
        }
    };

    const totalCount = allReviews.length + (userReview && !allReviews.find(r => r.id === userReview.id) ? 1 : 0);

    const openComments = (review) => {
        setCommentsReview(review);
    };

    return (
        <div className="space-y-4">
            {/* Tabs (visual only) */}
            <div className="flex items-center gap-4 text-xs sm:text-sm border-b border-slate-800">
                <button className="pb-2 border-b-2 border-emerald-500 text-slate-100 font-medium">
                    Reviews ({totalCount})
                </button>
            </div>

            {/* User's review (highlighted) or Write review CTA */}
            {userReview ? (
                <ReviewCard
                    review={userReview}
                    highlighted
                    onEdit={() => editReviewHandler(userReview)}
                    onDelete={() => confirmDeleteReviewHandler(userReview)}
                    onComment={() => openComments(userReview)}
                />
            ) : (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
                    <div className="space-y-1">
                        <p className="text-slate-200 font-medium">What did you think?</p>
                        <p className="text-slate-400">
                            Share a quick reaction or a full review — it helps other readers
                            decide if this is for them.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowReviewModal(true)}
                        className="inline-flex items-center rounded-2xl bg-emerald-500 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-950 shadow hover:bg-emerald-400 transition"
                    >
                        Write a review
                    </button>
                </div>
            )}

            <ReviewModal
                visible={showReviewModal}
                initialText={editingReview?.reviewContent || ""}
                initialRating={userRating}
                onClose={() => { setShowReviewModal(false); setEditingReview(null); }}
                onSave={saveReviewHandler}
                onRatingChange={changeRatingHandler}
                saving={savingReview}
                showRating
            />

            <ConfirmModal
                open={showDeleteConfirm}
                title="Delete review"
                message={`Are you sure you want to delete ${deletingReview?.id === userReview?.id ? 'your' : 'this'} review? This action cannot be undone.`}
                confirmText={deleting ? "Deleting..." : "Delete"}
                onConfirm={deleteReviewHandler}
                onCancel={() => { setShowDeleteConfirm(false); setDeletingReview(null); }}
            />

            {/* Reviews list */}
            <div className="space-y-3">
                {loading && <p className="text-sm text-slate-400">Loading reviews...</p>}
                {!loading && paginatedReviews.length === 0 && !userReview && (
                    <p className="text-sm text-slate-400">No reviews yet. Be the first to share your thoughts!</p>
                )}
                {paginatedReviews
                    .filter(r => r.id !== userReview?.id)
                    .map((review) => (
                        <ReviewCard
                            key={review.id}
                            review={review}
                            isAdmin={isAdmin}
                            onEdit={isAdmin ? () => editReviewHandler(review) : undefined}
                            onDelete={isAdmin ? () => confirmDeleteReviewHandler(review) : undefined}
                            onComment={() => openComments(review)}
                        />
                    ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <Pagination
                    page={page}
                    pageSize={PAGE_SIZE}
                    total={allReviews.length}
                    onPageChange={setPage}
                    hidePageSize
                />
            )}

            <CommentModal
                visible={!!commentsReview}
                review={commentsReview}
                bookTitle={bookTitle}
                onClose={() => setCommentsReview(null)}
            />
        </div>
    );
}
