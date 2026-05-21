import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { copy, fallbackPlansByLocale, faqsByLocale, featuresByLocale, heroSlides, trustMarksByLocale } from '@/types/data';
import type { Locale, PlanView, SubscriptionPlan } from '@/types/types';
import BlogSection from '@/Components/Welcome/BlogSection';
import ContactSection from '@/Components/Welcome/ContactSection';
import DemoSection from '@/Components/Welcome/DemoSection';
import FaqSection from '@/Components/Welcome/FaqSection';
import FeaturesSection from '@/Components/Welcome/FeaturesSection';
import HeroSection from '@/Components/Welcome/HeroSection';
import PricingSection from '@/Components/Welcome/PricingSection';
import TestimonialsSection from '@/Components/Welcome/TestimonialsSection';
import WelcomeFooter from '@/Components/Welcome/WelcomeFooter';
import WelcomeHeader from '@/Components/Welcome/WelcomeHeader';

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
    subscriptionPlans: SubscriptionPlan[];
    appUrl: string;
    latestPosts: BlogPost[];
}

export default function Welcome({ auth, subscriptionPlans, appUrl, latestPosts = [] }: WelcomeProps) {
    const [locale, setLocale] = useState<Locale>('fr');
    const [activeHeroSlide, setActiveHeroSlide] = useState(0);
    const [scrolled, setScrolled] = useState(false);

    // ── Scroll detection ───────────────────────────────────────────────────
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 60);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // ── Persist locale ─────────────────────────────────────────────────────
    useEffect(() => {
        const saved = window.localStorage.getItem('landing_locale');
        if (saved === 'fr' || saved === 'en') setLocale(saved as Locale);
    }, []);

    useEffect(() => {
        window.localStorage.setItem('landing_locale', locale);
    }, [locale]);

    // ── Dashboard URL ──────────────────────────────────────────────────────
    const getDashboardUrl = () => {
        if (!auth.user) return route('register');
        if (auth.user.role === 'admin_platforme') return route('platform.dashboard');
        if (auth.code_user) return route('dashboard', { code_user: auth.code_user });
        return route('register');
    };

    // ── Derived data ───────────────────────────────────────────────────────
    const t = copy[locale];
    const features = useMemo(() => featuresByLocale[locale], [locale]);
    const faqs = useMemo(() => faqsByLocale[locale], [locale]);
    const trustMarks = useMemo(() => trustMarksByLocale[locale], [locale]);

    const hasHeroSlides = heroSlides.length > 0;
    const activeHeroCaption = hasHeroSlides ? heroSlides[activeHeroSlide]?.caption?.[locale] : null;
    const heroHeadline = activeHeroCaption?.title ?? t.hero.title;
    const heroDescription = activeHeroCaption?.description ?? t.hero.description;

    const filteredSubscriptionPlans = useMemo(() => {
        return subscriptionPlans.filter((plan) => {
            const identity = `${plan.slug ?? ''} ${plan.name ?? ''}`.toLowerCase().trim();
            const looksFree = identity === 'free' || identity.includes('free') || identity.includes('gratuit');
            const isZeroPrice = Number(plan.price) === 0;
            return !looksFree && !isZeroPrice;
        });
    }, [subscriptionPlans]);

    const hasDynamicPlans = filteredSubscriptionPlans.length > 0;

    const plans = useMemo<PlanView[]>(() => {
        if (filteredSubscriptionPlans.length === 0) return fallbackPlansByLocale[locale];
        const middle = Math.floor(filteredSubscriptionPlans.length / 2);
        return filteredSubscriptionPlans.map((plan, index) => {
            const isFr = locale === 'fr';
            const unlimited = isFr ? 'Illimite' : 'Unlimited';
            const subtitle = isFr ? 'par mois' : 'per month';
            const rawEur = plan.price_eur?.trim() || plan.formatted_price?.trim();
            const badge = isFr
                ? plan.shop_limit_text
                : plan.has_unlimited_shops
                  ? 'Unlimited stores'
                  : `Up to ${plan.max_shops} store${plan.max_shops > 1 ? 's' : ''}`;
            const shopsLabel = plan.has_unlimited_shops
                ? isFr ? `${unlimited} boutiques` : `${unlimited} stores`
                : isFr ? `${plan.max_shops} boutique${plan.max_shops > 1 ? 's' : ''}` : `${plan.max_shops} store${plan.max_shops > 1 ? 's' : ''}`;
            const usersLabel = plan.has_unlimited_users
                ? isFr ? `${unlimited} utilisateurs` : `${unlimited} users`
                : isFr ? `${plan.max_users} utilisateurs` : `${plan.max_users} users`;
            const productsLabel = plan.has_unlimited_products
                ? isFr ? `${unlimited} produits` : `${unlimited} products`
                : isFr ? `${plan.max_products} produits` : `${plan.max_products} products`;
            const depotsLabel = plan.max_depots === 0
                ? isFr ? 'Sans depot' : 'No depot'
                : plan.has_unlimited_depots
                  ? isFr ? `${unlimited} depots` : `${unlimited} depots`
                  : isFr ? `${plan.max_depots} depot${plan.max_depots > 1 ? 's' : ''}` : `${plan.max_depots} depot${plan.max_depots > 1 ? 's' : ''}`;
            const baseFeatures = isFr
                ? ['Ventes et caisse', 'Gestion des achats', 'Rapports et statistiques']
                : ['Sales and POS', 'Purchase management', 'Reports and analytics'];
            const extraFeatures = Array.isArray(plan.features)
                ? plan.features.filter((f) => f && f.trim().length > 0).slice(0, 2)
                : [];
            return {
                name: plan.name,
                price_eur: rawEur || `${plan.price} EUR`,
                price_fcfa: plan.price_fcfa,
                subtitle,
                badge,
                points: [shopsLabel, usersLabel, productsLabel, depotsLabel, ...baseFeatures, ...extraFeatures],
                highlighted: index === middle,
            };
        });
    }, [filteredSubscriptionPlans, locale]);

    // ── Hero auto-advance ──────────────────────────────────────────────────
    useEffect(() => {
        if (heroSlides.length <= 1) return;
        const timer = window.setInterval(() => {
            setActiveHeroSlide((current) => (current + 1) % heroSlides.length);
        }, 4500);
        return () => window.clearInterval(timer);
    }, []);

    const canonicalUrl = appUrl || 'https://batixpro.com';
    const ogImage = `${canonicalUrl}${t.seo.ogImage}`;
    const ogLocale = locale === 'fr' ? 'fr_FR' : 'en_US';
    const ogLocaleAlt = locale === 'fr' ? 'en_US' : 'fr_FR';

    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'Organization',
                '@id': `${canonicalUrl}/#organization`,
                name: 'BATIX PRO',
                url: canonicalUrl,
                logo: {
                    '@type': 'ImageObject',
                    url: `${canonicalUrl}/favicon.svg`,
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
                '@id': `${canonicalUrl}/#website`,
                url: canonicalUrl,
                name: 'BATIX PRO',
                description: t.seo.description,
                publisher: { '@id': `${canonicalUrl}/#organization` },
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
                description: t.seo.description,
                url: canonicalUrl,
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

                {/* JSON-LD */}
                <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
            </Head>
            <div className="relative min-h-screen overflow-x-clip bg-[#f9f5ef] text-slate-900 selection:bg-amber-300 selection:text-slate-900">
                <div className="pointer-events-none absolute inset-0 -z-10">
                    <div className="h-full w-full bg-gradient-to-br from-[#fdf8f0] via-[#f9f5ef] to-[#f2ebe0]" />
                </div>
                <div className="w-full">
                    <WelcomeHeader
                        locale={locale}
                        setLocale={setLocale}
                        scrolled={scrolled}
                        getDashboardUrl={getDashboardUrl}
                        isAuthenticated={!!auth.user}
                    />

                    <main className="pt-10">
                        <HeroSection
                            locale={locale}
                            t={t}
                            heroHeadline={heroHeadline}
                            heroDescription={heroDescription}
                            activeHeroSlide={activeHeroSlide}
                            getDashboardUrl={getDashboardUrl}
                            setActiveHeroSlide={setActiveHeroSlide}
                        />

                        <FeaturesSection
                            locale={locale}
                            featuresTitle={t.featuresTitle}
                            features={features}
                        />

                        <DemoSection
                            locale={locale}
                            t={{ demo: t.demo, videoFaqs: t.videoFaqs }}
                            getDashboardUrl={getDashboardUrl}
                        />

                        <TestimonialsSection
                            locale={locale}
                            promises={t.promises}
                            trustReasons={t.trustReasons}
                        />

                        <PricingSection
                            pricingTitle={t.pricingTitle}
                            pricingLabel={t.pricingLabel}
                            pricingFallback={t.pricingFallback}
                            planCta={t.planCta}
                            plans={plans}
                            hasDynamicPlans={hasDynamicPlans}
                            getDashboardUrl={getDashboardUrl}
                        />

                        {/* ── Séparateur Pricing / FAQ ── */}
                        <div className="bg-slate-900 px-6 lg:px-8">
                            <div className="mx-auto max-w-7xl">
                                <div className="flex items-center gap-4">
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-amber-400/60" />
                                    <span className="shrink-0 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-amber-400">
                                        FAQ
                                    </span>
                                    <div className="h-px flex-1 bg-gradient-to-l from-transparent via-slate-700 to-amber-400/60" />
                                </div>
                            </div>
                        </div>

                        <FaqSection
                            locale={locale}
                            faqTitle={t.faqTitle}
                            faqs={faqs}
                        />

                        <BlogSection
                            locale={locale}
                            posts={latestPosts}
                        />

                        <ContactSection
                            locale={locale}
                            t={{ contact: t.contact }}
                            getDashboardUrl={getDashboardUrl}
                        />
                    </main>

                    <WelcomeFooter
                        footerText={t.footerText}
                        nav={t.nav}
                    />
                </div>
            </div>
        </>
    );
}
