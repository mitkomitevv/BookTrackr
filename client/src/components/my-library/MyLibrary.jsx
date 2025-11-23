// src/components/my-library/MyLibrary.jsx
import BookCard from "../book-card/BookCard";
import CurrentlyReadingCard from "./CurrentlyReadingCard";

const CURRENTLY_READING = [
    {
        id: 1,
        title: "The House Between Seasons",
        author: "Aya Morrow",
        coverUrl: "/images/books/house-between-seasons.jpg",
        description:
            "A quiet, atmospheric fantasy set in an inn that only appears on the border of seasons, hosting travelers out of time.",
        progressPercent: 54,
        currentPage: 212,
        totalPages: 394,
    },
    {
        id: 2,
        title: "A Song for Distant Suns",
        author: "Marcos Ibarra",
        coverUrl: "/images/books/distant-suns.jpg",
        description:
            "A sweeping, character-driven space epic about the last signal from a dying star — and the people obsessed with decoding it.",
        progressPercent: 21,
        currentPage: 89,
        totalPages: 432,
    },
];

const RECENTLY_FINISHED = [
    {
        id: 1,
        title: "Margins of the Map",
        author: "Noah Clarke",
        coverUrl: "/images/books/margins-of-the-map.jpg",
        description:
            '"Quietly devastating in the best way. The kind of book that makes your own hometown feel haunted afterwards."',
        rating: "4.0",
        ratingsCount: "your rating",
        finishedLabel: "Finished 3 days ago",
    },
    {
        id: 2,
        title: "Cities Made of Paper",
        author: "Rhea Das",
        coverUrl: "/images/books/cities-made-of-paper.jpg",
        description:
            '"Every chapter felt like walking deeper into a city built out of memory and regret. New all-time favorite."',
        rating: "5.0",
        ratingsCount: "your rating",
        finishedLabel: "Finished last week",
    },
    {
        id: 3,
        title: "The Silent Archive",
        author: "Lena Harrow",
        coverUrl: "/images/books/the-silent-archive.jpg",
        description:
            '"Loved the concept more than the execution, but the ending completely sold me on the series."',
        rating: "4.5",
        ratingsCount: "your rating",
        finishedLabel: "Finished 2 weeks ago",
    },
];

export default function MyLibrary() {
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
                            All your shelves in one place. Track what you&apos;re reading now,
                            what&apos;s next, and what you&apos;ve already finished.
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-xs sm:text-sm">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-2.5 flex flex-col">
                            <span className="text-slate-400">Total books</span>
                            <span className="text-lg font-semibold text-slate-50">128</span>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-2.5 flex flex-col">
                            <span className="text-slate-400">Currently reading</span>
                            <span className="text-lg font-semibold text-emerald-400">4</span>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-2.5 flex flex-col">
                            <span className="text-slate-400">Read this year</span>
                            <span className="text-lg font-semibold text-slate-50">23</span>
                        </div>
                    </div>
                </section>

                {/* Shelf pills (visual for now) */}
                <section className="space-y-4">
                    <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                        <button className="rounded-full bg-emerald-500 text-slate-950 font-medium px-4 py-1.5 shadow">
                            All
                        </button>
                        <button className="rounded-full bg-slate-900 border border-slate-700 text-slate-200 px-4 py-1.5 hover:border-emerald-500 hover:text-emerald-300">
                            Currently reading
                        </button>
                        <button className="rounded-full bg-slate-900 border border-slate-700 text-slate-200 px-4 py-1.5 hover:border-emerald-500 hover:text-emerald-300">
                            To Read
                        </button>
                        <button className="rounded-full bg-slate-900 border border-slate-700 text-slate-200 px-4 py-1.5 hover:border-emerald-500 hover:text-emerald-300">
                            Read
                        </button>
                        <button className="rounded-full bg-slate-900 border border-slate-700 text-slate-200 px-4 py-1.5 hover:border-emerald-500 hover:text-emerald-300">
                            Favorites
                        </button>
                        <button className="rounded-full bg-slate-900 border border-slate-700 text-slate-200 px-4 py-1.5 hover:border-emerald-500 hover:text-emerald-300">
                            DNF
                        </button>
                    </div>
                </section>

                {/* Currently reading */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-50">
                                Currently reading
                            </h2>
                            <p className="text-sm text-slate-400">Pick up where you left off.</p>
                        </div>
                        <a
                            href="#"
                            className="text-xs sm:text-sm text-emerald-400 hover:text-emerald-300 font-medium"
                        >
                            View all
                        </a>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {CURRENTLY_READING.map((book) => (
                            <CurrentlyReadingCard key={book.id} book={book} />
                        ))}
                    </div>
                </section>

                {/* Shelves overview (kept as simple cards for now) */}
                {/* ...you can keep your existing HTML here, it’s purely styling */}

                {/* Recently finished – reusing BookCard */}
                <section className="space-y-4 pb-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-50">
                                Recently finished
                            </h2>
                            <p className="text-sm text-slate-400">
                                Your last few completed reads.
                            </p>
                        </div>
                        <a
                            href="#"
                            className="text-xs sm:text-sm text-emerald-400 hover:text-emerald-300 font-medium"
                        >
                            View reading history
                        </a>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {RECENTLY_FINISHED.map((book) => (
                            <div
                                key={book.id}
                            >
                                <span className="text-[11px] text-slate-400 mb-1">
                                    {book.finishedLabel}
                                </span>
                                <BookCard
                                    title={book.title}
                                    author={book.author}
                                    coverUrl={book.coverUrl}
                                    description={book.description}
                                    rating={book.rating}
                                    ratingsCount={book.ratingsCount}
                                    href="#"
                                    showDescription={true}
                                    compact={true} // hides tags if you add any
                                />
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
