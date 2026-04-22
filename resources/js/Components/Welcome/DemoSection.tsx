import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, PlayCircle } from 'lucide-react';
import { fadeUp, stagger } from './data';
import type { Locale } from './types';

interface DemoSectionProps {
    locale: Locale;
    t: {
        demo: { title: string; description: string; cta: string; videoTitle: string; videoHint: string; videoUrl: string };
    };
    getDashboardUrl: () => string;
}

export default function DemoSection({ locale, t, getDashboardUrl }: DemoSectionProps) {
    const demoHighlights = locale === 'fr'
        ? [
            'Parcours complet: vente, stock, reporting',
            'Cas concrets inspires de vraies quincailleries',
            'Equipe prete en quelques minutes, pas en quelques semaines',
        ]
        : [
            'Full flow: checkout, inventory, reporting',
            'Real use cases inspired by actual hardware stores',
            'Team-ready in minutes, not weeks',
        ];

    const demoChips = locale === 'fr'
        ? ['2 min chrono', 'Sans jargon technique', 'Vision claire pour gerants']
        : ['2-minute walkthrough', 'No technical jargon', 'Clear manager visibility'];

    return (
        <motion.section
            id="demo"
            className="w-full scroll-mt-24 bg-[#efe6d8] py-10 md:py-14"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
        >
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="grid overflow-hidden rounded-3xl border border-[#d6c9b2] bg-[#fbf7ef] shadow-xl lg:grid-cols-12">
                    {/* Video */}
                    <motion.div className="p-4 sm:p-6 lg:col-span-7 lg:p-7" variants={fadeUp}>
                        <div className="relative overflow-hidden rounded-2xl border border-[#cdbfa8] bg-slate-900 shadow-xl">
                            <div className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/45 px-3 py-1 text-xs font-semibold text-white">
                                <PlayCircle className="size-3.5 text-amber-300" />
                                {locale === 'fr' ? 'Demo guidee' : 'Guided demo'}
                            </div>
                            <div className="absolute right-4 top-4 z-10 rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-slate-900">
                                2 min
                            </div>
                            <div className="aspect-video">
                                <iframe
                                    className="h-full w-full"
                                    src={t.demo.videoUrl}
                                    title={t.demo.videoTitle}
                                    loading="lazy"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                />
                            </div>
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950/90 via-slate-900/45 to-transparent" />
                            <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap gap-2">
                                {demoChips.map((chip) => (
                                    <span key={chip} className="rounded-full border border-white/25 bg-black/35 px-3 py-1 text-xs font-medium text-white">
                                        {chip}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Texte */}
                    <motion.div className="border-t border-[#e1d6c5] bg-[#f8f2e8] p-6 sm:p-7 lg:col-span-5 lg:border-l lg:border-t-0 lg:p-8" variants={fadeUp}>
                        <p className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                            <PlayCircle className="size-3.5" />
                            Demo
                        </p>
                        <h2 className="mt-4 text-3xl font-bold leading-tight text-slate-900">{t.demo.title}</h2>
                        <p className="mt-3 text-slate-600">{t.demo.description}</p>

                        <ul className="mt-5 space-y-2.5">
                            {demoHighlights.map((point) => (
                                <li key={point} className="flex items-start gap-2.5 text-sm text-slate-700">
                                    <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                        <Check className="size-3" />
                                    </span>
                                    {point}
                                </li>
                            ))}
                        </ul>

                        <div className="mt-7">
                            <Link href={getDashboardUrl()} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800">
                                {t.demo.cta}
                                <ArrowRight className="size-4" />
                            </Link>
                        </div>
                        <p className="mt-4 text-xs text-slate-500">{t.demo.videoHint}</p>
                    </motion.div>
                </div>
            </div>
        </motion.section>
    );
}
