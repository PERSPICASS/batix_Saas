import { useEffect, useState } from 'react';

export type CookieConsentValue = 'granted' | 'denied';

const STORAGE_KEY = 'batix_cookie_consent';

/**
 * Tracks the visitor's cookie-consent choice (analytics cookies only — Google
 * Analytics, gated on this) in localStorage. `consent` stays null until the
 * first read completes, so callers can avoid flashing the banner or firing
 * analytics before we actually know the stored choice.
 */
export function useCookieConsent() {
    const [consent, setConsentState] = useState<CookieConsentValue | null>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored === 'granted' || stored === 'denied') {
            setConsentState(stored);
        }
        setReady(true);
    }, []);

    const setConsent = (value: CookieConsentValue) => {
        window.localStorage.setItem(STORAGE_KEY, value);
        setConsentState(value);
    };

    return { consent, setConsent, ready };
}
