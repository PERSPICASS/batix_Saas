import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Cookie } from 'lucide-react';
import type { Locale } from '@/types/types';
import type { CookieConsentValue } from '@/hooks/useCookieConsent';

interface CookieConsentBannerProps {
    locale: Locale;
    consent: CookieConsentValue | null;
    setConsent: (value: CookieConsentValue) => void;
    ready: boolean;
    message: string;
    accept: string;
    decline: string;
    learnMore: string;
}

/** Gates Google Analytics (see GoogleAnalytics.tsx) behind an explicit accept/decline choice. */
export default function CookieConsentBanner({ locale, consent, setConsent, ready, message, accept, decline, learnMore }: CookieConsentBannerProps) {
    if (!ready || consent !== null) return null;

    const isFr = locale === 'fr';

    return (
        <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 px-6 py-5 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur-sm sm:px-8"
            role="dialog"
            aria-live="polite"
            aria-label={isFr ? 'Consentement aux cookies' : 'Cookie consent'}
        >
            <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
                <div className="flex items-start gap-3 sm:items-center">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-terre-50 text-terre-600">
                        <Cookie className="size-4" />
                    </span>
                    <p className="text-sm leading-relaxed text-slate-600">
                        {message}{' '}
                        <Link
                            href={isFr ? route('policies.show', 'privacy') : route('en.policies.show', 'privacy')}
                            className="font-semibold text-terre-700 underline underline-offset-2 hover:text-terre-800"
                        >
                            {learnMore}
                        </Link>
                    </p>
                </div>
                <div className="flex shrink-0 gap-3">
                    <button
                        type="button"
                        onClick={() => setConsent('denied')}
                        className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-gray-50"
                    >
                        {decline}
                    </button>
                    <button
                        type="button"
                        onClick={() => setConsent('granted')}
                        className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-amber-400"
                    >
                        {accept}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
