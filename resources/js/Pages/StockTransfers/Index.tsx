import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { ArrowRight, PackageCheck, Plus, Trash2, Truck, X } from 'lucide-react';
import { useRoute } from '@/utils/route';
import { useLocale } from '@/contexts/LocaleContext';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';
import PaginationLinks from '@/Components/PaginationLinks';

interface Shop { id: number; name: string }

interface Suggestion {
    product: string;
    from_shop_id: number;
    from_shop: string;
    from_product_id: number;
    from_stock: number;
    from_min: number;
    to_shop_id: number;
    to_shop: string;
    to_product_id: number;
    to_stock: number;
    to_min: number;
    quantity: number;
}

interface Transfer {
    id: number;
    reference: string;
    status: 'in_transit' | 'received' | 'cancelled';
    notes: string | null;
    sent_at: string | null;
    received_at: string | null;
    from_shop: Shop | null;
    to_shop: Shop | null;
    // nullable : compte supprimé depuis.
    user: { name: string } | null;
    receiver: { name: string } | null;
    items: { id: number; product_name: string; quantity: number }[];
    can_receive: boolean;
    can_cancel: boolean;
}

interface Props {
    transfers: { data: Transfer[]; links: { url: string | null; label: string; active: boolean }[] };
    shops: Shop[];
    suggestions: Suggestion[];
    canSend: boolean;
    sourceProducts: { id: number; name: string; sku: string | null; stock_quantity: number }[];
    filters: { status: string; from_shop_id: number };
}

const STATUSES = ['in_transit', 'received', 'cancelled'] as const;

const field = 'mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200';

