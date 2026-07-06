import { PropsWithChildren, useEffect, useState } from 'react';
import type { Locale } from '@/types/types';
import { copy } from '@/types/data';
import WelcomeHeader from '@/Components/Welcome/WelcomeHeader';
import WelcomeFooter from '@/Components/Welcome/WelcomeFooter';
import GoogleAnalytics from '@/Components/GoogleAnalytics';

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

    return (
        <div className="relative min-h-screen overflow-x-clip bg-white text-slate-900 selection:bg-terre-200 selection:text-terre-900">
            <GoogleAnalytics />

            <WelcomeHeader
                locale={locale}
                localeLinks={localeLinks}
                scrolled={scrolled}
                getDashboardUrl={getDashboardUrl}
                isAuthenticated={isAuthenticated}
            />

            <main>{children}</main>

            <WelcomeFooter locale={locale} footerText={t.footerText} />
        </div>
    );
}
