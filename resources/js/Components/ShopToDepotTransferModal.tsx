import { useForm } from '@inertiajs/react';
import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import InputError from '@/Components/InputError';
import QuantityInput from '@/Components/QuantityInput';
import { useRoute } from '@/utils/route';
import { useLocale } from '@/contexts/LocaleContext';

export interface ShopProductForDepot {
    id: number;
    name: string;
    sku: string | null;
    shop_id: number;
    stock_quantity: number;
}

interface Item {
    product_id: string;
    quantity: string;
}

interface Props {
    /** Dépôt imposé (page d'un dépôt) : pas de choix de dépôt dans ce cas. */
    depot?: { id: number; name: string };
    /** Dépôts proposés quand aucun n'est imposé (liste des produits). */
    depots?: Array<{ id: number; name: string }>;
    shops: Array<{ id: number; name: string }>;
    /** `undefined` tant que le stock n'est pas chargé. */
    shopProducts: ShopProductForDepot[] | undefined;
    defaultShopId?: number | string | null;
    onClose: () => void;
}

const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none';
const emptyItem = (): Item => ({ product_id: '', quantity: '1' });

/**
 * Transfert boutique → dépôt : le comptoir d'une boutique renvoie du stock à un dépôt.
 * Ouvert depuis la page d'un dépôt (dépôt imposé) ou depuis la liste des produits (dépôt
 * à choisir). Seuls les produits suivis en stock et disponibles au comptoir sont proposés.
 */
