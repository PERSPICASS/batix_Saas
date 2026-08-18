import AuthSplitLayout from '@/Components/AuthSplitLayout';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { t } = useLocale();
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title={t.auth.pages.login.title} />

            <AuthSplitLayout
                title={t.auth.pages.login.heading}
                description={t.auth.pages.login.description}
                icon={<Lock className="size-5" />}
                topLink={{ href: '/', label: t.auth.pages.login.topLink }}
                sideStepLabel={t.auth.pages.login.sideLabel}
                sideTitle={t.auth.pages.login.sideTitle}
                sideDescription={t.auth.pages.login.sideDescription}
            >
                {status && (
                    <div className="mb-3 rounded-lg border border-emerald-300/60 bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-800">
                        {status}
                    </div>
                )}

                <form onSubmit={submit} className="space-y-3">
                    <div>
                        <InputLabel htmlFor="email" value={t.auth.form.email} className="text-slate-700" />

                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="mt-1 block w-full rounded-xl border border-gray-200 bg-white text-slate-900 placeholder-slate-400 focus:border-terre-400 focus:ring-terre-400/20"
                            autoComplete="username"
                            isFocused={true}
                            onChange={(e) => setData('email', e.target.value)}
                        />

                        <InputError message={errors.email} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="password" value={t.auth.form.password} className="text-slate-700" />

                        <div className="relative mt-1">
                            <TextInput
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={data.password}
                                className="block w-full rounded-xl border border-gray-200 bg-white pr-10 text-slate-900 placeholder-slate-400 focus:border-terre-400 focus:ring-terre-400/20"
                                autoComplete="current-password"
                                onChange={(e) => setData('password', e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 focus:outline-none"
                            >
                                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                            </button>
                        </div>

                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                        <label className="inline-flex items-center">
                            <Checkbox
                                name="remember"
                                checked={data.remember}
                                className="border-gray-300 bg-white text-terre-600 focus:ring-terre-300"
                                onChange={(e) => setData('remember', e.target.checked)}
                            />
                            <span className="ms-2 text-sm text-slate-700">{t.auth.form.rememberMe}</span>
                        </label>

                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="text-sm text-slate-600 underline underline-offset-4 transition hover:text-terre-700"
                            >
                                {t.auth.links.forgotPassword}
                            </Link>
                        )}
                    </div>

                    <div className="space-y-2 pt-1">
                        <PrimaryButton className="w-full justify-center rounded-xl !bg-amber-300 py-2.5 text-sm font-bold normal-case tracking-normal !text-slate-900 shadow-md hover:!bg-amber-400 focus:!ring-amber-300" disabled={processing}>
                            {t.auth.actions.signIn}
                        </PrimaryButton>

                        <div className="text-center">
                            <Link href={route('register')} className="text-xs text-slate-600 underline underline-offset-4 transition hover:text-terre-700 sm:text-sm">
                                {t.auth.links.noAccount}
                            </Link>
                        </div>
                    </div>
                </form>
            </AuthSplitLayout>
        </>
    );
}
