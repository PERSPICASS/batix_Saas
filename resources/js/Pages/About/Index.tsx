import { Link } from '@inertiajs/react';
import { ArrowRight, HardHat, MapPin, ShieldCheck, Users } from 'lucide-react';
import aboutBanner from '/resources/images/various-repair-tools-for-sale-on-hardware-store-sh-2026-03-17-21-44-06-utc.jpg';
import PublicLayout from '@/Layouts/PublicLayout';
import { SeoHead } from '@/Components/SeoHead';
import { PageProps } from '@/types';
import type { Locale } from '@/types/types';
import { copy } from '@/types/data';
import { useDashboardUrl } from '@/hooks/useDashboardUrl';

interface Props extends PageProps {
    locale: Locale;
    localeLinks: Record<Locale, string>;
}

export default function AboutIndex({ auth, locale, localeLinks }: Props) {
    const getDashboardUrl = useDashboardUrl(auth);
    const t = copy[locale];
    const isFr = locale === 'fr';

    const title = isFr ? 'À propos de BATIX PRO' : 'About BATIX PRO';
    const description = isFr
        ? 'BATIX PRO est un logiciel de gestion pensé pour les quincailleries et boutiques d\'Afrique francophone.'
        : 'BATIX PRO is management software built for hardware stores and shops across French-speaking Africa.';

    const values = isFr
        ? [
            { icon: HardHat, title: 'Conçu pour le terrain', text: 'Pas pour des informaticiens : pour des gérants, vendeurs et caissiers qui n\'ont pas le temps à perdre.' },
            { icon: MapPin, title: 'Pensé pour l\'Afrique francophone', text: 'Prix affichés en FCFA et EUR, support en français, adapté aux réalités du commerce local.' },
            { icon: ShieldCheck, title: 'Vos données vous appartiennent', text: 'Exportables à tout moment, sans vous enfermer dans un outil que vous ne maîtrisez pas.' },
            { icon: Users, title: 'Support humain', text: 'Une équipe joignable par WhatsApp et email, pas un simple centre de tickets automatisé.' },
        ]
        : [
            { icon: HardHat, title: 'Built for the field', text: 'Not for IT teams — for managers, sellers and cashiers who have no time to lose.' },
            { icon: MapPin, title: 'Built for French-speaking Africa', text: 'Prices shown in FCFA and EUR, French-language support, adapted to local commerce.' },
            { icon: ShieldCheck, title: 'Your data is yours', text: 'Exportable anytime, without locking you into a tool you don\'t control.' },
            { icon: Users, title: 'Human support', text: 'A team reachable on WhatsApp and email, not just an automated ticket queue.' },
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
                <div
                    className="h-56 w-full bg-cover bg-center sm:h-72"
                    style={{ backgroundImage: `url(${aboutBanner})` }}
                    role="img"
                    aria-label={isFr ? 'Rayonnage de quincaillerie' : 'Hardware store shelving'}
                />

                <section className="mx-auto max-w-3xl px-6 py-16 text-center lg:px-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-terre-600">
                        {isFr ? 'À propos' : 'About'}
                    </p>
                    <h1 className="mt-2 text-4xl font-extrabold text-slate-900">{title}</h1>
                    <p className="mt-4 text-lg leading-relaxed text-slate-600">
                        {isFr
                            ? "BATIX PRO est né d'un constat simple : la plupart des logiciels de gestion sont conçus pour des bureaux, pas pour des comptoirs de quincaillerie où chaque minute compte. Notre objectif est de donner aux commerçants d'Afrique francophone les mêmes outils de pilotage que les grandes enseignes, sans la complexité."
                            : "BATIX PRO started from a simple observation: most management software is built for back offices, not for hardware store counters where every minute counts. Our goal is to give French-speaking African retailers the same management tools as large chains, without the complexity."}
                    </p>
                </section>

                <section className="bg-gray-50 py-14">
                    <div className="mx-auto grid max-w-5xl gap-5 px-6 sm:grid-cols-2 lg:px-8">
                        {values.map((value) => (
                            <div key={value.title} className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                <div className="inline-flex h-fit shrink-0 rounded-xl bg-terre-50 p-3 text-terre-600">
                                    <value.icon className="size-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900">{value.title}</p>
                                    <p className="mt-1 text-sm leading-relaxed text-slate-500">{value.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="py-14 text-center">
                    <div className="mx-auto max-w-2xl px-6 lg:px-8">
                        <h2 className="text-2xl font-extrabold text-slate-900">
                            {isFr ? 'Envie de le voir en action ?' : 'Want to see it in action?'}
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
