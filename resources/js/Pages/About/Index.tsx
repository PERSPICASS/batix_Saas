import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, HardHat, MapPin, MessageCircle, ShieldCheck, TriangleAlert, Users, Zap } from 'lucide-react';
import aboutBanner from '/resources/images/various-repair-tools-for-sale-on-hardware-store-sh-2026-03-17-21-44-06-utc.jpg';
import PublicLayout from '@/Layouts/PublicLayout';
import { SeoHead } from '@/Components/SeoHead';
import FinalCtaSection from '@/Components/Welcome/FinalCtaSection';
import { PageProps } from '@/types';
import type { Locale } from '@/types/types';
import { copy, fadeUp, stagger } from '@/types/data';
import { featurePages } from '@/types/featurePages';
import { useDashboardUrl } from '@/hooks/useDashboardUrl';

interface Props extends PageProps {
    locale: Locale;
    localeLinks: Record<Locale, string>;
}

export default function AboutIndex({ auth, locale, localeLinks }: Props) {
    const getDashboardUrl = useDashboardUrl(auth);
    const t = copy[locale];
    const isFr = locale === 'fr';

    const title = isFr ? 'À propos de BATIX PRO' : 'About BATIX PRO';
    const description = isFr
        ? 'BATIX PRO est un logiciel de gestion pensé pour les quincailleries et boutiques de détail, partout dans le monde.'
        : 'BATIX PRO is management software built for hardware stores and retail shops, wherever they are.';

    const values = isFr
        ? [
            { icon: HardHat, title: 'Conçu pour le terrain', text: 'Pas pour des informaticiens : pour des gérants, vendeurs et caissiers qui n\'ont pas le temps à perdre.' },
            { icon: MapPin, title: 'Multi-devises et bilingue', text: 'Prix affichés en EUR, USD, CAD ou FCFA, interface disponible en français et en anglais.' },
            { icon: ShieldCheck, title: 'Vos données vous appartiennent', text: 'Exportables à tout moment (Excel, CSV), sans vous enfermer dans un outil que vous ne maîtrisez pas.' },
            { icon: Users, title: 'Support humain', text: 'Une équipe joignable par WhatsApp et email, pas un simple centre de tickets automatisé.' },
        ]
        : [
            { icon: HardHat, title: 'Built for the field', text: 'Not for IT teams — for managers, sellers and cashiers who have no time to lose.' },
            { icon: MapPin, title: 'Multi-currency and bilingual', text: 'Prices shown in EUR, USD, CAD or FCFA, interface available in French and English.' },
            { icon: ShieldCheck, title: 'Your data is yours', text: 'Exportable anytime (Excel, CSV), without locking you into a tool you don\'t control.' },
            { icon: Users, title: 'Human support', text: 'A team reachable on WhatsApp and email, not just an automated ticket queue.' },
        ];

    const problemSolution = isFr
        ? {
            problemTitle: 'Le problème',
            problem: "La plupart des commerçants gèrent encore leur stock sur cahier, leurs ventes de tête, et découvrent une rupture le jour où un client repart les mains vides. Les logiciels de gestion existants sont soit trop chers, soit trop complexes, avec des devises ou une langue qui ne correspondent pas à leur marché.",
            solutionTitle: 'Notre réponse',
            solution: "BATIX PRO donne aux commerçants, où qu'ils soient, les mêmes outils de pilotage que les grandes enseignes — vente, stock, multi-boutiques, rapports, assistant IA — dans une seule application, disponible en français et en anglais, avec des prix affichés dans votre devise, et un essai qui ne demande pas de carte bancaire.",
        }
        : {
            problemTitle: 'The problem',
            problem: "Most retailers still track stock on paper, sales from memory, and discover a stock-out the day a customer walks away empty-handed. Existing management software is either too expensive or too complex, priced or worded in ways that don't match their market.",
            solutionTitle: 'Our answer',
            solution: "BATIX PRO gives retailers, wherever they are, the same management tools as large chains — sales, stock, multi-store, reports, AI assistant — in one application, available in French and English, priced in your currency, with a trial that asks for no credit card.",
        };

    const builtLabel = isFr ? 'Ce que nous avons construit' : 'What we built';
    const builtTitle = isFr ? 'Cinq modules, un seul logiciel' : 'Five modules, one piece of software';

    const promiseIcons = [Zap, MessageCircle, ShieldCheck];
    const pullQuote = isFr
        ? "La plupart des logiciels de gestion sont conçus pour des bureaux, pas pour des comptoirs de quincaillerie où chaque minute compte."
        : "Most management software is built for back offices, not for hardware store counters where every minute counts.";

    return (
        <>
            <SeoHead
                title={title}
                description={description}
                canonical={localeLinks[locale]}
                ogLocale={isFr ? 'fr_FR' : 'en_US'}
                hreflangAlternates={[
                    { locale: 'fr', href: localeLinks.fr },
                    { locale: 'en', href: localeLinks.en },
                    { locale: 'x-default', href: localeLinks.fr },
                ]}
            />

            <PublicLayout locale={locale} localeLinks={localeLinks} isAuthenticated={!!auth.user} getDashboardUrl={getDashboardUrl}>
                {/* Hero avec bannière, plus immersif */}
                <section className="relative">
                    <div
                        className="h-80 w-full bg-cover bg-center sm:h-[28rem]"
                        style={{ backgroundImage: `linear-gradient(180deg, rgba(15,15,15,0.25), rgba(15,15,15,0.75)), url(${aboutBanner})` }}
                        role="img"
                        aria-label={isFr ? 'Rayonnage de quincaillerie' : 'Hardware store shelving'}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-terre-900/70">
                        <div className="w-full flex items-center justify-center flex-col">
                            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">
                                {isFr ? 'À propos' : 'About'}
                            </p>
                            <h1 className="mt-3 text-4xl font-extrabold leading-tight text-white sm:text-5xl">{title}</h1>
                            <p className="mt-4 max-w-xl text-lg text-terre-50 text-center">{description}</p>
                        </div>
                    </div>
                </section>

                {/* Citation d'ouverture */}
                <section className="mx-auto max-w-3xl px-6 py-16 text-center lg:px-8">
                    <span className="text-6xl font-black leading-none text-terre-200">“</span>
                    <p className="-mt-6 text-2xl font-bold leading-snug text-slate-900 sm:text-3xl">
                        {pullQuote}
                    </p>
                    <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-500">
                        {isFr
                            ? "Notre objectif est de donner à tout commerçant, où qu'il soit, les mêmes outils de pilotage que les grandes enseignes, sans la complexité."
                            : "Our goal is to give any retailer, wherever they are, the same management tools as large chains, without the complexity."}
                    </p>
                </section>

                {/* Bandeau de preuve — chiffres réels déjà utilisés sur le site */}
                <section className="border-y border-gray-200 bg-white py-12">
                    <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 px-6 sm:grid-cols-3 lg:px-8">
                        {t.promises.map((promise, index) => {
                            const Icon = promiseIcons[index] ?? Zap;
                            return (
                                <div key={promise.label} className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-5 shadow-sm">
                                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-terre-50 text-terre-600">
                                        <Icon className="size-5" />
                                    </span>
                                    <div>
                                        <p className="text-2xl font-extrabold text-slate-900">{promise.value}</p>
                                        <p className="text-xs text-slate-500">{promise.label}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Le problème / Notre réponse */}
                <section className="bg-terre-50 py-16">
                    <motion.div
                        className="relative mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-2 lg:px-8"
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, amount: 0.2 }}
                        variants={stagger}
                    >
                        <motion.div variants={fadeUp} className="rounded-2xl bg-white p-8 shadow-sm">
                            <div className="mb-4 inline-flex size-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                                <TriangleAlert className="size-5" />
                            </div>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{problemSolution.problemTitle}</p>
                            <p className="mt-3 text-base leading-relaxed text-slate-600">{problemSolution.problem}</p>
                        </motion.div>

                        <div className="absolute left-1/2 top-1/2 z-10 hidden size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-amber-300 text-slate-900 shadow-lg md:flex">
                            <ArrowRight className="size-5" />
                        </div>

                        <motion.div variants={fadeUp} className="rounded-2xl bg-terre-600 p-8 shadow-sm">
                            <div className="mb-4 inline-flex size-11 items-center justify-center rounded-full bg-white/15 text-white">
                                <CheckCircle2 className="size-5" />
                            </div>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-terre-100">{problemSolution.solutionTitle}</p>
                            <p className="mt-3 text-base leading-relaxed text-white">{problemSolution.solution}</p>
                        </motion.div>
                    </motion.div>
                </section>

                {/* Valeurs */}
                <section className="bg-white py-16">
                    <div className="mx-auto max-w-6xl px-6 lg:px-8">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-terre-600">
                            {isFr ? 'Nos principes' : 'Our principles'}
                        </p>
                        <h2 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                            {isFr ? 'Ce qui guide chaque décision produit' : 'What guides every product decision'}
                        </h2>
                        <div className="mt-3 h-1 w-12 rounded-full bg-terre-500" />

                        <motion.div
                            className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, amount: 0.1 }}
                            variants={stagger}
                        >
                            {values.map((value) => (
                                <motion.div key={value.title} variants={fadeUp} className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                                    <div className="mx-auto mb-4 inline-flex size-14 items-center justify-center rounded-2xl bg-terre-50 text-terre-600">
                                        <value.icon className="size-6" />
                                    </div>
                                    <p className="font-bold text-slate-900">{value.title}</p>
                                    <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{value.text}</p>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* Ce que nous avons construit — lien vers les 5 modules réels */}
                <section className="bg-gray-50 py-16">
                    <div className="mx-auto max-w-6xl px-6 lg:px-8">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-terre-600">{builtLabel}</p>
                        <h2 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">{builtTitle}</h2>
                        <div className="mt-3 h-1 w-12 rounded-full bg-terre-500" />

                        <motion.div
                            className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, amount: 0.1 }}
                            variants={stagger}
                        >
                            {featurePages.map((feature) => (
                                <motion.div key={feature.slug} variants={fadeUp}>
                                    <Link
                                        href={isFr ? route('features.show', feature.slug) : route('en.features.show', feature.slug)}
                                        className="group flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-terre-200 hover:shadow-md"
                                    >
                                        <div className="mb-3 inline-flex w-fit rounded-xl bg-terre-50 p-2.5 text-terre-600">
                                            <feature.icon className="size-5" />
                                        </div>
                                        <p className="font-bold text-slate-900">{feature.title[locale]}</p>
                                        <p className="mt-1 flex-1 text-sm leading-relaxed text-slate-500">{feature.tagline[locale]}</p>
                                        <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-terre-700">
                                            {isFr ? 'Découvrir' : 'Discover'}
                                            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                                        </span>
                                    </Link>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                <FinalCtaSection
                    title={t.contact.title}
                    description={t.contact.description}
                    cta={t.contact.cta}
                    getDashboardUrl={getDashboardUrl}
                />
            </PublicLayout>
        </>
    );
}
