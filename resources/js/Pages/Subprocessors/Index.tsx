import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Boxes } from 'lucide-react';
import PublicLayout from '@/Layouts/PublicLayout';
import { SeoHead } from '@/Components/SeoHead';
import FinalCtaSection from '@/Components/Welcome/FinalCtaSection';
import { PageProps } from '@/types';
import type { Locale } from '@/types/types';
import { copy, fadeUp, stagger } from '@/types/data';
import { subprocessors } from '@/i18n/subprocessors';
import { useDashboardUrl } from '@/hooks/useDashboardUrl';

interface Props extends PageProps {
    locale: Locale;
    localeLinks: Record<Locale, string>;
}

export default function SubprocessorsIndex({ auth, locale, localeLinks }: Props) {
    const getDashboardUrl = useDashboardUrl(auth);
    const t = copy[locale];
    const isFr = locale === 'fr';

    const title = isFr ? 'Sous-traitants' : 'Subprocessors';
    const description = isFr
        ? "La liste des prestataires avec qui BATIX PRO partage des données pour faire fonctionner le service : paiements, envoi d'emails, mesure d'audience et hébergement."
        : 'The providers BATIX PRO shares data with to run the service: payments, email delivery, audience measurement and hosting.';

    const list = subprocessors[locale];

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
                            <Boxes className="size-6" />
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-terre-600">
                            {isFr ? 'Confiance' : 'Trust'}
                        </p>
                        <h1 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">{title}</h1>
                        <p className="mt-4 text-base leading-relaxed text-slate-600">{description}</p>
                    </motion.div>
                </section>

                {/* List */}
                <section className="bg-white py-16">
                    <div className="mx-auto max-w-4xl px-6 lg:px-8">
                        <motion.div
                            className="space-y-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm sm:p-10"
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, amount: 0.05 }}
                            variants={stagger}
                        >
                            {list.map((item) => (
                                <motion.div key={item.name} variants={fadeUp} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="text-base font-bold text-slate-900">{item.name}</h2>
                                        <span className="rounded-full bg-terre-50 px-3 py-1 text-xs font-semibold text-terre-700">{item.role}</span>
                                    </div>
                                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.data}</p>
                                </motion.div>
                            ))}
                        </motion.div>

                        <p className="mt-6 text-center text-sm text-slate-500">
                            {isFr ? 'Cette liste évolue avec le produit. Pour plus de détails, consultez notre ' : 'This list evolves with the product. For more details, see our '}
                            <Link
                                href={isFr ? route('policies.show', 'privacy') : route('en.policies.show', 'privacy')}
                                className="font-semibold text-terre-700 underline underline-offset-2 hover:text-terre-800"
                            >
                                {isFr ? 'politique de confidentialité' : 'privacy policy'}
                            </Link>
                            .
                        </p>
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
