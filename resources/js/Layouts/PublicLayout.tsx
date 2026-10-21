import { PropsWithChildren, useEffect, useState } from 'react';
import type { Locale } from '@/types/types';
import { copy } from '@/types/data';
import WelcomeHeader from '@/Components/Welcome/WelcomeHeader';
import WelcomeFooter from '@/Components/Welcome/WelcomeFooter';
import GoogleAnalytics from '@/Components/GoogleAnalytics';
import CookieConsentBanner from '@/Components/CookieConsentBanner';
import AnnualPromoBanner from '@/Components/Welcome/AnnualPromoBanner';
import { useCookieConsent } from '@/hooks/useCookieConsent';

interface PublicLayoutProps extends PropsWithChildren {
    locale: Locale;
    localeLinks: Record<Locale, string>;
    isAuthenticated: boolean;
    getDashboardUrl: () => string;
}

/**
 * Shared chrome (header + footer) for every public marketing page (Home, Blog,
 * Fonctionnalités, Tarifs, Clients, Ressources, À propos, Contact) so each page
 * only needs to render its own content.
 */
export default function PublicLayout({ locale, localeLinks, isAuthenticated, getDashboardUrl, children }: PublicLayoutProps) {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 60);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const t = copy[locale];
    const { consent, setConsent, ready } = useCookieConsent();

    return (
        <div className="relative min-h-screen overflow-x-clip bg-white text-slate-900 selection:bg-terre-200 selection:text-terre-900">
            <GoogleAnalytics consent={consent} />

            <AnnualPromoBanner
                locale={locale}
                highlight={t.annualPromo.highlight}
                message={t.annualPromo.message}
                cta={t.annualPromo.cta}
                dismiss={t.annualPromo.dismiss}
            />

            <WelcomeHeader
                locale={locale}
                localeLinks={localeLinks}
                scrolled={scrolled}
                getDashboardUrl={getDashboardUrl}
                isAuthenticated={isAuthenticated}
            />

            <main>{children}</main>

            <WelcomeFooter locale={locale} footerText={t.footerText} />

            <CookieConsentBanner
                locale={locale}
                consent={consent}
                setConsent={setConsent}
                ready={ready}
                message={t.cookieConsent.message}
                accept={t.cookieConsent.accept}
                decline={t.cookieConsent.decline}
                learnMore={t.cookieConsent.learnMore}
            />
        </div>
    );
}
