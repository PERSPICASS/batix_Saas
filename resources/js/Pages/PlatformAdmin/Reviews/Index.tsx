import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { Star, Check, X, Trash2, MessageSquareHeart, ThumbsUp } from 'lucide-react';
import { useState } from 'react';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';
import PaginationLinks from '@/Components/PaginationLinks';
import { useLocale } from '@/contexts/LocaleContext';
import { fmtDate } from '@/utils/platformFormat';

interface Review {
    id: number;
    author_name: string;
    author_company: string | null;
    rating: number;
    comment: string;
    would_recommend: boolean;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string | null;
}

interface Props {
    reviews: {
        data: Review[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    counts: { pending: number; approved: number; total: number };
}

const STATUS_STYLES: Record<Review['status'], string> = {
    pending: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30',
    approved: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30',
    rejected: 'bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/30',
};

function Stars({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} className={`size-4 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
            ))}
        </div>
    );
}

export default function ReviewsIndex({ reviews, counts }: Props) {
    const { t, locale } = useLocale();
    const tr = t.platformAdmin.reviews;
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
    // Rejeter un avis déjà publié le retire du site : on confirme d'abord.
    const [confirmUnpublish, setConfirmUnpublish] = useState<Review | null>(null);
    const [processing, setProcessing] = useState(false);

    const options = (onDone?: () => void) => ({
        preserveScroll: true,
        onStart: () => setProcessing(true),
        onFinish: () => {
            setProcessing(false);
            onDone?.();
        },
    });

    const approve = (id: number) => router.post(route('platform.reviews.approve', id), {}, options());
    const reject = (id: number) => router.post(route('platform.reviews.reject', id), {}, options(() => setConfirmUnpublish(null)));
    const destroy = (id: number) => router.delete(route('platform.reviews.destroy', id), options(() => setConfirmDelete(null)));

    return (
        <AuthenticatedLayout>
            <Head title={tr.title} />

            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <MessageSquareHeart className="size-7 text-amber-400" />
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{tr.title}</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {tr.summary(counts.pending, counts.approved, counts.total)}
                        </p>
                    </div>
                </div>

                {reviews.data.length === 0 ? (
                    <p className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400">
                        {tr.empty}
                    </p>
                ) : (
                    <div className="space-y-4">
                        {reviews.data.map((r) => (
                            <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <p className="font-semibold text-slate-900 dark:text-white">{r.author_name}</p>
                                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status]}`}>
                                                {tr.status[r.status]}
                                            </span>
                                        </div>
                                        {r.author_company && (
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{r.author_company}</p>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <Stars rating={r.rating} />
                                        {r.would_recommend && (
                                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                                                <ThumbsUp className="size-3" /> {tr.recommends}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <p className="mt-3 whitespace-pre-line text-sm text-slate-700 dark:text-slate-200">{r.comment}</p>

                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                    {r.status !== 'approved' && (
                                        <button
                                            onClick={() => approve(r.id)}
                                            disabled={processing}
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
                                        >
                                            <Check className="size-4" /> {tr.approve}
                                        </button>
                                    )}
                                    {r.status !== 'rejected' && (
                                        <button
                                            onClick={() => (r.status === 'approved' ? setConfirmUnpublish(r) : reject(r.id))}
                                            disabled={processing}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/5"
                                        >
                                            <X className="size-4" /> {r.status === 'approved' ? tr.unpublish : tr.reject}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setConfirmDelete(r.id)}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
                                    >
                                        <Trash2 className="size-4" /> {tr.delete}
                                    </button>
                                    {r.created_at && (
                                        <span className="ml-auto text-xs text-slate-400">{fmtDate(r.created_at, locale)}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <PaginationLinks links={reviews.links} />
            </div>

            <ConfirmDeleteModal
                show={confirmDelete !== null}
                onClose={() => setConfirmDelete(null)}
                onConfirm={() => confirmDelete !== null && destroy(confirmDelete)}
                title={tr.deleteTitle}
                message={tr.deleteMessage}
                processing={processing}
            />

            <ConfirmDeleteModal
                show={confirmUnpublish !== null}
                onClose={() => setConfirmUnpublish(null)}
                onConfirm={() => confirmUnpublish && reject(confirmUnpublish.id)}
                title={tr.unpublishTitle}
                message={confirmUnpublish ? tr.unpublishMessage(confirmUnpublish.author_name) : ''}
                confirmText={tr.unpublish}
                processingText={tr.unpublish}
                processing={processing}
            />
        </AuthenticatedLayout>
    );
}
