import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useRoute } from '@/utils/route';
import { ArrowUpRight, Plus, Warehouse, X } from 'lucide-react';
import { useState } from 'react';
import ProductImage from '@/Components/ProductImage';
import { useLocale } from '@/contexts/LocaleContext';
import InputError from '@/Components/InputError';

interface Transfer {
    id: number;
    reference: string;
    shop_name: string;
    product_name: string;
    product_image: string | null;
    quantity: number;
    notes: string | null;
    user_name: string;
    status: 'pending' | 'completed' | 'cancelled';
    transferred_at: string;
    created_at: string;
}

interface PaginatedTransfers {
    data: Transfer[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Shop {
    id: number;
    name: string;
}

interface DepotProductItem {
    id: number;
    product_id: number;
    product_name: string;
    quantity: number;
}

interface DepotInfo {
    id: number;
    name: string;
}

interface Props {
    depot: DepotInfo;
    transfers: PaginatedTransfers;
    shops: Shop[];
    depotProducts: DepotProductItem[];
}

interface TransferItem {
    product_id: string;
    quantity: string;
}

interface TransferFormData {
    shop_id: string;
    notes: string;
    items: TransferItem[];
}

const statusLabel: Record<string, string> = {
    pending: 'En attente',
    completed: 'Complété',
    cancelled: 'Annulé',
};

const statusClass: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400',
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400',
    cancelled: 'bg-rose-100 text-rose-600 dark:bg-rose-400/10 dark:text-rose-400',
};

export default function Transfers({ depot, transfers, shops, depotProducts }: Props) {
    const { t } = useLocale();
    const buildRoute = useRoute();
    const [showForm, setShowForm] = useState(false);

    const form = useForm<TransferFormData>({
        shop_id: '',
        notes: '',
        items: [{ product_id: '', quantity: '1' }],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(buildRoute('depots.transfer', { depot: depot.id }), {
            onSuccess: () => {
                setShowForm(false);
                form.reset();
            },
        });
    };

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center gap-3">
                <Link href={buildRoute('depots.index')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">Dépôts</Link>
                <span className="text-slate-600 dark:text-slate-300">/</span>
                <Link href={buildRoute('depots.show', { depot: depot.id })} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">{depot.name}</Link>
                <span className="text-slate-600 dark:text-slate-300">/</span>
                <span className="font-semibold">Transferts</span>
            </div>
        }>
            <Head title={`Transferts — ${depot.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex size-11 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-300/10">
                            <ArrowUpRight className="size-5 text-amber-600 dark:text-amber-300" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Transferts — {depot.name}</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{transfers.total} transfert(s) au total</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200"
                    >
                        <Plus className="size-4" />
                        Nouveau transfert
                    </button>
                </div>

                {/* Table */}
                <div className="rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900">
                    {transfers.data.length === 0 ? (
                        <div className="flex flex-col items-center py-16">
                            <Warehouse className="size-10 text-slate-300 dark:text-slate-600" />
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Aucun transfert enregistré</p>
                            <button
                                onClick={() => setShowForm(true)}
                                className="mt-3 inline-flex items-center gap-1.5 text-sm text-amber-500 hover:text-amber-400"
                            >
                                <Plus className="size-3.5" />
                                Créer un transfert
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50 dark:border-white/5 dark:bg-white/[0.02]">
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Référence</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Produit</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Boutique</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Qté</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Statut</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Par</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                        {transfers.data.map(t => (
                                            <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                                                <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{t.reference}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <ProductImage
                                                            src={t.product_image}
                                                            name={t.product_name}
                                                            thumbnailClass="size-8"
                                                        />
                                                        <span className="font-medium text-slate-900 dark:text-white">{t.product_name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{t.shop_name}</td>
                                                <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">{t.quantity}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass[t.status] ?? ''}`}>
                                                        {statusLabel[t.status] ?? t.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{t.user_name}</td>
                                                <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{t.transferred_at}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {transfers.last_page > 1 && (
                                <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-white/5">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Page {transfers.current_page} / {transfers.last_page}
                                    </p>
                                    <div className="flex gap-1">
                                        {transfers.links.map((link, i) => (
                                            link.url ? (
                                                <Link
                                                    key={i}
                                                    href={link.url}
                                                    className={`rounded-lg px-3 py-1.5 text-sm ${link.active ? 'bg-amber-300 font-semibold text-slate-950' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5'}`}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            ) : (
                                                <span
                                                    key={i}
                                                    className="rounded-lg px-3 py-1.5 text-sm text-slate-300 dark:text-slate-600"
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            )
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Modal: Nouveau transfert */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Nouveau transfert</h3>
                            <button onClick={() => setShowForm(false)} className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <X className="size-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Boutique */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Boutique destination *</label>
                                <select
                                    value={form.data.shop_id}
                                    onChange={e => form.setData('shop_id', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
                                    required
                                >
                                    <option value="">-- Sélectionner une boutique --</option>
                                    {shops.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                <InputError message={form.errors.shop_id} />
                            </div>

                            {/* Lignes produits */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Produits *</label>
                                    <button
                                        type="button"
                                        onClick={() => form.setData('items', [...(form.data.items ?? []), { product_id: '', quantity: '1' }])}
                                        className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-500 dark:text-amber-400"
                                    >
                                        <Plus className="size-3.5" />
                                        Ajouter un produit
                                    </button>
                                </div>

                                {(form.data.items ?? []).map((item, index) => {
                                    const depotProd = depotProducts.find(p => String(p.product_id) === item.product_id);
                                    return (
                                        <div key={index} className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-800/50">
                                            <div className="flex-1 space-y-2">
                                                <select
                                                    value={item.product_id}
                                                    onChange={e => {
                                                        const newItems = [...(form.data.items ?? [])];
                                                        newItems[index] = { ...newItems[index], product_id: e.target.value };
                                                        form.setData('items', newItems);
                                                    }}
                                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
                                                    required
                                                >
                                                    <option value="">-- Produit --</option>
                                                    {depotProducts.map(p => (
                                                        <option key={p.product_id} value={p.product_id} disabled={p.quantity <= 0}>
                                                            {p.product_name} (stock: {p.quantity})
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max={depotProd?.quantity ?? undefined}
                                                        value={item.quantity}
                                                        onChange={e => {
                                                            const newItems = [...(form.data.items ?? [])];
                                                            newItems[index] = { ...newItems[index], quantity: e.target.value };
                                                            form.setData('items', newItems);
                                                        }}
                                                        className="w-24 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
                                                        placeholder="Qté"
                                                        required
                                                    />
                                                    {depotProd && (
                                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                                            / {depotProd.quantity} disponible{depotProd.quantity > 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                </div>
                                                {(form.errors as any)[`items.${index}.quantity`] && (
                                                    <p className="text-xs text-rose-500">{(form.errors as any)[`items.${index}.quantity`]}</p>
                                                )}
                                            </div>
                                            {(form.data.items ?? []).length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newItems = (form.data.items ?? []).filter((_, i) => i !== index);
                                                        form.setData('items', newItems);
                                                    }}
                                                    className="mt-1 rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-400/10"
                                                >
                                                    <X className="size-4" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
                                <textarea
                                    value={form.data.notes}
                                    onChange={e => form.setData('notes', e.target.value)}
                                    rows={2}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
                                    placeholder="Optionnel..."
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="submit" disabled={form.processing} className="flex-1 rounded-xl bg-amber-300 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50">
                                    {form.processing ? 'Transfert...' : `Transférer ${(form.data.items ?? []).length > 1 ? `(${(form.data.items ?? []).length} produits)` : ''}`}
                                </button>
                                <button type="button" onClick={() => setShowForm(false)} className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-medium text-slate-700 dark:border-white/10 dark:text-slate-300">
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
