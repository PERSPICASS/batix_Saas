import { usePage, Link } from '@inertiajs/react';
import { CheckCircle2, Store, Package, ShoppingCart, ChevronRight, X } from 'lucide-react';
import { useState } from 'react';
import { useLocale } from '@/contexts/LocaleContext';

interface Onboarding {
    has_shop: boolean;
    has_product: boolean;
    has_sale: boolean;
    is_complete: boolean;
}

export default function GettingStarted({ onboarding }: { onboarding: Onboarding }) {
    const { auth, routeParams } = usePage<any>().props;
    const [dismissed, setDismissed] = useState(false);
    const { t } = useLocale();

    if (onboarding.is_complete || dismissed) return null;

    const codeUser = auth?.user?.code_user ?? routeParams?.code_user ?? '';

    const steps = [
        {
            key: 'has_shop' as const,
            label: t.gettingStarted.steps.shop.label,
            description: t.gettingStarted.steps.shop.description,
            icon: Store,
            href: `/${codeUser}/boutiques/create`,
            cta: t.gettingStarted.steps.shop.cta,
        },
        {
            key: 'has_product' as const,
            label: t.gettingStarted.steps.product.label,
            description: t.gettingStarted.steps.product.description,
            icon: Package,
            href: `/${codeUser}/produits/create`,
            cta: t.gettingStarted.steps.product.cta,
        },
        {
            key: 'has_sale' as const,
            label: t.gettingStarted.steps.sale.label,
            description: t.gettingStarted.steps.sale.description,
            icon: ShoppingCart,
            href: `/${codeUser}/ventes/create`,
            cta: t.gettingStarted.steps.sale.cta,
        },
    ];

    const completedCount = steps.filter(s => onboarding[s.key]).length;
    const progressPct = Math.round((completedCount / steps.length) * 100);

    return (
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-amber-50/60 to-transparent p-6 dark:border-amber-300/20 dark:from-amber-300/10 dark:via-amber-200/5 dark:to-transparent">
            <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">{t.gettingStarted.title}</h2>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                        {completedCount === 0
                            ? t.gettingStarted.progressZero
                            : t.gettingStarted.progressN(completedCount, steps.length)}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setDismissed(true)}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-gray-200 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-slate-300"
                >
                    <X className="size-4" />
                </button>
            </div>

            <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                <div
                    className="h-full rounded-full bg-amber-300 transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                />
            </div>

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
                                    ? 'border-emerald-300 bg-emerald-50 opacity-70 dark:border-emerald-500/20 dark:bg-emerald-500/5'
                                    : isNext
                                    ? 'border-amber-300 bg-amber-50 dark:border-amber-300/30 dark:bg-amber-300/10'
                                    : 'border-gray-200 bg-gray-50 dark:border-white/5 dark:bg-white/3'
                            }`}
                        >
                            <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                                done ? 'bg-emerald-100 dark:bg-emerald-500/20' : isNext ? 'bg-amber-100 dark:bg-amber-300/20' : 'bg-gray-200 dark:bg-white/5'
                            }`}>
                                {done ? (
                                    <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                    <span className={`text-sm font-bold ${isNext ? 'text-amber-600 dark:text-amber-300' : 'text-slate-500'}`}>
                                        {idx + 1}
                                    </span>
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className={`text-sm font-semibold ${done ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}>
                                    {step.label}
                                </p>
                                {!done && (
                                    <p className="mt-0.5 text-xs text-slate-500">{step.description}</p>
                                )}
                            </div>

                            {!done && (
                                <Link
                                    href={step.href}
                                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                        isNext
                                            ? 'bg-amber-300 text-slate-950 hover:bg-amber-200'
                                            : 'border border-gray-300 text-slate-500 hover:bg-gray-100 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/5'
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
