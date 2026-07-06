import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useLocale } from '@/contexts/LocaleContext';

export default function CreateFixedCost() {
    const { t } = useLocale();
    const CATEGORIES = Object.entries(t.platformFixedCosts.categories).map(([value, label]) => ({ value, label }));
    const CURRENCIES = Object.entries(t.platformFixedCosts.currencies).map(([code, label]) => ({ code, label }));
    const BILLING_CYCLES = Object.entries(t.platformFixedCosts.billingCycles).map(([value, label]) => ({ value, label }));
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        category: 'infrastructure',
        amount_monthly: '',
        currency: 'EUR',
        billing_cycle: 'monthly',
        description: '',
        is_active: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        router.post('/platform-admin/fixed-costs', formData);
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{t.platformFixedCosts.create.title}</h1>
                    <Link
                        href={route('platform.fixed-costs.index')}
                        className="flex items-center gap-2 text-sm text-amber-300 hover:text-amber-200"
                    >
                        <ArrowLeft className="size-4" />
                        {t.platformFixedCosts.create.backToList}
                    </Link>
                </div>
            }
        >
            <Head title={t.platformFixedCosts.create.title} />

            <div className="mx-auto max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-white/10 bg-white/5 p-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t.platformFixedCosts.form.name}</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-300/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-slate-500"
                            placeholder={t.platformFixedCosts.form.namePlaceholder}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t.platformFixedCosts.form.category}</label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-300/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
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
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t.platformFixedCosts.form.amount}</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.amount_monthly}
                                onChange={(e) => setFormData({ ...formData, amount_monthly: e.target.value })}
                                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-300/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-slate-500"
                                placeholder="0.00"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t.platformFixedCosts.form.currency}</label>
                            <select
                                value={formData.currency}
                                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-300/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
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
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t.platformFixedCosts.form.billingCycle}</label>
                        <select
                            value={formData.billing_cycle}
                            onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value })}
                            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-300/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                        >
                            {BILLING_CYCLES.map((cycle) => (
                                <option key={cycle.value} value={cycle.value}>
                                    {cycle.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t.platformFixedCosts.form.description}</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-300/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-slate-500"
                            rows={3}
                            placeholder={t.platformFixedCosts.form.descriptionPlaceholder}
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
                        <label htmlFor="is_active" className="text-sm text-slate-600 dark:text-slate-300">
                            {t.platformFixedCosts.form.isActive}
                        </label>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 rounded-lg bg-amber-300 px-4 py-2 font-medium text-slate-950 transition hover:bg-amber-200 disabled:opacity-50"
                        >
                            {loading ? t.platformFixedCosts.create.submitting : t.platformFixedCosts.create.submit}
                        </button>
                        <Link
                            href={route('platform.fixed-costs.index')}
                            className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-center font-medium text-slate-300 transition hover:bg-white/5"
                        >
                            {t.platformFixedCosts.form.cancel}
                        </Link>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
