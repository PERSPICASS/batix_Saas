import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2, Eye, Search, ShoppingCart, Package, Calendar, DollarSign } from 'lucide-react';
import Table, { TableActions, TableActionButton, TableBadge } from '@/Components/Table';
import { useState, FormEventHandler } from 'react';
import { useRoute } from '@/utils/route';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';

interface Supplier {
    id: number;
    name: string;
    company_name: string | null;
}

interface User {
    id: number;
    name: string;
}

interface PurchaseItem {
    id: number;
    quantity_ordered: number;
    quantity_received: number;
}

interface Purchase {
    id: number;
    reference: string;
    status: 'draft' | 'confirmed' | 'received' | 'partial' | 'cancelled';
    order_date: string;
    expected_date: string | null;
    received_date: string | null;
    total: string;
    currency: string;
    supplier: Supplier;
    user: User;
    items: PurchaseItem[];
}

interface PaginatedPurchases {
    data: Purchase[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface SupplierOption {
    id: number;
    name: string;
}

interface Props {
    code_user: string;
    purchases: PaginatedPurchases;
    suppliers: SupplierOption[];
    currency: string;
    filters: {
        search?: string;
        status?: string;
        supplier_id?: string;
    };
}

export default function PurchasesIndex({ code_user, purchases, suppliers, currency, filters }: Props) {
    const route = useRoute();

    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [supplierId, setSupplierId] = useState(filters.supplier_id || '');
    const [deleteModal, setDeleteModal] = useState<{ show: boolean; purchase: Purchase | null }>({ 
        show: false, 
        purchase: null 
    });
    const [deleting, setDeleting] = useState(false);

    const handleFilter: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(
            route('purchases.index', { code_user }),
            { search, status: status !== 'all' ? status : undefined, supplier_id: supplierId || undefined },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleDelete = (purchase: Purchase) => {
        setDeleteModal({ show: true, purchase });
    };

    const confirmDelete = () => {
        if (!deleteModal.purchase) return;
        setDeleting(true);
        router.delete(route('purchases.destroy', { code_user, purchase: deleteModal.purchase.id }), {
            onSuccess: () => {
                setDeleteModal({ show: false, purchase: null });
                setDeleting(false);
            },
            onError: () => setDeleting(false),
        });
    };

    const getStatusBadge = (status: Purchase['status']) => {
        const statusConfig = {
            draft: { label: 'Brouillon', variant: 'default' as const },
            confirmed: { label: 'Confirmé', variant: 'info' as const },
            partial: { label: 'Partiel', variant: 'warning' as const },
            received: { label: 'Reçu', variant: 'success' as const },
            cancelled: { label: 'Annulé', variant: 'danger' as const },
        };
        const config = statusConfig[status];
        return <TableBadge variant={config.variant}>{config.label}</TableBadge>;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const formatCurrency = (amount: string, currency: string) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: currency,
        }).format(parseFloat(amount));
    };

    const columns = [
        {
            key: 'reference',
            label: 'Référence',
            render: (purchase: Purchase) => (
                <div>
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="size-4 text-amber-300" />
                        <span className="font-medium">{purchase.reference}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-slate-400">
                        {purchase.items.length} article{purchase.items.length > 1 ? 's' : ''}
                    </div>
                </div>
            ),
        },
        {
            key: 'supplier',
            label: 'Fournisseur',
            render: (purchase: Purchase) => (
                <div>
                    <div className="font-medium">{purchase.supplier.name}</div>
                    {purchase.supplier.company_name && (
                        <div className="text-xs text-slate-400">{purchase.supplier.company_name}</div>
                    )}
                </div>
            ),
        },
        {
            key: 'dates',
            label: 'Dates',
            render: (purchase: Purchase) => (
                <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2 text-slate-300">
                        <Calendar className="size-3.5" />
                        <span>Commande: {formatDate(purchase.order_date)}</span>
                    </div>
                    {purchase.expected_date && (
                        <div className="text-xs text-slate-400">
                            Prévue: {formatDate(purchase.expected_date)}
                        </div>
                    )}
                    {purchase.received_date && (
                        <div className="text-xs text-green-400">
                            Reçue: {formatDate(purchase.received_date)}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Statut',
            render: (purchase: Purchase) => getStatusBadge(purchase.status),
        },
        {
            key: 'total',
            label: 'Total',
            render: (purchase: Purchase) => (
                <div className="flex items-center gap-2">
                    
                    <span className="font-semibold text-green-400">
                        {formatCurrency(purchase.total, purchase.currency)}
                    </span>
                </div>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (purchase: Purchase) => (
                <TableActions>
                    <Link href={route('purchases.show', { code_user, purchase: purchase.id })}>
                        <TableActionButton>
                            <Eye className="size-4" />
                            Voir
                        </TableActionButton>
                    </Link>
                    {purchase.status === 'draft' && (
                        <>
                            <Link href={route('purchases.edit', { code_user, purchase: purchase.id })}>
                                <TableActionButton>
                                    <Pencil className="size-4" />
                                    Modifier
                                </TableActionButton>
                            </Link>
                            <TableActionButton
                                onClick={() => handleDelete(purchase)}
                                variant="danger"
                            >
                                <Trash2 className="size-4" />
                                Supprimer
                            </TableActionButton>
                        </>
                    )}
                    {purchase.status === 'cancelled' && (
                        <TableActionButton
                            onClick={() => handleDelete(purchase)}
                            variant="danger"
                        >
                            <Trash2 className="size-4" />
                            Supprimer
                        </TableActionButton>
                    )}
                </TableActions>
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Bons de commande" />

            <div className="space-y-6">
                {/* En-tête */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Bons de commande</h1>
                        <p className="mt-1 text-sm text-slate-400">
                            Gérez vos commandes fournisseurs et réceptionnez la marchandise
                        </p>
                    </div>
                    <Link
                        href={route('purchases.create', { code_user })}
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
                    >
                        <Plus className="size-5" />
                        Nouveau bon de commande
                    </Link>
                </div>

                {/* Filtres */}
                <form onSubmit={handleFilter} className="rounded-xl bg-slate-800/50 p-4">
                    <div className="grid gap-4 md:grid-cols-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-300">
                                Recherche
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Référence, fournisseur..."
                                    className="w-full rounded-lg border-slate-700 bg-slate-900/50 py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-amber-300 focus:ring-amber-300"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-300">
                                Statut
                            </label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full rounded-lg border-slate-700 bg-slate-900/50 py-2 px-4 text-sm text-white focus:border-amber-300 focus:ring-amber-300"
                            >
                                <option value="all">Tous les statuts</option>
                                <option value="draft">Brouillon</option>
                                <option value="confirmed">Confirmé</option>
                                <option value="partial">Partiel</option>
                                <option value="received">Reçu</option>
                                <option value="cancelled">Annulé</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-300">
                                Fournisseur
                            </label>
                            <select
                                value={supplierId}
                                onChange={(e) => setSupplierId(e.target.value)}
                                className="w-full rounded-lg border-slate-700 bg-slate-900/50 py-2 px-4 text-sm text-white focus:border-amber-300 focus:ring-amber-300"
                            >
                                <option value="">Tous les fournisseurs</option>
                                {suppliers.map((supplier) => (
                                    <option key={supplier.id} value={supplier.id}>
                                        {supplier.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                type="submit"
                                className="w-full rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
                            >
                                Filtrer
                            </button>
                        </div>
                    </div>
                </form>

                {/* Statistiques rapides */}
                <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-xl bg-slate-800/50 p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-blue-500/10 p-3">
                                <ShoppingCart className="size-6 text-blue-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">{purchases.total}</div>
                                <div className="text-sm text-slate-400">Total commandes</div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl bg-slate-800/50 p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-yellow-500/10 p-3">
                                <Package className="size-6 text-yellow-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">
                                    {purchases.data.filter(p => p.status === 'confirmed' || p.status === 'partial').length}
                                </div>
                                <div className="text-sm text-slate-400">En attente</div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl bg-slate-800/50 p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-green-500/10 p-3">
                                <Package className="size-6 text-green-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">
                                    {purchases.data.filter(p => p.status === 'received').length}
                                </div>
                                <div className="text-sm text-slate-400">Reçues</div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl bg-slate-800/50 p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-amber-500/10 p-3">
                                <DollarSign className="size-6 text-amber-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">
                                    {formatCurrency(
                                        purchases.data
                                            .filter(p => p.status !== 'cancelled')
                                            .reduce((sum, p) => sum + parseFloat(p.total), 0)
                                            .toString(),
                                        currency
                                    )}
                                </div>
                                <div className="text-sm text-slate-400">Valeur totale</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tableau */}
                <Table
                    columns={columns}
                    data={purchases.data}
                    emptyMessage="Aucun bon de commande trouvé"
                />

                {/* Pagination */}
                {purchases.last_page > 1 && (
                    <div className="mt-6 flex items-center justify-center gap-2">
                        {purchases.links.map((link, index) => {
                            if (link.url === null) {
                                return (
                                    <span
                                        key={index}
                                        className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-500"
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                );
                            }
                            return (
                                <Link
                                    key={index}
                                    href={link.url}
                                    preserveState
                                    preserveScroll
                                    className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                                        link.active
                                            ? 'border-amber-300 bg-amber-300 text-slate-950 font-semibold'
                                            : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal de confirmation de suppression */}
            <ConfirmDeleteModal
                show={deleteModal.show}
                onClose={() => setDeleteModal({ show: false, purchase: null })}
                onConfirm={confirmDelete}
                title="Supprimer le bon de commande"
                message={`Êtes-vous sûr de vouloir supprimer le bon de commande ${deleteModal.purchase?.reference} ? Cette action est irréversible.`}
                processing={deleting}
            />
        </AuthenticatedLayout>
    );
}
