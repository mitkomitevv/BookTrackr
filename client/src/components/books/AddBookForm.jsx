export default function AddBookForm() {
    const handleSubmit = (e) => {
        e.preventDefault();
        // TODO: hook into your API / state later
    };

    return (
        <main className="flex-1">
            <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
                {/* Page heading */}
                <header className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-semibold text-slate-50">
                        Add a new book
                    </h1>
                    <p className="text-sm text-slate-400 max-w-2xl">
                        Add a book to your catalog. You can always edit these details later.
                    </p>
                </header>

                {/* Form card */}
                <form
                    onSubmit={handleSubmit}
                    className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 space-y-6 shadow-lg"
                >
                    {/* Basic info */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wide">
                                Basic information
                            </h2>
                            <span className="text-[11px] text-slate-500">
                                <span className="text-emerald-400">*</span> Required fields
                            </span>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {/* Title */}
                            <div className="sm:col-span-2">
                                <label className="flex flex-col gap-1 text-sm">
                                    <span className="text-slate-200">
                                        Title <span className="text-emerald-400">*</span>
                                    </span>
                                    <input
                                        type="text"
                                        name="title"
                                        required
                                        placeholder="The House Between Seasons"
                                        className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </label>
                            </div>

                            {/* Author */}
                            <div>
                                <label className="flex flex-col gap-1 text-sm">
                                    <span className="text-slate-200">
                                        Author <span className="text-emerald-400">*</span>
                                    </span>
                                    <input
                                        type="text"
                                        name="author"
                                        required
                                        placeholder="Aya Morrow"
                                        className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </label>
                            </div>

                            {/* Genre */}
                            <div>
                                <label className="flex flex-col gap-1 text-sm">
                                    <span className="text-slate-200">Genre</span>
                                    <select
                                        name="genre"
                                        className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        defaultValue=""
                                    >
                                        <option value="" disabled>
                                            Select a genre
                                        </option>
                                        <option>Fantasy</option>
                                        <option>Science Fiction</option>
                                        <option>Literary</option>
                                        <option>Romance</option>
                                        <option>Thriller</option>
                                        <option>Non-fiction</option>
                                    </select>
                                </label>
                            </div>

                            {/* ISBN */}
                            <div>
                                <label className="flex flex-col gap-1 text-sm">
                                    <span className="text-slate-200">ISBN</span>
                                    <input
                                        type="text"
                                        name="isbn"
                                        placeholder="978-1-234567-89-7"
                                        className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                    <span className="text-[11px] text-slate-500">
                                        Optional for older editions, but helps avoid duplicates.
                                    </span>
                                </label>
                            </div>

                            {/* Page count */}
                            <div>
                                <label className="flex flex-col gap-1 text-sm">
                                    <span className="text-slate-200">Page count</span>
                                    <input
                                        type="number"
                                        name="pages"
                                        min="1"
                                        placeholder="384"
                                        className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </label>
                            </div>

                            {/* Published year */}
                            <div>
                                <label className="flex flex-col gap-1 text-sm">
                                    <span className="text-slate-200">Published year</span>
                                    <input
                                        type="number"
                                        name="year"
                                        placeholder="2024"
                                        className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </label>
                            </div>
                        </div>
                    </section>

                    {/* Cover & meta */}
                    <section className="space-y-4">
                        <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wide">
                            Cover & metadata
                        </h2>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {/* Cover URL */}
                            <div className="sm:col-span-2">
                                <label className="flex flex-col gap-1 text-sm">
                                    <span className="text-slate-200">Cover image URL</span>
                                    <input
                                        type="url"
                                        name="coverUrl"
                                        placeholder="https://example.com/cover.jpg"
                                        className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                    <span className="text-[11px] text-slate-500">
                                        You can host images in your backend later — this is just a
                                        placeholder for now.
                                    </span>
                                </label>
                            </div>

                            {/* Mood / tags (free text for now) */}
                            <div className="sm:col-span-2">
                                <label className="flex flex-col gap-1 text-sm">
                                    <span className="text-slate-200">Tags / moods</span>
                                    <input
                                        type="text"
                                        name="tags"
                                        placeholder="cozy, bittersweet, slow burn"
                                        className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                    <span className="text-[11px] text-slate-500">
                                        Comma-separated for now (you can parse them into chips later).
                                    </span>
                                </label>
                            </div>
                        </div>
                    </section>

                    {/* Description */}
                    <section className="space-y-3">
                        <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wide">
                            Description
                        </h2>
                        <label className="flex flex-col gap-1 text-sm">
                            <span className="sr-only">Description</span>
                            <textarea
                                name="description"
                                rows={5}
                                placeholder="Short description or blurb for this book..."
                                className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-y"
                            />
                        </label>
                    </section>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            className="px-4 py-2 rounded-2xl border border-slate-700 text-sm text-slate-200 hover:border-slate-500 hover:text-slate-100 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-2xl bg-emerald-500 text-sm font-semibold text-slate-950 shadow hover:bg-emerald-400 transition"
                        >
                            Save book
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
