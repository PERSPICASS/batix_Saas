import React, { FormEvent, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeft, Plus, X, AlertCircle } from 'lucide-react';

interface SubscriptionPlan {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    max_shops: number;
    max_users: number;
    features: string[] | null;
    is_active: boolean;
}

interface Props {
    plan: SubscriptionPlan;
    activeSubscriptionsCount: number;
}

export default function Edit({ plan, activeSubscriptionsCount }: Props) {
    // Debug: voir ce qui est reçu
    console.log('Plan received:', plan);
    console.log('Active subscriptions count:', activeSubscriptionsCount);
    
    const { data, setData, put, processing, errors } = useForm({
        name: plan.name || '',
        slug: plan.slug || '',
        description: plan.description || '',
        price: String(plan.price || 0),
        max_shops: String(plan.max_shops ?? 0),
        max_users: String(plan.max_users ?? 0),
        features: plan.features || [],
        is_active: plan.is_active ?? true,
    });

    const [featureInput, setFeatureInput] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        put(route('platform.subscriptions.update', plan.id));
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
                    <h1 className="text-xl font-semibold text-white">Modifier: {plan.name}</h1>
                </div>
            }
        >
            <Head title={`Modifier le Plan: ${plan.name}`} />

            <div className="space-y-4">
                {/* Avertissement pour les plans avec abonnements actifs */}
                {activeSubscriptionsCount > 0 && (
                    <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
                            <div>
                                <h3 className="text-sm font-medium text-yellow-400">
                                    Attention
                                </h3>
                                <p className="mt-1 text-sm text-yellow-300/90">
                                    Ce plan a {activeSubscriptionsCount} abonnement(s) actif(s). 
                                    Les modifications importantes (prix, limites) peuvent affecter les clients existants.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
                    {/* Nom et Slug */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="block space-y-1 text-sm text-slate-200">
                            <span>Nom du Plan *</span>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                                required
                            />
                            {errors.name && <span className="text-xs text-red-400">{errors.name}</span>}
                        </label>

                        <label className="block space-y-1 text-sm text-slate-200">
                            <span>Slug *</span>
                            <input
                                type="text"
                                value={data.slug}
                                onChange={(e) => setData('slug', e.target.value)}
                                className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                                required
                            />
                            <p className="text-xs text-slate-400">Identifiant unique (ex: starter, growth, scale)</p>
                            {errors.slug && <span className="text-xs text-red-400">{errors.slug}</span>}
                        </label>
                    </div>

                    {/* Description */}
                    <label className="block space-y-1 text-sm text-slate-200">
                        <span>Description</span>
                        <textarea
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={3}
                            className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                        />
                        {errors.description && <span className="text-xs text-red-400">{errors.description}</span>}
                    </label>

                    {/* Prix */}
                    <label className="block space-y-1 text-sm text-slate-200">
                        <span>Prix (XAF/mois) *</span>
                        <input
                            type="number"
                            step="0.01"
                            value={data.price}
                            onChange={(e) => setData('price', e.target.value)}
                            className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                            required
                        />
                        {errors.price && <span className="text-xs text-red-400">{errors.price}</span>}
                    </label>

                    {/* Limites */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="block space-y-1 text-sm text-slate-200">
                            <span>Nombre maximum de boutiques *</span>
                            <input
                                type="number"
                                value={data.max_shops}
                                onChange={(e) => setData('max_shops', e.target.value)}
                                className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                                required
                            />
                            <p className="text-xs text-slate-400">-1 pour illimité</p>
                            {errors.max_shops && <span className="text-xs text-red-400">{errors.max_shops}</span>}
                        </label>

                        <label className="block space-y-1 text-sm text-slate-200">
                            <span>Nombre maximum d'utilisateurs *</span>
                            <input
                                type="number"
                                value={data.max_users}
                                onChange={(e) => setData('max_users', e.target.value)}
                                className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                                required
                            />
                            <p className="text-xs text-slate-400">-1 pour illimité</p>
                            {errors.max_users && <span className="text-xs text-red-400">{errors.max_users}</span>}
                        </label>
                    </div>

                    {/* Fonctionnalités */}
                    <label className="block space-y-2 text-sm text-slate-200">
                        <span>Fonctionnalités</span>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={featureInput}
                                onChange={(e) => setFeatureInput(e.target.value)}
                                placeholder="Ajouter une fonctionnalité..."
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
                        {errors.features && <span className="text-xs text-red-400">{errors.features}</span>}

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
                        <span>Plan actif (visible pour les clients)</span>
                    </label>

                    {/* Boutons */}
                    <div className="flex justify-end gap-2 pt-4">
                        <Link
                            href={route('platform.subscriptions.index')}
                            className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/10 transition"
                        >
                            Annuler
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50 transition"
                        >
                            {processing ? 'Mise à jour...' : 'Mettre à Jour'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
