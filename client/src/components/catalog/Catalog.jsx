import { useFetch } from '../../hooks/useRequest';
import BookCard from '../book-card/BookCard';
import CurrentlyReadingCard from '../my-library/CurrentlyReadingCard';
import Pagination from '../ui/Pagination';
import { useState, useEffect, useContext } from 'react';
import { useSearchParams } from 'react-router';
import useSearchQuery from '../../hooks/useSearchQuery';
import UserContext from '../../contexts/UserContext';

export default function Catalog() {
    const { user } = useContext(UserContext);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [total, setTotal] = useState(null);
    const [searchParams] = useSearchParams();
    const authorParam = searchParams.get('author');
    const shelfParam = searchParams.get('shelf');
    const shelfKey =
        shelfParam === 'favorites'
            ? 'favoriteBooks'
            : shelfParam === 'currentlyReading'
              ? 'currentlyReading'
              : shelfParam;

    const q = authorParam ?? (searchParams.get('q') || '');

    const offset = (page - 1) * pageSize;

    // Fetch user's shelf when comming from my-library
    const shelfPath =
        shelfKey && user
            ? `/data/shelves?where=_ownerId%3D%22${user._id}%22`
            : null;
    const { data: shelvesData } = useFetch(shelfPath, {
        headers: user?.accessToken
            ? { 'X-Authorization': user.accessToken }
            : {},
    });

    const shelfBooks = shelvesData?.[0]?.[shelfKey] || [];

    const whereClause = useSearchQuery(q, ['title', 'author']);
    const whereQuery = whereClause
        ? `&where=${encodeURIComponent(whereClause)}`
        : '';

    // If shelf parameter is present, filter by shelf books
    let path;
    let countPath;

    if (shelfKey && shelvesData) {
        // Build expression WHERE clause using IN for shelf books
        const inClause = shelfBooks.length
            ? `_id IN (${shelfBooks.map((id) => `"${id}"`).join(',')})`
            : '';

        if (inClause) {
            const shelfWhereQuery = `&where=${encodeURIComponent(inClause)}`;
            path = `/data/books?offset=${offset}&pageSize=${pageSize}${shelfWhereQuery}`;
            countPath = `/data/books?count=true${shelfWhereQuery}`;
        } else {
            path = null;
            countPath = null;
        }
    } else if (!shelfParam) {
        path = `/data/books?offset=${offset}&pageSize=${pageSize}${whereQuery}`;
        countPath = `/data/books?count=true${whereQuery}`;
    } else {
        path = null;
        countPath = null;
    }

    const { data: books, loading, error } = useFetch(path);
    const { data: countData, refetch: refetchCount } = useFetch(countPath);

    useEffect(() => {
        if (countData != null) setTotal(Number(countData));
    }, [countData]);

    useEffect(() => {
        refetchCount?.();
    }, [pageSize, refetchCount, shelfParam]);

    useEffect(() => {
        setPage(1);
    }, [q, shelfParam]);

    return (
        <main className="flex-1">
            <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
                {/* Header / filters row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-50">
                            {shelfParam === 'currentlyReading'
                                ? 'Currently reading'
                                : shelfParam
                                  ? `${shelfParam.charAt(0).toUpperCase() + shelfParam.slice(1)} books`
                                  : 'Browse books'}
                        </h1>
                        <p className="text-sm text-slate-400">
                            {shelfParam === 'currentlyReading'
                                ? 'Your currently reading shelf.'
                                : shelfParam
                                  ? `Your ${shelfParam} shelf.`
                                  : 'Explore our library.'}
                        </p>
                    </div>
                </div>

                {/* Loading / Error states */}
                {loading && (
                    <p className="text-sm text-slate-400">Loading books…</p>
                )}
                {error && (
                    <p className="text-sm text-red-400">
                        {error.payload?.message || 'Failed to load books.'}
                    </p>
                )}

                {/* Grid */}
                {books && books.length > 0 && (
                    <div
                        className={
                            shelfParam === 'currentlyReading'
                                ? 'grid gap-4 md:grid-cols-2 grid-cols-1'
                                : 'grid gap-4 sm:gap-5 md:grid-cols-2 grid-cols-1'
                        }
                    >
                        {books.map((book) =>
                            shelfParam === 'currentlyReading' ? (
                                <CurrentlyReadingCard
                                    key={book._id}
                                    book={book}
                                />
                            ) : (
                                <BookCard key={book._id} {...book} />
                            ),
                        )}
                    </div>
                )}

                {books && books.length === 0 && (
                    <p className="text-sm text-slate-400">No books found.</p>
                )}

                {/* Pagination */}
                <Pagination
                    page={page}
                    pageSize={pageSize}
                    total={total}
                    onPageChange={(p) => {
                        setPage(p);
                    }}
                    onPageSizeChange={(s) => {
                        setPageSize(s);
                        setPage(1);
                    }}
                />
            </div>
        </main>
    );
}
