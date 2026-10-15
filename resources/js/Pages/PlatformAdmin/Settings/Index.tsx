import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import { Save, Loader2, CreditCard } from 'lucide-react';
import InputError from '@/Components/InputError';
import { useLocale } from '@/contexts/LocaleContext';

interface PaymentSettings {
    wave: string;
    orange_money: string;
    mtn_money: string;
    moov_money: string;
    virement: string;
    carte: string;
}

interface Props extends PageProps {
    settings: { payment: PaymentSettings };
}

const FIELDS: { key: keyof PaymentSettings; icon: string; placeholder?: string }[] = [
    { key: 'wave', icon: '🌊', placeholder: '+221 77 000 00 00' },
    { key: 'orange_money', icon: '🟠', placeholder: '+221 77 000 00 01' },
    { key: 'mtn_money', icon: '🟡', placeholder: '+225 07 00 00 00 00' },
    { key: 'moov_money', icon: '🔵', placeholder: '+226 70 00 00 00' },
    { key: 'virement', icon: '🏦', placeholder: 'IBAN / RIB' },
    { key: 'carte', icon: '💳' },
];

export default function PlatformSettings({ settings }: Props) {
    const { t } = useLocale();
    const tr = t.platformAdmin.settings;
    const { data, setData, patch, processing, errors, recentlySuccessful } = useForm({
        payment: { ...settings.payment },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('platform.settings.update'), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{tr.title}</h1>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{tr.subtitle}</p>
                </div>
            }
        >
            <Head title={tr.headTitle} />

            <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-8">
                {recentlySuccessful && (
                    <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
                        {tr.saved}
                    </div>
                )}

                <section className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-white/5">
                    <div>
                        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                            <CreditCard className="size-5 text-amber-500 dark:text-amber-200" />
                            {tr.payment}
                        </h2>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{tr.paymentHint}</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        {FIELDS.map(({ key, icon, placeholder }) => (
                            <div key={key} className="space-y-1.5">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {icon} {tr.labels[key]}
                                </label>
                                <input
                                    type="text"
                                    value={data.payment[key]}
                                    onChange={(e) => setData('payment', { ...data.payment, [key]: e.target.value })}
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-300/50 focus:outline-none focus:ring-1 focus:ring-amber-300/50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder-slate-500"
                                    placeholder={placeholder ?? tr.cardPlaceholder}
                                />
                                <InputError message={(errors as Record<string, string>)[`payment.${key}`]} />
                            </div>
                        ))}
                    </div>
                </section>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center gap-2 rounded-xl bg-amber-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-amber-200 disabled:opacity-50"
                    >
                        {processing ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                        {tr.submit}
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
