import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Table, { TableActionButton, TableActions, TableBadge } from '@/Components/Table';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Eye, Trash2, Search, X, SlidersHorizontal, RotateCcw } from 'lucide-react';
import Currency from '@/Components/Currency';
import { useRoute } from '@/utils/route';
import { useState, useEffect } from 'react';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';
import { PageProps } from '@/types';

interface Shop {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
}

interface Customer {
    id: number;
    name: string;
}

interface Sale {
    id: number;
    ticket_number: string;
    sale_date: string;
    payment_method: string;
    status: string;
    total: string;
    amount_paid: string;
    remaining_amount: string;
    credit_due_date: string | null;
    shop: Shop;
    user: User;
    customer: Customer | null;
}

interface PaginatedData {
    data: Sale[];
    links: any;
    meta: any;
}

interface Stats {
    total_revenue: number;
    total_sales: number;
    total_credit_remaining: number;
    total_credit_sales: number;
}

interface Props extends PageProps {
    sales: PaginatedData;
    stats: Stats;
    shops: Shop[];
    filters: {
        search?: string;
        status?: string;
        shop_id?: string;
        payment_method?: string;
        date_from?: string;
        date_to?: string;
        credit_only?: string;
    };
}

const paymentMethodLabels: Record<string, string> = {
    cash: 'Espèces',
    card: 'Carte',
    transfer: 'Virement',
    check: 'Chèque',
    mobile: 'Mobile',
    multiple: 'Multiple',
    credit: 'Crédit',
};

const statusLabels: Record<string, string> = {
    completed: 'Terminée',
    pending: 'En attente',
    cancelled: 'Annulée',
    returned: 'Retournée',
};

