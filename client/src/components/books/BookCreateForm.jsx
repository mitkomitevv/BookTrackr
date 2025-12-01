// pages/BookCreateForm.jsx
import { useNavigate } from "react-router";
import { useFormRequest } from "../../hooks/useFormRequest";

const initialValues = {
    title: "",
    author: "",
    genre: "",
    isbn: "",
    pages: "",
    year: "",
    coverUrl: "",
    tags: "",
    description: "",
};

export default function BookCreateForm() {
    const navigate = useNavigate();

    const {
        registerInput,
        formProps,
        loading,
        error,
    } = useFormRequest({
        path: "/data/books",
        method: "POST",
        initialValues,
        withAuth: true,
        mapValues: (values) => ({
            ...values,
            pages: values.pages ? Number(values.pages) : undefined,
            year: values.year ? Number(values.year) : undefined,
            numberInSeries: values.numberInSeries ? Number(values.numberInSeries) : undefined,
            tags: values.tags
              ? values.tags.split(",").map(t => t.trim()).filter(Boolean)
              : [],
        }),
        onSuccess: (data, reset) => {
            reset();
            navigate("/catalog");
        },
    });

    const handleCancel = () => navigate("/books");

    return (
        <main className="flex-1">
            <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
                <header className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-semibold text-slate-50">
                        Add a new book
                    </h1>
                    <p className="text-sm text-slate-400 max-w-2xl">
                        Add a book to your catalog. You can always edit these details later.
                    </p>
                </header>

                {error && (
                    <p className="text-sm text-red-400">
                        {error.message || "Something went wrong while creating the book."}
                    </p>
                )}
                {loading && (
                    <p className="text-sm text-slate-400">
                        Saving book…
                    </p>
                )}

                <form
                    {...formProps}
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
                                        required
                                        placeholder="Empire of Silence"
                                        className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        {...registerInput("title")}
                                    />
                                </label>
                            </div>

                            {/* Series */}
                            <div>
                                <label className="flex flex-col gap-1 text-sm">
                                    <span className="text-slate-200">Series</span>
                                    <input
                                        type="text"
                                        placeholder="The Sun Eater"
                                        className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        {...registerInput("series")}
                                    />
                                </label>
                            </div>

                            {/* Number in series */}
                            <div>
                                <label className="flex flex-col gap-1 text-sm">
                                    <span className="text-slate-200">Number in series</span>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="1"
                                        className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        {...registerInput("numberInSeries")}
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
                                        required
                                        placeholder="Aya Morrow"
                                        className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        {...registerInput("author")}
                                    />
                                </label>
                            </div>

                            {/* Genre */}
                            <div>
                                <label className="flex flex-col gap-1 text-sm">
                                    <span className="text-slate-200">Genre</span>
                                    <select
                                        className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        {...registerInput("genre")}
                                    >
                                        <option value="">Select a genre</option>
                                        <option>Fantasy</option>
                                        <option>Science Fiction</option>
                                        <option>Literary</option>
                                        <option>Romance</option>
                                        <option>Thriller</option>
                                        <option>Non-fiction</option>
                                    </select>
                                </label>
                            </div>

                            {/* Page count */}
                            <div>
                                <label className="flex flex-col gap-1 text-sm">
                                    <span className="text-slate-200">Page count</span>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="384"
                                        className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        {...registerInput("pages")}
                                    />
                                </label>
                            </div>

                            {/* Published year */}
                            <div>
                                <label className="flex flex-col gap-1 text-sm">
                                    <span className="text-slate-200">Published year</span>
                                    <input
                                        type="number"
                                        placeholder="2024"
                                        className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        {...registerInput("year")}
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
                                        placeholder="https://example.com/cover.jpg"
                                        className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        {...registerInput("coverUrl")}
                                    />
                                    <span className="text-[11px] text-slate-500">
                                        You can host images in your backend later — this is just a
                                        placeholder for now.
                                    </span>
                                </label>
                            </div>

                            {/* Tags / moods */}
                            <div className="sm:col-span-2">
                                <label className="flex flex-col gap-1 text-sm">
                                    <span className="text-slate-200">Tags / moods</span>
                                    <input
                                        type="text"
                                        placeholder="cozy, bittersweet, slow burn"
                                        className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        {...registerInput("tags")}
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
                                rows={5}
                                placeholder="Short description or blurb for this book..."
                                className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-y"
                                {...registerInput("description")}
                            />
                        </label>
                    </section>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-4 py-2 rounded-2xl border border-slate-700 text-sm text-slate-200 hover:border-slate-500 hover:text-slate-100 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 rounded-2xl bg-emerald-500 text-sm font-semibold text-slate-950 shadow hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transition"
                        >
                            {loading ? "Saving..." : "Save book"}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
