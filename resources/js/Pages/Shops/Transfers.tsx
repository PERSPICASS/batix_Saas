import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Ban } from 'lucide-react';
import { useState } from 'react';
import { useRoute } from '@/utils/route';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';
import { useLocale } from '@/contexts/LocaleContext';

interface TransferItem {
    id: number;
    product_name: string;
    quantity: number;
}

interface Transfer {
    id: number;
    reference: string;
    status: string;
    notes: string | null;
    created_at: string;
    from_shop: { id: number; name: string } | null;
    to_shop: { id: number; name: string } | null;
    user: { id: number; name: string } | null;
    items: TransferItem[];
}

interface Props {
    shop: { id: number; name: string };
    transfers: {
        data: Transfer[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
}

export default function ShopTransfers({ shop, transfers }: Props) {
    const route = useRoute();
    const { t, locale } = useLocale();
    const [toCancel, setToCancel] = useState<Transfer | null>(null);
    const [cancelling, setCancelling] = useState(false);

    const confirmCancel = () => {
        if (!toCancel) return;

        setCancelling(true);
        router.post(route('shops.transfer.cancel', { shopTransfer: toCancel.id }), {}, {
            onFinish: () => { setCancelling(false); setToCancel(null); },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                    {t.shops.transfer.history} — {shop.name}
                </h1>
            }
        >
            <Head title={t.shops.transfer.history} />

            <div className="space-y-4">
                <Link
                    href={route('shops.show', { shop: shop.id })}
                    className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                >
                    <ArrowLeft className="size-4" /> {t.common.actions.back}
                </Link>

                {transfers.data.length === 0 ? (
                    <p className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                        {t.shops.transfer.noTransfers}
                    </p>
                ) : (
                    <div className="space-y-3">
                        {transfers.data.map((transfer) => {
                            // Le sens se lit depuis la boutique consultée : le même document
                            // est une sortie pour l'une et une entrée pour l'autre.
                            const outgoing = transfer.from_shop?.id === shop.id;

                            return (
                                <div
                                    key={transfer.id}
                                    className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                {outgoing ? (
                                                    <ArrowUpRight className="size-4 text-red-500" />
                                                ) : (
                                                    <ArrowDownLeft className="size-4 text-emerald-500" />
                                                )}
                                                <span className="font-semibold text-slate-900 dark:text-white">
                                                    {transfer.reference}
                                                </span>
                                                {transfer.status === 'cancelled' && (
                                                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-white/10 dark:text-slate-300">
                                                        {t.shops.transfer.cancelled}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                                {outgoing ? t.shops.transfer.sentTo : t.shops.transfer.receivedFrom}{' '}
                                                <span className="font-medium">
                                                    {outgoing ? transfer.to_shop?.name : transfer.from_shop?.name}
                                                </span>
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {new Date(transfer.created_at).toLocaleString(locale === 'en' ? 'en-GB' : 'fr-FR')}
                                                {transfer.user && ` · ${t.shops.transfer.by} ${transfer.user.name}`}
                                            </p>
                                        </div>

                                        {/* Seule la boutique d'origine peut annuler : c'est elle
                                            qui a envoyé, et la marchandise lui revient. */}
                                        {outgoing && transfer.status !== 'cancelled' && (
                                            <button
                                                type="button"
                                                onClick={() => setToCancel(transfer)}
                                                className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/10"
                                            >
                                                <Ban className="size-3.5" /> {t.shops.transfer.cancel}
                                            </button>
                                        )}
                                    </div>

                                    <ul className="mt-3 divide-y divide-gray-200 border-t border-gray-200 pt-2 text-sm dark:divide-white/10 dark:border-white/10">
                                        {transfer.items.map((item) => (
                                            <li key={item.id} className="flex justify-between py-1.5">
                                                <span className="text-slate-700 dark:text-slate-300">{item.product_name}</span>
                                                <span className="font-medium text-slate-900 dark:text-slate-200">
                                                    {item.quantity}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                    {transfer.notes && (
                                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{transfer.notes}</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {transfers.links && (
                    <div className="flex items-center justify-center gap-1">
                        {transfers.links.map((link, index) => (
                            <Link
                                key={index}
                                href={link.url || '#'}
                                className={`rounded-lg px-3 py-2 text-sm ${
                                    link.active
                                        ? 'bg-amber-300 font-semibold text-slate-950'
                                        : 'border border-white/15 text-slate-200 hover:bg-white/10'
                                } ${!link.url ? 'cursor-not-allowed opacity-50' : ''}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {toCancel && (
                <ConfirmDeleteModal
                    show
                    onClose={() => setToCancel(null)}
                    onConfirm={confirmCancel}
                    processing={cancelling}
                    title={t.shops.transfer.cancel}
                    message={t.shops.transfer.cancelConfirm.replace(':reference', toCancel.reference)}
                    confirmText={t.shops.transfer.cancel}
                />
            )}
        </AuthenticatedLayout>
    );
}
