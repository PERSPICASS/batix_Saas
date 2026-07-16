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

    // Offres déclarées à Google. Le XAF est la devise réellement stockée (cf. utils/currency.ts) :
    // les autres montants affichés en sont convertis, donc lui seul peut être annoncé sans
    // dériver un chiffre. Rien n'est publié quand aucun plan payant n'est actif — les plans
    // de repli sont du contenu marketing statique, pas des offres réelles (cf. buildPlanViews),
    // et les plans sur devis n'ont volontairement pas de prix.
    // Number() est indispensable : `price` arrive de la colonne décimale Postgres sous
    // forme de chaîne ("45000.00"), malgré le `number` annoncé par le type. Le reste de
    // l'app ne le voit pas — JS convertit tout seul dans les divisions de currency.ts —
    // mais une comparaison de type, elle, rejetterait tout en silence.
    // Les plans à 0 (offre sur devis) sont écartés : annoncer un prix nul serait faux.
    const offers = hasDynamicPlans
        ? plans
              .map((plan) => ({ plan, price: Number(plan.price_xaf) }))
              .filter(({ price }) => Number.isFinite(price) && price > 0)
              .map(({ plan, price }) => ({
                  '@type': 'Offer',
                  name: plan.name,
                  price,
                  priceCurrency: 'XAF',
                  url: localeLinks[locale],
                  availability: 'https://schema.org/InStock',
              }))
        : [];

    const jsonLd = offers.length
        ? [
              {
                  '@context': 'https://schema.org',
                  '@type': 'SoftwareApplication',
                  name: 'BATIX PRO',
                  applicationCategory: 'BusinessApplication',
                  operatingSystem: 'Web',
                  description,
                  url: localeLinks[locale],
                  inLanguage: isFr ? 'fr-FR' : 'en-US',
                  offers,
              },
          ]
        : undefined;

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
                jsonLd={jsonLd}
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
