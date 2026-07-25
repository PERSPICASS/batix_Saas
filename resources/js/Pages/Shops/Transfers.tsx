import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useRoute } from '@/utils/route';
import { useLocale } from '@/contexts/LocaleContext';

interface TransferItem {
    id: number;
    product_name: string;
}

interface Transfer {
    id: number;
    reference: string;
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
                                            </div>
                                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                                {outgoing ? t.shops.transfer.copiedTo : t.shops.transfer.copiedFrom}{' '}
                                                <span className="font-medium">
                                                    {outgoing ? transfer.to_shop?.name : transfer.from_shop?.name}
                                                </span>
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {new Date(transfer.created_at).toLocaleString(locale === 'en' ? 'en-GB' : 'fr-FR')}
                                                {transfer.user && ` · ${t.shops.transfer.by} ${transfer.user.name}`}
                                            </p>
                                        </div>

                                    </div>

                                    <ul className="mt-3 divide-y divide-gray-200 border-t border-gray-200 pt-2 text-sm dark:divide-white/10 dark:border-white/10">
                                        {transfer.items.map((item) => (
                                            <li key={item.id} className="py-1.5 text-slate-700 dark:text-slate-300">
                                                {item.product_name}
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
        </AuthenticatedLayout>
    );
}
