import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Eye, Pencil, Trash2, ClipboardCheck } from 'lucide-react';
import Table, { TableActions, TableActionButton } from '@/Components/Table';
import { useState } from 'react';
import { useRoute } from '@/utils/route';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';

interface Shop {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
}

interface Inventory {
    id: number;
    inventory_number: string;
    inventory_date: string;
    status: string;
    total_items: number;
    total_discrepancies: number;
    shop: Shop;
    user: User;
}

interface PaginatedInventories {
    data: Inventory[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    inventories: PaginatedInventories;
    filters: {
        status?: string;
    };
}

export default function InventoryIndex({ inventories, filters }: Props) {
    const route = useRoute();

    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [deleteModal, setDeleteModal] = useState<{ show: boolean; inventory: Inventory | null }>({ show: false, inventory: null });
    const [completeModal, setCompleteModal] = useState<{ show: boolean; inventory: Inventory | null }>({ show: false, inventory: null });
    const [processing, setProcessing] = useState(false);

    const handleSearch = () => {
        router.get(route('inventory.index'), { status: statusFilter }, { preserveState: true });
    };

    const handleDelete = (inventory: Inventory) => {
        setDeleteModal({ show: true, inventory });
    };

    const confirmDelete = () => {
        if (!deleteModal.inventory) return;
        setProcessing(true);
        router.delete(route('inventory.destroy', { inventory: deleteModal.inventory.id }), {
            onSuccess: () => {
                setDeleteModal({ show: false, inventory: null });
                setProcessing(false);
            },
            onError: () => setProcessing(false),
        });
    };

    const handleComplete = (inventory: Inventory) => {
        setCompleteModal({ show: true, inventory });
    };

    const confirmComplete = () => {
        if (!completeModal.inventory) return;
        setProcessing(true);
        router.post(route('inventory.complete', { inventory: completeModal.inventory.id }), {}, {
            onSuccess: () => {
                setCompleteModal({ show: false, inventory: null });
                setProcessing(false);
            },
            onError: () => setProcessing(false),
        });
    };

    const getStatusBadge = (status: string) => {
        const statuses: Record<string, { label: string; bg: string; text: string }> = {
            draft: { label: 'Brouillon', bg: 'bg-slate-500/20', text: 'text-slate-300' },
            in_progress: { label: 'En cours', bg: 'bg-blue-500/20', text: 'text-blue-300' },
            completed: { label: 'Terminé', bg: 'bg-green-500/20', text: 'text-green-300' },
            cancelled: { label: 'Annulé', bg: 'bg-red-500/20', text: 'text-red-300' },
        };

        const statusInfo = statuses[status] || statuses.draft;

        return (
            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}>
                {statusInfo.label}
            </span>
        );
    };

    const columns = [
        {
            key: 'inventory_number',
            label: 'Numéro',
            render: (inventory: Inventory) => (
                <span className="font-medium text-amber-300">{inventory.inventory_number}</span>
            ),
        },
        {
            key: 'inventory_date',
            label: 'Date',
            render: (inventory: Inventory) => new Date(inventory.inventory_date).toLocaleDateString('fr-FR'),
        },
        {
            key: 'shop',
            label: 'Boutique',
            render: (inventory: Inventory) => inventory.shop.name,
        },
        {
            key: 'total_items',
            label: 'Produits',
            align: 'center' as const,
            render: (inventory: Inventory) => (
                <span className="font-semibold text-slate-200">{inventory.total_items}</span>
            ),
        },
        {
            key: 'total_discrepancies',
            label: 'Écarts',
            align: 'center' as const,
            render: (inventory: Inventory) => (
                <span className={`font-semibold ${inventory.total_discrepancies > 0 ? 'text-amber-400' : 'text-green-400'}`}>
                    {inventory.total_discrepancies}
                </span>
            ),
        },
        {
            key: 'status',
            label: 'Statut',
            render: (inventory: Inventory) => getStatusBadge(inventory.status),
        },
        {
            key: 'user',
            label: 'Créé par',
            render: (inventory: Inventory) => (
                <span className="text-sm text-slate-300">{inventory.user.name}</span>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            align: 'right' as const,
            render: (inventory: Inventory) => (
                <TableActions>
                    <Link
                        href={route('inventory.show', { inventory: inventory.id })}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/10"
                    >
                        <Eye className="size-3.5" /> Voir
                    </Link>
                    {inventory.status !== 'completed' && (
                        <>
                            <Link
                                href={route('inventory.edit', { inventory: inventory.id })}
                                className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/10"
                            >
                                <Pencil className="size-3.5" /> Modifier
                            </Link>
                            <TableActionButton variant="success" onClick={() => handleComplete(inventory)}>
                                <ClipboardCheck className="size-3.5" /> Terminer
                            </TableActionButton>
                            <TableActionButton variant="danger" onClick={() => handleDelete(inventory)}>
                                <Trash2 className="size-3.5" /> Supprimer
                            </TableActionButton>
                        </>
                    )}
                </TableActions>
            ),
        },
    ];

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">Inventaires</h1>}>
            <Head title="Inventaires" />

            <section className="space-y-6">
                {/* Filters */}
                <div className="flex items-center justify-between">
                    <div className="flex gap-4">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="rounded-lg border border-white/15 bg-slate-900/70 px-4 py-2 text-sm text-slate-200"
                        >
                            <option value="">Tous les statuts</option>
                            <option value="draft">Brouillon</option>
                            <option value="in_progress">En cours</option>
                            <option value="completed">Terminé</option>
                            <option value="cancelled">Annulé</option>
                        </select>
                        <button
                            onClick={handleSearch}
                            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/5"
                        >
                            Filtrer
                        </button>
                    </div>
                    <Link
                        href={route('inventory.create')}
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200"
                    >
                        <Plus className="size-4" /> Nouvel inventaire
                    </Link>
                </div>

                {/* Table */}
                <Table columns={columns} data={inventories.data} />

                {/* Pagination */}
                {inventories.links && (
                    <div className="flex items-center justify-center gap-1">
                        {inventories.links.map((link, index) => (
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
                    onClose={() => setDeleteModal({ show: false, inventory: null })}
                    onConfirm={confirmDelete}
                    message={`Êtes-vous sûr de vouloir supprimer l'inventaire "${deleteModal.inventory?.inventory_number}" ?`}
                    processing={processing}
                />

                {/* Modal de confirmation pour terminer l'inventaire */}
                <ConfirmDeleteModal
                    show={completeModal.show}
                    onClose={() => setCompleteModal({ show: false, inventory: null })}
                    onConfirm={confirmComplete}
                    title="Terminer l'inventaire"
                    message={`Terminer l'inventaire "${completeModal.inventory?.inventory_number}" ? Les différences seront appliquées au stock.`}
                    confirmText="Terminer"
                    processing={processing}
                />
            </section>
        </AuthenticatedLayout>
    );
}
