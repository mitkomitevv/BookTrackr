import BookCard from "../book-card/BookCard";

const STAFF_PICKS = [
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

export default function StaffRecommendations() {
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
                {STAFF_PICKS.map((book) => (
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
                    />
                ))}
            </div>
        </section>
    );
}
