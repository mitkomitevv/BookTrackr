export default function ConfirmModal({
    open,
    title = 'Are you sure?',
    message,
    confirmText = 'Delete',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    loading = false,
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
            <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full text-slate-100 shadow-lg">
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                {message && (
                    <p className="text-sm text-slate-300 mb-4">{message}</p>
                )}
                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-3 py-1 rounded-2xl border border-slate-700 text-sm text-slate-200 hover:border-slate-500 transition"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className="px-3 py-1 rounded-2xl bg-red-600 text-sm font-medium text-white hover:bg-red-500 transition disabled:opacity-60"
                    >
                        {loading ? 'Deleting...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
