import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { DollarSign, Edit2, Trash2, Plus } from 'lucide-react';
import Table, { TableActions, TableBadge } from '@/Components/Table';
import { useState } from 'react';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';

interface FixedCost {
    id: number;
    name: string;
    category: string;
    amount_monthly: number;
    description: string | null;
    is_active: boolean;
    created_at: string;
}

interface Props {
    costs: FixedCost[];
    total_monthly: number;
}

const CATEGORIES = {
    infrastructure: 'Infrastructure',
    api: 'API & Services',
    storage: 'Stockage',
    security: 'Sécurité',
    other: 'Autre',
};

export default function FixedCostsIndex({ costs, total_monthly }: Props) {
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

    const handleDelete = (id: number) => {
        router.delete(`/platform-admin/fixed-costs/${id}`, {
            onSuccess: () => setConfirmDelete(null),
        });
    };

    const activeCosts = costs.filter(c => c.is_active);
    const inactiveCosts = costs.filter(c => !c.is_active);

    const columns = [
        {
            key: 'name',
            label: 'Charge',
            render: (cost: FixedCost) => (
                <div>
                    <p className="font-medium text-white">{cost.name}</p>
                    {cost.description && (
                        <p className="text-xs text-slate-400">{cost.description}</p>
                    )}
                </div>
            ),
        },
        {
            key: 'category',
            label: 'Catégorie',
            render: (cost: FixedCost) => (
                <span className="rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-300">
                    {CATEGORIES[cost.category as keyof typeof CATEGORIES] || cost.category}
                </span>
            ),
        },
        {
            key: 'amount_monthly',
            label: 'Montant mensuel',
            render: (cost: FixedCost) => (
                <div className="flex items-center gap-2 font-semibold text-amber-300">
                    <DollarSign className="size-4" />
                    €{parseFloat(cost.amount_monthly.toString()).toFixed(2)}
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Statut',
            render: (cost: FixedCost) => (
                <TableBadge variant={cost.is_active ? 'success' : 'danger'}>
                    {cost.is_active ? 'Actif' : 'Inactif'}
                </TableBadge>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (cost: FixedCost) => (
                <TableActions>
                    <Link
                        href={route('platform.fixed-costs.edit', cost.id)}
                        className="rounded-lg p-2 text-blue-300 transition hover:bg-blue-500/10"
                        title="Modifier"
                    >
                        <Edit2 className="size-4" />
                    </Link>
                    <button
                        type="button"
                        onClick={() => setConfirmDelete(cost.id)}
                        className="rounded-lg p-2 text-red-300 transition hover:bg-red-500/10"
                        title="Supprimer"
                    >
                        <Trash2 className="size-4" />
                    </button>
                </TableActions>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-white">Charges Fixes</h1>
                    <Link
                        href={route('platform.dashboard')}
                        className="text-sm text-amber-300 hover:text-amber-200"
                    >
                        ← Retour au dashboard
                    </Link>
                </div>
            }
        >
            <Head title="Charges Fixes - Admin Plateforme" />

            <div className="space-y-6">
                {/* Boutons et stats */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-1">
                        <p className="text-sm text-slate-400">Charges actives: <span className="font-semibold text-white">{activeCosts.length}</span></p>
                        <p className="text-sm text-slate-400">Total mensuel: <span className="font-semibold text-amber-300">€{total_monthly.toFixed(2)}</span></p>
                    </div>
                    <Link
                        href={route('platform.fixed-costs.create')}
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 font-medium text-slate-950 transition hover:bg-amber-200"
                    >
                        <Plus className="size-4" />
                        Nouvelle charge
                    </Link>
                </div>

                {/* Table */}
                <Table
                    columns={columns}
                    data={costs}
                    emptyMessage="Aucune charge définie."
                />
            </div>

            {/* Modal de confirmation suppression */}
            {confirmDelete && (
                <ConfirmDeleteModal
                    show={true}
                    onClose={() => setConfirmDelete(null)}
                    onConfirm={() => handleDelete(confirmDelete)}
                    title="Supprimer la charge"
                    message="Êtes-vous sûr de vouloir supprimer cette charge ? Cette action est irréversible."
                />
            )}
        </AuthenticatedLayout>
    );
}
