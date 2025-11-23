import BookCard from "../book-card/BookCard";
import Pagination from "./Pagination";

const CATALOG_BOOKS = [
    {
        id: 1,
        title: "A Song for Distant Suns",
        author: "Marcos Ibarra",
        tags: ["Sci-Fi", "Space Opera"],
        description:
            "A sweeping, character-driven space epic about the last signal from a dying star — and the people obsessed with decoding it.",
        rating: "4.48",
        ratingsCount: "12.1k",
        coverUrl: "/images/books/distant-suns.jpg",
    },
    {
        id: 2,
        title: "The House Between Seasons",
        author: "Aya Morrow",
        tags: ["Fantasy", "Cozy"],
        description:
            "A quiet, atmospheric fantasy set in an inn that only appears on the border of seasons, hosting travelers out of time.",
        rating: "4.35",
        ratingsCount: "6.4k",
        coverUrl: "/images/books/house-between-seasons.jpg",
    },
    {
        id: 3,
        title: "Margins of the Map",
        author: "Noah Clarke",
        tags: ["Literary", "Contemporary"],
        description:
            "A cartographer returns to his hometown to redraw the coastline and confront the fault lines of his past.",
        rating: "4.02",
        ratingsCount: "3.9k",
        coverUrl: "/images/books/margins-of-the-map.jpg",
    },
];

export default function Catalog() {
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

                {/* Grid */}
                <div className="grid gap-4 sm:gap-5 md:grid-cols-3 sm:grid-cols-2 grid-cols-1">
                    {CATALOG_BOOKS.map((book) => (
                        <BookCard
                            key={book.id}
                            title={book.title}
                            author={book.author}
                            description={book.description}
                            tags={book.tags}
                            rating={book.rating}
                            ratingsCount={book.ratingsCount}
                            coverUrl={book.coverUrl}
                            href="#"
                        // you could set compact={true} to hide tags/description if you want
                        />
                    ))}
                </div>

                {/* Pagination – just styling for now */}
                <Pagination />
            </div>
        </main>
    );
}
