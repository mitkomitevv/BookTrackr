import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useFormRequest } from '../../hooks/useFormRequest';
import { useFetch } from '../../hooks/useRequest';

export default function BookSaveForm() {
    const navigate = useNavigate();
    const { bookId } = useParams();
    const isEdit = Boolean(bookId);
    const [errors, setErrors] = useState({});

    const {
        data: book,
        loading: loadingBook,
        error: bookError,
    } = useFetch(isEdit ? `/data/books/${bookId}` : null, {
        immediate: isEdit,
    });

    const initialValues = useMemo(() => {
        if (isEdit && book) {
            return {
                title: book.title ?? '',
                author: book.author ?? '',
                genre: book.genre ?? '',
                isbn: book.isbn ?? '',
                pages: book.pages ?? '',
                year: book.year ?? '',
                coverUrl: book.coverUrl ?? '',
                tags: book.tags ? book.tags.join(', ') : '',
                description: book.description ?? '',
                numberInSeries: book.numberInSeries ?? '',
                series: book.series ?? '',
            };
        }
        return {
            title: '',
            author: '',
            genre: '',
            isbn: '',
            pages: '',
            year: '',
            coverUrl: '',
            tags: '',
            description: '',
            numberInSeries: '',
            series: '',
        };
    }, [isEdit, book]);

    const handleBlur = (fieldName, value) => {
        let fieldError = null;

        if (fieldName === 'title' && !value.trim()) {
            fieldError = 'Title is required';
        }
        if (fieldName === 'author' && !value.trim()) {
            fieldError = 'Author is required';
        }
        if (fieldName === 'genre' && !value) {
            fieldError = 'Genre is required';
        }
        if (fieldName === 'pages' && !value) {
            fieldError = 'Page count is required';
        }
        if (fieldName === 'year' && !value) {
            fieldError = 'Published year is required';
        }
        if (fieldName === 'description' && !value.trim()) {
            fieldError = 'Description is required';
        }

        setErrors((prev) => {
            const newErrors = { ...prev };
            if (fieldError) {
                newErrors[fieldName] = fieldError;
            } else {
                delete newErrors[fieldName];
            }
            return newErrors;
        });
    };

    const { registerInput, formProps, loading, error, reset } = useFormRequest({
        path: isEdit ? `/data/books/${bookId}` : '/data/books',
        method: isEdit ? 'PUT' : 'POST',
        initialValues,
        withAuth: true,
        mapValues: (values) => ({
            ...values,
            pages: values.pages ? Number(values.pages) : undefined,
            year: values.year ? Number(values.year) : undefined,
            numberInSeries: values.numberInSeries
                ? Number(values.numberInSeries)
                : undefined,
            coverUrl:
                values.coverUrl.trim() ||
                'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSAK9WZiWmfdDs6DpjZtXlANjjUHcayTMMhwsGDCe-Wsw&s',
            tags: values.tags
                ? values.tags
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean)
                : [],
        }),
        onSuccess: (data, reset) => {
            reset();
            if (isEdit) {
                navigate(`/catalog/${bookId}/details`);
            } else {
                navigate('/catalog');
            }
        },
    });

    // Populate form when book data arrives (edit mode)
    useEffect(() => {
        if (!isEdit || !book) return;
        const vals = {
            title: book.title ?? '',
            author: book.author ?? '',
            genre: book.genre ?? '',
            isbn: book.isbn ?? '',
            pages: book.pages ?? '',
            year: book.year ?? '',
            coverUrl: book.coverUrl ?? '',
            tags: book.tags ? book.tags.join(', ') : '',
            description: book.description ?? '',
            numberInSeries: book.numberInSeries ?? '',
            series: book.series ?? '',
        };
        reset(vals);
    }, [isEdit, book, reset]);

    const cancelClickHandler = () =>
        navigate(isEdit ? `/catalog/${bookId}/details` : '/catalog');

    if (isEdit && loadingBook) {
        return (
            <div className="flex-1 flex items-center justify-center">
                Loading...
            </div>
        );
    }

    if (isEdit && bookError) {
        return (
            <div className="flex-1 flex items-center justify-center">
                Failed to load book for editing
            </div>
        );
    }

    return (
        <main className="flex-1">
            <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
                <header className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-semibold text-slate-50">
                        {isEdit ? 'Edit book' : 'Add a new book'}
                    </h1>
                    <p className="text-sm text-slate-400 max-w-2xl">
                        {isEdit
                            ? 'Update the book details.'
                            : "Before adding a new book, please ensure it isn't already in our catalog to avoid duplicates. Duplicates will be removed by our admin team. Any book added here will be visible to all users."}
                    </p>
                </header>

                {error && (
                    <p className="text-sm text-red-400">
                        {error.message ||
                            'Something went wrong while saving the book.'}
                    </p>
                )}
                {loading && (
                    <p className="text-sm text-slate-400">Saving book…</p>
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
                                <span className="text-emerald-400">*</span>{' '}
                                Required fields
                            </span>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {/* Title */}
                            <div className="sm:col-span-2">
                                <label className="flex flex-col gap-1 text-sm">
                                    <span className="text-slate-200">
                                        Title{' '}
                                        <span className="text-emerald-400">
                                            *
                                        </span>
                                    </span>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Book Title"
                                        className={`w-full rounded-2xl border ${errors.title ? 'border-red-500' : 'border-slate-700'} bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 ${errors.title ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-emerald-500 focus:border-emerald-500'}`}
                                        {...registerInput('title')}
                                        onBlur={(e) =>
                                            handleBlur('title', e.target.value)
                                        }
                                    />
                                    {errors.title && (
                                        <span className="text-xs text-red-400">
                                            {errors.title}
                                        </span>
                                    )}
                                </label>
                            </div>

                            {/* Series */}
                            <div>
                                <label className="flex flex-col gap-1 text-sm">
                                    <span className="text-slate-200">
                                        Series
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Series Name"
                                        className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        {...registerInput('series')}
                                    />
                                </label>
                            </div>

                            {/* Number in series */}
                            <div>
                                <label className="flex flex-col gap-1 text-sm">
                                    <span className="text-slate-200">
                                        Number in series
                                    </span>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="1"
                                        className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        {...registerInput('numberInSeries')}
                                    />
                                </label>
                            </div>

                            {/* Author */}
                            <div>
                                <label className="flex flex-col gap-1 text-sm">
                                    <span className="text-slate-200">
                                        Author{' '}
                                        <span className="text-emerald-400">
                                            *
                                        </span>
                                    </span>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Author Name"
                                        className={`w-full rounded-2xl border ${errors.author ? 'border-red-500' : 'border-slate-700'} bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 ${errors.author ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-emerald-500 focus:border-emerald-500'}`}
                                        {...registerInput('author')}
                                        onBlur={(e) =>
                                            handleBlur('author', e.target.value)
                                        }
                                    />
                                    {errors.author && (
                                        <span className="text-xs text-red-400">
                                            {errors.author}
                                        </span>
                                    )}
                                </label>
                            </div>

                            {/* Genre */}
                            <div>
                                <label className="flex flex-col gap-1 text-sm">
                                    <span className="text-slate-200">
                                        Genre{' '}
                                        <span className="text-emerald-400">
                                            *
                                        </span>
                                    </span>
                                    <select
                                        required
                                        className={`w-full rounded-2xl border ${errors.genre ? 'border-red-500' : 'border-slate-700'} bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 ${errors.genre ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-emerald-500 focus:border-emerald-500'}`}
                                        {...registerInput('genre')}
                                        onBlur={(e) =>
                                            handleBlur('genre', e.target.value)
                                        }
                                    >
                                        <option value="">Select a genre</option>
                                        <option>Fantasy</option>
                                        <option>Science Fiction</option>
                                        <option>Literary</option>
                                        <option>Romance</option>
                                        <option>Thriller</option>
                                        <option>Non-fiction</option>
                                    </select>
                                    {errors.genre && (
                                        <span className="text-xs text-red-400">
                                            {errors.genre}
                                        </span>
                                    )}
                                </label>
                            </div>

                            {/* Page count */}
                            <div>
                                <label className="flex flex-col gap-1 text-sm">
                                    <span className="text-slate-200">
                                        Page count{' '}
                                        <span className="text-emerald-400">
                                            *
                                        </span>
                                    </span>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        placeholder="384"
                                        className={`w-full rounded-2xl border ${errors.pages ? 'border-red-500' : 'border-slate-700'} bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 ${errors.pages ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-emerald-500 focus:border-emerald-500'}`}
                                        {...registerInput('pages')}
                                        onBlur={(e) =>
                                            handleBlur('pages', e.target.value)
                                        }
                                    />
                                    {errors.pages && (
                                        <span className="text-xs text-red-400">
                                            {errors.pages}
                                        </span>
                                    )}
                                </label>
                            </div>

                            {/* Published year */}
                            <div>
                                <label className="flex flex-col gap-1 text-sm">
                                    <span className="text-slate-200">
                                        Published year{' '}
                                        <span className="text-emerald-400">
                                            *
                                        </span>
                                    </span>
                                    <input
                                        type="number"
                                        required
                                        placeholder="2024"
                                        className={`w-full rounded-2xl border ${errors.year ? 'border-red-500' : 'border-slate-700'} bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 ${errors.year ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-emerald-500 focus:border-emerald-500'}`}
                                        {...registerInput('year')}
                                        onBlur={(e) =>
                                            handleBlur('year', e.target.value)
                                        }
                                    />
                                    {errors.year && (
                                        <span className="text-xs text-red-400">
                                            {errors.year}
                                        </span>
                                    )}
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
                                    <span className="text-slate-200">
                                        Cover image URL
                                    </span>
                                    <input
                                        type="url"
                                        placeholder="https://example.com/cover.jpg"
                                        className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        {...registerInput('coverUrl')}
                                    />
                                    <span className="text-[11px] text-slate-500">
                                        Leave empty to use a default placeholder
                                        image.
                                    </span>
                                </label>
                            </div>

                            {/* Tags / moods */}
                            <div className="sm:col-span-2">
                                <label className="flex flex-col gap-1 text-sm">
                                    <span className="text-slate-200">
                                        Tags / moods
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="cozy, bittersweet, slow burn"
                                        className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        {...registerInput('tags')}
                                    />
                                    <span className="text-[11px] text-slate-500">
                                        Comma-separated for now (you can parse
                                        them into chips later).
                                    </span>
                                </label>
                            </div>
                        </div>
                    </section>

                    {/* Description */}
                    <section className="space-y-3">
                        <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wide">
                            Description{' '}
                            <span className="text-emerald-400">*</span>
                        </h2>
                        <label className="flex flex-col gap-1 text-sm">
                            <span className="sr-only">Description</span>
                            <textarea
                                rows={5}
                                required
                                placeholder="Short description or blurb for this book..."
                                className={`w-full rounded-2xl border ${errors.description ? 'border-red-500' : 'border-slate-700'} bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 ${errors.description ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-emerald-500 focus:border-emerald-500'} resize-y`}
                                {...registerInput('description')}
                                onBlur={(e) =>
                                    handleBlur('description', e.target.value)
                                }
                            />
                            {errors.description && (
                                <span className="text-xs text-red-400">
                                    {errors.description}
                                </span>
                            )}
                        </label>
                    </section>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={cancelClickHandler}
                            className="px-4 py-2 rounded-2xl border border-slate-700 text-sm text-slate-200 hover:border-slate-500 hover:text-slate-100 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 rounded-2xl bg-emerald-500 text-sm font-semibold text-slate-950 shadow hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transition"
                        >
                            {loading ? 'Saving...' : 'Save book'}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
