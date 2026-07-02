import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Locale } from '@/types/types';
import { translations } from '@/i18n';
import axios from 'axios';

const STORAGE_KEY = 'dashboard_locale';
const DEFAULT_LOCALE: Locale = 'fr';

type Translations = typeof translations['fr'] | typeof translations['en'];

interface LocaleContextValue {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: Translations;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>(() => {
        if (typeof window === 'undefined') return DEFAULT_LOCALE;
        const stored = window.localStorage.getItem(STORAGE_KEY);
        return stored === 'fr' || stored === 'en' ? stored : DEFAULT_LOCALE;
    });

    const setLocale = useCallback((next: Locale) => {
        setLocaleState(next);
        window.localStorage.setItem(STORAGE_KEY, next);
        // Best-effort sync so server-rendered content (emails, activity log, PDFs…) matches
        // the UI language. Silently ignored outside {code_user}-scoped pages (guest pages,
        // platform-admin…) where the route can't even be built, and when logged out.
        try {
            axios.post(route('locale.update'), { locale: next }).catch(() => {});
        } catch {
            // route() throws synchronously if {code_user} isn't resolvable here — nothing to sync.
        }
    }, []);

    return (
        <LocaleContext.Provider value={{ locale, setLocale, t: translations[locale] as Translations }}>
            {children}
        </LocaleContext.Provider>
    );
}

export function useLocale(): LocaleContextValue {
    const ctx = useContext(LocaleContext);
    if (!ctx) throw new Error('useLocale must be used inside <LocaleProvider>');
    return ctx;
}
