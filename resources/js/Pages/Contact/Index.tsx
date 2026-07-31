import PublicLayout from '@/Layouts/PublicLayout';
import { SeoHead } from '@/Components/SeoHead';
import ContactSection from '@/Components/Welcome/ContactSection';
import { PageProps } from '@/types';
import type { Locale } from '@/types/types';
import { copy } from '@/types/data';
import { useDashboardUrl } from '@/hooks/useDashboardUrl';
import { breadcrumbSchema, webPageSchema } from '@/utils/seoSchemas';

interface Props extends PageProps {
    locale: Locale;
    localeLinks: Record<Locale, string>;
}

export default function ContactIndex({ auth, appUrl, locale, localeLinks }: Props) {
    const getDashboardUrl = useDashboardUrl(auth);
    const t = copy[locale];
    const isFr = locale === 'fr';

    const title = isFr ? 'Contact — BATIX PRO' : 'Contact — BATIX PRO';
    const description = isFr
        ? 'Une question ? Écrivez-nous ou contactez-nous par WhatsApp, réponse sous 24h.'
        : 'Got a question? Write to us or reach us on WhatsApp, we reply within 24 hours.';

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
                    {
                        ...webPageSchema(appUrl, {
                            type: 'ContactPage',
                            name: 'Contact',
                            description,
                            url: localeLinks[locale],
                            locale,
                        }),
                        // Le contactPoint reste déclaré une seule fois, sur l'accueil.
                        mainEntity: { '@id': `${appUrl}/#organization` },
                    },
                    breadcrumbSchema(appUrl, [{ name: 'Contact', item: localeLinks[locale] }]),
                ]}
            />

            <PublicLayout locale={locale} localeLinks={localeLinks} isAuthenticated={!!auth.user} getDashboardUrl={getDashboardUrl}>
                <ContactSection locale={locale} t={{ contact: t.contact }} getDashboardUrl={getDashboardUrl} />
            </PublicLayout>
        </>
    );
}
