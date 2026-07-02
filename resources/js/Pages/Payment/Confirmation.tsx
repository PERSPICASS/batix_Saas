import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import { CheckCircle2, ArrowRight, Mail } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';

interface Props extends PageProps {
    planName?: string | null;
    message?: string | null;
}

export default function Confirmation({ planName, message, auth }: Props) {
    const { t } = useLocale();

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-white">{t.plans.checkout.confirmation.headTitle}</h2>}>
            <Head title={t.plans.checkout.confirmation.headTitle} />

            <div className="mx-auto max-w-lg">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center space-y-6">

                    {/* Icône */}
                    <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-400/20">
                        <CheckCircle2 className="size-9 text-emerald-400" />
                    </div>

                    {/* Titre */}
                    <div>
                        <h1 className="text-2xl font-bold text-white">{t.plans.checkout.confirmation.title}</h1>
                        <p className="mt-2 text-slate-400">
                            {message || (planName ? t.plans.checkout.confirmation.withPlan(planName) : t.plans.checkout.confirmation.withoutPlan)}
                        </p>
                    </div>

                    {/* Contact */}
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                        <Mail className="size-4 text-slate-500" />
                        {t.plans.checkout.confirmation.question} <a href="mailto:support@batixpro.com" className="text-amber-200 hover:underline">support@batixpro.com</a>
                    </div>

                    {/* CTA */}
                    <Link
                        href={`/${auth.user?.code_user}/dashboard`}
                        className="inline-flex items-center gap-2 rounded-xl bg-amber-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-amber-200"
                    >
                        {t.plans.checkout.confirmation.goToDashboard}
                        <ArrowRight className="size-4" />
                    </Link>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
