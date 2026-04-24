import { Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronDown, Clock, PlayCircle } from 'lucide-react';
import { useState } from 'react';
import { stagger, fadeUp } from '../../types/data';
import type { Locale } from '../../types/types';

interface VideoFaqItem {
    id: string;
    question: string;
    duration: string;
    url: string;
}

interface DemoSectionProps {
    locale: Locale;
    t: {
        demo: {
            sectionTitle: string;
            sectionSubtitle: string;
            cta: string;
        };
        videoFaqs: VideoFaqItem[];
    };
    getDashboardUrl: () => string;
}

export default function DemoSection({ locale, t, getDashboardUrl }: DemoSectionProps) {
    const [openId, setOpenId] = useState<string | null>(t.videoFaqs[0]?.id ?? null);

    const toggle = (id: string) => {
        setOpenId((current) => (current === id ? null : id));
    };

    return (
        <motion.section
            id="demo"
            className="w-full scroll-mt-24 bg-white py-10 md:py-14"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            variants={stagger}
        >
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                {/* En-tête */}
                <motion.div className="mb-8" variants={fadeUp}>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
                        {locale === 'fr' ? 'Tutoriels video' : 'Video tutorials'}
                    </p>
                    <h2 className="mt-2 text-3xl font-extrabold text-slate-900">{t.demo.sectionTitle}</h2>
                    <div className="mt-3 h-1 w-12 rounded-full bg-amber-400" />
                    <p className="mt-3 max-w-xl text-slate-600">{t.demo.sectionSubtitle}</p>
                </motion.div>

                <div className="grid gap-4 lg:grid-cols-12">
                    {/* Accordion */}
                    <motion.div className="space-y-2 lg:col-span-5" variants={fadeUp}>
                        {t.videoFaqs.map((item, index) => {
                            const isOpen = openId === item.id;
                            return (
                                <div
                                    key={item.id}
                                    className={`overflow-hidden rounded-2xl border transition-all duration-200 ${
                                        isOpen
                                            ? 'border-slate-900 bg-slate-900 shadow-lg'
                                            : 'border-[#d6c9b2] bg-[#fbf7ef] hover:border-amber-300'
                                    }`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => toggle(item.id)}
                                        className="flex w-full items-center gap-3 px-5 py-4 text-left"
                                    >
                                        {/* Numéro */}
                                        <span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${isOpen ? 'bg-amber-300 text-slate-900' : 'bg-slate-100 text-slate-600'}`}>
                                            {index + 1}
                                        </span>

                                        <span className="flex-1">
                                            <span className={`block text-sm font-semibold leading-snug ${isOpen ? 'text-white' : 'text-slate-800'}`}>
                                                {item.question}
                                            </span>
                                            <span className={`mt-1 flex items-center gap-1 text-xs ${isOpen ? 'text-amber-300' : 'text-slate-400'}`}>
                                                <Clock className="size-3" />
                                                {item.duration}
                                            </span>
                                        </span>

                                        <ChevronDown className={`size-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-amber-300' : 'text-slate-400'}`} />
                                    </button>

                                    {/* Vidéo inline sur mobile */}
                                    <AnimatePresence initial={false}>
                                        {isOpen && (
                                            <motion.div
                                                key="mobile-video"
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25 }}
                                                className="lg:hidden"
                                            >
                                                <div className="mx-4 mb-4 overflow-hidden rounded-xl">
                                                    <div className="aspect-video">
                                                        <iframe
                                                            className="h-full w-full"
                                                            src={`${item.url}?autoplay=1&mute=1`}
                                                            title={item.question}
                                                            loading="lazy"
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            allowFullScreen
                                                        />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}

                        {/* CTA sous l'accordion */}
                        <div className="pt-3">
                            <Link
                                href={getDashboardUrl()}
                                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 font-bold text-slate-900 shadow-sm transition hover:bg-amber-300"
                            >
                                {t.demo.cta}
                                <ArrowRight className="size-4" />
                            </Link>
                        </div>
                    </motion.div>

                    {/* Lecteur vidéo desktop */}
                    <motion.div className="hidden lg:col-span-7 lg:block" variants={fadeUp}>
                        <div className="sticky top-28 overflow-hidden rounded-3xl border border-[#d6c9b2] bg-slate-900 shadow-2xl">
                            {openId ? (
                                (() => {
                                    const active = t.videoFaqs.find((v) => v.id === openId);
                                    if (!active) return null;
                                    return (
                                        <>
                                            {/* Badge titre */}
                                            <div className="flex items-center gap-3 border-b border-white/10 px-5 py-3">
                                                <PlayCircle className="size-4 shrink-0 text-amber-300" />
                                                <p className="truncate text-sm font-medium text-white">{active.question}</p>
                                                <span className="ml-auto flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-xs text-amber-200">
                                                    <Clock className="size-3" />
                                                    {active.duration}
                                                </span>
                                            </div>
                                            <div className="aspect-video">
                                                <iframe
                                                    key={active.id}
                                                    className="h-full w-full"
                                                    src={`${active.url}?autoplay=1&mute=1`}
                                                    title={active.question}
                                                    loading="lazy"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                />
                                            </div>
                                        </>
                                    );
                                })()
                            ) : (
                                <div className="flex aspect-video items-center justify-center">
                                    <p className="text-sm text-slate-400">
                                        {locale === 'fr' ? 'Selectionnez une video' : 'Select a video'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.section>
    );
}
