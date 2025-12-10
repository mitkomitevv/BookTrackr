import { useFetch } from '../../hooks/useRequest';
import { Link } from 'react-router';
import BookCard from '../book-card/BookCard';

export default function ShelfPreview({
    title,
    description,
    bookIds,
    onViewAll,
}) {
    const booksToFetch = bookIds?.slice(0, 3) || [];
    const inClause = booksToFetch.length
        ? `_id IN (${booksToFetch.map((id) => `"${id}"`).join(',')})`
        : '';
    const path = inClause
        ? `/data/books?where=${encodeURIComponent(inClause)}`
        : null;

    const { data: books = [], loading, error } = useFetch(path);

    if (loading) {
        return (
            <section className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-50">
                            {title}
                        </h2>
                        <p className="text-sm text-slate-400">{description}</p>
                    </div>
                </div>
                <p className="text-slate-400 text-sm">Loading books...</p>
            </section>
        );
    }

    if (error) {
        return (
            <section className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-50">
                            {title}
                        </h2>
                        <p className="text-sm text-slate-400">{description}</p>
                    </div>
                </div>
                <p className="text-sm text-red-400">
                    Failed to load shelf books.
                </p>
            </section>
        );
    }

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-semibold text-slate-50">
                        {title}
                    </h2>
                    <p className="text-sm text-slate-400">{description}</p>
                </div>
                {bookIds.length > 0 && (
                    <Link
                        to={onViewAll}
                        className="text-xs sm:text-sm text-emerald-400 hover:text-emerald-300 font-medium"
                    >
                        View all {title}
                    </Link>
                )}
            </div>

            {books.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {books.map((book) => (
                        <div key={book._id}>
                            <BookCard
                                _id={book._id}
                                title={book.title}
                                author={book.author}
                                coverUrl={book.coverUrl}
                                description={book.description}
                                showDescription={true}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-slate-400 text-sm">
                    No books in this shelf yet.
                </p>
            )}
        </section>
    );
}
