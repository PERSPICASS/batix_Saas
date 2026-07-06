import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import PublicLayout from '@/Layouts/PublicLayout';
import { SeoHead } from '@/Components/SeoHead';
import TestimonialsSection from '@/Components/Welcome/TestimonialsSection';
import CustomerQuotes from '@/Components/Welcome/CustomerQuotes';
import { PageProps } from '@/types';
import type { Locale } from '@/types/types';
import { copy } from '@/types/data';
import { testimonialsByLocale } from '@/types/testimonials';
import { useDashboardUrl } from '@/hooks/useDashboardUrl';

interface Props extends PageProps {
    locale: Locale;
    localeLinks: Record<Locale, string>;
}

export default function CustomersIndex({ auth, locale, localeLinks }: Props) {
    const getDashboardUrl = useDashboardUrl(auth);
    const t = copy[locale];
    const isFr = locale === 'fr';
    const testimonials = testimonialsByLocale[locale];

    const title = isFr ? 'Nos clients — BATIX PRO' : 'Our customers — BATIX PRO';
    const description = isFr
        ? 'Découvrez pourquoi les quincailliers font confiance à BATIX PRO pour gérer leurs ventes, leur stock et leurs équipes.'
        : 'Discover why hardware store owners trust BATIX PRO to run their sales, stock and teams.';

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
            />

            <PublicLayout locale={locale} localeLinks={localeLinks} isAuthenticated={!!auth.user} getDashboardUrl={getDashboardUrl}>
                <section className="mx-auto max-w-7xl px-6 pt-16 lg:px-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-terre-600">
                        {isFr ? 'Clients' : 'Customers'}
                    </p>
                    <h1 className="mt-2 max-w-2xl text-4xl font-extrabold text-slate-900">
                        {isFr ? 'Des quincailleries qui gagnent du temps chaque jour' : 'Hardware stores saving time every day'}
                    </h1>
                    <p className="mt-3 max-w-2xl text-base text-slate-600">{description}</p>
                </section>

                <CustomerQuotes locale={locale} testimonials={testimonials} />

                <TestimonialsSection locale={locale} promises={t.promises} trustReasons={t.trustReasons} />

                <section className="bg-gray-50 py-14 text-center">
                    <div className="mx-auto max-w-2xl px-6 lg:px-8">
                        <h2 className="text-2xl font-extrabold text-slate-900">
                            {isFr ? 'Rejoignez-les dès aujourd\'hui' : 'Join them today'}
                        </h2>
                        <Link
                            href={getDashboardUrl()}
                            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-300 px-6 py-3 font-bold text-slate-900 shadow-md transition hover:bg-amber-400"
                        >
                            {t.hero.primary}
                            <ArrowRight className="size-4" />
                        </Link>
                    </div>
                </section>
            </PublicLayout>
        </>
    );
}
