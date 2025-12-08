import { useMemo } from 'react';
import BookCard from '../book-card/BookCard';
import { useFetch } from '../../hooks/useRequest';

export default function StaffRecommendations() {
    const {
        data: settings,
        loading: settingsLoading,
        error: settingsError,
    } = useFetch('/data/settings/home');
    const RAW_RECOMMENDATIONS = useMemo(
        () => settings?.staffRecommendations || [],
        [settings],
    );

    const idPicks = useMemo(() => {
        if (!Array.isArray(RAW_RECOMMENDATIONS)) return [];
        return RAW_RECOMMENDATIONS.map((p) =>
            typeof p === 'object' ? p._id || p.id : String(p),
        ).filter(Boolean);
    }, [RAW_RECOMMENDATIONS]);

    // Request only the picked books from the server
    const booksPath = useMemo(() => {
        if (idPicks.length === 0) return null;
        const inside = idPicks
            .map((id) => id.toString().replace(/"/g, '\\"'))
            .join('","');
        const clause = `_id in ("${inside}")`;
        return `/data/books?where=${encodeURIComponent(clause)}`;
    }, [idPicks]);

    const {
        data: booksData,
        loading: booksLoading,
        error: booksError,
    } = useFetch(booksPath, { immediate: Boolean(booksPath) });

    const recommended = useMemo(() => {
        if (!Array.isArray(idPicks) || idPicks.length === 0) return [];
        const books = Array.isArray(booksData) ? booksData : [];
        return idPicks
            .map((id) => books.find((b) => b._id == id || b.id == id))
            .filter(Boolean);
    }, [idPicks, booksData]);

    const loading = settingsLoading || booksLoading;
    const error = settingsError || booksError;

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-slate-50">
                        Staff recommendations
                    </h2>
                    <p className="text-sm text-slate-400">
                        Hand-picked reads our team can’t stop talking about.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 sm:gap-5 md:grid-cols-3 sm:grid-cols-2 grid-cols-1">
                {loading && (
                    <div className="text-sm text-slate-400">
                        Loading recommendations…
                    </div>
                )}
                {error && (
                    <div className="text-sm text-red-400">
                        Failed to load recommendations
                    </div>
                )}
                {!loading && recommended.length === 0 && (
                    <div className="text-sm text-slate-400">
                        No recommendations set.
                    </div>
                )}

                {recommended.map((book) => (
                    <BookCard key={book._id} {...book} />
                ))}
            </div>
        </section>
    );
}
