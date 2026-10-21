import { Head, Link } from '@inertiajs/react';
import { Check, ArrowRight, ArrowLeft } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { useLocale } from '@/contexts/LocaleContext';

interface SubscriptionPlan {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    max_shops: number;
    max_users: number;
    max_products: number;
    max_depots: number;
    features: string[] | null;
    is_active: boolean;
    price_eur: string;
    price_fcfa: string;
    formatted_price: string;
    has_unlimited_shops: boolean;
    has_unlimited_users: boolean;
    has_unlimited_products: boolean;
    has_unlimited_depots: boolean;
}

interface PlansProps extends PageProps {
    plans: SubscriptionPlan[];
}

export default function Index({ plans, auth }: PlansProps) {
    const { t } = useLocale();
    const currentPlanSlug = auth.user && 'subscription' in auth ? (auth as any).subscription?.plan_slug : null;

    const getPlanBadge = (planSlug: string): string => {
        const badges: Record<string, string> = {
            free: t.plans.badges.free,
            starter: t.plans.badges.starter,
            growth: t.plans.badges.growth,
            scale: t.plans.badges.scale,
        };
        return badges[planSlug] || t.plans.badges.default;
    };

    const getPlanFeatures = (plan: SubscriptionPlan): string[] => {
        const shopsLabel = plan.has_unlimited_shops
            ? t.plans.features.unlimitedShops
            : t.plans.features.shopsCount(plan.max_shops);

        const usersLabel = plan.has_unlimited_users
            ? t.plans.features.unlimitedUsers
            : t.plans.features.usersCount(plan.max_users);

        const productsLabel = plan.has_unlimited_products
            ? t.plans.features.unlimitedProducts
            : t.plans.features.productsCount(plan.max_products);

        const depotsLabel = plan.max_depots === 0
            ? t.plans.features.noDepot
            : plan.has_unlimited_depots
                ? t.plans.features.unlimitedDepots
                : t.plans.features.depotsCount(plan.max_depots);

        const baseFeatures = [
            shopsLabel,
            usersLabel,
            productsLabel,
            depotsLabel,
            t.plans.features.salesAndPos,
            t.plans.features.purchaseManagement,
            t.plans.features.reportsAndStats,
        ];

        // Add AI Assistant for Growth, Pro, and Enterprise plans
        if (['growth', 'pro', 'enterprise'].includes(plan.slug)) {
            baseFeatures.push(t.plans.features.aiAgent);
        }

        return baseFeatures;
    };

    const isCurrentPlan = (planSlug: string) => {
        return currentPlanSlug === planSlug;
    };

    const isHighlighted = (planSlug: string) => {
        return planSlug === 'growth';
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{t.plans.pageTitle}</h1>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {t.plans.pageSubtitle}
                    </p>
                </div>
            }
        >
            <Head title={t.plans.pageTitle} />

            <section className="space-y-8">
                {/* Header avec retour */}
                <div className="flex items-center justify-between">
                    {auth?.user?.code_user && (
                        <Link
                            href={`/${auth.user.code_user}/dashboard`}
                            className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white transition"
                        >
                            <ArrowLeft className="size-4" />
                            {t.plans.backToDashboard}
                        </Link>
                    )}
                </div>

                {/* Grille des plans - Style Landing Page */}
                <div className="grid gap-4 lg:grid-cols-4">
                    {plans.map((plan) => {
                        const features = getPlanFeatures(plan);
                        const isCurrent = isCurrentPlan(plan.slug);
                        const highlighted = isHighlighted(plan.slug);

                        return (
                            <article
                                key={plan.id}
                                className={`rounded-2xl border p-6 transition hover:-translate-y-1 ${
                                    highlighted 
                                        ? 'border-amber-300 bg-amber-300/10' 
                                        : 'border-white/10 bg-white/5'
                                }`}
                            >
                                {/* Badge du plan */}
                                <p className="text-sm font-semibold text-amber-200">
                                    {getPlanBadge(plan.slug)}
                                    {isCurrent && ` • ${t.plans.current}`}
                                </p>

                                {/* Nom du plan */}
                                <h3 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>

                                {/* Prix */}
                                <div className="mt-4 flex items-center justify-between gap-4">
                                    {plan.slug === 'enterprise' ? (
                                        <div className="py-4">
                                            <p className="text-2xl font-bold text-amber-300">{t.plans.customQuote}</p>
                                            <p className="mt-1 text-xs font-medium text-slate-400">{t.plans.contactForPrice}</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div>
                                                <div className="flex items-end gap-1">
                                                    <span className="text-3xl font-black tracking-tight leading-none text-white">
                                                        {plan.price_eur.replace(/[^0-9]/g, '')}
                                                    </span>
                                                    <span className="text-lg font-bold text-amber-300">
                                                        {plan.price_eur.replace(/[0-9\s]/g, '').trim() || 'EUR'}
                                                    </span>
                                                </div>
                                                <p className="mt-0.5 text-xs font-medium text-slate-400">{t.plans.perMonth}</p>
                                            </div>
                                            {plan.price_fcfa && (
                                                <div className="flex items-center h-16">
                                                    <div className="h-10" style={{ width: '1px', backgroundColor: '#64748b' }} />
                                                </div>
                                            )}
                                            {plan.price_fcfa && (
                                                <div className="pl-4">
                                                    <div className="flex flex-col items-start">
                                                        <p className="text-xl font-bold text-amber-300">
                                                            {plan.price_fcfa.replace(' FCFA', '')}
                                                        </p>
                                                        <p className="text-xs font-medium text-amber-300">FCFA</p>
                                                        <p className="mt-0.5 text-xs font-medium text-slate-400">{t.plans.perMonth}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Fonctionnalités */}
                                <ul className="mt-5 space-y-3 text-sm text-slate-200">
                                    {features.map((feature, index) => (
                                        <li key={index} className="flex items-center gap-2">
                                            <Check className="size-4 text-emerald-300 flex-shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                {/* Bouton CTA */}
                                <div className="mt-6">
                                    {isCurrent ? (
                                        <button
                                            disabled
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-400 cursor-not-allowed"
                                        >
                                            {t.plans.currentPlanButton}
                                        </button>
                                    ) : plan.slug === 'enterprise' ? (
                                        <a
                                            href="mailto:contact@batixpro.com"
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
                                        >
                                            {t.plans.contactUs}
                                            <ArrowRight className="size-4" />
                                        </a>
                                    ) : (
                                        <a
                                            href={`/plans/${plan.slug}/checkout`}
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                                        >
                                            {plan.slug === 'free' ? t.plans.getStarted : t.plans.choosePlan}
                                            <ArrowRight className="size-4" />
                                        </a>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>

                {/* Section Aide - Style Landing Page */}
                <section className="rounded-3xl border border-white/10 bg-gradient-to-r from-amber-300/20 via-orange-300/15 to-cyan-300/20 p-8 text-center backdrop-blur-xl">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t.plans.helpTitle}</h2>
                    <p className="mx-auto mt-3 max-w-2xl text-slate-200">
                        {t.plans.helpText}
                    </p>
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                        <a
                            href="mailto:support@batixpro.com"
                            className="inline-flex items-center gap-2 rounded-xl bg-amber-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-amber-200"
                        >
                            {t.plans.contactSupport}
                            <ArrowRight className="size-4" />
                        </a>
                        <Link
                            href="/#faq"
                            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
                        >
                            {t.plans.seeFaq}
                        </Link>
                    </div>
                </section>
            </section>
        </AuthenticatedLayout>
    );
}

