import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { fadeUp, stagger } from '../../types/data';
import type { PlanView } from '../../types/types';

interface PricingSectionProps {
    pricingTitle: string;
    pricingFallback: string;
    planCta: string;
    plans: PlanView[];
    hasDynamicPlans: boolean;
    getDashboardUrl: () => string;
}

export default function PricingSection({ pricingTitle, pricingFallback, planCta, plans, hasDynamicPlans, getDashboardUrl }: PricingSectionProps) {
    return (
        <motion.section
            id="pricing"
            className="w-full scroll-mt-24 bg-[#f9f5ef] py-10 md:py-14"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            variants={stagger}
        >
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="rounded-3xl border border-[#dfd3bf] bg-white p-6 shadow-sm lg:p-8">
                    <h2 className="mb-2 text-3xl font-extrabold text-slate-900">{pricingTitle}</h2>
                    <div className="mb-8 h-1 w-12 rounded-full bg-amber-400" />
                    {!hasDynamicPlans && (
                        <p className="mb-5 rounded-xl border border-[#d6c29d] bg-[#f7ecd5] px-4 py-3 text-sm text-amber-900">{pricingFallback}</p>
                    )}
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {plans.map((plan) => (
                            <motion.article
                                key={plan.name}
                                className={`relative rounded-2xl border p-6 ${plan.highlighted ? 'border-slate-900 bg-slate-900 text-white shadow-xl' : 'border-[#e8dfd1] bg-[#fdf9f4] text-slate-900 shadow-sm hover:border-amber-300'}`}
                                variants={fadeUp}
                                whileHover={{ y: -5 }}
                            >
                                {plan.highlighted && (
                                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                                        <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-slate-900">⭐ Populaire</span>
                                    </div>
                                )}
                                <p className={`text-sm font-semibold ${plan.highlighted ? 'text-amber-200' : 'text-amber-700'}`}>{plan.badge}</p>
                                <h3 className="mt-2 text-2xl font-bold">{plan.name}</h3>
                                <div className="mt-3 space-y-1">
                                    <p className="text-3xl font-bold">{plan.price_eur}</p>
                                    <p className={`text-xl font-semibold ${plan.highlighted ? 'text-amber-200' : 'text-amber-700'}`}>{plan.price_fcfa}</p>
                                </div>
                                <p className={`mt-2 text-xs ${plan.highlighted ? 'text-slate-300' : 'text-slate-500'}`}>{plan.subtitle}</p>
                                <ul className={`mt-5 space-y-3 text-sm ${plan.highlighted ? 'text-slate-100' : 'text-slate-700'}`}>
                                    {plan.points.map((point) => (
                                        <li key={point} className="flex items-center gap-2">
                                            <Check className={`size-4 ${plan.highlighted ? 'text-emerald-300' : 'text-emerald-600'}`} />
                                            {point}
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    href={getDashboardUrl()}
                                    className={`mt-6 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${plan.highlighted ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                                >
                                    {planCta}
                                    <ArrowRight className="size-4" />
                                </Link>
                            </motion.article>
                        ))}
                    </div>
                </div>
            </div>
        </motion.section>
    );
}
