import { useMemo } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';
import { SeoHead } from '@/Components/SeoHead';
import PricingSection from '@/Components/Welcome/PricingSection';
import FaqSection from '@/Components/Welcome/FaqSection';
import { PageProps } from '@/types';
import type { Locale, SubscriptionPlan } from '@/types/types';
import { copy, faqsByLocale } from '@/types/data';
import { buildPlanViews } from '@/utils/planViews';
import { useDashboardUrl } from '@/hooks/useDashboardUrl';
import FinalCtaSection from '@/Components/Welcome/FinalCtaSection';

interface Props extends PageProps {
    subscriptionPlans: SubscriptionPlan[];
    locale: Locale;
    localeLinks: Record<Locale, string>;
}

export default function PricingIndex({ auth, subscriptionPlans, locale, localeLinks }: Props) {
    const getDashboardUrl = useDashboardUrl(auth);
    const t = copy[locale];
    const isFr = locale === 'fr';
    const faqs = faqsByLocale[locale];

    const { plans, hasDynamicPlans } = useMemo(
        () => buildPlanViews(subscriptionPlans, locale),
        [subscriptionPlans, locale]
    );

    const title = isFr
        ? 'Tarifs BATIX PRO — Des plans qui suivent votre croissance'
        : 'BATIX PRO Pricing — Plans that scale with your growth';
    const description = isFr
        ? 'Comparez les plans BATIX PRO : Starter, Growth, Pro et Entreprise. Facturation mensuelle ou annuelle (2 mois offerts), en EUR et FCFA.'
        : 'Compare BATIX PRO plans: Starter, Growth, Pro and Entreprise. Monthly or yearly billing (2 months free), in EUR and FCFA.';

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
                

                <PricingSection
                    locale={locale}
                    pricingTitle={t.pricingTitle}
                    pricingLabel={t.pricingLabel}
                    pricingFallback={t.pricingFallback}
                    planCta={t.planCta}
                    plans={plans}
                    hasDynamicPlans={hasDynamicPlans}
                    getDashboardUrl={getDashboardUrl}
                />

                <FaqSection locale={locale} faqTitle={t.faqTitle} faqs={faqs} />
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
