import { Link, useNavigate } from 'react-router';
import { useRequest, useFetch } from '../../hooks/useRequest';
import { useContext, useState, useEffect, useMemo } from 'react';
import UserContext from '../../contexts/UserContext';
import ConfirmModal from '../ui/ConfirmModal';
import StarRating from '../ui/StarRating';
import ShelfModal from '../ui/ShelfModal';
import { useExpandable } from '../../hooks/useExpandable';
import { useShelfManagement } from '../../hooks/useShelfManagement';

function gradientClassFor(key) {
    const gradients = [
        'bg-gradient-to-br from-emerald-700 via-sky-700 to-violet-800',
        'bg-gradient-to-br from-pink-700 via-red-700 to-rose-600',
        'bg-gradient-to-br from-indigo-800 via-purple-700 to-pink-600',
        'bg-gradient-to-br from-rose-700 via-fuchsia-700 to-indigo-700',
        'bg-gradient-to-br from-emerald-700 via-lime-600 to-amber-600',
    ];
    if (!key) return gradients[0];
    const idx =
        key.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) %
        gradients.length;
    return gradients[idx];
}

export default function BookHeaderSection({
    title,
    series,
    numberInSeries,
    coverUrl,
    author,
    tags,
    description,
    pages,
    year,
    genre,
    _id,
    _ownerId,
}) {
    const navigate = useNavigate();
    const { request } = useRequest();
    const { user, isAdmin } = useContext(UserContext);
    const [showConfirm, setShowConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [userRating, setUserRating] = useState(0);
    const [userRatingId, setUserRatingId] = useState(null);
    const [savingRating, setSavingRating] = useState(false);
    const [showShelfModal, setShowShelfModal] = useState(false);
    const {
        expanded: descriptionExpanded,
        setExpanded: setDescriptionExpanded,
        contentRef: descriptionRef,
        isLong: isDescriptionLong,
    } = useExpandable(description);

    const ratingsPath = _id
        ? `/data/ratings?where=${encodeURIComponent(`bookId="${_id}"`)}`
        : null;
    const { data: ratingsData, refetch: refetchRatings } = useFetch(
        ratingsPath,
        {
            immediate: !!_id,
        },
    );

    const { shelves, bookShelves, toggleShelf, removeFromAllShelves } =
        useShelfManagement(_id, user);

    const canEditDelete = user && (isAdmin || user._id === _ownerId);

    const ratingStats = useMemo(() => {
        if (
            !ratingsData ||
            !Array.isArray(ratingsData) ||
            ratingsData.length === 0
        ) {
            return { average: 0, count: 0, distribution: [0, 0, 0, 0, 0] };
        }
        const distribution = [0, 0, 0, 0, 0];
        let sum = 0;
        for (const r of ratingsData) {
            if (r.stars >= 1 && r.stars <= 5) {
                distribution[r.stars - 1]++;
                sum += r.stars;
            }
        }
        return {
            average: sum / ratingsData.length,
            count: ratingsData.length,
            distribution,
        };
    }, [ratingsData]);

    // Find user's existing rating
    useEffect(() => {
        if (user && ratingsData && Array.isArray(ratingsData)) {
            const existing = ratingsData.find((r) => r._ownerId === user._id);
            if (existing) {
                setUserRating(existing.stars || 0);
                setUserRatingId(existing._id);
            } else {
                setUserRating(0);
                setUserRatingId(null);
            }
        } else {
            setUserRating(0);
            setUserRatingId(null);
        }
    }, [user, ratingsData]);

    const ratingChangeHandler = async (stars) => {
        if (!user?.accessToken) return;
        setSavingRating(true);
        try {
            const headers = { 'X-Authorization': user.accessToken };
            if (userRatingId) {
                // Update existing rating
                if (stars === 0) {
                    // Delete rating
                    await request(
                        `/data/ratings/${userRatingId}`,
                        'DELETE',
                        null,
                        headers,
                    );
                    setUserRatingId(null);
                } else {
                    await request(
                        `/data/ratings/${userRatingId}`,
                        'PUT',
                        { bookId: _id, stars },
                        headers,
                    );
                }
            } else if (stars > 0) {
                // Create new rating
                const result = await request(
                    '/data/ratings',
                    'POST',
                    { bookId: _id, stars },
                    headers,
                );
                setUserRatingId(result._id);
            }
            setUserRating(stars);
            refetchRatings?.();
        } catch (err) {
            console.error('Failed to save rating:', err);
        } finally {
            setSavingRating(false);
        }
    };

    const deleteHandler = () => {
        setShowConfirm(true);
    };

    const confirmDeleteHandler = async () => {
        setDeleting(true);
        try {
            const headers = user?.accessToken
                ? { 'X-Authorization': user.accessToken }
                : {};
            await request(`/data/books/${_id}`, 'DELETE', null, headers);
            setShowConfirm(false);
            navigate('/catalog');
        } catch (err) {
            console.error(err);
            alert(err.payload?.message || 'Failed to delete book.');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <section className="flex flex-col lg:flex-row gap-8">
            {/* Left: cover + shelf actions + status */}
            <div className="w-full lg:w-64 flex flex-col items-center gap-4">
                {/* Cover */}
                <div className="w-48 h-72 rounded-2xl overflow-hidden shadow-2xl shadow-emerald-500/20">
                    {coverUrl ? (
                        <img
                            className="w-full h-full bg-cover bg-center"
                            src={coverUrl}
                            alt={title}
                        />
                    ) : (
                        <div
                            className={`w-full h-full flex items-center justify-center text-white ${gradientClassFor(title)} text-center relative`}
                        >
                            <div className="absolute inset-0 bg-black/25" />
                            <div className="relative z-10 px-3">
                                <div className="text-3xl font-semibold tracking-tight drop-shadow-md">
                                    {title}
                                </div>
                                {author && (
                                    <div className="text-xs text-white/95 mt-1 drop-shadow-sm">
                                        by {author}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Shelf buttons */}
                <div className="w-full flex flex-col gap-2 text-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-slate-400">Your rating:</span>
                        {user ? (
                            <div
                                className={
                                    savingRating
                                        ? 'opacity-50 pointer-events-none'
                                        : ''
                                }
                            >
                                <StarRating
                                    value={userRating}
                                    onChange={ratingChangeHandler}
                                    size="md"
                                />
                            </div>
                        ) : (
                            <span className="text-slate-500 text-[11px]">
                                Log in to rate
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => setShowShelfModal(true)}
                        disabled={!user}
                        className="w-full inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-2 font-semibold text-slate-950 shadow hover:bg-emerald-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {!user
                            ? 'Log in to add'
                            : bookShelves.length > 0
                              ? bookShelves[0]
                              : 'Add to Shelf'}
                    </button>
                </div>
            </div>

            {/* Right: main details */}
            <div className="flex-1 space-y-5">
                {/* Title & meta */}
                <div className="space-y-2">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-50">
                                {title}
                                {series && (
                                    <span className="text-lg text-slate-400 font-normal ml-2">
                                        ({series}
                                        {numberInSeries
                                            ? `, #${numberInSeries}`
                                            : ''}
                                        )
                                    </span>
                                )}
                            </h1>
                            <p className="text-sm text-slate-300">
                                by{' '}
                                <span className="text-slate-100 font-medium">
                                    {author}
                                </span>
                            </p>
                        </div>

                        {canEditDelete && (
                            <div className="flex gap-2">
                                <Link
                                    type="button"
                                    to={`/catalog/${_id}/edit`}
                                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 px-3 py-1 text-sm text-slate-200 hover:border-emerald-500 hover:text-emerald-300 transition"
                                >
                                    Edit
                                </Link>
                                <button
                                    type="button"
                                    onClick={deleteHandler}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-500 transition"
                                >
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        {tags &&
                            tags.map((tag) => <span key={tag}>{tag}</span>)}
                        <span className="h-3 w-px bg-slate-700" />
                        <span>
                            {pages
                                ? `${pages} pages`
                                : 'Page count not available'}
                        </span>
                        <span className="h-3 w-px bg-slate-700" />
                        <span>Published {year}</span>
                    </div>
                </div>

                {/* Rating summary */}
                <RatingSummary stats={ratingStats} />

                {/* Description */}
                <section className="space-y-3 text-sm">
                    <h2 className="text-sm font-semibold text-slate-100 tracking-wide uppercase">
                        Description
                    </h2>
                    <div className="description">
                        <p
                            ref={descriptionRef}
                            className={`text-slate-300 leading-relaxed ${!descriptionExpanded ? 'line-clamp-[10]' : ''}`}
                        >
                            {description}
                        </p>
                        {isDescriptionLong && (
                            <button
                                onClick={() =>
                                    setDescriptionExpanded(!descriptionExpanded)
                                }
                                className="mt-1 text-emerald-400 hover:text-emerald-300 font-medium text-sm"
                            >
                                {descriptionExpanded
                                    ? 'See less'
                                    : 'See more...'}
                            </button>
                        )}
                    </div>
                </section>

                {/* Metadata tags */}
                <section className="space-y-2 text-xs">
                    <h2 className="text-sm font-semibold text-slate-100 tracking-wide uppercase">
                        Details
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center rounded-full bg-slate-900 border border-slate-700 px-3 py-1 text-[11px] text-slate-300">
                            Genre: {genre}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-slate-900 border border-slate-700 px-3 py-1 text-[11px] text-slate-300">
                            {numberInSeries
                                ? 'Part of a series'
                                : 'Standalone novel'}
                        </span>
                    </div>
                </section>
            </div>

            <ConfirmModal
                open={showConfirm}
                onConfirm={confirmDeleteHandler}
                onCancel={() => setShowConfirm(false)}
                title="Confirm Delete"
                message="Are you sure you want to delete this book? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                loading={deleting}
            />

            <ShelfModal
                isOpen={showShelfModal}
                onClose={() => setShowShelfModal(false)}
                bookTitle={title}
                bookId={_id}
                shelves={shelves}
                onToggleShelf={toggleShelf}
                onRemoveFromAll={removeFromAllShelves}
            />
        </section>
    );
}

function RatingSummary({ stats }) {
    const { average, count, distribution } = stats || {
        average: 0,
        count: 0,
        distribution: [0, 0, 0, 0, 0],
    };
    const percentages = distribution.map((d) =>
        count > 0 ? Math.round((d / count) * 100) : 0,
    );

    return (
        <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm">
            <div className="flex items-center gap-2">
                <span className="text-3xl leading-none text-amber-300">★</span>
                <div>
                    <div className="text-lg font-semibold text-slate-50">
                        {count > 0 ? average.toFixed(2) : '—'}
                    </div>
                    <div className="text-xs text-slate-400">
                        {count} {count === 1 ? 'rating' : 'ratings'}
                    </div>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-5 gap-2 text-[11px] text-slate-400">
                <RatingBar
                    label="5★"
                    percent={`${percentages[4]}%`}
                    width={`${percentages[4]}%`}
                />
                <RatingBar
                    label="4★"
                    percent={`${percentages[3]}%`}
                    width={`${percentages[3]}%`}
                />
                <RatingBar
                    label="3★"
                    percent={`${percentages[2]}%`}
                    width={`${percentages[2]}%`}
                />
                <RatingBar
                    label="2★"
                    percent={`${percentages[1]}%`}
                    width={`${percentages[1]}%`}
                />
                <RatingBar
                    label="1★"
                    percent={`${percentages[0]}%`}
                    width={`${percentages[0]}%`}
                />
            </div>
        </div>
    );
}

function RatingBar({ label, percent, width }) {
    return (
        <div className="flex items-center gap-2">
            <span>{label}</span>
            <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width }}
                />
            </div>
            <span>{percent}</span>
        </div>
    );
}
