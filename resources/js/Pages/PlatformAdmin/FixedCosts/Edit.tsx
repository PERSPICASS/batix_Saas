import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';

interface FixedCost {
    id: number;
    name: string;
    category: string;
    amount_monthly: number;
    currency: string;
    billing_cycle: string;
    description: string | null;
    is_active: boolean;
}

interface Props {
    cost: FixedCost;
}

const CATEGORIES = [
    { value: 'infrastructure', label: 'Infrastructure' },
    { value: 'api', label: 'API & Services' },
    { value: 'storage', label: 'Stockage' },
    { value: 'security', label: 'Sécurité' },
    { value: 'other', label: 'Autre' },
];

const CURRENCIES = [
    { code: 'EUR', label: 'Euro (€)' },
    { code: 'USD', label: 'Dollar US ($)' },
    { code: 'FCFA', label: 'Franc CFA (FCFA)' },
];

const BILLING_CYCLES = [
    { value: 'monthly', label: 'Mensuel' },
    { value: 'annual', label: 'Annuel' },
];

export default function EditFixedCost({ cost }: Props) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: cost.name,
        category: cost.category,
        amount_monthly: cost.amount_monthly.toString(),
        currency: cost.currency,
        billing_cycle: cost.billing_cycle,
        description: cost.description || '',
        is_active: cost.is_active,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        router.put(`/platform-admin/fixed-costs/${cost.id}`, formData);
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-white">Modifier Charge Fixe</h1>
                    <Link
                        href={route('platform.fixed-costs.index')}
                        className="flex items-center gap-2 text-sm text-amber-300 hover:text-amber-200"
                    >
                        <ArrowLeft className="size-4" />
                        Retour à la liste
                    </Link>
                </div>
            }
        >
            <Head title="Modifier Charge Fixe" />

            <div className="mx-auto max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-white/10 bg-white/5 p-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300">Nom *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-slate-500 focus:border-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-300/20"
                            placeholder="ex: Serveur AWS"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300">Catégorie *</label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-300/20"
                        >
                            {CATEGORIES.map((cat) => (
                                <option key={cat.value} value={cat.value}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300">Montant *</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.amount_monthly}
                                onChange={(e) => setFormData({ ...formData, amount_monthly: e.target.value })}
                                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-slate-500 focus:border-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-300/20"
                                placeholder="0.00"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300">Devise *</label>
                            <select
                                value={formData.currency}
                                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-300/20"
                            >
                                {CURRENCIES.map((curr) => (
                                    <option key={curr.code} value={curr.code}>
                                        {curr.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300">Cycle de facturation *</label>
                        <select
                            value={formData.billing_cycle}
                            onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value })}
                            className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-300/20"
                        >
                            {BILLING_CYCLES.map((cycle) => (
                                <option key={cycle.value} value={cycle.value}>
                                    {cycle.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-slate-500 focus:border-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-300/20"
                            rows={3}
                            placeholder="Notes optionnelles"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="rounded"
                        />
                        <label htmlFor="is_active" className="text-sm text-slate-300">
                            Charge active
                        </label>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 rounded-lg bg-amber-300 px-4 py-2 font-medium text-slate-950 transition hover:bg-amber-200 disabled:opacity-50"
                        >
                            {loading ? 'Mise à jour...' : 'Mettre à jour'}
                        </button>
                        <Link
                            href={route('platform.fixed-costs.index')}
                            className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-center font-medium text-slate-300 transition hover:bg-white/5"
                        >
                            Annuler
                        </Link>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
