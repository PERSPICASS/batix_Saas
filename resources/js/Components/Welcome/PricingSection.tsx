import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, ChevronDown, Star } from 'lucide-react';
import { useState } from 'react';
import { fadeUp, stagger } from '../../types/data';
import { currencies, currencyLabels, formatPrice, type Currency } from '../../utils/currency';
import type { Locale, PlanView } from '../../types/types';

interface PricingSectionProps {
    locale: Locale;
    pricingTitle: string;
    pricingFallback: string;
    planCta: string;
    pricingLabel: string;
    plans: PlanView[];
    hasDynamicPlans: boolean;
    getDashboardUrl: () => string;
}

type BillingCycle = 'monthly' | 'yearly';

export default function PricingSection({ locale, pricingTitle, pricingFallback, planCta, pricingLabel, plans, hasDynamicPlans, getDashboardUrl }: PricingSectionProps) {
    const isFr = locale === 'fr';
    const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
    const [currency, setCurrency] = useState<Currency>('USD');

    const planOrder = ['Starter', 'Growth', 'Pro', 'Entreprise'];
    const sortedPlans = [...plans].sort((a, b) => {
        const indexA = planOrder.indexOf(a.name);
        const indexB = planOrder.indexOf(b.name);
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });

    return (
        <motion.section
            id="pricing"
            className="w-full scroll-mt-24 bg-white py-14 md:py-20"
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, amount: 0.1 }}
            variants={stagger}
        >
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                {/* En-tête */}
                <motion.div className="mb-8" variants={fadeUp}>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-terre-600">
                        {pricingLabel}
                    </p>
                    <h2 className="mt-2 text-3xl font-extrabold text-slate-900">{pricingTitle}</h2>
                    <div className="mt-3 h-1 w-12 rounded-full bg-terre-500" />
                    {!hasDynamicPlans && (
                        <p className="mt-4 inline-block rounded-xl border border-terre-200 bg-terre-50 px-4 py-3 text-sm text-terre-700">{pricingFallback}</p>
                    )}
                </motion.div>

                {/* Toggle mensuel/annuel (gauche) + devise (droite) sur la même ligne */}
                <motion.div className="mb-3 flex flex-wrap items-center justify-between gap-3" variants={fadeUp}>
                    <div className="flex items-center gap-3">
                        <div className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
                            {(['monthly', 'yearly'] as BillingCycle[]).map((cycle) => (
                                <button
                                    key={cycle}
                                    type="button"
                                    onClick={() => setBillingCycle(cycle)}
                                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                                        billingCycle === cycle ? 'bg-terre-600 text-white' : 'text-slate-500 hover:text-slate-900'
                                    }`}
                                >
                                    {cycle === 'monthly' ? (isFr ? 'Mensuel' : 'Monthly') : (isFr ? 'Annuel' : 'Yearly')}
                                </button>
                            ))}
                        </div>
                        {billingCycle === 'yearly' && (
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                {isFr ? '2 mois offerts' : '2 months free'}
                            </span>
                        )}
                    </div>

                    <div className="relative">
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value as Currency)}
                            aria-label={isFr ? 'Devise' : 'Currency'}
                            className="appearance-none rounded-xl border border-gray-200 bg-gray-50 py-2 pl-4 pr-9 text-sm font-semibold text-slate-700 outline-none transition hover:border-terre-300 focus:border-terre-400"
                        >
                            {currencies.map((c) => (
                                <option key={c} value={c}>{currencyLabels[c]}</option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    </div>
                </motion.div>

                <motion.p className="mb-8 text-xs text-slate-400" variants={fadeUp}>
                    {isFr
                        ? 'Facturation réelle en EUR via Paddle. Les prix en USD, CAD et FCFA affichés ici sont des conversions indicatives (EUR à parité fixe, USD/CAD à taux de marché approximatif) à titre de repère uniquement.'
                        : 'Actual billing is in EUR via Paddle. Prices shown in USD, CAD and FCFA here are indicative conversions (EUR at fixed parity, USD/CAD at an approximate market rate) for reference only.'}
                </motion.p>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {sortedPlans.map((plan) => {
                        const isYearly = billingCycle === 'yearly' && !!plan.price_xaf_yearly;
                        const amountXaf = isYearly ? plan.price_xaf_yearly : plan.price_xaf;
                        const displaySubtitle = isYearly ? (isFr ? 'par an' : 'per year') : plan.subtitle;
                        const displayPrice = amountXaf ? formatPrice(amountXaf, currency) : null;

                        return (
                        <motion.article
                            key={plan.name}
                            className={`relative rounded-2xl border p-6 transition ${
                                plan.highlighted
                                    ? 'border-terre-600 bg-terre-600 text-white shadow-xl'
                                    : 'border-gray-200 bg-white text-slate-900 shadow-sm hover:border-gray-300'
                            }`}
                            variants={fadeUp}
                            whileHover={{ y: -4 }}
                        >
                            {plan.highlighted && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wide text-amber-400 ring-1 ring-amber-400/50">
                                        <Star className="size-3 fill-amber-400" /> {isFr ? 'Populaire' : 'Popular'}
                                    </span>
                                </div>
                            )}
                            <p className={`text-sm font-semibold ${plan.highlighted ? 'text-terre-100' : 'text-terre-600'}`}>{plan.badge}</p>
                            <h3 className="mt-2 text-2xl font-bold">{plan.name}</h3>

                            {/* ── Bloc prix mis en valeur ── */}
                            <div className={`mt-4 rounded-2xl px-5 py-4 ${plan.highlighted ? 'bg-white/10' : 'bg-gray-50'}`}>
                                {plan.name === 'Entreprise' || !displayPrice ? (
                                    <div className="py-4">
                                        <p className={`text-2xl font-bold ${plan.highlighted ? 'text-white' : 'text-terre-600'}`}>
                                            {isFr ? 'Devis sur mesure' : 'Custom quote'}
                                        </p>
                                        <p className={`mt-1 text-xs font-medium ${plan.highlighted ? 'text-terre-100' : 'text-slate-500'}`}>
                                            {isFr ? 'Nous contacter pour obtenir un prix' : 'Contact us for pricing'}
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <span className={`text-4xl font-black tracking-tight leading-none ${plan.highlighted ? 'text-white' : 'text-slate-900'}`}>
                                            {displayPrice}
                                        </span>
                                        <p className={`mt-0.5 text-xs font-medium ${plan.highlighted ? 'text-terre-100' : 'text-slate-500'}`}>{displaySubtitle}</p>
                                    </div>
                                )}
                            </div>
                            <ul className={`mt-5 space-y-3 text-sm ${plan.highlighted ? 'text-white' : 'text-slate-700'}`}>
                                {plan.points.map((point) => (
                                    <li key={point} className="flex items-center gap-2">
                                        <Check className={`size-4 shrink-0 ${plan.highlighted ? 'text-white' : 'text-emerald-600'}`} />
                                        {point}
                                    </li>
                                ))}
                            </ul>
                            <Link
                                href={getDashboardUrl()}
                                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-400"
                            >
                                {planCta}
                                <ArrowRight className="size-4" />
                            </Link>
                        </motion.article>
                        );
                    })}
                </div>
            </div>
        </motion.section>
    );
}
