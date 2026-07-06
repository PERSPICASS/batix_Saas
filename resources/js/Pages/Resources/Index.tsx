import { Link } from '@inertiajs/react';
import { ArrowRight, BookOpen, LayoutGrid, Tag } from 'lucide-react';
import PublicLayout from '@/Layouts/PublicLayout';
import { SeoHead } from '@/Components/SeoHead';
import { PageProps } from '@/types';
import type { Locale } from '@/types/types';
import { useDashboardUrl } from '@/hooks/useDashboardUrl';

interface Props extends PageProps {
    locale: Locale;
    localeLinks: Record<Locale, string>;
}

export default function ResourcesIndex({ auth, locale, localeLinks }: Props) {
    const getDashboardUrl = useDashboardUrl(auth);
    const isFr = locale === 'fr';

    const title = isFr ? 'Ressources — BATIX PRO' : 'Resources — BATIX PRO';
    const description = isFr
        ? 'Guides, conseils et actualités pour mieux gérer votre quincaillerie au quotidien.'
        : 'Guides, tips and news to better manage your hardware store every day.';

    const links = [
        {
            icon: BookOpen,
            title: isFr ? 'Blog & Conseils' : 'Blog & Tips',
            text: isFr ? 'Guides pratiques et actualités pour votre quincaillerie.' : 'Practical guides and news for your hardware store.',
            href: isFr ? route('blog.index') : route('en.blog.index'),
        },
        {
            icon: LayoutGrid,
            title: isFr ? 'Fonctionnalités' : 'Features',
            text: isFr ? 'Tout ce que BATIX PRO peut faire pour vous.' : 'Everything BATIX PRO can do for you.',
            href: isFr ? route('features.index') : route('en.features.index'),
        },
        {
            icon: Tag,
            title: isFr ? 'Tarifs' : 'Pricing',
            text: isFr ? 'Comparez les plans et choisissez le vôtre.' : 'Compare plans and pick yours.',
            href: isFr ? route('pricing') : route('en.pricing'),
        },
    ];

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
                <section className="bg-terre-600 py-16 text-center">
                    <div className="mx-auto max-w-3xl px-6 lg:px-8">
                        <div className="mx-auto mb-6 inline-flex rounded-2xl bg-white/15 p-4 text-white">
                            <BookOpen className="size-8" />
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-terre-100">
                            {isFr ? 'Ressources' : 'Resources'}
                        </p>
                        <h1 className="mt-2 text-4xl font-extrabold text-white">
                            {isFr ? 'Apprenez à mieux gérer votre quincaillerie' : 'Learn to run your hardware store better'}
                        </h1>
                        <p className="mx-auto mt-3 max-w-xl text-base text-terre-50">{description}</p>
                    </div>
                </section>

                <section className="mx-auto max-w-5xl px-6 py-14 lg:px-8">
                    <div className="grid gap-5 sm:grid-cols-3">
                        {links.map((link) => (
                            <Link
                                key={link.title}
                                href={link.href}
                                className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-terre-200 hover:shadow-md"
                            >
                                <div className="mb-4 inline-flex w-fit rounded-xl bg-terre-50 p-3 text-terre-600">
                                    <link.icon className="size-5" />
                                </div>
                                <h2 className="font-extrabold text-slate-900">{link.title}</h2>
                                <p className="mt-1 flex-1 text-sm leading-relaxed text-slate-500">{link.text}</p>
                                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-terre-700">
                                    {isFr ? 'Voir' : 'View'}
                                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            </PublicLayout>
        </>
    );
}
