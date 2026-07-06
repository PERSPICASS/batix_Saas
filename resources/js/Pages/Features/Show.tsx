import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import PublicLayout from '@/Layouts/PublicLayout';
import { SeoHead } from '@/Components/SeoHead';
import FinalCtaSection from '@/Components/Welcome/FinalCtaSection';
import { PageProps } from '@/types';
import type { Locale } from '@/types/types';
import { copy, fadeUp, stagger } from '@/types/data';
import { featurePages, getFeaturePage } from '@/types/featurePages';
import { useDashboardUrl } from '@/hooks/useDashboardUrl';

interface Props extends PageProps {
    slug: string;
    locale: Locale;
    localeLinks: Record<Locale, string>;
}

export default function FeatureShow({ auth, slug, locale, localeLinks }: Props) {
    const getDashboardUrl = useDashboardUrl(auth);
    const isFr = locale === 'fr';
    const page = getFeaturePage(slug);
    const t = copy[locale];

    if (!page) return null;

    const otherPages = featurePages.filter((p) => p.slug !== slug);
    const seoTitle = `${page.title[locale]} — BATIX PRO`;

    return (
        <>
            <SeoHead
                title={seoTitle}
                description={page.description[locale]}
                canonical={localeLinks[locale]}
                ogLocale={isFr ? 'fr_FR' : 'en_US'}
                hreflangAlternates={[
                    { locale: 'fr', href: localeLinks.fr },
                    { locale: 'en', href: localeLinks.en },
                    { locale: 'x-default', href: localeLinks.fr },
                ]}
            />

            <PublicLayout locale={locale} localeLinks={localeLinks} isAuthenticated={!!auth.user} getDashboardUrl={getDashboardUrl}>
                {/* Hero centré, simple */}
                <section className="bg-terre-600 py-16">
                    <motion.div
                        className="mx-auto max-w-2xl px-6 text-center lg:px-8"
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        variants={fadeUp}
                    >
                        <Link
                            href={isFr ? route('features.index') : route('en.features.index')}
                            className="mb-6 inline-flex items-center gap-2 text-sm text-terre-100 transition hover:text-white"
                        >
                            <ArrowRight className="size-4 rotate-180" />
                            {isFr ? 'Toutes les fonctionnalités' : 'All features'}
                        </Link>

                        <div className="mx-auto mb-6 inline-flex w-fit rounded-2xl bg-white/15 p-4 text-white">
                            <page.icon className="size-7" />
                        </div>
                        <h1 className="text-3xl font-extrabold text-white sm:text-4xl">{page.title[locale]}</h1>
                        <p className="mt-3 text-lg text-terre-100">{page.tagline[locale]}</p>
                        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-terre-50">{page.description[locale]}</p>

                        <Link
                            href={getDashboardUrl()}
                            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-900 shadow-md transition hover:bg-amber-400"
                        >
                            {isFr ? 'Démarrer mon essai' : 'Start my free trial'}
                            <ArrowRight className="size-4" />
                        </Link>
                    </motion.div>
                </section>

                {/* Tous les bénéfices — une seule grille uniforme */}
                <section className="bg-white py-16">
                    <div className="mx-auto max-w-5xl px-6 lg:px-8">
                        <motion.div
                            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, amount: 0.1 }}
                            variants={stagger}
                        >
                            {page.benefits[locale].map((benefit) => (
                                <motion.div
                                    key={benefit.title}
                                    variants={fadeUp}
                                    className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                                >
                                    <div className="mb-3 inline-flex size-10 items-center justify-center rounded-xl bg-terre-50 text-terre-600">
                                        <benefit.icon className="size-5" />
                                    </div>
                                    <p className="font-bold text-slate-900">{benefit.title}</p>
                                    <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{benefit.description}</p>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* Découvrir aussi */}
                <section className="bg-gray-50 py-14">
                    <div className="mx-auto max-w-6xl px-6 lg:px-8">
                        <h2 className="mb-6 text-2xl font-extrabold text-slate-900">
                            {isFr ? 'Continuez votre découverte' : 'Keep exploring'}
                        </h2>
                        <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {otherPages.map((other) => (
                                <Link
                                    key={other.slug}
                                    href={isFr ? route('features.show', other.slug) : route('en.features.show', other.slug)}
                                    className="group flex w-64 shrink-0 flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-terre-200 hover:shadow-md"
                                >
                                    <div className="mb-4 inline-flex w-fit rounded-xl bg-terre-50 p-2.5 text-terre-600">
                                        <other.icon className="size-5" />
                                    </div>
                                    <p className="font-extrabold text-slate-900">{other.title[locale]}</p>
                                    <p className="mt-1 flex-1 text-sm leading-relaxed text-slate-500">{other.tagline[locale]}</p>
                                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-terre-700">
                                        {isFr ? 'Découvrir' : 'Discover'}
                                        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                                    </span>
                                </Link>
                            ))}
                        </div>
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
