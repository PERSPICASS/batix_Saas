import { Head, router } from '@inertiajs/react';
import { useEffect } from 'react';
import type { CookieConsentValue } from '@/hooks/useCookieConsent';

declare global {
    interface Window {
        dataLayer?: unknown[];
        gtag?: (...args: unknown[]) => void;
    }
}

const GA4_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID as string | undefined;

interface GoogleAnalyticsProps {
    /** Only loads once the visitor has explicitly accepted cookies via CookieConsentBanner. */
    consent: CookieConsentValue | null;
}

/**
 * Google Analytics 4 loader — mounted once from PublicLayout, so it only ever
 * runs on the public marketing site (Home, Blog, Fonctionnalités, Tarifs,
 * Clients, Ressources, À propos, Contact), never on the authenticated dashboard.
 *
 * Ships pageview tracking only for now. To add event tracking later (CTA
 * clicks, trial signups, video plays), call `window.gtag?.('event', name, params)`
 * from the relevant component — the loader below already exposes `gtag` globally.
 */
export default function GoogleAnalytics({ consent }: GoogleAnalyticsProps) {
    const enabled = Boolean(GA4_ID) && import.meta.env.PROD && consent === 'granted';

    useEffect(() => {
        if (!enabled) return;

        // Inertia is an SPA after the first load — gtag's own automatic pageview
        // only fires once, so re-fire a page_view on every client-side navigation.
        const unsubscribe = router.on('navigate', (event) => {
            window.gtag?.('event', 'page_view', {
                page_location: event.detail.page.url,
            });
        });

        return () => unsubscribe();
    }, [enabled]);

    if (!enabled) return null;

    return (
        <Head>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`} />
            <script>
                {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    window.gtag = gtag;
                    gtag('js', new Date());
                    gtag('config', '${GA4_ID}');
                `}
            </script>
        </Head>
    );
}
