import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Bot, Mic, Sparkles } from 'lucide-react';
import { useRef } from 'react';
import { fadeUp, stagger } from '../../types/data';
import { getFeaturePage } from '../../types/featurePages';
import type { Locale } from '../../types/types';

interface AiShowcaseProps {
    locale: Locale;
}

type Mock =
    | { type: 'chat'; question: string; answer: string }
    | { type: 'voice'; listening: string; transcript: string };

/**
 * Showcase of the real Assistant IA capabilities — the 4 data tools (see
 * app/Services/AiChatService.php) plus voice input (Web Speech API, see
 * resources/js/Components/AiChatWidget.tsx) — styled as a horizontal card
 * carousel inspired by Brevo's "Aura" section. Each mockup bubble is an
 * illustrative UI sketch, not a real screenshot; copy is the same verified
 * text as /fonctionnalites/assistant-ia.
 */
export default function AiShowcase({ locale }: AiShowcaseProps) {
    const isFr = locale === 'fr';
    const feature = getFeaturePage('assistant-ia');
    const scrollerRef = useRef<HTMLDivElement>(null);

    if (!feature) return null;

    const benefits = feature.benefits[locale].slice(0, 5);

    const mocks: Mock[] = isFr
        ? [
            { type: 'chat', question: 'Quel est mon chiffre d\'affaires aujourd\'hui ?', answer: '1 240 000 FCFA · 34 ventes · panier moyen 36 470 FCFA' },
            { type: 'chat', question: 'Combien de sacs de ciment reste-t-il ?', answer: '42 unités en stock, dépôt principal' },
            { type: 'chat', question: 'Des produits en rupture ?', answer: '⚠ Peinture blanche 5L — 3 restants seulement' },
            { type: 'chat', question: 'Mes meilleures ventes ce mois-ci ?', answer: '1. Ciment 50kg  2. Fil électrique  3. Peinture' },
            { type: 'voice', listening: 'Écoute en cours...', transcript: '« Combien j\'ai vendu aujourd\'hui ? »' },
        ]
        : [
            { type: 'chat', question: 'What\'s my revenue today?', answer: '1,240,000 FCFA · 34 sales · avg basket 36,470 FCFA' },
            { type: 'chat', question: 'How many bags of cement are left?', answer: '42 units in stock, main depot' },
            { type: 'chat', question: 'Any products running low?', answer: '⚠ White paint 5L — only 3 left' },
            { type: 'chat', question: 'My best sellers this month?', answer: '1. Cement 50kg  2. Electrical wire  3. Paint' },
            { type: 'voice', listening: 'Listening...', transcript: '"How much did I sell today?"' },
        ];

    const scroll = (direction: 'prev' | 'next') => {
        scrollerRef.current?.scrollBy({ left: direction === 'next' ? 340 : -340, behavior: 'smooth' });
    };

    const featureHref = isFr ? route('features.show', feature.slug) : route('en.features.show', feature.slug);

    return (
        <motion.section
            className="w-full overflow-hidden bg-terre-50 py-14 md:py-20"
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, amount: 0.1 }}
            variants={stagger}
        >
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-center">
                    {/* Colonne gauche */}
                    <motion.div variants={fadeUp}>
                        <span className="inline-flex items-center gap-2 rounded-full border border-terre-200 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-terre-700">
                            <Sparkles className="size-3.5" />
                            {isFr ? 'Propulsé par notre IA' : 'Powered by our AI'}
                        </span>

                        <h2 className="mt-6 text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
                            {isFr ? 'Un assistant qui travaille avec vous' : 'An assistant that works with you'}
                        </h2>

                        <p className="mt-4 text-base leading-relaxed text-slate-600">
                            {feature.description[locale]}
                        </p>

                        <div className="mt-8 flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => scroll('prev')}
                                aria-label={isFr ? 'Précédent' : 'Previous'}
                                className="flex size-11 items-center justify-center rounded-full border border-gray-200 bg-white text-slate-500 shadow-sm transition hover:border-terre-300 hover:text-terre-700"
                            >
                                <ArrowLeft className="size-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => scroll('next')}
                                aria-label={isFr ? 'Suivant' : 'Next'}
                                className="flex size-11 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm transition hover:bg-slate-800"
                            >
                                <ArrowRight className="size-4" />
                            </button>
                        </div>
                    </motion.div>

                    {/* Carousel */}
                    <motion.div
                        ref={scrollerRef}
                        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                        variants={fadeUp}
                    >
                        {benefits.map((benefit, index) => {
                            const mock = mocks[index];
                            return (
                                <article
                                    key={benefit.title}
                                    className="w-[85%] shrink-0 snap-start rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:w-[380px]"
                                >
                                    {/* Mockup fenêtre */}
                                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                                        <div className="mb-3 flex items-center gap-1.5">
                                            <span className="size-2 rounded-full bg-gray-300" />
                                            <span className="size-2 rounded-full bg-gray-300" />
                                            <span className="size-2 rounded-full bg-gray-300" />
                                        </div>
                                        {mock.type === 'chat' ? (
                                            <>
                                                <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-terre-600 px-3 py-2 text-xs font-medium text-white">
                                                    {mock.question}
                                                </div>
                                                <div className="mt-2 flex items-start gap-2">
                                                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-300 text-slate-900">
                                                        <Bot className="size-3" />
                                                    </span>
                                                    <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 text-xs text-slate-700 shadow-sm">
                                                        {mock.answer}
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center gap-3 py-2 text-center">
                                                <span className="flex size-10 items-center justify-center rounded-full bg-red-500 text-white shadow-sm">
                                                    <Mic className="size-4" />
                                                </span>
                                                <div className="flex items-end gap-0.5">
                                                    {[6, 12, 18, 10, 14, 8, 16].map((h, i) => (
                                                        <span key={i} className="w-1 rounded-full bg-terre-400" style={{ height: `${h}px` }} />
                                                    ))}
                                                </div>
                                                <p className="text-xs font-medium text-terre-600">{mock.listening}</p>
                                                <p className="max-w-[90%] text-xs italic text-slate-500">{mock.transcript}</p>
                                            </div>
                                        )}
                                    </div>

                                    <h3 className="mt-4 text-lg font-extrabold text-slate-900">{benefit.title}</h3>
                                    <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{benefit.description}</p>

                                    <Link
                                        href={featureHref}
                                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                                    >
                                        {isFr ? "Découvrir l'Assistant IA" : 'Discover the AI Assistant'}
                                    </Link>
                                </article>
                            );
                        })}
                    </motion.div>
                </div>
            </div>
        </motion.section>
    );
}
