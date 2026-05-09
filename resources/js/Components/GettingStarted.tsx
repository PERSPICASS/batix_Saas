import { usePage, Link } from '@inertiajs/react';
import { CheckCircle2, Circle, Store, Package, ShoppingCart, ChevronRight, X } from 'lucide-react';
import { useState } from 'react';

interface Onboarding {
    has_shop: boolean;
    has_product: boolean;
    has_sale: boolean;
    is_complete: boolean;
}

interface Step {
    key: keyof Omit<Onboarding, 'is_complete'>;
    label: string;
    description: string;
    icon: React.ElementType;
    href: string;
    cta: string;
}

export default function GettingStarted({ onboarding }: { onboarding: Onboarding }) {
    const { auth, routeParams } = usePage<any>().props;
    const [dismissed, setDismissed] = useState(false);

    if (onboarding.is_complete || dismissed) return null;

    const codeUser = auth?.user?.code_user ?? routeParams?.code_user ?? '';

    const steps: Step[] = [
        {
            key: 'has_shop',
            label: 'Créer votre boutique',
            description: 'Configurez votre première boutique pour commencer.',
            icon: Store,
            href: `/${codeUser}/boutiques/create`,
            cta: 'Créer une boutique',
        },
        {
            key: 'has_product',
            label: 'Ajouter vos produits',
            description: 'Renseignez votre catalogue de produits et stocks.',
            icon: Package,
            href: `/${codeUser}/produits/create`,
            cta: 'Ajouter un produit',
        },
        {
            key: 'has_sale',
            label: 'Effectuer une vente',
            description: 'Enregistrez votre première transaction.',
            icon: ShoppingCart,
            href: `/${codeUser}/ventes/create`,
            cta: 'Nouvelle vente',
        },
    ];

    const completedCount = steps.filter(s => onboarding[s.key]).length;
    const progressPct = Math.round((completedCount / steps.length) * 100);

    return (
        <div className="rounded-2xl border border-amber-300/20 bg-gradient-to-br from-amber-300/10 via-amber-200/5 to-transparent p-6">
            {/* Header */}
            <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-base font-bold text-white">Démarrage rapide</h2>
                    <p className="mt-0.5 text-sm text-slate-400">
                        {completedCount === 0
                            ? 'Suivez ces 3 étapes pour lancer votre activité.'
                            : `${completedCount} sur ${steps.length} étapes complétées.`}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setDismissed(true)}
                    className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-slate-300"
                >
                    <X className="size-4" />
                </button>
            </div>

            {/* Progress bar */}
            <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                    className="h-full rounded-full bg-amber-300 transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                />
            </div>

            {/* Steps */}
            <div className="space-y-3">
                {steps.map((step, idx) => {
                    const done = onboarding[step.key];
                    const Icon = step.icon;
                    const isNext = !done && steps.slice(0, idx).every(s => onboarding[s.key]);

                    return (
                        <div
                            key={step.key}
                            className={`flex items-center gap-4 rounded-xl border px-4 py-3.5 transition ${
                                done
                                    ? 'border-emerald-500/20 bg-emerald-500/5 opacity-70'
                                    : isNext
                                    ? 'border-amber-300/30 bg-amber-300/10'
                                    : 'border-white/5 bg-white/3'
                            }`}
                        >
                            {/* Step number / check */}
                            <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                                done ? 'bg-emerald-500/20' : isNext ? 'bg-amber-300/20' : 'bg-white/5'
                            }`}>
                                {done ? (
                                    <CheckCircle2 className="size-5 text-emerald-400" />
                                ) : (
                                    <span className={`text-sm font-bold ${isNext ? 'text-amber-300' : 'text-slate-500'}`}>
                                        {idx + 1}
                                    </span>
                                )}
                            </div>

                            {/* Content */}
                            <div className="min-w-0 flex-1">
                                <p className={`text-sm font-semibold ${done ? 'text-slate-400 line-through' : 'text-white'}`}>
                                    {step.label}
                                </p>
                                {!done && (
                                    <p className="mt-0.5 text-xs text-slate-500">{step.description}</p>
                                )}
                            </div>

                            {/* CTA */}
                            {!done && (
                                <Link
                                    href={step.href}
                                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                        isNext
                                            ? 'bg-amber-300 text-slate-950 hover:bg-amber-200'
                                            : 'border border-white/10 text-slate-400 hover:bg-white/5'
                                    }`}
                                >
                                    {step.cta}
                                    <ChevronRight className="size-3" />
                                </Link>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
