import React, { FormEvent, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeft, Plus, X } from 'lucide-react';
import InputError from '@/Components/InputError';
import { useLocale } from '@/contexts/LocaleContext';

export default function Create() {
    const { t } = useLocale();
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        slug: '',
        description: '',
        price: '',
        max_shops: '',
        max_users: '',
        max_products: '',
        max_depots: '',
        features: [] as string[],
        is_active: true,
    });

    const [featureInput, setFeatureInput] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(route('platform.subscriptions.store'));
    };

    const addFeature = () => {
        if (featureInput.trim()) {
            setData('features', [...data.features, featureInput.trim()]);
            setFeatureInput('');
        }
    };

    const removeFeature = (index: number) => {
        setData('features', data.features.filter((_, i) => i !== index));
    };

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    };

    const handleNameChange = (name: string) => {
        setData('name', name);
        if (!data.slug) {
            setData('slug', generateSlug(name));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-4">
                    <Link
                        href={route('platform.subscriptions.index')}
                        className="rounded-lg border border-white/15 p-2 text-slate-200 hover:bg-white/10 transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-xl font-semibold text-white">{t.platformSubscriptionPlans.create.title}</h1>
                </div>
            }
        >
            <Head title={t.platformSubscriptionPlans.create.headTitle} />

            <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
                {/* Nom et Slug */}
                <div className="grid gap-4 md:grid-cols-2">
                    <label className="block space-y-1 text-sm text-slate-200">
                        <span>{t.platformSubscriptionPlans.form.name}</span>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                            required
                        />
                        <InputError message={errors.name} />
                    </label>

                    <label className="block space-y-1 text-sm text-slate-200">
                        <span>{t.platformSubscriptionPlans.form.slug}</span>
                        <input
                            type="text"
                            value={data.slug}
                            onChange={(e) => setData('slug', e.target.value)}
                            className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                            required
                        />
                        <p className="text-xs text-slate-400">{t.platformSubscriptionPlans.form.slugHint}</p>
                        <InputError message={errors.slug} />
                    </label>
                </div>

                {/* Description */}
                <label className="block space-y-1 text-sm text-slate-200">
                    <span>{t.platformSubscriptionPlans.form.description}</span>
                    <textarea
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                    />
                    <InputError message={errors.description} />
                </label>

                {/* Prix */}
                <label className="block space-y-1 text-sm text-slate-200">
                    <span>{t.platformSubscriptionPlans.form.price}</span>
                    <input
                        type="number"
                        step="0.01"
                        value={data.price}
                        onChange={(e) => setData('price', e.target.value)}
                        className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                        required
                    />
                    <InputError message={errors.price} />
                </label>

                {/* Limites */}
                <div className="grid gap-4 md:grid-cols-2">
                    <label className="block space-y-1 text-sm text-slate-200">
                        <span>{t.platformSubscriptionPlans.form.maxShops}</span>
                        <input
                            type="number"
                            value={data.max_shops}
                            onChange={(e) => setData('max_shops', e.target.value)}
                            className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                            required
                        />
                        <p className="text-xs text-slate-400">{t.platformSubscriptionPlans.form.unlimitedHint}</p>
                        <InputError message={errors.max_shops} />
                    </label>

                    <label className="block space-y-1 text-sm text-slate-200">
                        <span>{t.platformSubscriptionPlans.form.maxUsers}</span>
                        <input
                            type="number"
                            value={data.max_users}
                            onChange={(e) => setData('max_users', e.target.value)}
                            className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                            required
                        />
                        <p className="text-xs text-slate-400">{t.platformSubscriptionPlans.form.unlimitedHint}</p>
                        <InputError message={errors.max_users} />
                    </label>

                    <label className="block space-y-1 text-sm text-slate-200">
                        <span>{t.platformSubscriptionPlans.form.maxProducts}</span>
                        <input
                            type="number"
                            value={data.max_products}
                            onChange={(e) => setData('max_products', e.target.value)}
                            className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                            required
                        />
                        <p className="text-xs text-slate-400">{t.platformSubscriptionPlans.form.unlimitedHint}</p>
                        <InputError message={errors.max_products} />
                    </label>

                    <label className="block space-y-1 text-sm text-slate-200">
                        <span>{t.platformSubscriptionPlans.form.maxDepots}</span>
                        <input
                            type="number"
                            value={data.max_depots}
                            onChange={(e) => setData('max_depots', e.target.value)}
                            className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                            required
                        />
                        <p className="text-xs text-slate-400">{t.platformSubscriptionPlans.form.unlimitedOrNoneHint}</p>
                        <InputError message={errors.max_depots} />
                    </label>
                </div>

                {/* Fonctionnalités */}
                <label className="block space-y-2 text-sm text-slate-200">
                    <span>{t.platformSubscriptionPlans.form.features}</span>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={featureInput}
                            onChange={(e) => setFeatureInput(e.target.value)}
                            placeholder={t.platformSubscriptionPlans.form.addFeaturePlaceholder}
                            className="flex-1 rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addFeature();
                                }
                            }}
                        />
                        <button
                            type="button"
                            onClick={addFeature}
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-500 transition"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                    <InputError message={errors.features} />

                    {data.features.length > 0 && (
                        <div className="space-y-2 mt-3">
                            {data.features.map((feature, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900/50 px-4 py-2"
                                >
                                    <span className="text-slate-200">{feature}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeFeature(index)}
                                        className="text-red-400 hover:text-red-300 transition"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </label>

                {/* Statut */}
                <label className="flex items-center gap-2 text-sm text-slate-200">
                    <input
                        type="checkbox"
                        checked={data.is_active}
                        onChange={(e) => setData('is_active', e.target.checked)}
                        className="rounded border border-white/15 bg-slate-900/70"
                    />
                    <span>{t.platformSubscriptionPlans.form.isActive}</span>
                </label>

                {/* Boutons */}
                <div className="flex justify-end gap-2 pt-4">
                    <Link
                        href={route('platform.subscriptions.index')}
                        className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/10 transition"
                    >
                        {t.platformSubscriptionPlans.form.cancel}
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50 transition"
                    >
                        {processing ? t.platformSubscriptionPlans.create.submitting : t.platformSubscriptionPlans.create.submit}
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
