import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, PlayCircle, Sparkles } from 'lucide-react';
import { fadeUp, heroSlides, stagger } from './data';
import type { HeroSlide, Locale } from './types';

interface HeroSectionProps {
    locale: Locale;
    t: {
        hero: { badge: string; primary: string; secondary: string; helper: string };
        quickPoints: string[];
        socialProof: string;
        stats: { label: string; value: string }[];
    };
    heroHeadline: string;
    heroDescription: string;
    activeHeroSlide: number;
    trustMarks: string[];
    getDashboardUrl: () => string;
    setActiveHeroSlide: (i: number) => void;
}

export default function HeroSection({
    locale,
    t,
    heroHeadline,
    heroDescription,
    activeHeroSlide,
    trustMarks,
    getDashboardUrl,
    setActiveHeroSlide,
}: HeroSectionProps) {
    const hasHeroSlides = heroSlides.length > 0;

    return (
        <motion.section className="w-full py-10 md:py-16" initial="hidden" animate="show" variants={stagger}>
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="grid items-center gap-12 lg:grid-cols-2">
                    {/* Colonne gauche — texte */}
                    <motion.div variants={fadeUp} transition={{ duration: 0.6 }}>
                        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-800">
                            <Sparkles className="size-3.5" />
                            {t.hero.badge}
                        </p>

                        <motion.h1
                            key={`${locale}-${heroSlides[activeHeroSlide]?.src ?? 'default'}-title`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35 }}
                            className="max-w-2xl text-4xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem]"
                        >
                            {heroHeadline}
                        </motion.h1>

                        <div className="mt-4 h-1 w-16 rounded-full bg-amber-400" />

                        <motion.p
                            key={`${locale}-${heroSlides[activeHeroSlide]?.src ?? 'default'}-desc`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: 0.05 }}
                            className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600"
                        >
                            {heroDescription}
                        </motion.p>

                        <div className="mt-8 flex flex-wrap items-center gap-3">
                            <Link
                                href={getDashboardUrl()}
                                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 font-bold text-white shadow-md transition hover:bg-slate-700 hover:shadow-lg"
                            >
                                {t.hero.primary}
                                <ArrowRight className="size-4" />
                            </Link>
                            <a
                                href="#demo"
                                className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-6 py-3.5 font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
                            >
                                <PlayCircle className="size-4 text-amber-600" />
                                {t.hero.secondary}
                            </a>
                        </div>

                        <p className="mt-3 text-xs text-slate-400">{t.hero.helper}</p>

                        <ul className="mt-8 space-y-2.5">
                            {t.quickPoints.map((point) => (
                                <li key={point} className="flex items-center gap-2.5 text-sm text-slate-700">
                                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                        <Check className="size-3" />
                                    </span>
                                    {point}
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Colonne droite — slider */}
                    <motion.div className="space-y-4" variants={fadeUp} transition={{ duration: 0.6, delay: 0.15 }}>
                        <div className="relative overflow-hidden rounded-3xl border border-[#e0d5c5] bg-[#f4ede2] shadow-2xl ring-1 ring-black/5">
                            <div className="relative aspect-[5/4]">
                                {hasHeroSlides ? (
                                    heroSlides.map((slide, index) => (
                                        <img
                                            key={slide.src}
                                            src={slide.src}
                                            alt={slide.alt}
                                            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${index === activeHeroSlide ? 'opacity-100' : 'opacity-0'}`}
                                        />
                                    ))
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 px-6 text-center text-slate-200">
                                        Ajoute des images dans resources/images/heroes pour activer le slider.
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-900/15 to-transparent" />

                                <div className="absolute bottom-5 left-5 right-5">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-200">{t.socialProof}</p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {trustMarks.map((brand) => (
                                            <span key={brand} className="rounded-full border border-white/30 bg-black/30 px-3 py-1 text-xs font-medium text-white">
                                                {brand}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="absolute right-4 top-4">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white shadow">
                                        <span className="size-1.5 rounded-full bg-white" />
                                        LIVE
                                    </span>
                                </div>
                            </div>
                        </div>

                        {hasHeroSlides && heroSlides.length > 1 && (
                            <div className="flex items-center justify-center gap-2">
                                {heroSlides.map((slide, index) => (
                                    <button
                                        key={`${slide.src}-dot`}
                                        type="button"
                                        onClick={() => setActiveHeroSlide(index)}
                                        className={`h-2 rounded-full transition-all ${index === activeHeroSlide ? 'w-8 bg-slate-900' : 'w-2 bg-slate-300 hover:bg-slate-500'}`}
                                        aria-label={`Slide ${index + 1}`}
                                    />
                                ))}
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-3">
                            {t.stats.map((stat) => (
                                <div key={stat.label} className="rounded-2xl border border-[#e0d5c5] bg-white px-4 py-3 text-center shadow-sm">
                                    <p className="text-xl font-extrabold text-slate-900">{stat.value}</p>
                                    <p className="mt-0.5 text-xs text-slate-500">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.section>
    );
}
