import { useState, useContext } from 'react';
import UserContext from '../../contexts/UserContext';
import { Link } from 'react-router';
import { useFetch, useRequest } from '../../hooks/useRequest';

export default function CurrentlyReadingCard({ book }) {
    const { user } = useContext(UserContext);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [pageInput, setPageInput] = useState('');
    const { request } = useRequest();

    const progressPath =
        user && book._id
            ? `/data/readingProgress?where=bookId%3D%22${book._id}%22%20and%20_ownerId%3D%22${user._id}%22`
            : null;

    const { data: progressData, refetch: refetchProgress } = useFetch(
        progressPath,
        {
            headers: user?.accessToken
                ? { 'X-Authorization': user.accessToken }
                : {},
        },
    );

    const progress = progressData?.[0] || null;

    const openModal = () => {
        setPageInput(progress?.currentPage?.toString() || '');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setPageInput('');
    };

    const updateProgressHandler = async (e) => {
        e.preventDefault();
        if (!user || !book._id) return;

        const currentPage = parseInt(pageInput);
        if (isNaN(currentPage) || currentPage < 0 || currentPage > book.pages) {
            alert(
                `Please enter a valid page number between 0 and ${book.pages}`,
            );
            return;
        }

        setIsUpdating(true);

        try {
            const body = {
                bookId: book._id,
                currentPage,
                totalPages: book.pages,
            };

            if (progress) {
                // Update existing progress
                await request(
                    `/data/readingProgress/${progress._id}`,
                    'PUT',
                    body,
                    {
                        'X-Authorization': user.accessToken,
                    },
                );
            } else {
                // Create new progress
                await request('/data/readingProgress', 'POST', body, {
                    'X-Authorization': user.accessToken,
                });
            }

            await refetchProgress();
            closeModal();
        } catch (error) {
            console.error('Error updating progress:', error);
            alert('Failed to update progress. Please try again.');
        } finally {
            setIsUpdating(false);
        }
    };

    const currentPage = progress?.currentPage || 0;
    const totalPages = book.pages || 0;
    const progressPercent =
        totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;

    return (
        <>
            <article className="flex gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <Link
                    to={`/catalog/${book._id}/details`}
                    className="w-16 h-24 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0"
                >
                    {book.coverUrl ? (
                        <img
                            src={book.coverUrl}
                            alt={book.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-[11px] text-slate-400">
                            No cover
                        </div>
                    )}
                </Link>

                <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <Link to={`/catalog/${book._id}/details`}>
                                <h3 className="text-sm font-semibold text-slate-100 line-clamp-2 group-hover:text-emerald-300">
                                    {book.title}
                                    {book.series && (
                                        <span className="text-sm text-slate-400 font-normal ml-2">
                                            ({book.series}
                                            {book.numberInSeries
                                                ? `, #${book.numberInSeries}`
                                                : ''}
                                            )
                                        </span>
                                    )}
                                </h3>
                            </Link>
                            <p className="text-xs text-slate-400">
                                {book.author}
                            </p>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                            {progressPercent}% read
                        </span>
                    </div>

                    {book.description && (
                        <p className="text-xs text-slate-300 line-clamp-2">
                            {book.description}
                        </p>
                    )}

                    <div className="space-y-1 pt-1">
                        <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-emerald-500"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={openModal}
                                className="text-emerald-400 hover:text-emerald-300 font-medium"
                            >
                                Update progress
                            </button>
                        </div>
                    </div>
                </div>
            </article>

            {/* Update Progress Modal */}
            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    onClick={closeModal}
                >
                    <div
                        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold text-slate-50 mb-2">
                            Update Reading Progress
                        </h3>
                        <p className="text-sm text-slate-400 mb-4">
                            {book.title}
                        </p>

                        <form onSubmit={updateProgressHandler}>
                            <div className="mb-4">
                                <label
                                    htmlFor="pageInput"
                                    className="block text-sm font-medium text-slate-300 mb-2"
                                >
                                    Current page
                                </label>
                                <input
                                    id="pageInput"
                                    type="number"
                                    min="0"
                                    max={book.pages}
                                    value={pageInput}
                                    onChange={(e) =>
                                        setPageInput(e.target.value)
                                    }
                                    placeholder="Enter page number"
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    autoFocus
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Total pages: {book.pages}
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={isUpdating}
                                    className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg font-medium transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                                >
                                    {isUpdating ? 'Updating...' : 'Update'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
