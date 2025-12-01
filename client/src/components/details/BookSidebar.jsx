// src/components/details/BookSidebar.jsx
export default function BookSidebar() {
    return (
        <aside className="w-full lg:w-72 space-y-4">
            <YourActivitySection />
            <SimilarBooksSection />
        </aside>
    );
}

function YourActivitySection() {
    return (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3 text-sm">
            <h2 className="text-sm font-semibold text-slate-100 tracking-wide uppercase">
                Your activity
            </h2>
            <div className="space-y-2 text-xs text-slate-400">
                <p>
                    You added this book to{" "}
                    <span className="text-slate-200">To Read</span> on Jan 12, 2025.
                </p>
                <p>
                    You last viewed this book{" "}
                    <span className="text-slate-200">2 hours ago</span>.
                </p>
            </div>
            <button className="mt-2 inline-flex items-center rounded-2xl border border-slate-700 px-3 py-1.5 text-[11px] font-medium text-slate-200 hover:border-emerald-500 hover:text-emerald-300 transition">
                View all activity
            </button>
        </section>
    );
}

const SIMILAR_BOOKS = [
    {
        id: 1,
        title: "The Lantern at Low Tide",
        subtitle: "Cozy · Coastal · Time slip",
    },
    {
        id: 2,
        title: "Winter's Guesthouse",
        subtitle: "Found family · Quiet magic",
    },
    {
        id: 3,
        title: "The City Between Doors",
        subtitle: "Portal fantasy · Liminal spaces",
    },
];

function SimilarBooksSection() {
    return (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3 text-sm">
            <h2 className="text-sm font-semibold text-slate-100 tracking-wide uppercase">
                Similar books
            </h2>
            <div className="space-y-3 text-xs">
                {SIMILAR_BOOKS.map((book) => (
                    <div key={book.id} className="flex gap-3 items-center">
                        <div className="h-12 w-8 rounded bg-slate-800" />
                        <div className="flex-1">
                            <p className="text-slate-100 text-xs">{book.title}</p>
                            <p className="text-slate-400 text-[11px]">{book.subtitle}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
