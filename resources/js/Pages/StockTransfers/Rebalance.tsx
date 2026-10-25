import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Search, Truck } from 'lucide-react';
import { useRoute } from '@/utils/route';
import { useLocale } from '@/contexts/LocaleContext';
import PaginationLinks from '@/Components/PaginationLinks';

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

interface RouteChoice { from_shop_id: number; from_shop: string; to_shop_id: number; to_shop: string; count: number }

interface Props {
    routes: RouteChoice[];
    route: { from: number; to: number };
    suggestions: { data: Suggestion[]; total: number; links: { url: string | null; label: string; active: boolean }[] };
    filters: { q?: string };
}

/**
 * Les suggestions de rééquilibrage, un trajet à la fois et 25 par page. Rien n'est coché
 * d'office : on choisit ce qui part, plutôt que de risquer d'envoyer des centaines de lignes.
 */
export default function Rebalance({ routes, route: current, suggestions, filters }: Props) {
    const route = useRoute();
    const { t } = useLocale();
    const s = t.stockTransfers;

    const [search, setSearch] = useState(filters.q ?? '');
    // Quantité choisie par produit de destination ; absent = non coché.
    const [picked, setPicked] = useState<Record<number, number>>({});
    const selected = suggestions.data.filter((sg) => (picked[sg.to_product_id] ?? 0) > 0);
    const target = routes.find((r) => r.from_shop_id === current.from && r.to_shop_id === current.to);

    // Recherche à la saisie, 300 ms après la dernière touche. Le garde-fou de premier rendu
    // évite qu'un remontage (lien de pagination) relance la recherche et renvoie en page 1.
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const timer = setTimeout(() => {
            router.get(route('stock-transfers.rebalance'), { from: current.from, to: current.to, q: search }, {
                only: ['suggestions', 'filters'], preserveState: true, preserveScroll: true, replace: true,
            });
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const submitSearch = (e: FormEvent) => e.preventDefault();

    const toggle = (sg: Suggestion, on: boolean) => setPicked((c) => {
        const next = { ...c };
        if (on) next[sg.to_product_id] = sg.quantity; else delete next[sg.to_product_id];
        return next;
    });

    const allOnPage = suggestions.data.length > 0 && suggestions.data.every((sg) => picked[sg.to_product_id] !== undefined);
    const toggleAll = (on: boolean) => setPicked((c) => {
        const next = { ...c };
        suggestions.data.forEach((sg) => { if (on) next[sg.to_product_id] = next[sg.to_product_id] ?? sg.quantity; else delete next[sg.to_product_id]; });
        return next;
    });

    const send = () => router.post(route('stock-transfers.store'), {
        transfers: [{
            from_shop_id: current.from,
            to_shop_id: current.to,
            items: selected.map((sg) => ({ product_id: sg.from_product_id, quantity: picked[sg.to_product_id] })),
        }],
    });

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-slate-900 dark:text-white">{s.suggestions.title}</h1>}>
            <Head title={s.suggestions.title} />

            <div className="space-y-5 pb-24">
                <Link href={route('stock-transfers.index')} className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                    <ArrowLeft className="size-4" /> {s.back}
                </Link>

                <p className="text-sm text-slate-600 dark:text-slate-300">{s.suggestions.hint}</p>

                {/* Le trajet : de quelle boutique vers laquelle. */}
                {routes.length > 1 && (
                    <div className="flex flex-wrap gap-2">
                        {routes.map((r) => {
                            const active = r.from_shop_id === current.from && r.to_shop_id === current.to;
                            return (
                                <Link key={`${r.from_shop_id}-${r.to_shop_id}`} href={route('stock-transfers.rebalance')} data={{ from: r.from_shop_id, to: r.to_shop_id }}
                                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm ${active
                                        ? 'bg-amber-300 font-semibold text-slate-950'
                                        : 'border border-gray-300 text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10'}`}>
                                    {r.from_shop} <ArrowRight className="size-3.5" /> {r.to_shop}
                                    <span className="opacity-70">· {s.suggestions.routeCount(r.count)}</span>
                                </Link>
                            );
                        })}
                    </div>
                )}

                <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <p className="flex flex-wrap items-center gap-1 font-semibold text-slate-900 dark:text-white">
                            {target?.from_shop} <ArrowRight className="size-4" /> {target?.to_shop}
                            <span className="ml-1 text-sm font-normal text-slate-500 dark:text-slate-400">· {s.suggestions.routeCount(suggestions.total)}</span>
                        </p>
                        <form onSubmit={submitSearch} className="relative w-full sm:w-72">
                            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={s.suggestions.search}
                                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200" />
                        </form>
                    </div>

                    {suggestions.data.length === 0 ? (
                        <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">{s.suggestions.noResult}</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                                        <th className="w-8 pb-2">
                                            <input type="checkbox" checked={allOnPage} onChange={(e) => toggleAll(e.target.checked)} title={s.suggestions.selectPage}
                                                className="rounded border-gray-300 text-amber-500 focus:ring-amber-300 dark:border-white/20 dark:bg-slate-900/70" />
                                        </th>
                                        <th className="pb-2">{s.suggestions.product}</th>
                                        <th className="pb-2">{s.suggestions.from}</th>
                                        <th className="pb-2">{s.suggestions.to}</th>
                                        <th className="pb-2 text-right">{s.suggestions.quantity}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {suggestions.data.map((sg) => {
                                        const on = picked[sg.to_product_id] !== undefined;
                                        return (
                                            <tr key={sg.to_product_id} className={`border-t border-gray-100 dark:border-white/5 ${on ? 'bg-amber-300/5' : ''}`}>
                                                <td className="py-2">
                                                    <input type="checkbox" checked={on} onChange={(e) => toggle(sg, e.target.checked)}
                                                        className="rounded border-gray-300 text-amber-500 focus:ring-amber-300 dark:border-white/20 dark:bg-slate-900/70" />
                                                </td>
                                                <td className="py-2 pr-3 text-slate-900 dark:text-white">{sg.product}</td>
                                                <td className="whitespace-nowrap py-2 pr-3 text-xs text-slate-500 dark:text-slate-400">{s.suggestions.stockOf(sg.from_stock, sg.from_min)}</td>
                                                <td className="whitespace-nowrap py-2 pr-3 text-xs text-rose-500">{s.suggestions.stockOf(sg.to_stock, sg.to_min)}</td>
                                                <td className="py-2 text-right">
                                                    <input type="number" min={1} max={sg.from_stock} value={picked[sg.to_product_id] ?? sg.quantity} disabled={!on}
                                                        onChange={(e) => setPicked((c) => ({ ...c, [sg.to_product_id]: Math.max(1, Math.min(sg.from_stock, Number(e.target.value) || 1)) }))}
                                                        className="w-20 rounded-lg border border-gray-300 bg-white px-2 py-1 text-right text-sm text-slate-900 disabled:opacity-40 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200" />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="mt-4"><PaginationLinks links={suggestions.links} /></div>
                </div>
            </div>

            {/* Toujours visible : ce qui va partir, et le bouton pour l'envoyer. */}
            {selected.length > 0 && (
                <div className="fixed inset-x-0 bottom-0 z-30 border-t border-amber-300/40 bg-white/95 px-4 py-3 backdrop-blur lg:left-72 dark:bg-slate-950/95">
                    <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-slate-700 dark:text-slate-200">
                            {s.suggestions.selectedSummary(selected.length, selected.reduce((sum, sg) => sum + (picked[sg.to_product_id] ?? 0), 0))}
                        </p>
                        <button type="button" onClick={send}
                            className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200">
                            <Truck className="size-4" /> {s.suggestions.sendTo(selected.length, target?.to_shop ?? '')}
                        </button>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
