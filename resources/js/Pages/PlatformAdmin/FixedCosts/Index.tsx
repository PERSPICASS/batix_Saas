import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Plus, Trash2, Edit2, DollarSign } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

interface FixedCost {
    id: number;
    name: string;
    category: string;
    amount_monthly: number;
    description: string | null;
    is_active: boolean;
    start_date: string | null;
    end_date: string | null;
}

interface Props {
    costs: FixedCost[];
    total_monthly: number;
}

const CATEGORIES = [
    { value: 'infrastructure', label: 'Infrastructure' },
    { value: 'api', label: 'API & Services' },
    { value: 'storage', label: 'Stockage' },
    { value: 'security', label: 'Sécurité' },
    { value: 'other', label: 'Autre' },
];

export default function FixedCostsIndex({ costs, total_monthly }: Props) {
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<Partial<FixedCost>>({
        name: '',
        category: 'infrastructure',
        amount_monthly: 0,
        is_active: true,
    });

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
        if (confirm('Êtes-vous sûr?')) {
            router.delete(`/platform-admin/fixed-costs/${id}`);
        }
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

    const groupedCosts = costs.reduce((acc, cost) => {
        const category = cost.category;
        if (!acc[category]) acc[category] = [];
        acc[category].push(cost);
        return acc;
    }, {} as Record<string, FixedCost[]>);

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-white">Charges Fixes</h2>}>
            <Head title="Charges Fixes" />

            <div className="mx-auto max-w-6xl space-y-6">
                {/* Add Button */}
                <div className="flex items-center justify-end">
                    <button
                        onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
                    >
                        <Plus className="size-4" />
                        Ajouter une charge
                    </button>
                </div>

                {/* Total Monthly */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex size-12 items-center justify-center rounded-lg bg-red-500/20">
                                <DollarSign className="size-6 text-red-400" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Charges mensuelles totales</p>
                                <p className="text-3xl font-bold text-white">€{total_monthly.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form */}
                {showForm && (
                    <form onSubmit={handleSubmit} className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300">Nom *</label>
                                <input
                                    type="text"
                                    value={formData.name || ''}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="ex: Serveur AWS"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300">Catégorie *</label>
                                <select
                                    value={formData.category || 'infrastructure'}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {CATEGORIES.map((cat) => (
                                        <option key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </option>
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
                                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0.00"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300">Description</label>
                            <textarea
                                value={formData.description || ''}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
                            >
                                {editingId ? 'Mettre à jour' : 'Ajouter'}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="flex-1 rounded-lg border border-white/10 px-4 py-2 font-medium text-slate-300 hover:bg-white/5"
                            >
                                Annuler
                            </button>
                        </div>
                    </form>
                )}

                {/* Costs by Category */}
                <div className="space-y-4">
                    {CATEGORIES.map((category) => {
                        const categoryName = category.value;
                        const categoryCosts = groupedCosts[categoryName] || [];
                        if (categoryCosts.length === 0) return null;

                        const categoryTotal = categoryCosts
                            .filter((c) => c.is_active)
                            .reduce((sum, c) => sum + parseFloat(c.amount_monthly.toString()), 0);

                        return (
                            <div key={categoryName} className="rounded-xl border border-white/10 bg-white/5 p-4">
                                <h3 className="mb-4 font-semibold text-white">{category.label}</h3>
                                <div className="space-y-2">
                                    {categoryCosts.map((cost) => (
                                        <div
                                            key={cost.id}
                                            className={`flex items-center justify-between rounded-lg border p-3 ${
                                                cost.is_active
                                                    ? 'border-white/10 bg-white/5'
                                                    : 'border-white/5 bg-white/[0.02] opacity-60'
                                            }`}
                                        >
                                            <div className="flex-1">
                                                <p className="font-medium text-white">{cost.name}</p>
                                                {cost.description && (
                                                    <p className="text-xs text-slate-500">{cost.description}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <p className="font-bold text-white">€{parseFloat(cost.amount_monthly.toString()).toFixed(2)}</p>
                                                    <p className="text-xs text-slate-500">/mois</p>
                                                </div>
                                                <button
                                                    onClick={() => handleEdit(cost)}
                                                    className="text-slate-400 hover:text-blue-400"
                                                >
                                                    <Edit2 className="size-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(cost.id)}
                                                    className="text-slate-400 hover:text-red-400"
                                                >
                                                    <Trash2 className="size-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-3 border-t border-white/10 pt-3 text-right">
                                    <p className="text-sm text-slate-400">
                                        Sous-total: <span className="font-semibold text-white">€{categoryTotal.toFixed(2)}</span>
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {costs.length === 0 && !showForm && (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
                        <p className="text-slate-400">Aucune charge définie. Commencez par en ajouter une.</p>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
