import { useState, useEffect, useContext, useMemo } from 'react';
import UserContext from '../../contexts/UserContext';
import { useRequest, useFetch } from '../../hooks/useRequest';
import Pagination from '../ui/Pagination';
import Search from '../search/Search';
import ReviewModal from '../ui/ReviewModal';
import { Fragment } from 'react';

export default function AdminPanel() {
    const { user } = useContext(UserContext);
    const { request } = useRequest();

    const [page, setPage] = useState(1);
    const PAGE_SIZE = 30;
    const [total, setTotal] = useState(null);

    const offset = (page - 1) * PAGE_SIZE;
    const path = `/data/books?offset=${offset}&pageSize=${PAGE_SIZE}`;
    const {
        data: booksData,
        loading: booksLoading,
        error: booksError,
    } = useFetch(path);

    const { data: settings, refetch: refetchSettings } = useFetch(
        '/data/settings/home',
    );

    const [query, setQuery] = useState('');
    const [pickOfTheMonth, setPickOfTheMonth] = useState(null);
    const [staffRecommendations, setStaffRecommendations] = useState(new Set());
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [resolvedPicks, setResolvedPicks] = useState({
        pick: null,
        staff: [],
    });

    // Review modal state
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [pendingPickId, setPendingPickId] = useState(null);
    const [pendingReviewText, setPendingReviewText] = useState('');
    const [savingReview, setSavingReview] = useState(false);

    const hasAnyPicks = !!(
        resolvedPicks?.pick ||
        (resolvedPicks?.staff && resolvedPicks.staff.length > 0)
    );

    // initialize from loaded settings
    useEffect(() => {
        if (settings) {
            setPickOfTheMonth(settings.pickOfMonth);

            // Normalize staff recommendations to an array/set of ids (strings)
            const normalized = (settings.staffRecommendations || [])
                .map((p) => String(p))
                .filter(Boolean);
            setStaffRecommendations(new Set(normalized));
        }
    }, [settings]);

    // Ensure the current pick and staff recommendations are always visible in admin
    useEffect(() => {
        let mounted = true;
        const pickId = pickOfTheMonth;
        const staffIds = Array.from(staffRecommendations || []);
        const ids = Array.from(
            new Set([...(pickId ? [pickId] : []), ...staffIds]),
        );

        if (ids.length === 0) {
            setResolvedPicks({ pick: null, staff: [] });
            return;
        }

        (async () => {
            try {
                const inside = ids
                    .map((id) => id.toString().replace(/"/g, '\\"'))
                    .join('","');
                const clause = `_id in ("${inside}")`;
                const res = await request(
                    `/data/books?where=${encodeURIComponent(clause)}`,
                );
                if (!mounted) return;
                const map = new Map(
                    (Array.isArray(res) ? res : []).map((b) => [
                        b._id || b.id,
                        b,
                    ]),
                );
                const pick = pickId ? map.get(pickId) || null : null;
                const staff = staffIds.map((id) => map.get(id)).filter(Boolean);
                setResolvedPicks({ pick, staff });
            } catch {
                if (!mounted) return;
                setResolvedPicks({ pick: null, staff: [] });
            }
        })();

        return () => {
            mounted = false;
        };
    }, [pickOfTheMonth, staffRecommendations, request]);

    // filter books based on query and ensure picks are visible
    const filtered = useMemo(() => {
        const books = booksData ?? [];
        const q = query.trim().toLowerCase();

        // apply query filter if present
        const list = q
            ? books.filter(
                  (b) =>
                      (b.title || '').toLowerCase().includes(q) ||
                      (b.author || '').toLowerCase().includes(q),
              )
            : books.slice();

        const ordered = [];
        const added = new Set();

        // Prepend resolved pick (from resolvedPicks) if present
        const pick = resolvedPicks?.pick;
        if (pick) {
            ordered.push(pick);
            added.add(pick._id || pick.id);
        }

        // Prepend resolved staff picks in order
        const staffList = resolvedPicks?.staff || [];
        for (const b of staffList) {
            const id = b._id || b.id;
            if (!id || added.has(id)) continue;
            ordered.push(b);
            added.add(id);
        }

        // Append the current page (or filtered) books, skipping duplicates
        for (const b of list) {
            const id = b._id || b.id;
            if (!added.has(id)) ordered.push(b);
        }

        return ordered;
    }, [booksData, query, resolvedPicks]);

    const highlightIds = useMemo(() => {
        const ids = new Set();
        if (pickOfTheMonth) {
            ids.add(pickOfTheMonth);
        }
        for (const id of staffRecommendations) {
            ids.add(id);
        }
        return ids;
    }, [pickOfTheMonth, staffRecommendations]);

    const highlightCount = useMemo(() => {
        let count = 0;
        for (const b of filtered) {
            const id = b._id || b.id;
            if (id && highlightIds.has(id)) {
                count++;
            } else {
                break;
            }
        }
        return count;
    }, [filtered, highlightIds]);

    // fetch total count for pagination
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const all = await request('/data/books');
                if (!mounted) return;
                if (Array.isArray(all)) {
                    setTotal(all.length);
                } else if (
                    all &&
                    typeof all === 'object' &&
                    Array.isArray(all.data)
                ) {
                    setTotal(all.data.length);
                } else setTotal(null);
            } catch {
                if (!mounted) return;
                setTotal(null);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [request]);

    const toggleStaff = (id) => {
        setStaffRecommendations((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const saveSettings = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const payload = {
                pickOfMonth: pickOfTheMonth,
                staffRecommendations: Array.from(staffRecommendations),
            };

            await request(
                '/data/settings/home',
                'PATCH',
                payload,
                user?.accessToken
                    ? { 'X-Authorization': user.accessToken }
                    : {},
            );

            setMessage({ type: 'success', text: 'Home settings saved.' });
            refetchSettings?.();
        } catch (err) {
            setMessage({
                type: 'error',
                text: err?.payload?.message || err.message || 'Failed to save.',
            });
        } finally {
            setSaving(false);
        }
    };

    const saveReviewHandler = async (text) => {
        setSavingReview(true);
        setMessage(null);
        try {
            const payload = {
                pickOfMonth: pendingPickId,
                pickOfMonthReview: text,
                staffRecommendations: Array.from(staffRecommendations),
            };
            await request(
                '/data/settings/home',
                'PATCH',
                payload,
                user?.accessToken
                    ? { 'X-Authorization': user.accessToken }
                    : {},
            );
            setPickOfTheMonth(pendingPickId);
            setShowReviewModal(false);
            setPendingPickId(null);
            setPendingReviewText('');
            setMessage({ type: 'success', text: 'Pick and review saved.' });
            refetchSettings?.();
        } catch (err) {
            setMessage({
                type: 'error',
                text:
                    err?.payload?.message ||
                    err.message ||
                    'Failed to save review.',
            });
        } finally {
            setSavingReview(false);
        }
    };

    return (
        <main className="flex-1">
            <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
                <header className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-semibold text-slate-50">
                        Admin panel
                    </h1>
                    <p className="text-sm text-slate-400">
                        Manage home page picks and staff recommendations.
                    </p>
                </header>

                <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 shadow-lg space-y-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wide">
                                Pick of the Month
                            </h2>
                            <p className="text-xs text-slate-400">
                                Select a single book to highlight on the home
                                page and however much you want for staff
                                recommendations.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {/* Always-visible picks preview */}
                        {hasAnyPicks && (
                            <div className="space-y-2 pb-4 mb-4 border-b border-slate-800">
                                {resolvedPicks.pick && (
                                    <div>
                                        <div className="text-sm font-medium text-emerald-300">
                                            Pick of the Month
                                        </div>
                                        <div className="rounded-2xl border border-emerald-500 bg-slate-900/60 p-3">
                                            <div className="font-medium text-slate-50 truncate">
                                                {resolvedPicks.pick.title}
                                            </div>
                                            <div className="text-xs text-slate-400 truncate">
                                                by {resolvedPicks.pick.author}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {resolvedPicks.staff &&
                                    resolvedPicks.staff.length > 0 && (
                                        <div>
                                            <div className="text-sm font-medium text-emerald-300">
                                                Staff recommendations
                                            </div>
                                            <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-6 mt-2">
                                                {resolvedPicks.staff.map(
                                                    (b) => (
                                                        <div
                                                            key={b._id || b.id}
                                                            className="rounded-2xl border border-emerald-500 bg-slate-900/60 p-3 text-sm"
                                                        >
                                                            <div className="font-medium text-slate-50 truncate">
                                                                {b.title}
                                                            </div>
                                                            <div className="text-xs text-slate-400 truncate">
                                                                by {b.author}
                                                            </div>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    )}
                            </div>
                        )}

                        {/* Search input (shared component) */}
                        <Search
                            value={query}
                            onChange={setQuery}
                            placeholder="Filter books by title or author..."
                        />

                        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                            {booksLoading && (
                                <div className="text-sm text-slate-400">
                                    Loading books…
                                </div>
                            )}
                            {booksError && (
                                <div className="text-sm text-red-400">
                                    Failed to load books
                                </div>
                            )}
                            {!booksLoading && filtered.length === 0 && (
                                <div className="text-sm text-slate-400">
                                    No books found.
                                </div>
                            )}

                            {filtered.map((b, index) => {
                                const id = b._id || b.id;
                                const isSelected = pickOfTheMonth === b._id;
                                const showDivider =
                                    highlightCount > 0 &&
                                    index === highlightCount;

                                return (
                                    <Fragment key={id}>
                                        {showDivider && (
                                            <div className="col-span-full my-3 border-t border-slate-800" />
                                        )}

                                        <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-slate-50">
                                                    {b.title}
                                                </div>
                                                <div className="text-xs text-slate-400">
                                                    by {b.author}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        if (
                                                            pickOfTheMonth ===
                                                            b._id
                                                        ) {
                                                            setPickOfTheMonth(
                                                                null,
                                                            );
                                                            return;
                                                        }
                                                        // Otherwise open review modal before saving the pick
                                                        setPendingPickId(b._id);
                                                        const existingReview =
                                                            settings?.pickOfMonthReview ||
                                                            '';
                                                        setPendingReviewText(
                                                            existingReview,
                                                        );
                                                        setShowReviewModal(
                                                            true,
                                                        );
                                                    }}
                                                    className={`px-3 py-1 rounded-xl text-xs font-semibold ${
                                                        isSelected
                                                            ? 'bg-emerald-500 text-slate-950'
                                                            : 'border border-slate-700 text-slate-300 hover:border-emerald-500 hover:text-emerald-300'
                                                    }`}
                                                >
                                                    Pick of the month
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        toggleStaff(b._id)
                                                    }
                                                    className={`px-2 py-0.5 rounded-xl text-[11px] ${
                                                        staffRecommendations.has(
                                                            b._id,
                                                        )
                                                            ? 'bg-emerald-500 text-slate-950'
                                                            : 'border border-slate-700 text-slate-300 hover:border-emerald-500 hover:text-emerald-300'
                                                    }`}
                                                >
                                                    {staffRecommendations.has(
                                                        b._id,
                                                    )
                                                        ? 'Staff Recommendation ✓'
                                                        : 'Staff Recommendation'}
                                                </button>
                                            </div>
                                        </div>
                                    </Fragment>
                                );
                            })}
                        </div>

                        <div className="pt-4 admin-pager">
                            <Pagination
                                page={page}
                                pageSize={PAGE_SIZE}
                                total={total}
                                onPageChange={(p) => setPage(p)}
                                hidePageSize={true}
                            />
                        </div>

                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => {
                                    setPickOfTheMonth(null);
                                    setStaffRecommendations(new Set());
                                }}
                                className="px-4 py-2 rounded-2xl border border-slate-700 text-sm text-slate-200 hover:border-slate-500 transition"
                            >
                                Reset
                            </button>
                            <button
                                onClick={saveSettings}
                                disabled={saving}
                                className="px-4 py-2 rounded-2xl bg-emerald-500 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transition"
                            >
                                {saving ? 'Saving...' : 'Save to home'}
                            </button>
                        </div>

                        {message && (
                            <div
                                className={`text-sm ${message.type === 'error' ? 'text-red-400' : 'text-emerald-300'}`}
                            >
                                {message.text}
                            </div>
                        )}

                        <ReviewModal
                            visible={showReviewModal}
                            initialText={pendingReviewText}
                            onClose={() => {
                                setShowReviewModal(false);
                                setPendingPickId(null);
                                setPendingReviewText('');
                            }}
                            onSave={saveReviewHandler}
                            saving={savingReview}
                        />
                    </div>
                </section>
            </div>
        </main>
    );
}
