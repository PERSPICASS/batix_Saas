import { motion } from 'framer-motion';
import { fadeUp, stagger } from '../../types/data';
import type { FeatureItem, Locale } from '../../types/types';

interface FeaturesSectionProps {
    locale: Locale;
    featuresTitle: string;
    features: FeatureItem[];
}

export default function FeaturesSection({ locale, featuresTitle, features }: FeaturesSectionProps) {
    const [main, second, ...rest] = features;
    const secondary = rest.slice(0, 6);
    const compact = rest.slice(6);

    return (
        <motion.section
            key={`features-${locale}`}
            id="features"
            className="w-full scroll-mt-24 bg-[#f5efe4] py-12 md:py-16"
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, amount: 0.05 }}
            variants={stagger}
        >
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                {/* En-tête */}
                <motion.div className="mb-10" variants={fadeUp}>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
                        {locale === 'fr' ? 'Fonctionnalités' : 'Features'}
                    </p>
                    <h2 className="mt-2 text-3xl font-extrabold text-slate-900">{featuresTitle}</h2>
                    <div className="mt-3 h-1 w-12 rounded-full bg-amber-400" />
                </motion.div>

                {/* Bento grid */}
                <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
                    {/* Colonne gauche — 2 cards clés */}
                    <div className="flex flex-col gap-4 lg:col-span-4">
                        {main && (
                            <motion.div
                                variants={fadeUp}
                                className="flex flex-col rounded-3xl bg-slate-900 p-8 text-white shadow-xl"
                            >
                                <div className="mb-6 inline-flex w-fit rounded-2xl bg-amber-400/15 p-4 text-amber-400">
                                    <main.icon className="size-6" />
                                </div>
                                <h3 className="text-xl font-extrabold leading-snug">{main.title}</h3>
                                <p className="mt-3 text-sm leading-relaxed text-slate-300">{main.description}</p>
                                <div className="mt-6 h-px w-full bg-white/10" />
                                <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-amber-400">
                                    {locale === 'fr' ? 'Fonctionnalité clé' : 'Key feature'}
                                </p>
                            </motion.div>
                        )}
                        {second && (
                            <motion.div
                                variants={fadeUp}
                                className="flex flex-col rounded-3xl bg-amber-400 p-8 text-slate-900 shadow-xl"
                            >
                                <div className="mb-6 inline-flex w-fit rounded-2xl bg-slate-900/10 p-4 text-slate-900">
                                    <second.icon className="size-6" />
                                </div>
                                <h3 className="text-xl font-extrabold leading-snug">{second.title}</h3>
                                <p className="mt-3 text-sm leading-relaxed text-slate-700">{second.description}</p>
                                <div className="mt-6 h-px w-full bg-slate-900/10" />
                                <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-slate-700">
                                    {locale === 'fr' ? 'Fonctionnalité clé' : 'Key feature'}
                                </p>
                            </motion.div>
                        )}
                    </div>

                    {/* Cards secondaires */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:col-span-8 lg:auto-rows-fr">
                        {secondary.map((feature) => (
                            <motion.div
                                key={feature.title}
                                variants={fadeUp}
                                className="flex h-full flex-col gap-3 rounded-3xl border border-[#ddd0bb] bg-white p-6 shadow-sm transition hover:shadow-md"
                            >
                                <div className="inline-flex w-fit rounded-xl bg-amber-100 p-3 text-amber-700">
                                    <feature.icon className="size-5" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-900">{feature.title}</h3>
                                    <p className="mt-1 text-sm leading-relaxed text-slate-500">{feature.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Cards compactes en bas — pleine largeur */}
                    {compact.length > 0 && (
                        <motion.div
                            variants={fadeUp}
                            className="grid gap-3 sm:grid-cols-2 lg:col-span-12 lg:grid-cols-3"
                        >
                            {compact.map((feature) => (
                                <div
                                    key={feature.title}
                                    className="flex items-start gap-4 rounded-2xl border border-[#ddd0bb] bg-[#fdf9f4] px-5 py-4 shadow-sm"
                                >
                                    <div className="mt-0.5 inline-flex shrink-0 rounded-lg bg-amber-100 p-2 text-amber-700">
                                        <feature.icon className="size-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">{feature.title}</p>
                                        <p className="mt-1 text-xs leading-relaxed text-slate-500">{feature.description}</p>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.section>
    );
}
