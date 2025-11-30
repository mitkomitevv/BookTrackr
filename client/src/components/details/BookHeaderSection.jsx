// src/components/details/BookHeaderSection.jsx
export default function BookHeaderSection({
    title,
    coverUrl,
    author,
    tags,
    description,
    pages,
    year,
    genre

}) {
    return (
        <section className="flex flex-col lg:flex-row gap-8">
            {/* Left: cover + shelf actions + status */}
            <div className="w-full lg:w-64 flex flex-col items-center gap-4">
                {/* Cover */}
                <div className="w-48 h-72 rounded-2xl bg-slate-800 overflow-hidden shadow-2xl shadow-emerald-500/20">
                    <img className="w-full h-full bg-cover bg-center" src={coverUrl} alt={title} />
                </div>

                {/* Shelf buttons */}
                <div className="w-full flex flex-col gap-2 text-sm">
                    <button className="w-full inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-2 font-semibold text-slate-950 shadow hover:bg-emerald-400 transition">
                        Add to "To Read"
                    </button>
                    <button className="w-full inline-flex items-center justify-center rounded-2xl border border-slate-700 px-4 py-2 font-medium text-slate-200 hover:border-emerald-500 hover:text-emerald-300 transition">
                        Mark as "Currently reading"
                    </button>
                    <button className="w-full inline-flex items-center justify-center rounded-2xl border border-slate-700 px-4 py-2 font-medium text-slate-200 hover:border-emerald-500 hover:text-emerald-300 transition">
                        I&apos;ve read this book
                    </button>
                </div>

                {/* Your rating / status */}
                <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/70 p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-slate-400">Your status</span>
                        <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                            To Read
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-slate-400">Your rating</span>
                        <button className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-200">
                            <span>Rate this book</span>
                            <span className="text-lg leading-none">★</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Right: main details */}
            <div className="flex-1 space-y-5">
                {/* Title & meta */}
                <div className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-semibold text-slate-50">
                        {title}
                    </h1>
                    <p className="text-sm text-slate-300">
                        by{" "}
                        <span className="text-slate-100 font-medium">{author}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span>{tags}</span>
                        <span className="h-3 w-px bg-slate-700" />
                        <span>{pages} pages</span>
                        <span className="h-3 w-px bg-slate-700" />
                        <span>Published {year}</span>
                    </div>
                </div>

                {/* Rating summary */}
                <RatingSummary />

                {/* Description */}
                <section className="space-y-3 text-sm">
                    <h2 className="text-sm font-semibold text-slate-100 tracking-wide uppercase">
                        Description
                    </h2>
                    <p className="text-slate-300 leading-relaxed">
                        {description}
                    </p>
                </section>

                {/* Metadata tags */}
                <section className="space-y-2 text-xs">
                    <h2 className="text-sm font-semibold text-slate-100 tracking-wide uppercase">
                        Details
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center rounded-full bg-slate-900 border border-slate-700 px-3 py-1 text-[11px] text-slate-300">
                            Genre: {genre}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-slate-900 border border-slate-700 px-3 py-1 text-[11px] text-slate-300">
                            Standalone novel
                        </span>
                    </div>
                </section>
            </div>
        </section>
    );
}

function RatingSummary() {
    return (
        <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm">
            <div className="flex items-center gap-2">
                <span className="text-3xl leading-none text-amber-300">★</span>
                <div>
                    <div className="text-lg font-semibold text-slate-50">4.35</div>
                    <div className="text-xs text-slate-400">
                        6,421 ratings · 1,203 reviews
                    </div>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-5 gap-2 text-[11px] text-slate-400">
                <RatingBar label="5★" percent="62%" width="66%" />
                <RatingBar label="4★" percent="23%" width="25%" />
                <RatingBar label="3★" percent="10%" width="16%" />
                <RatingBar label="2★" percent="3%" width="8%" />
                <RatingBar label="1★" percent="2%" width="4%" />
            </div>
        </div>
    );
}

function RatingBar({ label, percent, width }) {
    return (
        <div className="flex items-center gap-2">
            <span>{label}</span>
            <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width }}
                />
            </div>
            <span>{percent}</span>
        </div>
    );
}
