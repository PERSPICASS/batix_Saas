import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, Filter, Calendar, Package, User, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useLocale } from '@/contexts/LocaleContext';

interface Preorder {
    id: number;
    product: { id: number; name: string };
    customer: { id: number; name: string };
    shop: { id: number; name: string };
    quantity_ordered: number;
    unit_price: number;
    expected_delivery_date: string;
    deposit_amount: number | null;
    status: string;
    created_at: string;
}

interface Shop {
    id: number;
    name: string;
}

interface Props {
    preorders: {
        data: Preorder[];
        links: any[];
        meta: any;
    };
    shops: Shop[];
    filters: {
        search?: string;
        status?: string;
        shop_id?: string;
    };
}

export default function Index({ preorders, shops, filters }: Props) {
    const { t } = useLocale();
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [shopFilter, setShopFilter] = useState(filters.shop_id || '');

    const handleSearch = () => {
        router.get(route('preorders.index'), {
            search,
            status: statusFilter,
            shop_id: shopFilter,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('');
        setShopFilter('');
        router.get(route('preorders.index'), {}, { preserveState: true });
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'pending': 'bg-yellow-400/10 text-yellow-300',
            'confirmed': 'bg-blue-400/10 text-blue-300',
            'ready': 'bg-green-400/10 text-green-300',
            'completed': 'bg-slate-400/10 text-slate-300',
            'cancelled': 'bg-red-400/10 text-red-300',
        };
        return colors[status] || 'bg-slate-400/10 text-slate-300';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            'pending': 'En attente',
            'confirmed': 'Confirmée',
            'ready': 'Prête',
            'completed': 'Complétée',
            'cancelled': 'Annulée',
        };
        return labels[status] || status;
    };

    const isOverdue = (date: string) => {
        return new Date(date) < new Date() && date;
    };

    const getTotalPrice = (unitPrice: number, quantity: number) => {
        return unitPrice * quantity;
    };

    const getRemainingBalance = (total: number, deposit: number | null) => {
        return total - (deposit || 0);
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-500/10">
                            <Package className="size-5 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white">Pré-commandes</h2>
                            <p className="text-sm text-slate-400">Gérez vos pré-commandes et réservations</p>
                        </div>
                    </div>
                    <Link
                        href={route('preorders.create')}
                        className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition"
                    >
                        <Plus className="size-4" /> Nouvelle pré-commande
                    </Link>
                </div>
            }
        >
            <Head title="Pré-commandes" />

            <div className="space-y-6">
                {/* Filtres */}
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Rechercher par produit, client..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-full rounded-lg border border-white/10 bg-slate-800/50 py-2 pl-10 pr-4 text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleSearch}
                                className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition"
                            >
                                <Search className="size-4" /> Rechercher
                            </button>
                        </div>
                    </div>

                    {/* Filtres avancés */}
                    <div className="mt-4 grid gap-4 sm:grid-cols-3 border-t border-white/10 pt-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Boutique</label>
                            <select
                                value={shopFilter}
                                onChange={(e) => setShopFilter(e.target.value)}
                                className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2 text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                            >
                                <option value="">Toutes les boutiques</option>
                                {shops.map((shop) => (
                                    <option key={shop.id} value={shop.id}>
                                        {shop.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Statut</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2 text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                            >
                                <option value="">Tous les statuts</option>
                                <option value="pending">En attente</option>
                                <option value="confirmed">Confirmée</option>
                                <option value="ready">Prête</option>
                                <option value="completed">Complétée</option>
                                <option value="cancelled">Annulée</option>
                            </select>
                        </div>

                        <div className="sm:col-span-1 flex items-end">
                            <button
                                onClick={clearFilters}
                                className="text-sm text-slate-400 hover:text-white transition"
                            >
                                Réinitialiser les filtres
                            </button>
                        </div>
                    </div>
                </div>

                {/* Liste des pré-commandes */}
                <div className="rounded-xl border border-white/10 bg-slate-900/50 overflow-hidden">
                    {preorders.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-6">
                            <Package className="size-12 text-slate-400 mb-4" />
                            <p className="text-lg font-medium text-slate-300 mb-2">Aucune pré-commande</p>
                            <p className="text-sm text-slate-400">Créez votre première pré-commande</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/10">
                            {preorders.data.map((preorder) => {
                                const total = getTotalPrice(preorder.unit_price, preorder.quantity_ordered);
                                const balance = getRemainingBalance(total, preorder.deposit_amount);
                                const overdue = isOverdue(preorder.expected_delivery_date);

                                return (
                                    <Link
                                        key={preorder.id}
                                        href={route('preorders.show', preorder.id)}
                                        className="p-4 hover:bg-white/5 transition block"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(preorder.status)}`}>
                                                        {getStatusLabel(preorder.status)}
                                                    </span>
                                                    {overdue && (
                                                        <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-red-400/10 text-red-300">
                                                            Échue
                                                        </span>
                                                    )}
                                                </div>

                                                <h3 className="text-sm font-semibold text-white mb-1">
                                                    {preorder.product.name}
                                                </h3>

                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3 text-xs text-slate-400">
                                                    <div className="flex items-center gap-1">
                                                        <User className="size-3" />
                                                        {preorder.customer.name}
                                                    </div>
                                                    <div>
                                                        Qté: <span className="text-white font-medium">{preorder.quantity_ordered}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="size-3" />
                                                        {new Date(preorder.expected_delivery_date).toLocaleDateString('fr-FR')}
                                                    </div>
                                                    <div className="text-right">
                                                        Total: <span className="text-white font-medium">{number_format(total, 0, ',', ' ')} FCFA</span>
                                                    </div>
                                                </div>

                                                {balance > 0 && (
                                                    <div className="mt-2 text-xs text-amber-300">
                                                        Reste à payer: {number_format(balance, 0, ',', ' ')} FCFA
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {preorders.links.length > 3 && (
                        <div className="flex items-center justify-center gap-2 border-t border-white/10 p-4">
                            {preorders.links.map((link: any, index: number) => (
                                <button
                                    key={index}
                                    onClick={() => link.url && router.visit(link.url)}
                                    disabled={!link.url}
                                    className={`px-3 py-1 rounded text-sm transition ${
                                        link.active
                                            ? 'bg-purple-600 text-white'
                                            : link.url
                                            ? 'text-slate-400 hover:bg-slate-800'
                                            : 'text-slate-600 cursor-not-allowed'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function number_format(number: number, decimals: number, decPoint: string, thousandsSep: string): string {
    const parts = number.toFixed(decimals).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSep);
    return parts.join(decPoint);
}
