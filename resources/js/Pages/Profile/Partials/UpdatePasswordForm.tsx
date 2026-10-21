import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef } from 'react';
import { Lock, CheckCircle } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';

export default function UpdatePasswordForm({
    className = '',
}: {
    className?: string;
}) {
    const { t } = useLocale();
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const {
        data,
        setData,
        errors,
        put,
        reset,
        processing,
        recentlySuccessful,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword: FormEventHandler = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <section className={className}>
            <header className="mb-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Lock className="h-5 w-5 text-amber-300" />
                    {t.profile.form.password.title}
                </h2>

                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {t.profile.form.password.description}
                </p>
            </header>

            <form onSubmit={updatePassword} className="mt-6 space-y-6">
                <div>
                    <label htmlFor="current_password" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                        {t.profile.form.password.currentPassword}
                    </label>

                    <div className="relative mt-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                        </div>
                        <input
                            id="current_password"
                            ref={currentPasswordInput}
                            type="password"
                            className="block w-full pl-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                            value={data.current_password}
                            onChange={(e) => setData('current_password', e.target.value)}
                            autoComplete="current-password"
                        />
                    </div>

                    {errors.current_password && (
                        <p className="mt-2 text-sm text-red-400">{errors.current_password}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                        {t.profile.form.password.newPassword}
                    </label>

                    <div className="relative mt-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                        </div>
                        <input
                            id="password"
                            ref={passwordInput}
                            type="password"
                            className="block w-full pl-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            autoComplete="new-password"
                        />
                    </div>

                    <InputError message={errors.password} />
                </div>

                <div>
                    <label htmlFor="password_confirmation" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                        {t.profile.form.password.confirmPassword}
                    </label>

                    <div className="relative mt-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                        </div>
                        <input
                            id="password_confirmation"
                            type="password"
                            className="block w-full pl-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            autoComplete="new-password"
                        />
                    </div>

                    {errors.password_confirmation && (
                        <p className="mt-2 text-sm text-red-400">{errors.password_confirmation}</p>
                    )}
                </div>

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
                            {t.profile.form.password.success}
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
