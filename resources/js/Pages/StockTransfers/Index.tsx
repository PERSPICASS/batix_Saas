import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowRight, PackageCheck, Plus, Scale, Truck, X } from 'lucide-react';
import { useRoute } from '@/utils/route';
import { useLocale } from '@/contexts/LocaleContext';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';
import PaginationLinks from '@/Components/PaginationLinks';

interface Transfer {
    id: number;
    reference: string;
    status: 'in_transit' | 'received' | 'cancelled';
    notes: string | null;
    sent_at: string | null;
    received_at: string | null;
    from_shop: { name: string } | null;
    to_shop: { name: string } | null;
    // nullable : compte supprimé depuis.
    user: { name: string } | null;
    receiver: { name: string } | null;
    items: { id: number; product_name: string; quantity: number }[];
    can_receive: boolean;
    can_cancel: boolean;
}

interface Props {
    transfers: { data: Transfer[]; links: { url: string | null; label: string; active: boolean }[] };
    canSend: boolean;
    // null : pas le propriétaire du compte (le rééquilibrage voit toutes les boutiques).
    rebalanceCount: number | null;
    inTransitCount: number;
    filters: { status: string };
}

const STATUSES = ['in_transit', 'received', 'cancelled'] as const;

/**
 * L'accueil des transferts de stock : deux actions, puis la liste. Le détail des suggestions
 * et la recherche de produits ont leur propre écran (Rebalance, Create).
 */
export default function StockTransfersIndex({ transfers, canSend, rebalanceCount, inTransitCount, filters }: Props) {
    const route = useRoute();
    const { t, locale } = useLocale();
    const s = t.stockTransfers;
    const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB') : '');

    const [cancelling, setCancelling] = useState<Transfer | null>(null);
    const receive = (transfer: Transfer) => router.post(route('stock-transfers.receive', { stockTransfer: transfer.id }), {}, { preserveScroll: true });
    const confirmCancel = () => {
        if (!cancelling) return;
        router.post(route('stock-transfers.cancel', { stockTransfer: cancelling.id }), {}, { preserveScroll: true, onFinish: () => setCancelling(null) });
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-slate-900 dark:text-white">{s.title}</h1>}>
            <Head title={s.title} />

            <div className="space-y-6">
                <p className="text-sm text-slate-600 dark:text-slate-300">{s.intro}</p>

                {inTransitCount > 0 && filters.status !== 'in_transit' && (
                    <p className="rounded-xl border border-amber-300/40 bg-amber-300/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-200">
                        {s.home.incoming(inTransitCount)}
                    </p>
                )}

                {canSend && (
                    <div className="grid gap-4 md:grid-cols-2">
                        {rebalanceCount !== null && (
                            <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
                                <Scale className="size-6 text-amber-500" />
                                <h2 className="mt-3 font-semibold text-slate-900 dark:text-white">{s.home.rebalance}</h2>
                                <p className="mt-1 flex-1 text-sm text-slate-600 dark:text-slate-300">
                                    {rebalanceCount > 0 ? s.home.rebalanceCount(rebalanceCount) : s.home.rebalanceNone}
                                </p>
                                {rebalanceCount > 0 && (
                                    <Link href={route('stock-transfers.rebalance')}
                                        className="mt-4 inline-flex w-fit items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200">
                                        {s.home.rebalanceAction} <ArrowRight className="size-4" />
                                    </Link>
                                )}
                            </div>
                        )}
                        <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
                            <Truck className="size-6 text-amber-500" />
                            <h2 className="mt-3 font-semibold text-slate-900 dark:text-white">{s.home.create}</h2>
                            <p className="mt-1 flex-1 text-sm text-slate-600 dark:text-slate-300">{s.home.createHint}</p>
                            <Link href={route('stock-transfers.create')}
                                className="mt-4 inline-flex w-fit items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10">
                                <Plus className="size-4" /> {s.home.createAction}
                            </Link>
                        </div>
                    </div>
                )}

                <section className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="mr-2 text-base font-semibold text-slate-900 dark:text-white">{s.home.transfers}</h2>
                        {STATUSES.map((status) => (
                            <Link key={status} href={route('stock-transfers.index')} data={{ status }} preserveScroll
                                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${filters.status === status
                                    ? 'bg-amber-300 text-slate-950'
                                    : 'border border-gray-300 text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10'}`}>
                                {s.list.statuses[status]}
                            </Link>
                        ))}
                    </div>

                    {transfers.data.length === 0 ? (
                        <p className="rounded-2xl border border-dashed border-gray-300 p-6 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">{s.list.empty}</p>
                    ) : (
                        transfers.data.map((transfer) => (
                            <article key={transfer.id} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-900 dark:text-white">
                                            {transfer.reference}
                                            <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                                                transfer.status === 'in_transit' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                                                    : transfer.status === 'received' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                                        : 'bg-slate-500/15 text-slate-500'}`}>
                                                {s.list.badge[transfer.status]}
                                            </span>
                                        </p>
                                        <p className="mt-1 flex flex-wrap items-center gap-1 text-sm text-slate-700 dark:text-slate-200">
                                            {transfer.from_shop?.name ?? s.list.unknown} <ArrowRight className="size-3.5" /> {transfer.to_shop?.name ?? s.list.unknown}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {s.list.sentBy(date(transfer.sent_at), transfer.user?.name ?? s.list.unknown)}
                                            {transfer.received_at && ` · ${s.list.receivedBy(date(transfer.received_at), transfer.receiver?.name ?? s.list.unknown)}`}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {/* La boutique qui envoie attend : c'est la boutique de destination qui réceptionne. */}
                                        {transfer.status === 'in_transit' && !transfer.can_receive && (
                                            <span className="text-xs text-slate-500 dark:text-slate-400">{s.list.awaiting(transfer.to_shop?.name ?? s.list.unknown)}</span>
                                        )}
                                        {transfer.can_receive && (
                                            <button type="button" onClick={() => receive(transfer)}
                                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500">
                                                <PackageCheck className="size-4" /> {s.list.receive}
                                            </button>
                                        )}
                                        {transfer.can_cancel && (
                                            <button type="button" onClick={() => setCancelling(transfer)}
                                                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10">
                                                <X className="size-4" /> {s.list.cancel}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <ul className="mt-3 flex flex-wrap gap-2 text-xs">
                                    {transfer.items.slice(0, 8).map((item) => (
                                        <li key={item.id} className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700 dark:bg-white/10 dark:text-slate-200">
                                            {item.product_name} × {item.quantity}
                                        </li>
                                    ))}
                                    {transfer.items.length > 8 && (
                                        <li className="px-1 py-1 text-slate-500 dark:text-slate-400">+{transfer.items.length - 8}</li>
                                    )}
                                </ul>
                                {transfer.notes && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{transfer.notes}</p>}
                            </article>
                        ))
                    )}

                    <PaginationLinks links={transfers.links} />
                </section>
            </div>

            <ConfirmDeleteModal
                show={cancelling !== null}
                onClose={() => setCancelling(null)}
                onConfirm={confirmCancel}
                title={s.list.cancelTitle}
                message={s.list.confirmCancel}
                confirmText={s.list.cancel}
                cancelText={s.list.keep}
                processing={false}
            />
        </AuthenticatedLayout>
    );
}
