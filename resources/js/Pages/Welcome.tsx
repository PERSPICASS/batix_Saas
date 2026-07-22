import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { copy, faqsByLocale, heroSlides, localBusinessData, faqSchemaData } from '@/types/data';
import type { Locale } from '@/types/types';
import { useDashboardUrl } from '@/hooks/useDashboardUrl';
import PublicLayout from '@/Layouts/PublicLayout';
import AiShowcase from '@/Components/Welcome/AiShowcase';
import AudienceSwitcher from '@/Components/Welcome/AudienceSwitcher';
import BlogSection from '@/Components/Welcome/BlogSection';
import DemoSection from '@/Components/Welcome/DemoSection';
import FaqSection from '@/Components/Welcome/FaqSection';
import FeaturesTeaser from '@/Components/Welcome/FeaturesTeaser';
import FinalCtaSection from '@/Components/Welcome/FinalCtaSection';
import HeroSection from '@/Components/Welcome/HeroSection';
import TrustSection from '@/Components/Welcome/TrustSection';
import TestimonialsSection, { type Testimonial } from '@/Components/Welcome/TestimonialsSection';

interface BlogPost {
    id: number;
    slug: string;
    title_fr: string;
    title_en: string | null;
    excerpt_fr: string | null;
    excerpt_en: string | null;
    cover_image: string | null;
    author_name: string;
    category: string | null;
    published_at: string | null;
}

interface WelcomeProps extends PageProps {
    appUrl: string;
    latestPosts: BlogPost[];
    reviews: Testimonial[];
    locale: Locale;
    localeLinks: Record<Locale, string>;
}

