import { useState, useContext, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import StarRating from '../ui/StarRating';
import { useExpandable } from '../../hooks/useExpandable';
import { useRequest } from '../../hooks/useRequest';
import UserContext from '../../contexts/UserContext';

export default function ReviewCard({
    review,
    highlighted = false,
    isAdmin = false,
    onEdit,
    onDelete,
    onComment,
}) {
    const { expanded, setExpanded, contentRef, isLong } = useExpandable(
        review.reviewContent,
    );
    const { user } = useContext(UserContext);
    const { request } = useRequest();
    const [helpfulCount, setHelpfulCount] = useState(0);
    const [userHelpful, setUserHelpful] = useState(false);
    const [marking, setMarking] = useState(false);
    const [likeId, setLikeId] = useState(null);
    const isColoredAvatar = review.variant !== 'neutral';
    const showActions = (highlighted || isAdmin) && (onEdit || onDelete);

    const fetchLikesData = useCallback(async () => {
        try {
            const headers = user?.accessToken
                ? { 'X-Authorization': user.accessToken }
                : {};
            const whereClause = encodeURIComponent(`reviewId="${review.id}"`);
            const response = await request(
                `/data/reviewLikes?where=${whereClause}`,
                'GET',
                undefined,
                headers,
            );

            if (Array.isArray(response)) {
                // Set helpful count based on total likes
                setHelpfulCount(response.length);

                // Check if current user has liked this review
                if (user?.accessToken) {
                    const userLike = response.find(
                        (like) => like._ownerId === user._id,
                    );
                    if (userLike) {
                        setUserHelpful(true);
                        setLikeId(userLike._id);
                    } else {
                        setUserHelpful(false);
                        setLikeId(null);
                    }
                }
            } else {
                setHelpfulCount(0);
                setUserHelpful(false);
                setLikeId(null);
            }
        } catch (err) {
            console.error('Failed to fetch likes data:', err);
            setHelpfulCount(0);
        }
    }, [review.id, user?.accessToken, user?._id, request]);

    useEffect(() => {
        fetchLikesData();
    }, [fetchLikesData]);

    const helpfulUpdateHandler = async () => {
        if (!user?.accessToken || marking) {
            return;
        }

        setMarking(true);

        try {
            const headers = { 'X-Authorization': user.accessToken };

            if (userHelpful && likeId) {
                // Unlike - delete the like record
                await request(
                    `/data/reviewLikes/${likeId}`,
                    'DELETE',
                    undefined,
                    headers,
                );
                setHelpfulCount(helpfulCount - 1);
                setUserHelpful(false);
                setLikeId(null);
            } else {
                // Like - create a new like record
                const likeResponse = await request(
                    `/data/reviewLikes`,
                    'POST',
                    { reviewId: review.id },
                    headers,
                );
                setHelpfulCount(helpfulCount + 1);
                setUserHelpful(true);
                setLikeId(likeResponse._id);
            }
        } catch (err) {
            console.error('Failed to update helpful status:', err);
        } finally {
            setMarking(false);
        }
    };

    return (
        <article
            className={`rounded-2xl border p-4 space-y-3 text-sm ${highlighted ? 'border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500/50' : 'border-slate-800 bg-slate-900/70'}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div
                        className={
                            'h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-semibold ' +
                            (isColoredAvatar
                                ? 'bg-gradient-to-br from-emerald-500 to-sky-500 text-slate-950'
                                : 'bg-slate-800 text-slate-200')
                        }
                    >
                        {review.initials}
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-100">
                                <Link
                                    to={`/library/${review._ownerId}`}
                                    className="hover:text-emerald-400 transition"
                                >
                                    {review.author}
                                </Link>
                                {highlighted && (
                                    <span className="ml-2 text-[10px] text-emerald-400 font-normal">
                                        Your review
                                    </span>
                                )}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                            {review.date}
                            <span className="h-3 w-px bg-slate-700" />
                            <span>
                                {review.rating > 0 && (
                                    <StarRating
                                        value={review.rating}
                                        readonly
                                        size="sm"
                                    />
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
                                className="px-3 py-1 rounded-xl text-xs font-medium text-slate-300 border border-slate-700 hover:border-emerald-500 hover:text-emerald-300 transition"
                            >
                                Edit
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={onDelete}
                                className="px-3 py-1 rounded-xl text-xs font-medium text-slate-300 border border-slate-700 hover:border-red-500 hover:text-red-400 transition"
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
                    className={`text-sm text-slate-200 leading-relaxed whitespace-pre-wrap ${!expanded ? 'line-clamp-3' : ''}`}
                >
                    {review.reviewContent}
                </p>
                {isLong && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="mt-1 text-emerald-400 hover:text-emerald-300 font-medium text-sm"
                    >
                        {expanded ? 'See less' : 'See more...'}
                    </button>
                )}
            </div>

            <div className="flex items-center gap-3 text-[13px] text-slate-400">
                <button
                    onClick={helpfulUpdateHandler}
                    disabled={marking || !user}
                    className={`inline-flex items-center gap-1 transition ${
                        userHelpful
                            ? 'text-emerald-400 hover:text-slate-400'
                            : 'hover:text-emerald-400 disabled:text-slate-600 disabled:cursor-not-allowed'
                    }`}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill={userHelpful ? 'currentColor' : 'none'}
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="size-6"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z"
                        />
                    </svg>
                </button>
                <span>{helpfulCount} found this helpful</span>
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
