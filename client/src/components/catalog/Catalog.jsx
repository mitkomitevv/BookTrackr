import { useFetch } from "../../hooks/useRequest";
import BookCard from "../book-card/BookCard";
import Pagination from "./Pagination";

export default function Catalog() {
    const { data: books, loading, error } = useFetch("/data/books");

    return (
        <main className="flex-1">
            <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
                {/* Header / filters row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-50">
                            Browse books
                        </h1>
                        <p className="text-sm text-slate-400">
                            Explore your library by genre, mood, and more.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs">
                        <select className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200">
                            <option>All genres</option>
                            <option>Fantasy</option>
                            <option>Sci-Fi</option>
                            <option>Literary</option>
                        </select>
                        <select className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200">
                            <option>Sort by: Trending</option>
                            <option>Highest rated</option>
                            <option>Most reviewed</option>
                            <option>Newest</option>
                        </select>
                    </div>
                </div>

                {/* Loading / Error states */}
                {loading && (
                    <p className="text-sm text-slate-400">Loading books…</p>
                )}
                {error && (
                    <p className="text-sm text-red-400">
                        {error.payload?.message || "Failed to load books."}
                    </p>
                )}

                {/* Grid */}
                {books && books.length > 0 && (
                    <div className="grid gap-4 sm:gap-5 md:grid-cols-3 sm:grid-cols-2 grid-cols-1">
                        {books.map((book) => (
                            <BookCard key={book._id} {...book}/>
                        ))}
                    </div>
                )}

                {books && books.length === 0 && (
                    <p className="text-sm text-slate-400">No books found.</p>
                )}

                {/* Pagination – just styling for now */}
                <Pagination />
            </div>
        </main>
    );
}
