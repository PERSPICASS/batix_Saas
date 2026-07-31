import { motion } from 'framer-motion';
import { Activity, CreditCard, FileSearch, KeyRound, Lock, Mail, ShieldCheck, Users, Webhook } from 'lucide-react';
import PublicLayout from '@/Layouts/PublicLayout';
import { SeoHead } from '@/Components/SeoHead';
import FinalCtaSection from '@/Components/Welcome/FinalCtaSection';
import { PageProps } from '@/types';
import type { Locale } from '@/types/types';
import { copy, fadeUp, stagger } from '@/types/data';
import { useDashboardUrl } from '@/hooks/useDashboardUrl';
import { breadcrumbSchema, webPageSchema } from '@/utils/seoSchemas';

interface Props extends PageProps {
    locale: Locale;
    localeLinks: Record<Locale, string>;
}

export default function SecurityIndex({ auth, appUrl, locale, localeLinks }: Props) {
    const getDashboardUrl = useDashboardUrl(auth);
    const t = copy[locale];
    const isFr = locale === 'fr';

    const title = isFr ? 'Sécurité & confiance' : 'Security & trust';
    const description = isFr
        ? 'Comment BATIX PRO protège les données de votre boutique et de vos clients : isolation par boutique, 2FA, rôles, paiements sans stockage de carte.'
        : "How BATIX PRO protects your shop's data and your customers' data: per-shop isolation, 2FA, roles, no card storage.";

    const pillars = isFr
        ? [
            { icon: ShieldCheck, title: 'Isolation des données', text: "Chaque boutique n'a accès qu'à ses propres ventes, stocks et clients. Cette séparation est vérifiée par nos tests automatisés à chaque changement de code." },
            { icon: KeyRound, title: 'Authentification à deux facteurs', text: "Activable sur chaque compte pour bloquer les connexions non autorisées, même en cas de mot de passe compromis." },
            { icon: Users, title: 'Contrôle d\'accès par rôles', text: "Chaque membre de l'équipe n'a que les permissions nécessaires à son poste : vente, stock, facturation, administration." },
            { icon: Activity, title: "Journal d'activité", text: "Les actions sensibles (ventes, modifications de stock, changements de prix) sont tracées et consultables par le gérant." },
            { icon: CreditCard, title: 'Aucun stockage de carte', text: "Les paiements par carte passent par des prestataires spécialisés (Paddle, LemonSqueezy) : nous ne voyons ni ne stockons jamais vos numéros de carte." },
            { icon: Lock, title: 'Connexions chiffrées', text: "Tout le trafic vers BATIX PRO est chiffré en HTTPS, sans exception." },
            { icon: Webhook, title: 'Paiements vérifiés', text: "Chaque notification de paiement est vérifiée par signature ou recontrôlée côté serveur avant d'être appliquée à votre compte." },
            { icon: FileSearch, title: 'Audits réguliers', text: "Nous auditons régulièrement nos dépendances et notre code applicatif pour corriger les vulnérabilités connues." },
        ]
        : [
            { icon: ShieldCheck, title: 'Data isolation', text: 'Each shop only ever sees its own sales, stock and customers. This separation is checked by our automated tests on every code change.' },
            { icon: KeyRound, title: 'Two-factor authentication', text: 'Available on every account to block unauthorized logins, even if a password is compromised.' },
            { icon: Users, title: 'Role-based access control', text: "Each team member only gets the permissions their role needs: sales, stock, invoicing, administration." },
            { icon: Activity, title: 'Activity log', text: 'Sensitive actions (sales, stock changes, price changes) are tracked and reviewable by the shop owner.' },
            { icon: CreditCard, title: 'No card storage', text: "Card payments go through specialized providers (Paddle, LemonSqueezy): we never see or store your card numbers." },
            { icon: Lock, title: 'Encrypted connections', text: 'All traffic to BATIX PRO is encrypted over HTTPS, with no exceptions.' },
            { icon: Webhook, title: 'Verified payment webhooks', text: "Every payment notification is signature-verified or re-checked server-side before being applied to your account." },
            { icon: FileSearch, title: 'Regular audits', text: 'We regularly audit our dependencies and application code to fix known vulnerabilities.' },
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
                jsonLd={[
                    webPageSchema(appUrl, {
                        name: title,
                        description,
                        url: localeLinks[locale],
                        locale,
                    }),
                    breadcrumbSchema(appUrl, [{ name: title, item: localeLinks[locale] }]),
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
                            <ShieldCheck className="size-6" />
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

                {/* Responsible disclosure */}
                <section className="border-y border-gray-200 bg-gray-50 py-16">
                    <motion.div
                        className="mx-auto max-w-2xl px-6 text-center lg:px-8"
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        variants={fadeUp}
                    >
                        <div className="mx-auto mb-4 inline-flex size-11 items-center justify-center rounded-full bg-terre-50 text-terre-600">
                            <Mail className="size-5" />
                        </div>
                        <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                            {isFr ? 'Vous avez trouvé une faille ?' : 'Found a vulnerability?'}
                        </h2>
                        <p className="mt-3 text-sm leading-relaxed text-slate-600">
                            {isFr
                                ? "Si vous pensez avoir découvert une vulnérabilité de sécurité sur BATIX PRO, contactez-nous directement : nous traitons ces signalements en priorité et ne poursuivrons pas les chercheurs qui nous alertent de bonne foi."
                                : "If you believe you've found a security vulnerability in BATIX PRO, contact us directly: we treat these reports as a priority and won't pursue researchers who report issues in good faith."}
                        </p>
                        <a
                            href="mailto:contact@batixpro.com?subject=Security%20report"
                            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                            <Mail className="size-4" />
                            contact@batixpro.com
                        </a>
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
