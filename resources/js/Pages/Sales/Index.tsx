import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Table, { TableActionButton, TableActions, TableBadge } from '@/Components/Table';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Eye, Trash2 } from 'lucide-react';
import Currency from '@/Components/Currency';
import { useRoute } from '@/utils/route';
import { useState } from 'react';
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
}

interface Props extends PageProps {
    sales: PaginatedData;
    stats: Stats;
}

const paymentMethodLabels: Record<string, string> = {
    cash: 'Espèces',
    card: 'Carte',
    transfer: 'Virement',
    check: 'Chèque',
    mobile: 'Mobile',
    multiple: 'Multiple',
};

const statusLabels: Record<string, string> = {
    completed: 'Terminée',
    pending: 'En attente',
    cancelled: 'Annulée',
    returned: 'Retournée',
};

export default function SalesIndex({ sales, stats, auth }: Props) {
    const route = useRoute();
    const [deleteModal, setDeleteModal] = useState<{ show: boolean; sale: Sale | null }>({ show: false, sale: null });
    const [deleting, setDeleting] = useState(false);
    
    // Les caissiers ne peuvent pas annuler des ventes
    const canCancelSale = auth.user?.role !== 'cashier' && auth.user?.role !== 'caisse';

    const handleDelete = (sale: Sale) => {
        setDeleteModal({ show: true, sale });
    };

    const confirmDelete = () => {
        if (!deleteModal.sale) return;
        setDeleting(true);
        router.delete(route('sales.destroy', { sale: deleteModal.sale.id }), {
            onSuccess: () => {
                setDeleteModal({ show: false, sale: null });
                setDeleting(false);
            },
            onError: () => setDeleting(false),
        });
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'completed':
                return 'success';
            case 'pending':
                return 'warning';
            case 'cancelled':
            case 'returned':
                return 'danger';
            default:
                return 'default';
        }
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">Ventes</h1>}>
            <Head title="Ventes" />
            <section className="space-y-4">
                {/* Statistiques */}
                <div className="grid gap-4 md:grid-cols-2">
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
                </div>

                <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-300">
                        {sales.data.length} vente{sales.data.length > 1 ? 's' : ''}
                    </p>
                    <Link
                        href={route('sales.create')}
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200"
                    >
                        <Plus className="size-4" /> Nouvelle vente
                    </Link>
                </div>

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
                                    {sale.status === 'completed' && canCancelSale && (
                                        <TableActionButton
                                            variant="danger"
                                            onClick={() => handleDelete(sale)}
                                        >
                                            <Trash2 className="size-3.5" /> Annuler
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
            </section>
        </AuthenticatedLayout>
    );
}
