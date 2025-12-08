import { useContext } from 'react';
import CurrentlyReadingCard from './CurrentlyReadingCard';
import ShelfPreview from '../shelf-preview/ShelfPreview';
import UserContext from '../../contexts/UserContext';
import { useFetch } from '../../hooks/useRequest';
import { Link } from 'react-router';

export default function MyLibrary() {
    const { user } = useContext(UserContext);

    const shelvesPath = user
        ? `/data/shelves?where=_ownerId%3D%22${user._id}%22`
        : null;
    const { data: shelvesData, loading: shelvesLoading } = useFetch(
        shelvesPath,
        {
            headers: user?.accessToken
                ? { 'X-Authorization': user.accessToken }
                : {},
        },
    );
    const shelves = shelvesData?.[0] || null;

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
            headers: user?.accessToken
                ? { 'X-Authorization': user.accessToken }
                : {},
        },
    );
    const currentlyReadingBooks = currentlyReadingData || [];

    if (shelvesLoading || (currentlyReadingPath && crLoading)) {
        return (
            <main className="flex-1">
                <div className="max-w-6xl mx-auto px-4 py-8">
                    <p className="text-slate-400">Loading your library...</p>
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
    const pillClasses = (enabled) =>
        enabled
            ? 'rounded-full bg-slate-900 border border-slate-700 text-slate-200 px-4 py-1.5 hover:border-emerald-500 hover:text-emerald-300'
            : 'rounded-full bg-slate-900 border border-slate-800 text-slate-500 px-4 py-1.5 cursor-not-allowed opacity-60 pointer-events-none';

    return (
        <main className="flex-1">
            <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
                {/* Heading + stats */}
                <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-50">
                            My Library
                        </h1>
                        <p className="text-sm text-slate-400 max-w-xl">
                            All your shelves in one place. Track what
                            you&apos;re reading now, what&apos;s next, and what
                            you&apos;ve already finished.
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
                            to={'/catalog?shelf=currentlyReading'}
                            aria-disabled={!canCurrentlyReading}
                            className={pillClasses(canCurrentlyReading)}
                        >
                            Currently reading
                        </Link>
                        <Link
                            to={'/catalog?shelf=read'}
                            aria-disabled={!canRead}
                            className={pillClasses(canRead)}
                        >
                            Read
                        </Link>
                        <Link
                            to={'/catalog?shelf=to-read'}
                            aria-disabled={!canToRead}
                            className={pillClasses(canToRead)}
                        >
                            To Read
                        </Link>
                        <Link
                            to={'/catalog?shelf=favorites'}
                            aria-disabled={!canFavorites}
                            className={pillClasses(canFavorites)}
                        >
                            Favorites
                        </Link>
                        <Link
                            to={'/catalog?shelf=dnf'}
                            aria-disabled={!canDnf}
                            className={pillClasses(canDnf)}
                        >
                            DNF
                        </Link>
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
                                to="/catalog?shelf=currentlyReading"
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
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center space-y-3">
                            <p className="text-slate-300">
                                You're not reading anything right now.
                            </p>
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
                        </div>
                    )}
                </section>

                {!hasAnyBooks && (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center space-y-4">
                        <h3 className="text-xl font-semibold text-slate-50">
                            Your library is empty
                        </h3>
                        <p className="text-slate-400 max-w-md mx-auto">
                            Start building your personal library by adding books
                            to your shelves. Track what you're reading, plan
                            your next reads, and keep a record of everything
                            you've finished.
                        </p>
                        <Link
                            to="/catalog"
                            className="inline-flex items-center rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow hover:bg-emerald-400 transition"
                        >
                            Explore Books
                        </Link>
                    </div>
                )}

                {shelves && hasAnyBooks && (
                    <>
                        {shelves.read && shelves.read.length > 0 && (
                            <ShelfPreview
                                title="Read"
                                description="Your completed reads."
                                shelfName="read"
                                bookIds={shelves.read}
                                onViewAll="/catalog?shelf=read"
                            />
                        )}

                        {shelves['to-read'] &&
                            shelves['to-read'].length > 0 && (
                                <ShelfPreview
                                    title="To Read"
                                    description="Books on your reading list."
                                    shelfName="to-read"
                                    bookIds={shelves['to-read']}
                                    onViewAll="/catalog?shelf=to-read"
                                />
                            )}

                        {shelves.favoriteBooks &&
                            shelves.favoriteBooks.length > 0 && (
                                <ShelfPreview
                                    title="Favorites"
                                    description="Your favorite books."
                                    shelfName="favoriteBooks"
                                    bookIds={shelves.favoriteBooks}
                                    onViewAll="/catalog?shelf=favorites"
                                />
                            )}

                        {shelves.dnf && shelves.dnf.length > 0 && (
                            <ShelfPreview
                                title="DNF (Did Not Finish)"
                                description="Books you didn't finish."
                                shelfName="dnf"
                                bookIds={shelves.dnf}
                                onViewAll="/catalog?shelf=dnf"
                            />
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
