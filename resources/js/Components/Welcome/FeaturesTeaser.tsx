import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { fadeUp, stagger } from '../../types/data';
import { featurePages } from '../../types/featurePages';
import type { Locale } from '../../types/types';

interface FeaturesTeaserProps {
    locale: Locale;
    featuresTitle: string;
}

/** Condensed features overview on Home — links out to the dedicated /fonctionnalites pages. */
export default function FeaturesTeaser({ locale, featuresTitle }: FeaturesTeaserProps) {
    const isFr = locale === 'fr';

    return (
        <motion.section
            id="features"
            className="w-full scroll-mt-24 bg-white py-12 md:py-16"
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, amount: 0.05 }}
            variants={stagger}
        >
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <motion.div className="mb-10 flex flex-wrap items-end justify-between gap-4" variants={fadeUp}>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-terre-600">
                            {isFr ? 'Fonctionnalités' : 'Features'}
                        </p>
                        <h2 className="mt-2 text-3xl font-extrabold text-slate-900">{featuresTitle}</h2>
                        <div className="mt-3 h-1 w-12 rounded-full bg-terre-500" />
                    </div>
                    <Link
                        href={isFr ? route('features.index') : route('en.features.index')}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-terre-700 transition hover:text-terre-900"
                    >
                        {isFr ? 'Toutes les fonctionnalités' : 'All features'}
                        <ArrowRight className="size-4" />
                    </Link>
                </motion.div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {featurePages.map((page) => (
                        <motion.div key={page.slug} variants={fadeUp}>
                            <Link
                                href={isFr ? route('features.show', page.slug) : route('en.features.show', page.slug)}
                                className="group flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-terre-200 hover:shadow-md"
                            >
                                <div className="mb-4 inline-flex w-fit rounded-xl bg-terre-50 p-3 text-terre-600">
                                    <page.icon className="size-5" />
                                </div>
                                <h3 className="font-extrabold text-slate-900">{page.title[locale]}</h3>
                                <p className="mt-1 flex-1 text-sm leading-relaxed text-slate-500">{page.tagline[locale]}</p>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.section>
    );
}