export default function SalesIndex({ sales, stats, shops, filters, auth }: Props) {
    const route = useRoute();
    const [deleteModal, setDeleteModal] = useState<{ show: boolean; sale: Sale | null }>({ show: false, sale: null });
    const [restoreModal, setRestoreModal] = useState<{ show: boolean; sale: Sale | null }>({ show: false, sale: null });
    const [deleting, setDeleting] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // État local des filtres
    const [search, setSearch]               = useState(filters.search ?? '');
    const [status, setStatus]               = useState(filters.status ?? '');
    const [paymentMethod, setPaymentMethod] = useState(filters.payment_method ?? '');
    const [dateFrom, setDateFrom]           = useState(filters.date_from ?? '');
    const [dateTo, setDateTo]               = useState(filters.date_to ?? '');
    const [creditOnly, setCreditOnly]       = useState(filters.credit_only === '1' || filters.credit_only === 'true');

    const canCancelSale = auth.user?.role !== 'cashier' && auth.user?.role !== 'caisse';
    const isAdmin = auth.user?.role === 'super_admin' || auth.user?.role === 'manager';

    // Nombre de filtres actifs (hors recherche)
    const activeFilterCount = [status, paymentMethod, dateFrom, dateTo, creditOnly ? '1' : ''].filter(Boolean).length;

    const applyFilters = () => {
        router.get(route('sales.index'), {
            ...(search        ? { search }          : {}),
            ...(status        ? { status }          : {}),
            ...(paymentMethod ? { payment_method: paymentMethod } : {}),
            ...(dateFrom      ? { date_from: dateFrom } : {}),
            ...(dateTo        ? { date_to: dateTo }   : {}),
            ...(creditOnly    ? { credit_only: '1' }  : {}),
        }, { preserveState: true, replace: true });
    };

    const resetFilters = () => {
        setSearch('');
        setStatus('');
        setPaymentMethod('');
        setDateFrom('');
        setDateTo('');
        setCreditOnly(false);
        router.get(route('sales.index'), {}, { preserveState: false, replace: true });
    };

    // Recherche avec debounce sur le champ texte
    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(route('sales.index'), {
                ...(search        ? { search }          : {}),
                ...(status        ? { status }          : {}),
                ...(paymentMethod ? { payment_method: paymentMethod } : {}),
                ...(dateFrom      ? { date_from: dateFrom } : {}),
                ...(dateTo        ? { date_to: dateTo }   : {}),
                ...(creditOnly    ? { credit_only: '1' }  : {}),
            }, { preserveState: true, replace: true });
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    const handleDelete = (sale: Sale) => setDeleteModal({ show: true, sale });

    const handleRestore = (sale: Sale) => setRestoreModal({ show: true, sale });

    const confirmRestore = () => {
        if (!restoreModal.sale) return;
        setRestoring(true);
        router.patch(route('sales.restore', { sale: restoreModal.sale.id }), {}, {
            onSuccess: () => { setRestoreModal({ show: false, sale: null }); setRestoring(false); },
            onError: () => setRestoring(false),
        });
    };

    const confirmDelete = () => {
        if (!deleteModal.sale) return;
        setDeleting(true);
        router.delete(route('sales.destroy', { sale: deleteModal.sale.id }), {
            onSuccess: () => { setDeleteModal({ show: false, sale: null }); setDeleting(false); },
            onError: () => setDeleting(false),
        });
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'completed': return 'success';
            case 'pending':   return 'warning';
            case 'cancelled':
            case 'returned':  return 'danger';
            default:          return 'default';
        }
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">Ventes</h1>}>
            <Head title="Ventes" />
            <section className="space-y-4">
                {/* Statistiques */}
                <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                        <h3 className="text-sm text-slate-400">Chiffre d'affaires total</h3>
                        <p className="mt-2 text-3xl font-bold text-amber-300">
                            <Currency amount={parseFloat(String(stats.total_revenue))} />
                        </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                        <h3 className="text-sm text-slate-400">Nombre de ventes</h3>
                        <p className="mt-2 text-3xl font-bold text-white">{stats.total_sales}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                        <h3 className="text-sm text-slate-400">Total créances</h3>
                        <p className="mt-2 text-3xl font-bold text-rose-400">
                            <Currency amount={parseFloat(String(stats.total_credit_remaining))} />
                        </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                        <h3 className="text-sm text-slate-400">Ventes à crédit</h3>
                        <p className="mt-2 text-3xl font-bold text-amber-300">{stats.total_credit_sales}</p>
                    </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* Recherche */}
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="N° ticket, client..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full rounded-lg border border-white/15 bg-slate-900/70 pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:border-amber-300 focus:outline-none"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                                <X className="size-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
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
                        {(search || activeFilterCount > 0) && (
                            <button onClick={resetFilters} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-400 hover:text-white">
                                <X className="size-4" /> Réinitialiser
                            </button>
                        )}

                        <Link
                            href={route('sales.create')}
                            className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200"
                        >
                            <Plus className="size-4" /> Nouvelle vente
                        </Link>
                    </div>
                </div>

                {/* Panneau de filtres avancés */}
                {showFilters && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {/* Statut */}
                            <div>
                                <label className="mb-1 block text-xs text-slate-400">Statut</label>
                                <select
                                    value={status}
                                    onChange={e => setStatus(e.target.value)}
                                    className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-white focus:border-amber-300 focus:outline-none"
                                >
                                <option value="">Toutes (hors annulées)</option>
                                    <option value="completed">Terminée</option>
                                    <option value="pending">En attente / Crédit</option>
                                    <option value="cancelled">Annulées uniquement</option>
                                    <option value="returned">Retournée</option>
                                </select>
                            </div>

                            {/* Mode paiement */}
                            <div>
                                <label className="mb-1 block text-xs text-slate-400">Mode de paiement</label>
                                <select
                                    value={paymentMethod}
                                    onChange={e => setPaymentMethod(e.target.value)}
                                    className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-white focus:border-amber-300 focus:outline-none"
                                >
                                    <option value="">Tous les modes</option>
                                    <option value="cash">Espèces</option>
                                    <option value="card">Carte</option>
                                    <option value="transfer">Virement</option>
                                    <option value="check">Chèque</option>
                                    <option value="mobile">Mobile</option>
                                    <option value="multiple">Multiple</option>
                                    <option value="credit">Crédit</option>
                                </select>
                            </div>

                            {/* Date de */}
                            <div>
                                <label className="mb-1 block text-xs text-slate-400">Du</label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={e => setDateFrom(e.target.value)}
                                    className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-white focus:border-amber-300 focus:outline-none"
                                />
                            </div>

                            {/* Date au */}
                            <div>
                                <label className="mb-1 block text-xs text-slate-400">Au</label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={e => setDateTo(e.target.value)}
                                    className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-white focus:border-amber-300 focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Crédit uniquement */}
                        <div className="mt-3 flex items-center gap-3">
                            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={creditOnly}
                                    onChange={e => setCreditOnly(e.target.checked)}
                                    className="size-4 rounded border-white/20 bg-slate-800 accent-amber-300"
                                />
                                Afficher uniquement les ventes à crédit non soldées
                            </label>
                        </div>

                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={applyFilters}
                                className="rounded-lg bg-amber-300 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200"
                            >
                                Appliquer les filtres
                            </button>
                        </div>
                    </div>
                )}

                <p className="text-sm text-slate-400">
                    {sales.meta?.total ?? sales.data.length} vente{(sales.meta?.total ?? sales.data.length) > 1 ? 's' : ''}
                    {(search || activeFilterCount > 0) && ' · filtré(es)'}
                </p>

                <Table
                    data={sales.data}
                    columns={[
                        { key: 'ticket_number', label: 'N° Ticket' },
                        {
                            key: 'sale_date',
                            label: 'Date',
                            render: (sale) =>
                                new Date(sale.sale_date).toLocaleDateString('fr-FR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                }),
                        },
                        {
                            key: 'customer',
                            label: 'Client',
                            render: (sale) => sale.customer?.name || 'Anonyme',
                        },
                        {
                            key: 'payment_method',
                            label: 'Paiement',
                            render: (sale) => paymentMethodLabels[sale.payment_method] || sale.payment_method,
                        },
                        {
                            key: 'total',
                            label: 'Total',
                            align: 'right',
                            render: (sale) => <Currency amount={parseFloat(sale.total)} />,
                        },
                        {
                            key: 'remaining_amount',
                            label: 'Reste',
                            align: 'right',
                            render: (sale) => parseFloat(sale.remaining_amount) > 0 ? (
                                <span className="font-semibold text-rose-400">
                                    <Currency amount={parseFloat(sale.remaining_amount)} />
                                </span>
                            ) : (
                                <span className="text-slate-500">—</span>
                            ),
                        },
                        {
                            key: 'status',
                            label: 'Statut',
                            align: 'center',
                            render: (sale) => (
                                <TableBadge variant={getStatusVariant(sale.status)}>
                                    {statusLabels[sale.status] || sale.status}
                                </TableBadge>
                            ),
                        },
                        {
                            key: 'user',
                            label: 'Vendeur',
                            render: (sale) => sale.user.name,
                        },
                        {
                            key: 'actions',
                            label: 'Actions',
                            align: 'right',
                            render: (sale) => (
                                <TableActions>
                                    <Link
                                        href={route('sales.show', { sale: sale.id })}
                                        className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/10"
                                    >
                                        <Eye className="size-3.5" /> Voir
                                    </Link>
                                    {canCancelSale && sale.status !== 'cancelled' && (isAdmin || sale.status === 'completed') && (
                                        <TableActionButton
                                            variant="danger"
                                            onClick={() => handleDelete(sale)}
                                        >
                                            <Trash2 className="size-3.5" /> Annuler
                                        </TableActionButton>
                                    )}
                                    {isAdmin && sale.status === 'cancelled' && (
                                        <TableActionButton
                                            variant="success"
                                            onClick={() => handleRestore(sale)}
                                        >
                                            <RotateCcw className="size-3.5" /> Réactiver
                                        </TableActionButton>
                                    )}
                                </TableActions>
                            ),
                        },
                    ]}
                    emptyMessage="Aucune vente trouvée"
                />

                {/* Pagination */}
                {sales.links && (
                    <div className="flex items-center justify-center gap-1">
                        {sales.links.map((link: any, index: number) => (
                            <Link
                                key={index}
                                href={link.url || '#'}
                                className={`rounded-lg px-3 py-2 text-sm ${
                                    link.active
                                        ? 'bg-amber-300 text-slate-950 font-semibold'
                                        : 'border border-white/15 text-slate-200 hover:bg-white/10'
                                } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}

                {/* Modal de suppression */}
                <ConfirmDeleteModal
                    show={deleteModal.show}
                    onClose={() => setDeleteModal({ show: false, sale: null })}
                    onConfirm={confirmDelete}
                    title="Annuler la vente"
                    message={`Êtes-vous sûr de vouloir annuler la vente "${deleteModal.sale?.ticket_number}" ?`}
                    confirmText="Annuler la vente"
                    processing={deleting}
                />

                {/* Modal de réactivation */}
                {restoreModal.show && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-xl">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-full bg-emerald-400/10">
                                    <RotateCcw className="size-5 text-emerald-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-white">Réactiver la vente</h3>
                            </div>
                            <p className="mb-2 text-sm text-slate-300">
                                Voulez-vous réactiver la vente <strong className="text-white">{restoreModal.sale?.ticket_number}</strong> ?
                            </p>
                            <p className="mb-6 text-xs text-slate-400">
                                Le statut repassera à "Terminée" et le stock des produits tracés sera de nouveau déduit.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={confirmRestore}
                                    disabled={restoring}
                                    className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
                                >
                                    {restoring ? 'Réactivation...' : 'Confirmer'}
                                </button>
                                <button
                                    onClick={() => setRestoreModal({ show: false, sale: null })}
                                    className="flex-1 rounded-xl border border-white/15 py-2.5 text-sm text-slate-300 hover:bg-white/5"
                                >
                                    Fermer
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </AuthenticatedLayout>
    );
}
