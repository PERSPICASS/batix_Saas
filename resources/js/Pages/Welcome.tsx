import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { copy, fallbackPlansByLocale, faqsByLocale, featuresByLocale, heroSlides, trustMarksByLocale } from '@/types/data';
import type { Locale, PlanView, SubscriptionPlan } from '@/types/types';
import ContactSection from '@/Components/Welcome/ContactSection';
import DemoSection from '@/Components/Welcome/DemoSection';
import FaqSection from '@/Components/Welcome/FaqSection';
import FeaturesSection from '@/Components/Welcome/FeaturesSection';
import HeroSection from '@/Components/Welcome/HeroSection';
import PricingSection from '@/Components/Welcome/PricingSection';
import WelcomeFooter from '@/Components/Welcome/WelcomeFooter';
import WelcomeHeader from '@/Components/Welcome/WelcomeHeader';

interface WelcomeProps extends PageProps {
    subscriptionPlans: SubscriptionPlan[];
}

export default function Welcome({ auth, subscriptionPlans }: WelcomeProps) {
    const [locale, setLocale] = useState<Locale>('fr');
    const [activeHeroSlide, setActiveHeroSlide] = useState(0);
    const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
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
    const maxFeatureIndex = Math.max(features.length - 1, 0);

    const plans = useMemo<PlanView[]>(() => {
        if (filteredSubscriptionPlans.length === 0) return fallbackPlansByLocale[locale];
        const middle = Math.floor(filteredSubscriptionPlans.length / 2);
        return filteredSubscriptionPlans.map((plan, index) => {
            const isFr = locale === 'fr';
            const unlimited = isFr ? 'Illimite' : 'Unlimited';
            const subtitle = isFr ? 'par mois' : 'per month';
            const rawEur = plan.price_eur?.trim() || plan.formatted_price?.trim();
            const rawFcfa = plan.price_fcfa?.trim();
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
                ? ['Ventes et caisse', 'Gestion des achats', 'Rapports et statistiques', 'Application mobile']
                : ['Sales and POS', 'Purchase management', 'Reports and analytics', 'Mobile app'];
            const extraFeatures = Array.isArray(plan.features)
                ? plan.features.filter((f) => f && f.trim().length > 0).slice(0, 2)
                : [];
            return {
                name: plan.name,
                price_eur: rawEur || `${plan.price} EUR`,
                price_fcfa: rawFcfa || (isFr ? 'Prix au checkout' : 'Price at checkout'),
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

    // ── Feature auto-advance ───────────────────────────────────────────────
    useEffect(() => {
        setActiveFeatureIndex((current) => Math.min(current, maxFeatureIndex));
    }, [maxFeatureIndex]);

    useEffect(() => {
        if (features.length <= 1) return;
        const timer = window.setInterval(() => {
            setActiveFeatureIndex((current) => (current >= maxFeatureIndex ? 0 : current + 1));
        }, 4200);
        return () => window.clearInterval(timer);
    }, [features.length, maxFeatureIndex]);

    return (
        <>
            <Head title={t.title} />
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
                            trustMarks={trustMarks}
                            getDashboardUrl={getDashboardUrl}
                            setActiveHeroSlide={setActiveHeroSlide}
                        />

                        <FeaturesSection
                            locale={locale}
                            featuresTitle={t.featuresTitle}
                            features={features}
                            activeFeatureIndex={activeFeatureIndex}
                            setActiveFeatureIndex={setActiveFeatureIndex}
                        />

                        <DemoSection
                            locale={locale}
                            t={{ demo: t.demo }}
                            getDashboardUrl={getDashboardUrl}
                        />

                        <PricingSection
                            pricingTitle={t.pricingTitle}
                            pricingFallback={t.pricingFallback}
                            planCta={t.planCta}
                            plans={plans}
                            hasDynamicPlans={hasDynamicPlans}
                            getDashboardUrl={getDashboardUrl}
                        />

                        <FaqSection
                            locale={locale}
                            faqTitle={t.faqTitle}
                            faqs={faqs}
                        />

                        <ContactSection
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
