import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { User, Mail, CheckCircle, Globe } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { countriesI18n } from '@/i18n/countries';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    country,
    className = '',
}: {
    mustVerifyEmail: boolean;
    status?: string;
    country: string | null;
    className?: string;
}) {
    const { t, locale } = useLocale();
    const user = usePage().props.auth.user!;
    const countries = countriesI18n[locale];

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
            // Le pays vient des props de la page, pas de `auth.user` : il n'est pas
            // partagé globalement (voir ProfileController::edit).
            country: country ?? '',
        });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        patch(route('profile.update'));
    };

    return (
        <section className={className}>
            <header className="mb-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <User className="h-5 w-5 text-amber-300" />
                    {t.profile.form.info.title}
                </h2>

                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {t.profile.form.info.description}
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                        {t.profile.form.info.name}
                    </label>

                    <div className="relative mt-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                        </div>
                        <input
                            id="name"
                            type="text"
                            className="block w-full pl-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                            autoFocus
                            autoComplete="name"
                        />
                    </div>

                    <InputError message={errors.name} />
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                        {t.profile.form.info.email}
                    </label>

                    <div className="relative mt-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                        </div>
                        <input
                            id="email"
                            type="email"
                            className="block w-full pl-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            required
                            autoComplete="username"
                        />
                    </div>

                    <InputError message={errors.email} />
                </div>

                <div>
                    <label htmlFor="country" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                        {countries.label}
                    </label>

                    <div className="relative mt-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Globe className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                        </div>
                        <select
                            id="country"
                            className="block w-full pl-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                            value={data.country}
                            onChange={(e) => setData('country', e.target.value)}
                        >
                            <option value="">{countries.placeholder}</option>
                            {countries.list.map((name) => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>

                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {t.profile.form.info.countryHint}
                    </p>

                    <InputError message={errors.country} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                        <p className="text-sm text-yellow-200">
                            {t.profile.messages.emailUnverified}
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="ml-2 rounded-md text-sm text-yellow-300 underline hover:text-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 font-medium"
                            >
                                {t.profile.messages.resendVerification}
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 flex items-center gap-2 text-sm font-medium text-green-400">
                                <CheckCircle className="h-4 w-4" />
                                {t.profile.messages.verificationSent}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50"
                    >
                        {t.common.actions.save}
                    </button>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-green-400 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            {t.profile.messages.saved}
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