export default function ShopToDepotTransferModal({ depot, depots = [], shops, shopProducts, defaultShopId, onClose }: Props) {
    const buildRoute = useRoute();
    const { t } = useLocale();
    const tr = t.products.toDepotModal;
    const [searches, setSearches] = useState<string[]>([]);
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const initialShop = defaultShopId && shops.some(s => String(s.id) === String(defaultShopId))
        ? String(defaultShopId)
        : (shops.length === 1 ? String(shops[0].id) : '');

    const form = useForm<{ depot_id: string; shop_id: string; notes: string; items: Item[] }>({
        depot_id: depot ? String(depot.id) : (depots.length === 1 ? String(depots[0].id) : ''),
        shop_id: initialShop,
        notes: '',
        items: [emptyItem()],
    });

    const available = (shopProducts ?? []).filter(p => String(p.shop_id) === form.data.shop_id);
    const errors = form.errors as Record<string, string | undefined>;

    const setItem = (index: number, patch: Partial<Item>) => {
        const items = [...form.data.items];
        items[index] = { ...items[index], ...patch };
        form.setData('items', items);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.data.depot_id) return;
        form.transform(({ depot_id, ...data }) => data);
        form.post(buildRoute('depots.receive-from-shop', { depot: form.data.depot_id }), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                onClose();
            },
        });
    };

    const count = form.data.items.length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
            <div className="my-4 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{depot ? tr.titleFromShop : tr.title}</h3>
                    <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X className="size-5" />
                    </button>
                </div>
                <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">{tr.hint}</p>
                <form onSubmit={submit} className="space-y-4">
                    {!depot && (
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{tr.depot} *</label>
                            <select value={form.data.depot_id} onChange={e => form.setData('depot_id', e.target.value)} className={inputClass} required>
                                <option value="">{tr.chooseDepot}</option>
                                {depots.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{tr.shop} *</label>
                        <select
                            value={form.data.shop_id}
                            onChange={e => form.setData(data => ({ ...data, shop_id: e.target.value, items: [emptyItem()] }))}
                            className={inputClass}
                            required
                        >
                            <option value="">{tr.chooseShop}</option>
                            {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <InputError message={form.errors.shop_id} />
                    </div>

                    {form.data.shop_id && (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{tr.products} *</label>
                                <button
                                    type="button"
                                    onClick={() => form.setData('items', [...form.data.items, emptyItem()])}
                                    className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-500 dark:text-amber-400"
                                >
                                    <Plus className="size-3.5" />
                                    {tr.addProduct}
                                </button>
                            </div>

                            {shopProducts === undefined ? (
                                <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">{tr.loading}</p>
                            ) : available.length === 0 && (
                                <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">{tr.noStock}</p>
                            )}

                            <div className="max-h-64 space-y-2 overflow-y-auto">
                                {form.data.items.map((item, index) => {
                                    const selected = available.find(p => String(p.id) === item.product_id);
                                    const term = openIndex === index ? (searches[index] ?? '') : '';
                                    const taken = new Set(form.data.items.filter((_, i) => i !== index).map(i => i.product_id));
                                    const filtered = available.filter(p =>
                                        !taken.has(String(p.id)) && (
                                            p.name.toLowerCase().includes(term.toLowerCase()) ||
                                            (p.sku ?? '').toLowerCase().includes(term.toLowerCase())
                                        )
                                    ).slice(0, 50);

                                    return (
                                        <div key={index} className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-800/50">
                                            <div className="min-w-0 flex-1 space-y-2">
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        readOnly={openIndex !== index}
                                                        value={openIndex === index ? term : (selected?.name ?? '')}
                                                        placeholder={tr.search}
                                                        onFocus={() => {
                                                            setOpenIndex(index);
                                                            setSearches(s => { const n = [...s]; n[index] = ''; return n; });
                                                        }}
                                                        onChange={e => setSearches(s => { const n = [...s]; n[index] = e.target.value; return n; })}
                                                        className={inputClass}
                                                    />
                                                    {openIndex === index && (
                                                        <>
                                                            <div className="fixed inset-0 z-10" onClick={() => setOpenIndex(null)} />
                                                            <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-white/10 dark:bg-slate-800">
                                                                {filtered.length === 0 ? (
                                                                    <p className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">{tr.noResult}</p>
                                                                ) : filtered.map(p => (
                                                                    <button
                                                                        key={p.id}
                                                                        type="button"
                                                                        onClick={() => { setItem(index, { product_id: String(p.id) }); setOpenIndex(null); }}
                                                                        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-white/5"
                                                                    >
                                                                        <span className="min-w-0 truncate">
                                                                            <span className="font-medium text-slate-900 dark:text-white">{p.name}</span>
                                                                            {p.sku && <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">{p.sku}</span>}
                                                                        </span>
                                                                        <span className="shrink-0 text-xs font-medium text-emerald-600">{tr.inStock.replace('{count}', String(p.stock_quantity))}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                                <InputError message={errors[`items.${index}.product_id`]} />
                                                <div className="flex items-center gap-2">
                                                    <QuantityInput
                                                        value={item.quantity}
                                                        onChange={q => setItem(index, { quantity: q === null ? '' : String(q) })}
                                                        className="w-24 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
                                                        placeholder={tr.quantity}
                                                        required
                                                    />
                                                    {selected && (
                                                        <span className="text-xs text-slate-500 dark:text-slate-400">{tr.atCounter.replace('{count}', String(selected.stock_quantity))}</span>
                                                    )}
                                                </div>
                                                <InputError message={errors[`items.${index}.quantity`]} />
                                            </div>
                                            {count > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => form.setData('items', form.data.items.filter((_, i) => i !== index))}
                                                    className="mt-1 rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-400/10"
                                                >
                                                    <X className="size-4" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <InputError message={form.errors.items} />
                        </div>
                    )}

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{tr.notes}</label>
                        <textarea
                            value={form.data.notes}
                            onChange={e => form.setData('notes', e.target.value)}
                            rows={2}
                            className={inputClass}
                            placeholder={tr.notesPlaceholder}
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={form.processing || !form.data.depot_id || !form.data.shop_id || form.data.items.some(i => !i.product_id)}
                            className="flex-1 rounded-xl bg-amber-300 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50"
                        >
                            {form.processing ? tr.submitting : (count > 1 ? tr.submitMany.replace('{count}', String(count)) : tr.submit)}
                        </button>
                        <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-medium text-slate-700 dark:border-white/10 dark:text-slate-300">
                            {tr.cancel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
