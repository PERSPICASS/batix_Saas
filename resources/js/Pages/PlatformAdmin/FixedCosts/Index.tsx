import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Search, DollarSign, Edit2, Trash2, Plus } from 'lucide-react';
import Table, { TableActions, TableActionButton, TableBadge } from '@/Components/Table';
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
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
    const [formData, setFormData] = useState<Partial<FixedCost>>({
        name: '',
        category: 'infrastructure',
        amount_monthly: 0,
        is_active: true,
    });

    const filteredCosts = costs.filter(cost =>
        cost.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cost.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeCosts = filteredCosts.filter(c => c.is_active);
    const inactiveCosts = filteredCosts.filter(c => !c.is_active);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            router.put(`/platform-admin/fixed-costs/${editingId}`, formData as any);
        } else {
            router.post('/platform-admin/fixed-costs', formData as any);
        }
        resetForm();
    };

    const handleEdit = (cost: FixedCost) => {
        setFormData(cost);
        setEditingId(cost.id);
        setShowForm(true);
    };

    const handleDelete = (id: number) => {
        router.delete(`/platform-admin/fixed-costs/${id}`, {
            onSuccess: () => setConfirmDelete(null),
        });
    };

    const resetForm = () => {
        setFormData({
            name: '',
            category: 'infrastructure',
            amount_monthly: 0,
            is_active: true,
        });
        setEditingId(null);
        setShowForm(false);
    };

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
                    <button
                        type="button"
                        onClick={() => handleEdit(cost)}
                        className="rounded-lg p-2 text-blue-300 transition hover:bg-blue-500/10"
                        title="Modifier"
                    >
                        <Edit2 className="size-4" />
                    </button>
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
                {/* Recherche et ajout */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                    <form onSubmit={(e) => e.preventDefault()} className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Rechercher par nom ou catégorie..."
                                className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-300/20"
                            />
                        </div>
                    </form>

                    <button
                        onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
                        className="flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 font-medium text-slate-950 transition hover:bg-amber-200"
                    >
                        <Plus className="size-4" />
                        Ajouter
                    </button>
                </div>

                {/* Stats rapides */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                        <p className="text-sm text-slate-400">Charges actives</p>
                        <p className="mt-1 text-2xl font-bold text-white">{activeCosts.length}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                        <p className="text-sm text-slate-400">Total charges</p>
                        <p className="mt-1 text-2xl font-bold text-white">€{total_monthly.toFixed(2)}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                        <p className="text-sm text-slate-400">Charges inactives</p>
                        <p className="mt-1 text-2xl font-bold text-white">{inactiveCosts.length}</p>
                    </div>
                </div>

                {/* Formulaire d'ajout/modification */}
                {showForm && (
                    <form onSubmit={handleSubmit} className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300">Nom *</label>
                                <input
                                    type="text"
                                    value={formData.name || ''}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-300/20"
                                    placeholder="ex: Serveur AWS"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300">Catégorie *</label>
                                <select
                                    value={formData.category || 'infrastructure'}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-300/20"
                                >
                                    {Object.entries(CATEGORIES).map(([key, value]) => (
                                        <option key={key} value={key}>{value}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300">Montant mensuel (€) *</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.amount_monthly || 0}
                                onChange={(e) => setFormData({ ...formData, amount_monthly: parseFloat(e.target.value) })}
                                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-300/20"
                                placeholder="0.00"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300">Description</label>
                            <textarea
                                value={formData.description || ''}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-300/20"
                                rows={2}
                                placeholder="Notes optionnelles"
                            />
                        </div>

                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active || false}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="rounded"
                                />
                                <span className="text-sm text-slate-300">Charge active</span>
                            </label>
                        </div>

                        <div className="flex gap-2 pt-4">
                            <button
                                type="submit"
                                className="flex-1 rounded-lg bg-amber-300 px-4 py-2 font-medium text-slate-950 transition hover:bg-amber-200"
                            >
                                {editingId ? 'Mettre à jour' : 'Ajouter'}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="flex-1 rounded-lg border border-white/10 px-4 py-2 font-medium text-slate-300 transition hover:bg-white/5"
                            >
                                Annuler
                            </button>
                        </div>
                    </form>
                )}

                {/* Table */}
                <Table
                    columns={columns}
                    data={filteredCosts}
                    emptyMessage="Aucune charge trouvée."
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
