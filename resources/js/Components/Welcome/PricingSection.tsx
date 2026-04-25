import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Star } from 'lucide-react';
import { fadeUp, stagger } from '../../types/data';
import type { PlanView } from '../../types/types';

interface PricingSectionProps {
    pricingTitle: string;
    pricingFallback: string;
    planCta: string;
    pricingLabel: string;
    plans: PlanView[];
    hasDynamicPlans: boolean;
    getDashboardUrl: () => string;
}

export default function PricingSection({ pricingTitle, pricingFallback, planCta, pricingLabel, plans, hasDynamicPlans, getDashboardUrl }: PricingSectionProps) {
    return (
        <motion.section
            id="pricing"
            className="w-full scroll-mt-24 bg-slate-900 py-14 md:py-20"
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, amount: 0.1 }}
            variants={stagger}
        >
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                {/* En-tête */}
                <motion.div className="mb-10" variants={fadeUp}>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-400">
                        {pricingLabel}
                    </p>
                    <h2 className="mt-2 text-3xl font-extrabold text-white">{pricingTitle}</h2>
                    <div className="mt-3 h-1 w-12 rounded-full bg-amber-400" />
                    {!hasDynamicPlans && (
                        <p className="mt-4 inline-block rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-300">{pricingFallback}</p>
                    )}
                </motion.div>

                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {plans.map((plan) => (
                        <motion.article
                            key={plan.name}
                            className={`relative rounded-2xl border p-6 transition ${
                                plan.highlighted
                                    ? 'border-amber-400 bg-amber-400 text-slate-900 shadow-[0_0_40px_-4px_rgba(251,191,36,0.45)] ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900'
                                    : 'border-slate-700 bg-slate-800 text-white shadow-sm hover:border-slate-500'
                            }`}
                            variants={fadeUp}
                            whileHover={{ y: -4 }}
                        >
                            {plan.highlighted && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wide text-amber-400 ring-1 ring-amber-400/50">
                                        <Star className="size-3 fill-amber-400" /> Populaire
                                    </span>
                                </div>
                            )}
                            <p className={`text-sm font-semibold ${plan.highlighted ? 'text-slate-700' : 'text-amber-400'}`}>{plan.badge}</p>
                            <h3 className="mt-2 text-2xl font-bold">{plan.name}</h3>

                            {/* ── Bloc prix mis en valeur ── */}
                            <div className={`mt-4 rounded-2xl px-5 py-4 ${plan.highlighted ? 'bg-slate-900/10' : 'bg-white/5'}`}>
                                <div className="flex items-end gap-1">
                                    <span className={`text-5xl font-black tracking-tight leading-none ${plan.highlighted ? 'text-slate-900' : 'text-white'}`}>
                                        {plan.price_eur.replace(/[^0-9]/g, '')}
                                    </span>
                                    <span className={`mb-1 text-xl font-bold ${plan.highlighted ? 'text-slate-700' : 'text-amber-400'}`}>
                                        {plan.price_eur.replace(/[0-9\s]/g, '').trim() || 'EUR'}
                                    </span>
                                </div>
                                <p className={`mt-0.5 text-xs font-medium ${plan.highlighted ? 'text-slate-600' : 'text-slate-400'}`}>{plan.subtitle}</p>
                            </div>
                            <ul className={`mt-5 space-y-3 text-sm ${plan.highlighted ? 'text-slate-800' : 'text-slate-200'}`}>
                                {plan.points.map((point) => (
                                    <li key={point} className="flex items-center gap-2">
                                        <Check className={`size-4 shrink-0 ${plan.highlighted ? 'text-slate-900' : 'text-emerald-400'}`} />
                                        {point}
                                    </li>
                                ))}
                            </ul>
                            <Link
                                href={getDashboardUrl()}
                                className={`mt-6 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                                    plan.highlighted
                                        ? 'bg-slate-900 text-white hover:bg-slate-800'
                                        : 'bg-amber-400 text-slate-900 hover:bg-amber-300'
                                }`}
                            >
                                {planCta}
                                <ArrowRight className="size-4" />
                            </Link>
                        </motion.article>
                    ))}
                </div>
            </div>
        </motion.section>
    );
}
