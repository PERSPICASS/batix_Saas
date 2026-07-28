import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { FileText, RotateCcw, ShieldCheck } from 'lucide-react';
import PublicLayout from '@/Layouts/PublicLayout';
import { SeoHead } from '@/Components/SeoHead';
import FinalCtaSection from '@/Components/Welcome/FinalCtaSection';
import { PageProps } from '@/types';
import type { Locale } from '@/types/types';
import { copy, fadeUp, stagger } from '@/types/data';
import { policies } from '@/i18n/policies';
import { useDashboardUrl } from '@/hooks/useDashboardUrl';

type PolicyType = 'terms' | 'privacy' | 'refund';

interface Props extends PageProps {
    policyType: PolicyType;
    locale: Locale;
    localeLinks: Record<Locale, string>;
}

const policyIcons: Record<PolicyType, typeof FileText> = {
    terms: FileText,
    privacy: ShieldCheck,
    refund: RotateCcw,
};

const policyKeys: Record<PolicyType, keyof (typeof policies)['en']> = {
    terms: 'termsOfService',
    privacy: 'privacyPolicy',
    refund: 'refundPolicy',
};

export default function PolicyShow({ auth, policyType, locale, localeLinks }: Props) {
    const getDashboardUrl = useDashboardUrl(auth);
    const isFr = locale === 'fr';
    const t = copy[locale];

    const policy = policies[locale][policyKeys[policyType]];
    const Icon = policyIcons[policyType];

    const otherPolicies = (['terms', 'privacy', 'refund'] as PolicyType[]).filter((type) => type !== policyType);
    const otherPolicyLabels = t.policies;

    return (
        <>
            <SeoHead
                title={policy.title}
                description={policy.title}
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
                        className="mx-auto max-w-4xl px-6 text-center lg:px-8"
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        variants={fadeUp}
                    >
                        <div className="mx-auto mb-5 inline-flex size-14 items-center justify-center rounded-2xl bg-terre-700 text-white">
                            <Icon className="size-6" />
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-terre-600">
                            {isFr ? 'Informations légales' : 'Legal'}
                        </p>
                        <h1 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">{policy.title}</h1>
                        <p className="mt-4 text-sm text-slate-500">{policy.lastUpdated}</p>
                    </motion.div>
                </section>

                {/* Content */}
                <section className="bg-white py-16">
                    <div className="mx-auto max-w-4xl px-6 lg:px-8">
                        <motion.div
                            className="space-y-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm sm:p-10"
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, amount: 0.05 }}
                            variants={stagger}
                        >
                            {Object.entries(policy.sections).map(([key, section]) => (
                                <motion.div key={key} variants={fadeUp} className="border-b border-gray-100 pb-8 last:border-0 last:pb-0">
                                    <h2 className="text-lg font-bold text-slate-900">{section.heading}</h2>
                                    <p className="mt-3 text-base leading-relaxed text-slate-600">{section.content}</p>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* Other policies */}
                <section className="border-y border-gray-200 bg-gray-50 py-12">
                    <div className="mx-auto max-w-4xl px-6 text-center lg:px-8">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-terre-600">
                            {isFr ? 'Autres politiques' : 'Other policies'}
                        </p>
                        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                            {otherPolicies.map((type) => (
                                <Link
                                    key={type}
                                    href={isFr ? route('policies.show', type) : route('en.policies.show', type)}
                                    className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-terre-200 hover:text-terre-700 hover:shadow-md"
                                >
                                    {otherPolicyLabels[type]}
                                </Link>
                            ))}
                        </div>
                    </div>
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
