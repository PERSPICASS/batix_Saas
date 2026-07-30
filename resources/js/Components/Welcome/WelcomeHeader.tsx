import { Link } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { useState } from 'react';
import type { Locale } from '../../types/types';
import { copy } from '../../types/data';
import { featurePages } from '../../types/featurePages';

interface WelcomeHeaderProps {
    locale: Locale;
    localeLinks: Record<Locale, string>;
    scrolled: boolean;
    getDashboardUrl: () => string;
    isAuthenticated: boolean;
}

export default function WelcomeHeader({ locale, localeLinks, scrolled, getDashboardUrl, isAuthenticated }: WelcomeHeaderProps) {
    const t = copy[locale];
    const isFr = locale === 'fr';
    const [featuresOpen, setFeaturesOpen] = useState(false);
    const featuresIndexHref = isFr ? route('features.index') : route('en.features.index');

    return (
        <header className={`z-50 w-full py-3 transition-all duration-300 ${scrolled ? 'fixed top-0 bg-terre-50 shadow-sm' : 'relative bg-terre-50'}`}>
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 lg:px-8">
                {/* Logo */}
                <Link href={isAuthenticated ? getDashboardUrl() : route('welcome')} className="flex flex-col gap-1">
                    <ApplicationLogo theme="light" className="h-10 w-auto" />
                    <p className="text-xs text-slate-500">{t.brandSubtitle}</p>
                </Link>
                

                {/* Nav principale */}
                <nav className="hidden items-center gap-1 p-1 lg:flex">
                    {/* Dropdown Fonctionnalités */}
                    <div
                        className="relative"
                        onMouseEnter={() => setFeaturesOpen(true)}
                        onMouseLeave={() => setFeaturesOpen(false)}
                    >
                        <Link
                            href={featuresIndexHref}
                            onClick={() => setFeaturesOpen(false)}
                            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-terre-50 hover:text-terre-700"
                        >
                            {t.nav.features}
                            <ChevronDown className="size-3.5" />
                        </Link>
                        {featuresOpen && (
                            <div className="absolute left-0 top-full z-50 w-64 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                                {featurePages.map((page) => (
                                    <Link
                                        key={page.slug}
                                        href={isFr ? route('features.show', page.slug) : route('en.features.show', page.slug)}
                                        onClick={() => setFeaturesOpen(false)}
                                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-terre-50"
                                    >
                                        <page.icon className="size-4 text-terre-600" />
                                        {page.title[locale]}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <Link
                        href={isFr ? route('pricing') : route('en.pricing')}
                        className="rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-terre-50 hover:text-terre-700"
                    >
                        {t.nav.pricing}
                    </Link>

                    {/* <Link
                        href={isFr ? route('resources') : route('en.resources')}
                        className="rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-terre-50 hover:text-terre-700"
                    >
                        {isFr ? 'Ressources' : 'Resources'}
                    </Link>*/}

                    <Link
                        href={isFr ? route('about') : route('en.about')}
                        className="rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-terre-50 hover:text-terre-700"
                    >
                        {isFr ? 'À propos' : 'About'}
                    </Link>
                </nav>

                {/* Actions droite */}
                <nav className="flex items-center gap-2">
                    {/* Switcher de langue */}
                    <div className="hidden items-center gap-1 rounded-lg border border-terre-200 bg-white p-1 sm:flex" aria-label={t.langLabel}>
                        {(['fr', 'en'] as Locale[]).map((l) => (
                            <Link
                                key={l}
                                href={localeLinks[l]}
                                preserveScroll
                                className={`rounded-md px-2 py-1 text-xs transition ${locale === l ? 'bg-terre-600 text-white' : 'text-slate-600 hover:bg-white'}`}
                            >
                                {l.toUpperCase()}
                            </Link>
                        ))}
                    </div>

                    {isAuthenticated ? (
                        <Link href={getDashboardUrl()} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-gray-50">
                            {t.auth.dashboard}
                        </Link>
                    ) : (
                        <>
                            <Link href={route('login')} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-gray-50">
                                {t.auth.login}
                            </Link>
                            <Link href={route('register')} className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-amber-400">
                                {t.auth.trial}
                            </Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}
