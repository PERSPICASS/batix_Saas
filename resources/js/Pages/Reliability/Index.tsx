import { motion } from 'framer-motion';
import { CheckCircle2, Database, GitBranch, Mail as MailIcon, Rocket, Server } from 'lucide-react';
import PublicLayout from '@/Layouts/PublicLayout';
import { SeoHead } from '@/Components/SeoHead';
import FinalCtaSection from '@/Components/Welcome/FinalCtaSection';
import { PageProps } from '@/types';
import type { Locale } from '@/types/types';
import { copy, fadeUp, stagger } from '@/types/data';
import { useDashboardUrl } from '@/hooks/useDashboardUrl';

interface Props extends PageProps {
    locale: Locale;
    localeLinks: Record<Locale, string>;
}

export default function ReliabilityIndex({ auth, locale, localeLinks }: Props) {
    const getDashboardUrl = useDashboardUrl(auth);
    const t = copy[locale];
    const isFr = locale === 'fr';

    const title = isFr ? 'Fiabilité' : 'Reliability';
    const description = isFr
        ? "Comment nous faisons tourner BATIX PRO au quotidien — sans promesse chiffrée que nous ne pourrions pas tenir."
        : "How we run BATIX PRO day to day — without a numeric guarantee we couldn't actually back up.";

    const pillars = isFr
        ? [
            { icon: Server, title: 'Infrastructure dédiée', text: "L'application tourne sur des serveurs dédiés chez Hostinger, déployée via des conteneurs Docker pour des mises à jour reproductibles." },
            { icon: Database, title: 'Base de données', text: 'PostgreSQL en production, avec des migrations versionnées appliquées automatiquement à chaque déploiement.' },
            { icon: GitBranch, title: 'Déploiement continu', text: "Chaque mise à jour du code passe par un pipeline automatisé (GitHub Actions) qui construit, migre et redémarre l'application en production." },
            { icon: CheckCircle2, title: 'Suite de tests', text: 'Un socle de tests automatisés couvre les parcours critiques (ventes, authentification, paiements) que nous exécutons avant les évolutions importantes.' },
            { icon: MailIcon, title: 'Communication en cas d\'incident', text: 'En cas d\'interruption de service, nous vous informons par email et WhatsApp, avec un point de contact direct avec l\'équipe.' },
        ]
        : [
            { icon: Server, title: 'Dedicated infrastructure', text: 'The application runs on dedicated servers at Hostinger, deployed via Docker containers for reproducible updates.' },
            { icon: Database, title: 'Database', text: 'PostgreSQL in production, with versioned migrations applied automatically on every deployment.' },
            { icon: GitBranch, title: 'Continuous deployment', text: 'Every code update goes through an automated pipeline (GitHub Actions) that builds, migrates and restarts the production app.' },
            { icon: CheckCircle2, title: 'Test suite', text: 'An automated test suite covers critical flows (sales, authentication, payments) that we run before significant changes.' },
            { icon: MailIcon, title: 'Incident communication', text: "If service is interrupted, we notify you by email and WhatsApp, with a direct point of contact with the team." },
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
                {/* Hero */}
                <section className="bg-terre-50 py-16">
                    <motion.div
                        className="mx-auto max-w-3xl px-6 text-center lg:px-8"
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        variants={fadeUp}
                    >
                        <div className="mx-auto mb-5 inline-flex size-14 items-center justify-center rounded-2xl bg-terre-700 text-white">
                            <Rocket className="size-6" />
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-terre-600">
                            {isFr ? 'Confiance' : 'Trust'}
                        </p>
                        <h1 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">{title}</h1>
                        <p className="mt-4 text-base leading-relaxed text-slate-600">{description}</p>
                    </motion.div>
                </section>

                {/* Pillars */}
                <section className="bg-white py-16">
                    <div className="mx-auto max-w-6xl px-6 lg:px-8">
                        <motion.div
                            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, amount: 0.1 }}
                            variants={stagger}
                        >
                            {pillars.map((pillar) => (
                                <motion.div
                                    key={pillar.title}
                                    variants={fadeUp}
                                    className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                >
                                    <div className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-terre-50 text-terre-600">
                                        <pillar.icon className="size-5" />
                                    </div>
                                    <p className="font-bold text-slate-900">{pillar.title}</p>
                                    <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{pillar.text}</p>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* Honest disclaimer instead of a fabricated uptime number */}
                <section className="border-y border-gray-200 bg-gray-50 py-14">
                    <motion.div
                        className="mx-auto max-w-2xl px-6 text-center lg:px-8"
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        variants={fadeUp}
                    >
                        <p className="text-sm leading-relaxed text-slate-600">
                            {isFr
                                ? "Nous ne publions pas encore d'historique de disponibilité mesuré publiquement. Si la continuité de service est critique pour votre activité, contactez-nous : nous en discutons directement avec vous."
                                : "We don't yet publish a public track record of measured uptime. If service continuity is critical for your business, contact us — we'll discuss it with you directly."}
                        </p>
                    </motion.div>
                </section>

                <FinalCtaSection
                    title={t.contact.title}
                    description={t.contact.description}
                    cta={t.contact.cta}
                    getDashboardUrl={getDashboardUrl}
                />
            </PublicLayout>
        </>
    );
}
