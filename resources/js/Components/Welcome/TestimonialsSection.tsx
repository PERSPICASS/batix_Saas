import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { ShieldCheck } from 'lucide-react';
import bgImage from '../../../images/bg.jpg';
import { fadeUp, stagger } from '../../types/data';
import type { Locale } from '../../types/types';

interface TrustPromise {
    icon: string;
    value: string;
    label: string;
}

interface TestimonialsSectionProps {
    locale: Locale;
    promises: TrustPromise[];
    trustReasons: string[];
}

function DynamicIcon({ name, className }: { name: string; className?: string }) {
    const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name];
    if (!Icon) return null;
    return <Icon className={className} />;
}

export default function TestimonialsSection({ locale, promises, trustReasons }: TestimonialsSectionProps) {
    const sectionLabel = locale === 'fr' ? 'Pourquoi nous faire confiance' : 'Why trust us';

    return (
        <motion.section
            className="relative w-full overflow-hidden py-12 md:py-16"
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, amount: 0.1 }}
            variants={stagger}
        >
            {/* Image de fond */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${bgImage})` }}
            />
            {/* Overlay sombre pour lisibilité */}
            <div className="absolute inset-0 bg-slate-900/80" />

            <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                <motion.div className="mb-10" variants={fadeUp}>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-terre-400">
                        {sectionLabel}
                    </p>
                    <div className="mt-2 h-1 w-12 rounded-full bg-terre-500" />
                </motion.div>

                {/* 3 promesses mesurables */}
                <motion.div className="mb-8 grid gap-4 sm:grid-cols-3" variants={fadeUp}>
                    {promises.map((p) => (
                        <div
                            key={p.label}
                            className="flex items-center gap-4 rounded-2xl border border-slate-700 bg-slate-800 px-5 py-5 shadow-md"
                        >
                            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-terre-500/10 text-terre-400">
                                <DynamicIcon name={p.icon} className="size-5" />
                            </span>
                            <div>
                                <p className="text-2xl font-extrabold text-white">{p.value}</p>
                                <p className="text-xs text-slate-400">{p.label}</p>
                            </div>
                        </div>
                    ))}
                </motion.div>

                {/* 4 raisons honnêtes */}
                <motion.div className="grid gap-3 sm:grid-cols-2" variants={stagger}>
                    {trustReasons.map((reason) => (
                        <motion.div
                            key={reason}
                            variants={fadeUp}
                            className="flex items-start gap-3 rounded-xl border border-slate-700 bg-slate-800/60 px-5 py-4"
                        >
                            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                            <p className="text-sm text-slate-300">{reason}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </motion.section>
    );
}

