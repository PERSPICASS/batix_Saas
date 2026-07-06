import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import { CheckCircle2, ArrowRight, Mail, Clock } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';

interface Props extends PageProps {
    planName?: string | null;
    message?: string | null;
    status?: 'confirmed' | 'pending';
}

export default function Confirmation({ planName, message, status = 'confirmed', auth }: Props) {
    const { t } = useLocale();
    const isPending = status === 'pending';

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-slate-900 dark:text-white">{isPending ? t.plans.checkout.confirmation.pendingHeadTitle : t.plans.checkout.confirmation.headTitle}</h2>}>
            <Head title={isPending ? t.plans.checkout.confirmation.pendingHeadTitle : t.plans.checkout.confirmation.headTitle} />

            <div className="mx-auto max-w-lg">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center space-y-6">

                    {/* Icône */}
                    <div className={`mx-auto flex size-16 items-center justify-center rounded-full ${isPending ? 'bg-amber-400/20' : 'bg-emerald-400/20'}`}>
                        {isPending ? <Clock className="size-9 text-amber-300" /> : <CheckCircle2 className="size-9 text-emerald-400" />}
                    </div>

                    {/* Titre */}
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{isPending ? t.plans.checkout.confirmation.pendingTitle : t.plans.checkout.confirmation.title}</h1>
                        <p className="mt-2 text-slate-400">
                            {message || (isPending
                                ? t.plans.checkout.confirmation.pendingMessage
                                : (planName ? t.plans.checkout.confirmation.withPlan(planName) : t.plans.checkout.confirmation.withoutPlan))}
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