export default function StockTransfersIndex({ transfers, shops, suggestions, canSend, sourceProducts, filters }: Props) {
    const route = useRoute();
    const { t, locale } = useLocale();
    const s = t.stockTransfers;
    const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB') : '');

    // --- Suggestions : cochées d'office, quantité modifiable --------------------------
    const [picked, setPicked] = useState<Record<number, { on: boolean; qty: number }>>(
        Object.fromEntries(suggestions.map((sg, i) => [i, { on: true, qty: sg.quantity }])),
    );
    const selectedCount = Object.values(picked).filter((p) => p.on && p.qty > 0).length;

    // Un transfert par couple de boutiques : c'est ce qui part dans le même camion.
    const sendSuggestions = () => {
        const groups: Record<string, { from_shop_id: number; to_shop_id: number; items: { product_id: number; quantity: number }[] }> = {};
        suggestions.forEach((sg, i) => {
            const p = picked[i];
            if (!p?.on || p.qty <= 0) return;
            const key = `${sg.from_shop_id}-${sg.to_shop_id}`;
            groups[key] ??= { from_shop_id: sg.from_shop_id, to_shop_id: sg.to_shop_id, items: [] };
            groups[key].items.push({ product_id: sg.from_product_id, quantity: p.qty });
        });
        router.post(route('stock-transfers.store'), { transfers: Object.values(groups) }, { preserveScroll: true });
    };

    // --- Transfert à la main ------------------------------------------------------------
    const [toShopId, setToShopId] = useState<number | ''>('');
    const [productId, setProductId] = useState<number | ''>('');
    const [qty, setQty] = useState(1);
    const [lines, setLines] = useState<{ product_id: number; name: string; quantity: number; max: number }[]>([]);
    const [notes, setNotes] = useState('');
    const otherShops = useMemo(() => shops.filter((shop) => shop.id !== filters.from_shop_id), [shops, filters.from_shop_id]);

    const changeFrom = (id: number) => router.get(route('stock-transfers.index'), { from_shop_id: id, status: filters.status }, { preserveScroll: true, preserveState: false });

    const addLine = () => {
        const product = sourceProducts.find((p) => p.id === productId);
        if (!product || qty <= 0) return;
        setLines((current) => [
            ...current.filter((l) => l.product_id !== product.id),
            { product_id: product.id, name: product.name, quantity: Math.min(qty, product.stock_quantity), max: product.stock_quantity },
        ]);
        setProductId('');
        setQty(1);
    };

    const sendManual = () => {
        if (!toShopId || lines.length === 0) return;
        router.post(route('stock-transfers.store'), {
            transfers: [{ from_shop_id: filters.from_shop_id, to_shop_id: toShopId, notes, items: lines.map((l) => ({ product_id: l.product_id, quantity: l.quantity })) }],
        }, { preserveScroll: true, onSuccess: () => { setLines([]); setNotes(''); } });
    };

    // --- Actions sur un transfert ---------------------------------------------------------
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

                {suggestions.length > 0 && (
                    <section className="rounded-2xl border border-amber-300/40 bg-white p-5 dark:bg-white/5">
                        <h2 className="text-base font-semibold text-slate-900 dark:text-white">{s.suggestions.title}</h2>
                        <p className="mb-4 mt-1 text-xs text-slate-500 dark:text-slate-400">{s.suggestions.hint}</p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                                        <th className="w-8 pb-2" />
                                        <th className="pb-2">{s.suggestions.product}</th>
                                        <th className="pb-2">{s.suggestions.from}</th>
                                        <th className="pb-2">{s.suggestions.to}</th>
                                        <th className="pb-2 text-right">{s.suggestions.quantity}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {suggestions.map((sg, i) => (
                                        <tr key={i} className="border-t border-gray-100 dark:border-white/5">
                                            <td className="py-2">
                                                <input type="checkbox" checked={picked[i]?.on ?? false}
                                                    onChange={(e) => setPicked((c) => ({ ...c, [i]: { ...c[i], on: e.target.checked } }))}
                                                    className="rounded border-gray-300 text-amber-500 focus:ring-amber-300 dark:border-white/20 dark:bg-slate-900/70" />
                                            </td>
                                            <td className="py-2 pr-3 text-slate-900 dark:text-white">{sg.product}</td>
                                            <td className="py-2 pr-3">
                                                <p className="text-slate-700 dark:text-slate-200">{sg.from_shop}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{s.suggestions.stockOf(sg.from_stock, sg.from_min)}</p>
                                            </td>
                                            <td className="py-2 pr-3">
                                                <p className="text-slate-700 dark:text-slate-200">{sg.to_shop}</p>
                                                <p className="text-xs text-rose-500">{s.suggestions.stockOf(sg.to_stock, sg.to_min)}</p>
                                            </td>
                                            <td className="py-2 text-right">
                                                <input type="number" min={1} max={sg.from_stock} value={picked[i]?.qty ?? sg.quantity}
                                                    onChange={(e) => setPicked((c) => ({ ...c, [i]: { ...c[i], qty: Math.max(0, Math.min(sg.from_stock, Number(e.target.value) || 0)) } }))}
                                                    className="w-20 rounded-lg border border-gray-300 bg-white px-2 py-1 text-right text-sm text-slate-900 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200" />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button type="button" onClick={sendSuggestions} disabled={selectedCount === 0}
                            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50">
                            <Truck className="size-4" /> {s.suggestions.send(selectedCount)}
                        </button>
                    </section>
                )}

                <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
                    <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">{s.manual.title}</h2>
                    {!canSend ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">{s.manual.needTwoShops}</p>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="text-sm text-slate-700 dark:text-slate-200">
                                    {s.manual.from}
                                    <select value={filters.from_shop_id} onChange={(e) => changeFrom(Number(e.target.value))} className={field}>
                                        {shops.map((shop) => <option key={shop.id} value={shop.id}>{shop.name}</option>)}
                                    </select>
                                </label>
                                <label className="text-sm text-slate-700 dark:text-slate-200">
                                    {s.manual.to}
                                    <select value={toShopId} onChange={(e) => setToShopId(e.target.value ? Number(e.target.value) : '')} className={field}>
                                        <option value="">{s.manual.chooseShop}</option>
                                        {otherShops.map((shop) => <option key={shop.id} value={shop.id}>{shop.name}</option>)}
                                    </select>
                                </label>
                            </div>

                            {sourceProducts.length === 0 ? (
                                <p className="text-sm text-slate-500 dark:text-slate-400">{s.manual.noProducts}</p>
                            ) : (
                                <div className="flex flex-wrap items-end gap-3">
                                    <label className="min-w-0 flex-1 text-sm text-slate-700 dark:text-slate-200">
                                        {s.manual.product}
                                        <select value={productId} onChange={(e) => setProductId(e.target.value ? Number(e.target.value) : '')} className={field}>
                                            <option value="">{s.manual.chooseProduct}</option>
                                            {sourceProducts.map((p) => (
                                                <option key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ''} — {s.manual.inStock(p.stock_quantity)}</option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="w-28 text-sm text-slate-700 dark:text-slate-200">
                                        {s.manual.quantity}
                                        <input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value) || 0)} className={field} />
                                    </label>
                                    <button type="button" onClick={addLine} disabled={!productId || qty <= 0}
                                        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-700 hover:bg-gray-100 disabled:opacity-50 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10">
                                        <Plus className="size-4" /> {s.manual.add}
                                    </button>
                                </div>
                            )}

                            {lines.length > 0 && (
                                <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 dark:divide-white/5 dark:border-white/10">
                                    {lines.map((line) => (
                                        <li key={line.product_id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                                            <span className="truncate text-slate-800 dark:text-slate-200">{line.name}</span>
                                            <span className="flex shrink-0 items-center gap-3">
                                                <span className="font-semibold text-slate-900 dark:text-white">× {line.quantity}</span>
                                                <button type="button" onClick={() => setLines((c) => c.filter((l) => l.product_id !== line.product_id))}
                                                    className="text-slate-400 hover:text-rose-500" title={s.manual.remove}>
                                                    <Trash2 className="size-4" />
                                                </button>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <label className="block text-sm text-slate-700 dark:text-slate-200">
                                {s.manual.notes}
                                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={field} />
                            </label>

                            <button type="button" onClick={sendManual} disabled={!toShopId || lines.length === 0}
                                className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50">
                                <Truck className="size-4" /> {s.manual.send}
                            </button>
                        </div>
                    )}
                </section>

                <section className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                        {STATUSES.map((status) => (
                            <Link key={status} href={route('stock-transfers.index')} data={{ status, from_shop_id: filters.from_shop_id }} preserveScroll
                                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${filters.status === status
                                    ? 'bg-amber-300 text-slate-950'
                                    : 'border border-gray-300 text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10'}`}>
                                {s.list.statuses[status]}
                            </Link>
                        ))}
                    </div>

                    {transfers.data.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">{s.list.empty}</p>
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
                                    <div className="flex flex-wrap gap-2">
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
                                    {transfer.items.map((item) => (
                                        <li key={item.id} className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700 dark:bg-white/10 dark:text-slate-200">
                                            {item.product_name} × {item.quantity}
                                        </li>
                                    ))}
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
