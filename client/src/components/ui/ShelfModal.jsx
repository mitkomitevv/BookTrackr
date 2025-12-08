import { createPortal } from 'react-dom';

export default function ShelfModal({
    isOpen,
    onClose,
    bookTitle,
    bookId,
    shelves,
    onToggleShelf,
    onRemoveFromAll,
}) {
    if (!isOpen || !shelves) return null;

    const bookShelves = [];
    const shelfMap = {
        currentlyReading: 'Currently Reading',
        'to-read': 'To Read',
        read: 'Read',
        favoriteBooks: 'Favorites',
        dnf: 'Did Not Finish',
    };

    Object.entries(shelfMap).forEach(([key, label]) => {
        if (shelves[key]?.includes(bookId)) {
            bookShelves.push(label);
        }
    });

    const modalContent = (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
            }}
        >
            <div
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-semibold text-slate-50 mb-2">
                    {bookShelves.length > 0 ? 'Manage Shelves' : 'Add to Shelf'}
                </h3>
                <p className="text-sm text-slate-400 mb-6">{bookTitle}</p>

                <div className="space-y-3">
                    <ShelfButton
                        label="Currently Reading"
                        shelfKey="currentlyReading"
                        bookId={bookId}
                        shelves={shelves}
                        onToggle={onToggleShelf}
                    />
                    <ShelfButton
                        label="To Read"
                        shelfKey="to-read"
                        bookId={bookId}
                        shelves={shelves}
                        onToggle={onToggleShelf}
                    />
                    <ShelfButton
                        label="Read"
                        shelfKey="read"
                        bookId={bookId}
                        shelves={shelves}
                        onToggle={onToggleShelf}
                    />
                    <ShelfButton
                        label="Favorites"
                        shelfKey="favoriteBooks"
                        bookId={bookId}
                        shelves={shelves}
                        onToggle={onToggleShelf}
                    />
                    <ShelfButton
                        label="Did Not Finish"
                        shelfKey="dnf"
                        bookId={bookId}
                        shelves={shelves}
                        onToggle={onToggleShelf}
                    />
                </div>

                {bookShelves.length > 0 && (
                    <button
                        onClick={onRemoveFromAll}
                        className="mt-4 w-full px-4 py-2 bg-red-600/20 border-2 border-red-600 text-red-400 rounded-xl font-medium transition-colors hover:bg-red-600/30"
                    >
                        Remove from all shelves
                    </button>
                )}

                <button
                    onClick={onClose}
                    className="mt-4 w-full px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl font-medium transition-colors"
                >
                    Done
                </button>
            </div>
        </div>
    );

    // Render via portal so the overlay is not clipped by transformed/overflow parents
    return typeof document !== 'undefined'
        ? createPortal(modalContent, document.body)
        : modalContent;
}

function ShelfButton({ label, shelfKey, bookId, shelves, onToggle }) {
    const isInShelf = shelves[shelfKey]?.includes(bookId);

    return (
        <button
            onClick={() => onToggle(shelfKey)}
            className={`w-full px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                isInShelf
                    ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-300 hover:bg-emerald-500/30'
                    : 'bg-slate-800 border-2 border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-slate-750'
            }`}
        >
            <div className="flex items-center justify-between">
                <span>{label}</span>
                {isInShelf && (
                    <span className="text-xs opacity-75">✓ Added</span>
                )}
            </div>
        </button>
    );
}
