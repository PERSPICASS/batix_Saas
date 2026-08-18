import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import { Save, Loader2, Settings, CreditCard, Phone, Globe, Mail } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';

interface Settings {
    general: {
        platform_name: string;
        support_email: string;
        support_phone: string;
        website_url: string;
    };
    payment: {
        wave: string;
        orange_money: string;
        mtn_money: string;
        moov_money: string;
        virement: string;
        carte: string;
    };
}

interface Props extends PageProps {
    settings: Settings;
}

export default function PlatformSettings({ settings }: Props) {
    const { t } = useLocale();
    const { data, setData, patch, processing, errors, recentlySuccessful } = useForm({
        general: { ...settings.general },
        payment: { ...settings.payment },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch('/platform-admin/settings');
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Paramètres de la plateforme</h1>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Configuration générale et numéros de paiement</p>
                </div>
            }
        >
            <Head title="Paramètres Plateforme" />

            <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-8">

                {/* Succès */}
                {recentlySuccessful && (
                    <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
                        ✓ Paramètres enregistrés avec succès.
                    </div>
                )}

                {/* ── Informations générales ── */}
                <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-5 dark:border-white/10 dark:bg-white/5">
                    <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                        <Settings className="size-5 text-amber-200" />
                        Informations générales
                    </h2>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Nom de la plateforme
                            </label>
                            <input
                                type="text"
                                value={data.general.platform_name}
                                onChange={e => setData('general', { ...data.general, platform_name: e.target.value })}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-300/50 focus:outline-none focus:ring-1 focus:ring-amber-300/50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder-slate-500"
                                placeholder="BATIX PRO"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                <span className="inline-flex items-center gap-1.5"><Globe className="size-3.5" /> URL du site</span>
                            </label>
                            <input
                                type="url"
                                value={data.general.website_url}
                                onChange={e => setData('general', { ...data.general, website_url: e.target.value })}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-300/50 focus:outline-none focus:ring-1 focus:ring-amber-300/50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder-slate-500"
                                placeholder="https://batixpro.com"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                <span className="inline-flex items-center gap-1.5"><Mail className="size-3.5" /> Email support</span>
                            </label>
                            <input
                                type="email"
                                value={data.general.support_email}
                                onChange={e => setData('general', { ...data.general, support_email: e.target.value })}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-300/50 focus:outline-none focus:ring-1 focus:ring-amber-300/50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder-slate-500"
                                placeholder="support@batixpro.com"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                <span className="inline-flex items-center gap-1.5"><Phone className="size-3.5" /> Téléphone support</span>
                            </label>
                            <input
                                type="tel"
                                value={data.general.support_phone}
                                onChange={e => setData('general', { ...data.general, support_phone: e.target.value })}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-300/50 focus:outline-none focus:ring-1 focus:ring-amber-300/50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder-slate-500"
                                placeholder="+221 77 000 00 00"
                            />
                        </div>
                    </div>
                </section>

                {/* ── Numéros de paiement ── */}
                <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-5 dark:border-white/10 dark:bg-white/5">
                    <div>
                        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                            <CreditCard className="size-5 text-amber-200" />
                            Numéros de paiement
                        </h2>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Ces numéros sont affichés sur la page de paiement lors de la souscription à un plan.</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        {[
                            { key: 'wave',         label: 'Wave',             icon: '🌊', placeholder: '+221 77 000 00 00' },
                            { key: 'orange_money', label: 'Orange Money',     icon: '🟠', placeholder: '+221 77 000 00 01' },
                            { key: 'mtn_money',    label: 'MTN Money',        icon: '🟡', placeholder: '+225 07 00 00 00 00' },
                            { key: 'moov_money',   label: 'Moov Money',       icon: '🔵', placeholder: '+226 70 00 00 00' },
                            { key: 'virement',     label: 'Virement bancaire', icon: '🏦', placeholder: 'IBAN / RIB' },
                            { key: 'carte',        label: 'Carte bancaire',   icon: '💳', placeholder: 'Lien ou info carte' },
                        ].map(({ key, label, icon, placeholder }) => (
                            <div key={key} className="space-y-1.5">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {icon} {label}
                                </label>
                                <input
                                    type="text"
                                    value={(data.payment as any)[key]}
                                    onChange={e => setData('payment', { ...data.payment, [key]: e.target.value })}
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-300/50 focus:outline-none focus:ring-1 focus:ring-amber-300/50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder-slate-500"
                                    placeholder={placeholder}
                                />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Bouton sauvegarder */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center gap-2 rounded-xl bg-amber-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-amber-200 disabled:opacity-50"
                    >
                        {processing ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                        Enregistrer les paramètres
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
