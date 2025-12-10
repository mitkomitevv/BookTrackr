import { useContext, useMemo } from 'react';
import { useParams } from 'react-router';
import CurrentlyReadingCard from './CurrentlyReadingCard';
import ShelfPreview from '../shelf-preview/ShelfPreview';
import UserContext from '../../contexts/UserContext';
import { useFetch } from '../../hooks/useRequest';
import { Link } from 'react-router';

export default function MyLibrary() {
    const { user } = useContext(UserContext);
    const { userId: routeUserId } = useParams();

    // Determine if viewing own library or another user's
    const isOwnLibrary = !routeUserId || (user && routeUserId === user._id);
    const targetUserId = routeUserId || user?._id;

    const shelvesPath = targetUserId
        ? `/data/shelves?where=${encodeURIComponent(`_ownerId="${targetUserId}"`)}&load=${encodeURIComponent('ownerInfo=_ownerId:users')}`
        : null;
    const { data: shelvesData, loading: shelvesLoading } = useFetch(
        shelvesPath,
        {
            headers:
                isOwnLibrary && user?.accessToken
                    ? { 'X-Authorization': user.accessToken }
                    : {},
        },
    );
    const shelves = shelvesData?.[0] || null;

    const viewedUsername = useMemo(() => {
        if (isOwnLibrary) return null;
        const ownerInfo = shelves?.ownerInfo;
        return (
            ownerInfo?.username ||
            ownerInfo?.name ||
            ownerInfo?.email?.split('@')[0] ||
            'User'
        );
    }, [isOwnLibrary, shelves]);

    const currentlyReadingIds = shelves?.currentlyReading || [];
    const crClause = currentlyReadingIds.length
        ? `_id IN (${currentlyReadingIds.map((id) => `"${id}"`).join(',')})`
        : '';
    const currentlyReadingPath = crClause
        ? `/data/books?where=${encodeURIComponent(crClause)}`
        : null;

    const { data: currentlyReadingData, loading: crLoading } = useFetch(
        currentlyReadingPath,
        {
            headers:
                isOwnLibrary && user?.accessToken
                    ? { 'X-Authorization': user.accessToken }
                    : {},
        },
    );
    const currentlyReadingBooks = currentlyReadingData || [];

    const addedBooksCountPath = targetUserId
        ? `/data/books?count=true&where=${encodeURIComponent(`_ownerId="${targetUserId}"`)}`
        : null;
    const { data: addedBooksCountData } = useFetch(addedBooksCountPath, {
        headers:
            isOwnLibrary && user?.accessToken
                ? { 'X-Authorization': user.accessToken }
                : {},
    });
    const addedBooksCount =
        addedBooksCountData != null ? Number(addedBooksCountData) : 0;

    if (shelvesLoading || (currentlyReadingPath && crLoading)) {
        return (
            <main className="flex-1">
                <div className="max-w-6xl mx-auto px-4 py-8">
                    <p className="text-slate-400">
                        {isOwnLibrary
                            ? 'Loading your library...'
                            : 'Loading library...'}
                    </p>
                </div>
            </main>
        );
    }

    const totalBooks = shelves
        ? (shelves.read?.length || 0) +
          (shelves.currentlyReading?.length || 0) +
          (shelves['to-read']?.length || 0)
        : 0;

    const hasAnyBooks = totalBooks > 0;
    const shelfHasBooks = (items) => Array.isArray(items) && items.length > 0;
    const canCurrentlyReading = shelfHasBooks(shelves?.currentlyReading);
    const canRead = shelfHasBooks(shelves?.read);
    const canToRead = shelfHasBooks(shelves?.['to-read']);
    const canFavorites = shelfHasBooks(shelves?.favoriteBooks);
    const canDnf = shelfHasBooks(shelves?.dnf);
    const canAddedBooks = addedBooksCount > 0;
    const pillClasses = (enabled) =>
        enabled
            ? 'rounded-full bg-slate-900 border border-slate-700 text-slate-200 px-4 py-1.5 hover:border-emerald-500 hover:text-emerald-300'
            : 'rounded-full bg-slate-900 border border-slate-800 text-slate-500 px-4 py-1.5 cursor-not-allowed opacity-60 pointer-events-none';

    // Helper to build shelf URLs with user ID for other users' libraries
    const shelfUrl = (shelfName) => {
        const base = `/catalog?shelf=${shelfName}`;
        return isOwnLibrary ? base : `${base}&userId=${targetUserId}`;
    };

    return (
        <main className="flex-1">
            <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
                {/* Heading + stats */}
                <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-50">
                            {isOwnLibrary
                                ? 'My Library'
                                : `${viewedUsername}'s Library`}
                        </h1>
                        <p className="text-sm text-slate-400 max-w-xl">
                            {isOwnLibrary
                                ? "All your shelves in one place. Track what you're reading now, what's next, and what you've already finished."
                                : `See what ${viewedUsername} is reading and has on their shelves.`}
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-xs sm:text-sm">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-2.5 flex flex-col">
                            <span className="text-slate-400">Total books</span>
                            <span className="text-lg font-semibold text-slate-50">
                                {totalBooks}
                            </span>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-2.5 flex flex-col">
                            <span className="text-slate-400">
                                Currently reading
                            </span>
                            <span className="text-lg font-semibold text-emerald-400">
                                {shelves?.currentlyReading?.length || 0}
                            </span>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-2.5 flex flex-col">
                            <span className="text-slate-400">
                                Read this year
                            </span>
                            <span className="text-lg font-semibold text-slate-50">
                                {shelves?.read?.length || 0}
                            </span>
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                        <Link
                            to={shelfUrl('currentlyReading')}
                            aria-disabled={!canCurrentlyReading}
                            className={pillClasses(canCurrentlyReading)}
                        >
                            Currently Reading (
                            {shelves?.currentlyReading?.length || 0})
                        </Link>
                        <Link
                            to={shelfUrl('read')}
                            aria-disabled={!canRead}
                            className={pillClasses(canRead)}
                        >
                            Read ({shelves?.read?.length || 0})
                        </Link>
                        <Link
                            to={shelfUrl('to-read')}
                            aria-disabled={!canToRead}
                            className={pillClasses(canToRead)}
                        >
                            To Read ({shelves?.['to-read']?.length || 0})
                        </Link>
                        <Link
                            to={shelfUrl('favorites')}
                            aria-disabled={!canFavorites}
                            className={pillClasses(canFavorites)}
                        >
                            Favorites ({shelves?.favoriteBooks?.length || 0})
                        </Link>
                        <Link
                            to={shelfUrl('dnf')}
                            aria-disabled={!canDnf}
                            className={pillClasses(canDnf)}
                        >
                            DNF ({shelves?.dnf?.length || 0})
                        </Link>

                        {isOwnLibrary && (
                            <>
                                <div className="h-9 w-px bg-slate-800"></div>

                                <Link
                                    to={'/catalog?addedBy=me'}
                                    aria-disabled={!canAddedBooks}
                                    className={pillClasses(canAddedBooks)}
                                >
                                    Your Contributions ({addedBooksCount})
                                </Link>
                            </>
                        )}
                    </div>
                </section>

                {/* Currently reading */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-50">
                                Currently reading
                            </h2>
                            <p className="text-sm text-slate-400">
                                Pick up where you left off.
                            </p>
                        </div>
                        {currentlyReadingBooks.length > 0 && (
                            <Link
                                to={shelfUrl('currentlyReading')}
                                className="text-xs sm:text-sm text-emerald-400 hover:text-emerald-300 font-medium"
                            >
                                View all
                            </Link>
                        )}
                    </div>

                    {currentlyReadingBooks.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            {currentlyReadingBooks.map((book) => (
                                <CurrentlyReadingCard
                                    key={book._id}
                                    book={book}
                                    isOwnLibrary={isOwnLibrary}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center space-y-3">
                            <p className="text-slate-300">
                                {isOwnLibrary
                                    ? "You're not reading anything right now."
                                    : `${viewedUsername} isn't reading anything right now.`}
                            </p>
                            {isOwnLibrary && (
                                <>
                                    <p className="text-sm text-slate-400">
                                        Browse the catalog and start your next
                                        adventure!
                                    </p>
                                    <Link
                                        to="/catalog"
                                        className="inline-flex items-center rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow hover:bg-emerald-400 transition"
                                    >
                                        Browse Catalog
                                    </Link>
                                </>
                            )}
                        </div>
                    )}
                </section>

                {!hasAnyBooks && (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center space-y-4">
                        <h3 className="text-xl font-semibold text-slate-50">
                            {isOwnLibrary
                                ? 'Your library is empty'
                                : 'This library is empty'}
                        </h3>
                        <p className="text-slate-400 max-w-md mx-auto">
                            {isOwnLibrary
                                ? "Start building your personal library by adding books to your shelves. Track what you're reading, plan your next reads, and keep a record of everything you've finished."
                                : `${viewedUsername} hasn't added any books to their library yet.`}
                        </p>
                        {isOwnLibrary && (
                            <Link
                                to="/catalog"
                                className="inline-flex items-center rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow hover:bg-emerald-400 transition"
                            >
                                Explore Books
                            </Link>
                        )}
                    </div>
                )}

                {shelves && hasAnyBooks && (
                    <>
                        {shelves.read && shelves.read.length > 0 && (
                            <ShelfPreview
                                title="Read"
                                description={
                                    isOwnLibrary
                                        ? 'Your completed reads.'
                                        : `${viewedUsername}'s completed reads.`
                                }
                                shelfName="read"
                                bookIds={shelves.read}
                                onViewAll={shelfUrl('read')}
                            />
                        )}

                        {shelves['to-read'] &&
                            shelves['to-read'].length > 0 && (
                                <ShelfPreview
                                    title="To Read"
                                    description={
                                        isOwnLibrary
                                            ? 'Books on your reading list.'
                                            : `Books on ${viewedUsername}'s reading list.`
                                    }
                                    shelfName="to-read"
                                    bookIds={shelves['to-read']}
                                    onViewAll={shelfUrl('to-read')}
                                />
                            )}

                        {shelves.favoriteBooks &&
                            shelves.favoriteBooks.length > 0 && (
                                <ShelfPreview
                                    title="Favorites"
                                    description={
                                        isOwnLibrary
                                            ? 'Your favorite books.'
                                            : `${viewedUsername}'s favorite books.`
                                    }
                                    shelfName="favoriteBooks"
                                    bookIds={shelves.favoriteBooks}
                                    onViewAll={shelfUrl('favorites')}
                                />
                            )}

                        {shelves.dnf && shelves.dnf.length > 0 && (
                            <ShelfPreview
                                title="DNF (Did Not Finish)"
                                description={
                                    isOwnLibrary
                                        ? "Books you didn't finish."
                                        : `Books ${viewedUsername} didn't finish.`
                                }
                                shelfName="dnf"
                                bookIds={shelves.dnf}
                                onViewAll={shelfUrl('dnf')}
                            />
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
