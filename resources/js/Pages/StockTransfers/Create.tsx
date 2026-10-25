import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Plus, Search, Trash2, Truck } from 'lucide-react';
import { useRoute } from '@/utils/route';
import { useLocale } from '@/contexts/LocaleContext';

interface Props {
    shopChoices: { id: number; name: string }[];
    // Seulement les résultats d'une recherche (20 au plus), jamais tout le catalogue.
    products: { id: number; name: string; sku: string | null; stock_quantity: number }[];
    filters: { from_shop_id: number; q?: string };
}

interface Line { product_id: number; name: string; quantity: number; max: number }

const field = 'mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200';

export default function CreateStockTransfer({ shopChoices: shops, products, filters }: Props) {
    const route = useRoute();
    const { t } = useLocale();
    const s = t.stockTransfers;
    const m = s.manual;

    const [toShopId, setToShopId] = useState<number | ''>('');
    const [search, setSearch] = useState(filters.q ?? '');
    const [quantities, setQuantities] = useState<Record<number, number>>({});
    const [lines, setLines] = useState<Line[]>([]);
    const [notes, setNotes] = useState('');

    // Changer de boutique d'origine change tout le catalogue : on repart de zéro.
    const changeFrom = (id: number) => router.get(route('stock-transfers.create'), { from_shop_id: id });

    // Recherche à la saisie (dès 2 lettres, 300 ms après la dernière touche). Elle ne recharge
    // que les résultats : les lignes déjà ajoutées restent. Garde-fou de premier rendu : un
    // remontage ne doit pas relancer une recherche.
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const q = search.trim();
        const timer = setTimeout(() => {
            router.get(route('stock-transfers.create'), { from_shop_id: filters.from_shop_id, q: q.length >= 2 ? q : '' }, {
                only: ['products', 'filters'], preserveState: true, preserveScroll: true, replace: true,
            });
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const submitSearch = (e: FormEvent) => e.preventDefault();

    const add = (product: Props['products'][number]) => {
        const quantity = Math.max(1, Math.min(product.stock_quantity, quantities[product.id] ?? 1));
        setLines((current) => [...current.filter((l) => l.product_id !== product.id), { product_id: product.id, name: product.name, quantity, max: product.stock_quantity }]);
    };

    const send = () => {
        if (!toShopId || lines.length === 0) return;
        router.post(route('stock-transfers.store'), {
            transfers: [{ from_shop_id: filters.from_shop_id, to_shop_id: toShopId, notes, items: lines.map((l) => ({ product_id: l.product_id, quantity: l.quantity })) }],
        });
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-slate-900 dark:text-white">{m.title}</h1>}>
            <Head title={m.title} />

            <div className="mx-auto max-w-3xl space-y-5">
                <Link href={route('stock-transfers.index')} className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                    <ArrowLeft className="size-4" /> {s.back}
                </Link>

                {/* 1. D'où vers où */}
                <section className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 sm:grid-cols-2 dark:border-white/10 dark:bg-white/5">
                    <label className="text-sm text-slate-700 dark:text-slate-200">
                        {m.from}
                        <select value={filters.from_shop_id} onChange={(e) => changeFrom(Number(e.target.value))} className={field}>
                            {shops.map((shop) => <option key={shop.id} value={shop.id}>{shop.name}</option>)}
                        </select>
                    </label>
                    <label className="text-sm text-slate-700 dark:text-slate-200">
                        {m.to}
                        <select value={toShopId} onChange={(e) => setToShopId(e.target.value ? Number(e.target.value) : '')} className={field}>
                            <option value="">{m.chooseShop}</option>
                            {shops.filter((shop) => shop.id !== filters.from_shop_id).map((shop) => <option key={shop.id} value={shop.id}>{shop.name}</option>)}
                        </select>
                    </label>
                </section>

                {/* 2. Quels produits */}
                <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
                    <form onSubmit={submitSearch} className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={m.searchProduct}
                            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200" />
                    </form>

                    {!filters.q ? (
                        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{m.typeToSearch}</p>
                    ) : products.length === 0 ? (
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{m.noResult}</p>
                    ) : (
                        <ul className="mt-3 divide-y divide-gray-100 dark:divide-white/5">
                            {products.map((product) => (
                                <li key={product.id} className="flex flex-wrap items-center justify-between gap-3 py-2">
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm text-slate-900 dark:text-white">{product.name}</span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">{product.sku ? `${product.sku} · ` : ''}{m.inStock(product.stock_quantity)}</span>
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <input type="number" min={1} max={product.stock_quantity} value={quantities[product.id] ?? 1}
                                            onChange={(e) => setQuantities((c) => ({ ...c, [product.id]: Number(e.target.value) || 1 }))}
                                            aria-label={m.quantity}
                                            className="w-20 rounded-lg border border-gray-300 bg-white px-2 py-1 text-right text-sm text-slate-900 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200" />
                                        <button type="button" onClick={() => add(product)}
                                            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10">
                                            <Plus className="size-4" /> {m.add}
                                        </button>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {/* 3. Ce qui part */}
                {lines.length > 0 && (
                    <section className="space-y-4 rounded-2xl border border-amber-300/40 bg-white p-5 dark:bg-white/5">
                        <ul className="divide-y divide-gray-100 dark:divide-white/5">
                            {lines.map((line) => (
                                <li key={line.product_id} className="flex items-center justify-between gap-3 py-2 text-sm">
                                    <span className="truncate text-slate-800 dark:text-slate-200">{line.name}</span>
                                    <span className="flex shrink-0 items-center gap-3">
                                        <span className="font-semibold text-slate-900 dark:text-white">× {line.quantity}</span>
                                        <button type="button" onClick={() => setLines((c) => c.filter((l) => l.product_id !== line.product_id))}
                                            className="text-slate-400 hover:text-rose-500" title={m.remove}>
                                            <Trash2 className="size-4" />
                                        </button>
                                    </span>
                                </li>
                            ))}
                        </ul>
                        <label className="block text-sm text-slate-700 dark:text-slate-200">
                            {m.notes}
                            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={field} />
                        </label>
                        <button type="button" onClick={send} disabled={!toShopId}
                            className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50">
                            <Truck className="size-4" /> {m.send}
                        </button>
                        {!toShopId && <p className="text-xs text-slate-500 dark:text-slate-400">{m.chooseShop}</p>}
                    </section>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
