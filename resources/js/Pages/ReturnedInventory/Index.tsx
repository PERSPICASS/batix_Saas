import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { CheckCircle, XCircle, Clock, AlertCircle, SlidersHorizontal, X } from 'lucide-react';
import Currency from '@/Components/Currency';
import { useRoute } from '@/utils/route';
import { useState } from 'react';
import { PageProps } from '@/types';

interface Product {
    id: number;
    name: string;
}

interface SaleReturn {
    id: number;
    quantity_returned: number;
    reason: string;
}

interface User {
    id: number;
    name: string;
}

interface ReturnedInventoryItem {
    id: number;
    sale_return_id: number;
    product_id: number;
    quantity: number;
    reason: string;
    condition: string;
    status: string;
    notes: string | null;
    created_at: string;
    reviewed_by: number | null;
    reviewed_at: string | null;
    product: Product;
    saleReturn: SaleReturn;
    reviewedBy: User | null;
}

interface Props extends PageProps {
    items: {
        data: ReturnedInventoryItem[];
        links?: any[];
        meta?: {
            last_page: number;
        };
    };
    filters?: {
        status?: string;
        condition?: string;
        product?: string;
        date_from?: string;
        date_to?: string;
    };
}

const statusLabels: Record<string, string> = {
    pending: 'En attente',
    approved: 'Approuvé',
    rejected: 'Rejeté',
};

const statusColors: Record<string, string> = {
    pending: 'text-amber-400',
    approved: 'text-green-400',
    rejected: 'text-red-400',
};

const statusIcons: Record<string, any> = {
    pending: Clock,
    approved: CheckCircle,
    rejected: XCircle,
};

const conditionLabels: Record<string, string> = {
    good: 'Bon état',
    defective: 'Défectueux',
};

const reasonLabels: Record<string, string> = {
    defective: 'Défectueux',
    wrong_item: 'Mauvais article',
    not_satisfied: 'Non satisfait',
    other: 'Autre',
};

