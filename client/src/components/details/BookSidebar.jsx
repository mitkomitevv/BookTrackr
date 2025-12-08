import { useContext, useMemo } from 'react';
import UserContext from '../../contexts/UserContext';
import { useFetch } from '../../hooks/useRequest';
import { Link } from 'react-router';

export default function BookSidebar({ bookId }) {
    return (
        <aside className="w-full lg:w-72 space-y-4">
            <YourActivitySection bookId={bookId} />
            <SimilarBooksSection bookId={bookId} />
        </aside>
    );
}

function YourActivitySection({ bookId }) {
    const { user } = useContext(UserContext);

    const shelvesPath = user
        ? `/data/shelves?where=_ownerId%3D%22${user._id}%22`
        : null;
    const { data: shelvesData } = useFetch(shelvesPath, {
        headers: user?.accessToken
            ? { 'X-Authorization': user.accessToken }
            : {},
    });
    const shelves = shelvesData?.[0] || null;

    const shelfInfo = useMemo(() => {
        if (!shelves || !bookId) return null;

        const shelfMap = {
            currentlyReading: 'Currently Reading',
            'to-read': 'To Read',
            read: 'Read',
            favoriteBooks: 'Favorites',
            dnf: 'Did Not Finish',
        };

        for (const [key, label] of Object.entries(shelfMap)) {
            if (shelves[key]?.includes(bookId)) {
                return { shelf: label, addedDate: shelves._createdOn };
            }
        }
        return null;
    }, [shelves, bookId]);

    if (!user) {
        return (
            <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3 text-sm">
                <h2 className="text-sm font-semibold text-slate-100 tracking-wide uppercase">
                    Your activity
                </h2>
                <div className="space-y-2 text-xs text-slate-400">
                    <p>Log in to see your activity and shelves.</p>
                </div>
            </section>
        );
    }

    return (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3 text-sm">
            <h2 className="text-sm font-semibold text-slate-100 tracking-wide uppercase">
                Your activity
            </h2>
            <div className="space-y-2 text-xs text-slate-400">
                {shelfInfo ? (
                    <p>
                        You added this book to{' '}
                        <span className="text-slate-200">
                            {shelfInfo.shelf}
                        </span>{' '}
                        on{' '}
                        <span className="text-slate-200">
                            {new Date(shelfInfo.addedDate).toLocaleDateString()}
                        </span>
                        .
                    </p>
                ) : (
                    <p>
                        You haven't added this book to any shelf yet.{' '}
                        <span className="text-slate-300">Add it now!</span>
                    </p>
                )}
            </div>
        </section>
    );
}

function SimilarBooksSection({ bookId }) {
    const { data: currentBook, loading: bookLoading } = useFetch(
        `/data/books/${bookId}`,
    );
    const { data: allBooks, loading: booksLoading } = useFetch('/data/books');
    const { data: ratingsData, loading: ratingsLoading } =
        useFetch('/data/ratings');

    const similarBooks = useMemo(() => {
        if (
            !currentBook ||
            !Array.isArray(allBooks) ||
            !Array.isArray(ratingsData)
        ) {
            return [];
        }

        // Get current book's genre and tags
        const currentGenre = currentBook.genre;
        const currentTags = currentBook.tags || [];

        // Find books with matching genre or tags
        const scoredBooks = allBooks
            .filter((book) => book._id !== bookId)
            .map((book) => {
                let score = 0;

                // Genre match: 2 points
                if (book.genre === currentGenre) {
                    score += 2;
                }

                // Tag matches: 1 point per matching tag
                if (book.tags) {
                    const matchingTags = book.tags.filter((tag) =>
                        currentTags.includes(tag),
                    );
                    score += matchingTags.length;
                }

                return { ...book, score };
            })
            .filter((book) => book.score > 0) // Only include books with at least one match
            .sort((a, b) => b.score - a.score) // Sort by score descending
            .slice(0, 3);

        return scoredBooks.map((book) => {
            const bookRatings = ratingsData.filter(
                (r) => r.bookId === book._id,
            );
            const avgRating =
                bookRatings.length > 0
                    ? (
                          bookRatings.reduce((sum, r) => sum + r.stars, 0) /
                          bookRatings.length
                      ).toFixed(2)
                    : 0;
            return {
                ...book,
                averageRating: parseFloat(avgRating),
                ratingCount: bookRatings.length,
            };
        });
    }, [currentBook, allBooks, ratingsData, bookId]);

    const loading = bookLoading || booksLoading || ratingsLoading;

    if (loading) {
        return (
            <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3 text-sm">
                <h2 className="text-sm font-semibold text-slate-100 tracking-wide uppercase">
                    Similar books
                </h2>
                <div className="text-xs text-slate-400">Loading...</div>
            </section>
        );
    }

    if (similarBooks.length === 0) {
        return (
            <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3 text-sm">
                <h2 className="text-sm font-semibold text-slate-100 tracking-wide uppercase">
                    Similar books
                </h2>
                <div className="text-xs text-slate-400">
                    No similar books found
                </div>
            </section>
        );
    }

    return (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3 text-sm">
            <h2 className="text-sm font-semibold text-slate-100 tracking-wide uppercase">
                Similar books
            </h2>
            <div className="space-y-3 text-xs">
                {similarBooks.map((book) => (
                    <Link
                        key={book._id}
                        to={`/catalog/${book._id}/details`}
                        className="flex gap-3 items-center hover:opacity-80 transition-opacity"
                    >
                        <div className="h-12 w-8 rounded bg-slate-800 overflow-hidden flex-shrink-0">
                            {book.coverUrl ? (
                                <img
                                    src={book.coverUrl}
                                    alt={book.title}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="h-full w-full bg-gradient-to-br from-emerald-500 via-cyan-500 to-indigo-500" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-slate-100 text-xs truncate">
                                {book.title}
                            </p>
                            <p className="text-slate-400 text-[11px]">
                                {book.author}
                            </p>
                            {book.ratingCount > 0 && (
                                <p className="text-slate-500 text-[11px] mt-1">
                                    ★ {book.averageRating} ({book.ratingCount})
                                </p>
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
