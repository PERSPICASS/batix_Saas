import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import featuresBanner from '/resources/images/heroes/shot-of-a-young-man-working-at-his-job-in-a-shop-2026-03-25-02-43-26-utc.jpg';
import PublicLayout from '@/Layouts/PublicLayout';
import { SeoHead } from '@/Components/SeoHead';
import { PageProps } from '@/types';
import type { Locale } from '@/types/types';
import { copy, fadeUp, faqsByLocale, stagger } from '@/types/data';
import { featurePages } from '@/types/featurePages';
import { useDashboardUrl } from '@/hooks/useDashboardUrl';
import FaqSection from '@/Components/Welcome/FaqSection';
import { useMemo } from 'react';
import FinalCtaSection from '@/Components/Welcome/FinalCtaSection';
import { breadcrumbSchema, faqSchema, itemListSchema, webPageSchema } from '@/utils/seoSchemas';

interface Props extends PageProps {
    locale: Locale;
    localeLinks: Record<Locale, string>;
}

export default function FeaturesIndex({ auth, appUrl, locale, localeLinks }: Props) {
    const getDashboardUrl = useDashboardUrl(auth);
    const isFr = locale === 'fr';
    const t = copy[locale];
    const faqs = useMemo(() => faqsByLocale[locale], [locale]);

    const title = isFr
        ? 'Fonctionnalités BATIX PRO — Caisse, stocks, multi-boutiques, rapports, IA'
        : 'BATIX PRO Features — POS, stock, multi-store, reports, AI';
    const description = isFr
        ? 'Découvrez toutes les fonctionnalités de BATIX PRO : vente et caisse, stocks et dépôts, multi-boutiques, rapports et facturation, assistant IA.'
        : 'Explore every BATIX PRO feature: sales and POS, stock and depots, multi-store, reports and invoicing, AI assistant.';

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
                jsonLd={[
                    webPageSchema(appUrl, {
                        type: 'CollectionPage',
                        name: isFr ? 'Fonctionnalités' : 'Features',
                        description,
                        url: localeLinks[locale],
                        locale,
                    }),
                    itemListSchema(
                        featurePages.map((page) => ({
                            name: page.title[locale],
                            url: isFr
                                ? route('features.show', page.slug)
                                : route('en.features.show', page.slug),
                            description: page.description[locale],
                        })),
                    ),
                    // La FAQ est bien rendue plus bas par <FaqSection> : c'est ce qui
                    // rend ce bloc légitime aux yeux de Google.
                    faqSchema(faqs),
                    breadcrumbSchema(appUrl, [
                        { name: isFr ? 'Fonctionnalités' : 'Features', item: localeLinks[locale] },
                    ]),
                ]}
            />

            <PublicLayout locale={locale} localeLinks={localeLinks} isAuthenticated={!!auth.user} getDashboardUrl={getDashboardUrl}>
                <section className="relative overflow-hidden">
                    <div className="absolute inset-0">
                        <img src={featuresBanner} alt="" className="h-full w-full object-cover" />
                        <div
                            className="absolute inset-0"
                            style={{ background: 'linear-gradient(120deg, rgba(59,30,17,0.88), rgba(160,82,45,0.55))' }}
                        />
                    </div>
                    <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8">
                        <motion.div className="max-w-2xl" initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-terre-200">
                                {isFr ? 'Fonctionnalités' : 'Features'}
                            </p>
                            <h1 className="mt-2 text-4xl font-extrabold text-white">
                                {isFr ? 'Tout ce dont votre quincaillerie a besoin' : 'Everything your hardware store needs'}
                            </h1>
                            <p className="mt-3 text-base text-terre-50">{description}</p>
                        </motion.div>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
                    <motion.div
                        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5"
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, amount: 0.1 }}
                        variants={stagger}
                    >
                        {featurePages.map((page) => (
                            <motion.div key={page.slug} variants={fadeUp}>
                                <Link
                                    href={isFr ? route('features.show', page.slug) : route('en.features.show', page.slug)}
                                    className="group flex h-full flex-col rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-terre-200 hover:shadow-md"
                                >
                                    <div className="mb-5 inline-flex w-fit rounded-2xl bg-terre-50 p-3 text-terre-600">
                                        <page.icon className="size-6" />
                                    </div>
                                    <h2 className="text-md font-extrabold text-slate-900">{page.title[locale]}</h2>
                                    <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">{page.tagline[locale]}</p>
                                    <div className="mt-4 flex items-center gap-1 text-sm font-medium text-terre-700">
                                        {isFr ? 'Découvrir' : 'Discover'}
                                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                </section>
                <FaqSection
                    locale={locale}
                    faqTitle={t.faqTitle}
                    faqs={faqs}
                />
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