export default function ReturnedInventoryIndex({ items, auth, filters }: Props) {
    const route = useRoute();
    const [processing, setProcessing] = useState<number | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [filterValues, setFilterValues] = useState({
        status: filters?.status || '',
        condition: filters?.condition || '',
        product: filters?.product || '',
        date_from: filters?.date_from || '',
        date_to: filters?.date_to || '',
    });

    const activeFilterCount = [filterValues.status, filterValues.condition, filterValues.product, filterValues.date_from, filterValues.date_to].filter(Boolean).length;

    const handleApprove = (id: number) => {
        if (!confirm('Approuver ce retour?')) return;
        setProcessing(id);
        router.post(route('returned-inventory.approve', { item: id }), {}, {
            onFinish: () => setProcessing(null),
        });
    };

    const handleReject = (id: number) => {
        if (!confirm('Rejeter ce retour?')) return;
        setProcessing(id);
        router.post(route('returned-inventory.reject', { item: id }), {}, {
            onFinish: () => setProcessing(null),
        });
    };

    const handleApplyFilters = () => {
        router.get(route('returned-inventory.index'), filterValues);
    };

    const handleResetFilters = () => {
        setFilterValues({
            status: '',
            condition: '',
            product: '',
            date_from: '',
            date_to: '',
        });
        router.get(route('returned-inventory.index'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-white">Inventaire de retour</h1>
                    <div className="text-sm text-slate-400">
                        {items.data ? items.data.filter(i => i.status === 'pending').length : 0} en attente
                    </div>
                </div>
            }
        >
            <Head title="Inventaire de retour" />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    {/* Bouton filtres */}
                    <button
                        onClick={() => setShowFilters(v => !v)}
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${showFilters || activeFilterCount > 0 ? 'border-amber-300/50 bg-amber-300/10 text-amber-300' : 'border-white/15 text-slate-300 hover:bg-white/5'}`}
                    >
                        <SlidersHorizontal className="size-4" />
                        Filtres
                        {activeFilterCount > 0 && (
                            <span className="flex size-5 items-center justify-center rounded-full bg-amber-300 text-xs font-bold text-slate-950">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>

                    {/* Reset */}
                    {activeFilterCount > 0 && (
                        <button
                            onClick={handleResetFilters}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-400 hover:text-white"
                        >
                            <X className="size-4" /> Réinitialiser
                        </button>
                    )}
                </div>

                {/* Panneau de filtres avancés */}
                {showFilters && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                            {/* Statut */}
                            <div>
                                <label className="mb-1 block text-xs text-slate-400">Statut</label>
                                <select
                                    value={filterValues.status}
                                    onChange={(e) => setFilterValues({...filterValues, status: e.target.value})}
                                    className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-white focus:border-amber-300 focus:outline-none"
                                >
                                    <option value="">Tous</option>
                                    <option value="pending">En attente</option>
                                    <option value="approved">Approuvé</option>
                                    <option value="rejected">Rejeté</option>
                                </select>
                            </div>

                            {/* Condition */}
                            <div>
                                <label className="mb-1 block text-xs text-slate-400">Condition</label>
                                <select
                                    value={filterValues.condition}
                                    onChange={(e) => setFilterValues({...filterValues, condition: e.target.value})}
                                    className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-white focus:border-amber-300 focus:outline-none"
                                >
                                    <option value="">Tous</option>
                                    <option value="good">Bon état</option>
                                    <option value="defective">Défectueux</option>
                                </select>
                            </div>

                            {/* Produit */}
                            <div>
                                <label className="mb-1 block text-xs text-slate-400">Produit</label>
                                <input
                                    type="text"
                                    placeholder="Rechercher..."
                                    value={filterValues.product}
                                    onChange={(e) => setFilterValues({...filterValues, product: e.target.value})}
                                    className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-white focus:border-amber-300 focus:outline-none"
                                />
                            </div>

                            {/* Date depuis */}
                            <div>
                                <label className="mb-1 block text-xs text-slate-400">Du</label>
                                <input
                                    type="date"
                                    value={filterValues.date_from}
                                    onChange={(e) => setFilterValues({...filterValues, date_from: e.target.value})}
                                    className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-white focus:border-amber-300 focus:outline-none"
                                />
                            </div>

                            {/* Date jusqu'au */}
                            <div>
                                <label className="mb-1 block text-xs text-slate-400">Au</label>
                                <input
                                    type="date"
                                    value={filterValues.date_to}
                                    onChange={(e) => setFilterValues({...filterValues, date_to: e.target.value})}
                                    className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-white focus:border-amber-300 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={handleApplyFilters}
                                className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-amber-200"
                            >
                                Appliquer les filtres
                            </button>
                        </div>
                    </div>
                )}

                {!items.data || items.data.length === 0 ? (
                    <div className="rounded-lg border border-white/10 bg-white/5 p-8 text-center">
                        <AlertCircle className="mx-auto size-12 text-slate-400 mb-3" />
                        <p className="text-slate-300">Aucun retour à traiter</p>
                    </div>
                ) : (
                    <div className="rounded-lg border border-white/10 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="border-b border-white/10 bg-white/5">
                                <tr>
                                    <th className="px-4 py-3 text-left text-slate-300">Date</th>
                                    <th className="px-4 py-3 text-left text-slate-300">Produit</th>
                                    <th className="px-4 py-3 text-center text-slate-300">Qté</th>
                                    <th className="px-4 py-3 text-left text-slate-300">Raison</th>
                                    <th className="px-4 py-3 text-left text-slate-300">Condition</th>
                                    <th className="px-4 py-3 text-center text-slate-300">Statut</th>
                                    <th className="px-4 py-3 text-right text-slate-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {items.data.map((item) => {
                                    const StatusIcon = statusIcons[item.status];
                                    return (
                                        <tr key={item.id} className="hover:bg-white/5">
                                            <td className="px-4 py-3 text-slate-300">
                                                {new Date(item.created_at).toLocaleDateString('fr-FR')}
                                            </td>
                                            <td className="px-4 py-3 text-white font-medium">
                                                {item.product.name}
                                            </td>
                                            <td className="px-4 py-3 text-center text-slate-300">
                                                {item.quantity}
                                            </td>
                                            <td className="px-4 py-3 text-slate-300">
                                                {reasonLabels[item.reason] || item.reason}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-sm ${
                                                    item.condition === 'defective'
                                                        ? 'text-red-400'
                                                        : 'text-green-400'
                                                }`}>
                                                    {conditionLabels[item.condition]}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className={`flex items-center justify-center gap-2 ${statusColors[item.status]}`}>
                                                    <StatusIcon className="size-4" />
                                                    <span>{statusLabels[item.status]}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {item.status === 'pending' && (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleApprove(item.id)}
                                                            disabled={processing === item.id}
                                                            className="rounded px-3 py-1 text-xs font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30 disabled:opacity-50"
                                                        >
                                                            {processing === item.id ? 'Traitement...' : 'Approuver'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(item.id)}
                                                            disabled={processing === item.id}
                                                            className="rounded px-3 py-1 text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50"
                                                        >
                                                            Rejeter
                                                        </button>
                                                    </div>
                                                )}
                                                {item.status !== 'pending' && (
                                                    <div className="text-xs text-slate-500">
                                                        {item.reviewedBy?.name}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {items.meta && items.links && items.meta.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        {items.links.map((link: any, index: number) => (
                            <a
                                key={index}
                                href={link.url}
                                className={`rounded px-3 py-2 text-sm ${
                                    link.active
                                        ? 'bg-amber-500 text-white'
                                        : 'border border-white/10 text-slate-300 hover:bg-white/5'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
