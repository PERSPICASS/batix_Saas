import { Link } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Quote } from 'lucide-react';
import { useState } from 'react';
import { fadeUp, stagger } from '../../types/data';
import { getFeaturePage } from '../../types/featurePages';
import { testimonialsByLocale } from '../../types/testimonials';
import type { Locale } from '../../types/types';

interface AudienceSwitcherProps {
    locale: Locale;
}

/**
 * Segment switcher (tabs → dynamic left content + right proof card), inspired
 * by Brevo's "Built for every business" section. Content is pulled from the
 * real feature pages (resources/js/types/featurePages.ts) — no invented copy —
 * and the proof card uses a text-only placeholder testimonial (no fabricated
 * customer photo, since we don't have a real one to attach to a real name).
 */
export default function AudienceSwitcher({ locale }: AudienceSwitcherProps) {
    const isFr = locale === 'fr';

    const segments = [
        {
            label: isFr ? 'Boutique unique' : 'Single store',
            featureSlug: 'vente-caisse',
            testimonialIndex: 0,
        },
        {
            label: isFr ? 'Multi-boutiques' : 'Multi-store',
            featureSlug: 'multi-boutiques',
            testimonialIndex: 1,
        },
        {
            label: isFr ? 'Équipes avec IA' : 'AI-powered teams',
            featureSlug: 'assistant-ia',
            testimonialIndex: 2,
        },
    ];

    const [activeIndex, setActiveIndex] = useState(0);
    const active = segments[activeIndex];
    const feature = getFeaturePage(active.featureSlug);
    const testimonial = testimonialsByLocale[locale][active.testimonialIndex];

    if (!feature) return null;

    return (
        <motion.section
            className="w-full bg-white py-14 md:py-20"
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, amount: 0.1 }}
            variants={stagger}
        >
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <motion.h2 className="text-center text-3xl font-extrabold text-slate-900 sm:text-4xl" variants={fadeUp}>
                    {isFr ? 'Conçu pour chaque étape de votre croissance' : 'Built for every stage of your growth'}
                </motion.h2>

                {/* Tabs */}
                <motion.div className="mt-8 flex justify-center" variants={fadeUp}>
                    <div className="inline-flex flex-wrap items-center justify-center gap-1 rounded-full border border-gray-200 bg-gray-50 p-1">
                        {segments.map((segment, index) => (
                            <button
                                key={segment.featureSlug}
                                type="button"
                                onClick={() => setActiveIndex(index)}
                                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                                    activeIndex === index ? 'bg-amber-300 text-slate-900' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                {segment.label}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Contenu dynamique */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={active.featureSlug}
                        className="mt-12 grid gap-10 lg:grid-cols-2 lg:items-center"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.25 }}
                    >
                        {/* Colonne gauche */}
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-terre-600">
                                {isFr ? 'Pour' : 'For'} {active.label.toLowerCase()}
                            </p>
                            <h3 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">{feature.title[locale]}</h3>
                            <p className="mt-3 text-base leading-relaxed text-slate-600">{feature.description[locale]}</p>

                            <ul className="mt-6 space-y-3">
                                {feature.benefits[locale].slice(0, 4).map((benefit) => (
                                    <li key={benefit.title} className="flex items-start gap-3">
                                        <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-terre-50 text-terre-600">
                                            <Check className="size-3" />
                                        </span>
                                        <span className="text-sm text-slate-700">{benefit.title}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href={isFr ? route('features.show', feature.slug) : route('en.features.show', feature.slug)}
                                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-amber-300 px-6 py-3 font-bold text-slate-900 shadow-sm transition hover:bg-amber-400"
                            >
                                {isFr ? 'En savoir plus' : 'Learn more'}
                                <ArrowRight className="size-4" />
                            </Link>
                        </div>

                        {/* Colonne droite — carte témoignage */}
                        <div className="rounded-3xl border border-gray-200 bg-gray-50 p-8">
                            <Quote className="size-8 text-terre-400" />
                            <blockquote className="mt-4 text-lg italic leading-relaxed text-slate-700">
                                “{testimonial.quote}”
                            </blockquote>
                            <p className="mt-6 font-bold text-slate-900">{testimonial.name}</p>
                            <p className="text-sm text-slate-500">{testimonial.role} — {testimonial.location}</p>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.section>
    );
}
