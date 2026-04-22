import { Link } from '@inertiajs/react';
import { HardHat } from 'lucide-react';
import type { Locale } from '../../types/types';
import { copy } from '../../types/data';

interface WelcomeHeaderProps {
    locale: Locale;
    setLocale: (l: Locale) => void;
    scrolled: boolean;
    getDashboardUrl: () => string;
    isAuthenticated: boolean;
}

export default function WelcomeHeader({ locale, setLocale, scrolled, getDashboardUrl, isAuthenticated }: WelcomeHeaderProps) {
    const t = copy[locale];

    return (
        <header className={`z-50 w-full py-3 transition-all duration-300 ${scrolled ? 'fixed top-0 bg-[#efe7db] shadow-md backdrop-blur-sm' : 'relative bg-[#efe7db]/95'}`}>
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 lg:px-8">
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-amber-300 p-2 text-slate-900">
                        <HardHat className="size-5" />
                    </div>
                    <div>
                        <p className="text-sm font-bold tracking-wide text-slate-900">BATIX PRO</p>
                        <p className="text-xs text-slate-600">{t.brandSubtitle}</p>
                    </div>
                </div>

                {/* Nav principale */}
                <nav className="hidden items-center gap-1 p-1 lg:flex">
                    {(['demo', 'features', 'pricing', 'faq', 'contact'] as const).map((key) => (
                        <a
                            key={key}
                            href={`#${key}`}
                            className="rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-amber-300 hover:text-slate-900"
                        >
                            {t.nav[key]}
                        </a>
                    ))}
                </nav>

                {/* Actions droite */}
                <nav className="flex items-center gap-2">
                    {/* Switcher de langue */}
                    <div className="hidden items-center gap-1 rounded-lg border border-[#d8cfbe] bg-[#f4ede2] p-1 sm:flex" aria-label={t.langLabel}>
                        {(['fr', 'en'] as Locale[]).map((l) => (
                            <button
                                key={l}
                                type="button"
                                onClick={() => setLocale(l)}
                                className={`rounded-md px-2 py-1 text-xs transition ${locale === l ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                                {l.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    {isAuthenticated ? (
                        <Link href={getDashboardUrl()} className="rounded-lg border border-[#d8cfbe] px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-[#e9dfd0]">
                            {t.auth.dashboard}
                        </Link>
                    ) : (
                        <>
                            <Link href={route('login')} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                                {t.auth.login}
                            </Link>
                            <Link href={route('register')} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
                                {t.auth.trial}
                            </Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}
