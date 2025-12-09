import { useContext, useMemo, useState } from 'react';
import { useFetch } from '../../hooks/useRequest';
import { useShelfManagement } from '../../hooks/useShelfManagement';
import { Link } from 'react-router';
import UserContext from '../../contexts/UserContext';
import ShelfModal from '../ui/ShelfModal';

export default function TrendingCard() {
    const { user } = useContext(UserContext);
    const [showShelfModal, setShowShelfModal] = useState(false);
    const { data: ratingsData, loading: ratingsLoading } =
        useFetch('/data/ratings');
    const { data: booksData, loading: booksLoading } = useFetch('/data/books');

    const trendingBook = useMemo(() => {
        if (!Array.isArray(ratingsData) || !Array.isArray(booksData)) {
            return null;
        }

        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

        const weeklyRatings = ratingsData.filter(
            (rating) => rating._createdOn >= oneWeekAgo,
        );

        const ratingCountByBook = {};
        weeklyRatings.forEach((rating) => {
            ratingCountByBook[rating.bookId] =
                (ratingCountByBook[rating.bookId] || 0) + 1;
        });

        let bookWithMostRatings = null;
        let maxRatings = 0;

        Object.entries(ratingCountByBook).forEach(([bookId, count]) => {
            if (count > maxRatings) {
                maxRatings = count;
                bookWithMostRatings = bookId;
            }
        });

        if (!bookWithMostRatings) {
            return null;
        }

        const bookDetails = booksData.find(
            (book) => book._id === bookWithMostRatings,
        );

        if (!bookDetails) {
            return null;
        }

        const bookRatings = weeklyRatings.filter(
            (rating) => rating.bookId === bookWithMostRatings,
        );
        const averageRating =
            bookRatings.length > 0
                ? (
                      bookRatings.reduce(
                          (sum, rating) => sum + rating.stars,
                          0,
                      ) / bookRatings.length
                  ).toFixed(2)
                : 0;

        return {
            ...bookDetails,
            averageRating: parseFloat(averageRating),
            ratingCount: bookRatings.length,
        };
    }, [ratingsData, booksData]);

    const loading = ratingsLoading || booksLoading;

    // Use shelf management hook
    const { shelves, bookShelves, toggleShelf, removeFromAllShelves } =
        useShelfManagement(trendingBook?._id, user);

    if (loading) {
        return (
            <div className="w-full md:w-80 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3 backdrop-blur">
                <p className="text-xs font-medium text-emerald-300 uppercase">
                    Trending this week
                </p>
                <div className="text-xs text-slate-400">Loading...</div>
            </div>
        );
    }

    if (!trendingBook) {
        return (
            <div className="w-full md:w-80 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3 backdrop-blur">
                <p className="text-xs font-medium text-emerald-300 uppercase">
                    Trending this week
                </p>
                <div className="text-xs text-slate-400">No ratings yet</div>
            </div>
        );
    }

    return (
        <Link
            to={`/catalog/${trendingBook._id}/details`}
            className="block w-full md:w-80 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3 backdrop-blur hover:border-slate-700 transition-colors"
        >
            <p className="text-xs font-medium text-emerald-300 uppercase">
                Trending this week
            </p>
            <div className="flex gap-3">
                <div className="h-24 w-16 rounded-md bg-slate-800 overflow-hidden flex-shrink-0">
                    {trendingBook.coverUrl ? (
                        <img
                            src={trendingBook.coverUrl}
                            alt={trendingBook.title}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="h-full w-full bg-gradient-to-br from-emerald-500 via-cyan-500 to-indigo-500" />
                    )}
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-semibold text-slate-50">
                        {trendingBook.title}
                    </h3>
                    <p className="text-xs text-slate-400">
                        {trendingBook.author}
                    </p>
                    <p className="mt-2 text-xs text-slate-300 line-clamp-3">
                        {trendingBook.description}
                    </p>
                </div>
            </div>
            <div className="flex items-center justify-between text-xs pt-2">
                <div className="flex items-center gap-1 text-amber-300">
                    ★ {trendingBook.averageRating}
                    <span className="text-slate-400">
                        · {trendingBook.ratingCount.toLocaleString()} ratings
                    </span>
                </div>
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        setShowShelfModal(true);
                    }}
                    disabled={!user}
                    className="text-emerald-400 hover:text-emerald-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {!user
                        ? 'Log in to add to your library'
                        : bookShelves.length > 0
                          ? bookShelves[0]
                          : 'Add to shelf'}
                </button>
            </div>

            <ShelfModal
                isOpen={showShelfModal}
                onClose={() => setShowShelfModal(false)}
                bookTitle={trendingBook.title}
                bookId={trendingBook._id}
                shelves={shelves}
                onToggleShelf={toggleShelf}
                onRemoveFromAll={removeFromAllShelves}
            />
        </Link>
    );
}