export default function Welcome({ auth, appUrl, latestPosts = [], reviews = [], locale, localeLinks }: WelcomeProps) {
    const [activeHeroSlide, setActiveHeroSlide] = useState(0);
    const getDashboardUrl = useDashboardUrl(auth);

    // ── Derived data ───────────────────────────────────────────────────────
    const t = copy[locale];
    const faqs = useMemo(() => faqsByLocale[locale], [locale]);

    const hasHeroSlides = heroSlides.length > 0;
    const activeHeroCaption = hasHeroSlides ? heroSlides[activeHeroSlide]?.caption?.[locale] : null;
    const heroHeadline = activeHeroCaption?.title ?? t.hero.title;
    const heroDescription = activeHeroCaption?.description ?? t.hero.description;

    // ── Hero auto-advance ──────────────────────────────────────────────────
    useEffect(() => {
        if (heroSlides.length <= 1) return;
        const timer = window.setInterval(() => {
            setActiveHeroSlide((current) => (current + 1) % heroSlides.length);
        }, 4500);
        return () => window.clearInterval(timer);
    }, []);

    // Aggregate rating from the real, admin-approved reviews shown on the page.
    // Only surfaced to search engines when there is at least one — an empty or
    // fabricated AggregateRating is against Google's guidelines.
    const reviewCount = reviews.length;
    const averageRating = reviewCount > 0
        ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10) / 10
        : 0;

    const canonicalUrl = localeLinks[locale];
    const ogImage = `${appUrl}${t.seo.ogImage}`;
    const ogLocale = locale === 'fr' ? 'fr_FR' : 'en_US';
    const ogLocaleAlt = locale === 'fr' ? 'en_US' : 'fr_FR';

    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'Organization',
                '@id': `${appUrl}/#organization`,
                name: 'BATIX PRO',
                url: appUrl,
                logo: {
                    '@type': 'ImageObject',
                    url: `${appUrl}/favicon.svg`,
                },
                sameAs: [],
                contactPoint: {
                    '@type': 'ContactPoint',
                    contactType: 'customer support',
                    availableLanguage: ['French', 'English'],
                },
            },
            {
                '@type': 'WebSite',
                '@id': `${appUrl}/#website`,
                url: appUrl,
                name: 'BATIX PRO',
                description: t.seo.description,
                publisher: { '@id': `${appUrl}/#organization` },
                inLanguage: locale === 'fr' ? 'fr-FR' : 'en-US',
            },
            {
                '@type': 'SoftwareApplication',
                name: 'BATIX PRO',
                applicationCategory: 'BusinessApplication',
                operatingSystem: 'Web',
                offers: {
                    '@type': 'AggregateOffer',
                    priceCurrency: 'EUR',
                    lowPrice: '0',
                    offerCount: '4',
                },
                ...(reviewCount > 0 && {
                    aggregateRating: {
                        '@type': 'AggregateRating',
                        ratingValue: averageRating,
                        reviewCount,
                        bestRating: 5,
                        worstRating: 1,
                    },
                }),
                description: t.seo.description,
                url: appUrl,
            },
        ],
    };

    return (
        <>
            <Head>
                <title>{t.title}</title>
                <meta name="description" content={t.seo.description} />
                <meta name="keywords" content={t.seo.keywords} />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href={canonicalUrl} />

                {/* Open Graph */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content={canonicalUrl} />
                <meta property="og:title" content={t.title} />
                <meta property="og:description" content={t.seo.description} />
                <meta property="og:image" content={ogImage} />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta property="og:site_name" content="BATIX PRO" />
                <meta property="og:locale" content={ogLocale} />
                <meta property="og:locale:alternate" content={ogLocaleAlt} />

                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={t.title} />
                <meta name="twitter:description" content={t.seo.description} />
                <meta name="twitter:image" content={ogImage} />

                {/* hreflang for multilingual SEO — real per-locale URLs, resolved server-side */}
                <link rel="alternate" hrefLang="fr" href={localeLinks.fr} />
                <link rel="alternate" hrefLang="en" href={localeLinks.en} />
                <link rel="alternate" hrefLang="x-default" href={localeLinks.fr} />

                {/* JSON-LD - Organization & WebSite & SoftwareApplication */}
                <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>

                {/* JSON-LD - LocalBusiness for local SEO */}
                <script type="application/ld+json">{JSON.stringify((localBusinessData as any)[locale] || (localBusinessData as any).fr)}</script>

                {/* JSON-LD - FAQ Schema for rich snippets */}
                <script type="application/ld+json">{JSON.stringify((faqSchemaData as any)[locale] || (faqSchemaData as any).fr)}</script>
            </Head>

            {/* H1 for SEO - visually hidden but accessible */}
            <h1 className="sr-only">
                BATIX PRO - Logiciel de gestion de quincaillerie avec ventes, stock et caisse en temps réel
            </h1>

            <PublicLayout
                locale={locale}
                localeLinks={localeLinks}
                isAuthenticated={!!auth.user}
                getDashboardUrl={getDashboardUrl}
            >
                <HeroSection
                    locale={locale}
                    t={t}
                    heroHeadline={heroHeadline}
                    heroDescription={heroDescription}
                    activeHeroSlide={activeHeroSlide}
                    getDashboardUrl={getDashboardUrl}
                    setActiveHeroSlide={setActiveHeroSlide}
                />

                <FeaturesTeaser locale={locale} featuresTitle={t.featuresTitle} />

                <AudienceSwitcher locale={locale} />

                {/* Remontée depuis la page /clients supprimée : elle porte les
                    promesses vérifiables (essai 14 jours, support WhatsApp) et ne
                    contenait aucun témoignage. */}
                <TrustSection locale={locale} promises={t.promises} trustReasons={t.trustReasons} />

                <AiShowcase locale={locale} />

                <DemoSection
                    locale={locale}
                    t={{ demo: t.demo, videoFaqs: t.videoFaqs }}
                    getDashboardUrl={getDashboardUrl}
                />

               

                <TestimonialsSection locale={locale} reviews={reviews} />

                <BlogSection
                    locale={locale}
                    posts={latestPosts}
                />

                <FinalCtaSection
                    title={t.contact.title}
                    description={t.contact.description}
                    cta={t.contact.cta}
                    getDashboardUrl={getDashboardUrl}
                />
                 {/* ── Séparateur / FAQ ── */}
                {/* <div className="bg-white px-6 lg:px-8">
                    <div className="mx-auto max-w-7xl">
                        <div className="flex items-center gap-4">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-terre-300" />
                            <span className="shrink-0 rounded-full border border-terre-200 bg-terre-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-terre-700">
                                FAQ
                            </span>
                            <div className="h-px flex-1 bg-gradient-to-l from-transparent via-gray-200 to-terre-300" />
                        </div>
                    </div>
                </div> */}

                <FaqSection
                    locale={locale}
                    faqTitle={t.faqTitle}
                    faqs={faqs}
                />
            </PublicLayout>
        </>
    );
}
