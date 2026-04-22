import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import featuresBackground from '/resources/images/various-repair-tools-for-sale-on-hardware-store-sh-2026-03-17-21-44-06-utc.jpg';
import { fadeUp, stagger } from '../../types/data';
import type { FeatureItem, Locale } from '../../types/types';

interface FeaturesSectionProps {
    locale: Locale;
    featuresTitle: string;
    features: FeatureItem[];
    activeFeatureIndex: number;
    setActiveFeatureIndex: (i: number) => void;
}

export default function FeaturesSection({ locale, featuresTitle, features, activeFeatureIndex, setActiveFeatureIndex }: FeaturesSectionProps) {
    const maxFeatureIndex = Math.max(features.length - 1, 0);
    const featurePages = features.length;

    return (
        <motion.section
            key={`features-${locale}`}
            id="features"
            className="w-full scroll-mt-24 bg-[#f5efe4] py-10 md:py-14"
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, amount: 0.1 }}
            variants={stagger}
        >
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="grid overflow-hidden rounded-3xl border border-[#d6c9b2] bg-[#fbf7ef] shadow-xl lg:grid-cols-2">
                    {/* Colonne gauche — carousel */}
                    <div className="p-5 sm:p-6 lg:p-8">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
                            {locale === 'fr' ? 'Fonctionnalites' : 'Features'}
                        </p>
                        <h2 className="mt-3 text-3xl font-extrabold text-slate-900">{featuresTitle}</h2>
                        <div className="mb-8 mt-4 h-1 w-12 rounded-full bg-amber-400" />

                        <div className="rounded-2xl border border-[#d6c9b2] bg-[#fbf7ef] p-5 shadow-sm md:p-6">
                            {/* Contrôles nav */}
                            <div className="mb-4 flex items-center justify-between">
                                <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                                    {locale === 'fr' ? 'Fonctionnalites cles' : 'Key features'}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setActiveFeatureIndex(activeFeatureIndex <= 0 ? maxFeatureIndex : activeFeatureIndex - 1)}
                                        className="inline-flex size-10 items-center justify-center rounded-full border border-[#d7c9b3] bg-white text-slate-800 transition hover:bg-amber-100"
                                        aria-label={locale === 'fr' ? 'Precedente' : 'Previous'}
                                    >
                                        <ArrowLeft className="size-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveFeatureIndex(activeFeatureIndex >= maxFeatureIndex ? 0 : activeFeatureIndex + 1)}
                                        className="inline-flex size-10 items-center justify-center rounded-full border border-[#d7c9b3] bg-white text-slate-800 transition hover:bg-amber-100"
                                        aria-label={locale === 'fr' ? 'Suivante' : 'Next'}
                                    >
                                        <ArrowRight className="size-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Slider */}
                            <div className="overflow-hidden">
                                <motion.div
                                    className="flex"
                                    animate={{ x: `-${activeFeatureIndex * 100}%` }}
                                    transition={{ duration: 0.45, ease: 'easeInOut' }}
                                >
                                    {features.map((feature) => (
                                        <div key={feature.title} className="w-full shrink-0">
                                            <motion.article
                                                className="rounded-2xl border border-[#e3d7c4] bg-white p-6 shadow-sm md:p-7"
                                                variants={fadeUp}
                                            >
                                                <div className="mb-5 inline-flex rounded-xl bg-amber-100 p-3 text-amber-700">
                                                    <feature.icon className="size-6" />
                                                </div>
                                                <h3 className="text-2xl font-extrabold text-slate-900">{feature.title}</h3>
                                                <p className="mt-3 text-base leading-relaxed text-slate-600">{feature.description}</p>
                                            </motion.article>
                                        </div>
                                    ))}
                                </motion.div>
                            </div>

                            {/* Dots */}
                            {featurePages > 1 && (
                                <div className="mt-5 flex items-center justify-center gap-2">
                                    {Array.from({ length: featurePages }).map((_, index) => (
                                        <button
                                            key={`fp-${index}`}
                                            type="button"
                                            onClick={() => setActiveFeatureIndex(index)}
                                            className={`h-2.5 rounded-full transition-all ${index === activeFeatureIndex ? 'w-8 bg-slate-900' : 'w-2.5 bg-slate-300 hover:bg-slate-500'}`}
                                            aria-label={`${index + 1}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Colonne droite — image */}
                    <div className="relative min-h-[360px] overflow-hidden lg:-ml-4 lg:shadow-[-28px_0_60px_-24px_rgba(15,23,42,0.55)]">
                        <img src={featuresBackground} alt="Produits et outils de quincaillerie en rayon" className="absolute inset-0 h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/35 to-slate-900/15" />
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white sm:p-8">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
                                {locale === 'fr' ? 'Etape terrain' : 'Field stage'}
                            </p>
                            <h3 className="mt-3 max-w-lg text-2xl font-bold leading-tight xl:text-3xl">
                                {locale === 'fr'
                                    ? 'Une vision claire de votre activite, meme en pleine affluence.'
                                    : 'A clear view of your operations, even during peak rush.'}
                            </h3>
                            <p className="mt-2 max-w-lg text-sm text-slate-200">
                                {locale === 'fr'
                                    ? 'Du comptoir aux depots, gardez la meme qualite de pilotage partout.'
                                    : 'From checkout to warehouses, keep the same operational clarity everywhere.'}
                            </p>
                            <div className="mt-4 inline-flex items-center rounded-full border border-white/30 bg-black/20 px-3 py-1 text-xs font-medium text-white">
                                {locale === 'fr'
                                    ? `${activeFeatureIndex + 1} / ${featurePages} fonctionnalites`
                                    : `${activeFeatureIndex + 1} / ${featurePages} features`}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.section>
    );
}
