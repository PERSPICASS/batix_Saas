import AuthSplitLayout from '@/Components/AuthSplitLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';

export default function ResetPassword({
    token,
    email,
}: {
    token: string;
    email: string;
}) {
    const { t } = useLocale();
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title={t.auth.pages.resetPassword.title} />

            <AuthSplitLayout
                title={t.auth.pages.resetPassword.heading}
                description={t.auth.pages.resetPassword.description}
                icon={<KeyRound className="size-5" />}
                sideStepLabel={t.auth.pages.resetPassword.sideLabel}
                sideTitle={t.auth.pages.resetPassword.sideTitle}
                sideDescription={t.auth.pages.resetPassword.sideDescription}
            >
                <form onSubmit={submit} className="space-y-3">
                    <div>
                        <InputLabel htmlFor="email" value={t.auth.form.email} className="text-slate-700" />
                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="mt-1 block w-full border border-[#cfc3ac] bg-white text-slate-900 placeholder-slate-400"
                            autoComplete="username"
                            onChange={(e) => setData('email', e.target.value)}
                        />
                        <InputError message={errors.email} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="password" value={t.auth.form.passwordNew} className="text-slate-700" />
                        <div className="relative mt-1">
                            <TextInput
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={data.password}
                                className="block w-full border border-[#cfc3ac] bg-white pr-10 text-slate-900 placeholder-slate-400"
                                autoComplete="new-password"
                                isFocused={true}
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

                    <div>
                        <InputLabel htmlFor="password_confirmation" value={t.auth.form.passwordConfirm} className="text-slate-700" />
                        <div className="relative mt-1">
                            <TextInput
                                id="password_confirmation"
                                type={showPasswordConfirmation ? 'text' : 'password'}
                                name="password_confirmation"
                                value={data.password_confirmation}
                                className="block w-full border border-[#cfc3ac] bg-white pr-10 text-slate-900 placeholder-slate-400"
                                autoComplete="new-password"
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 focus:outline-none"
                            >
                                {showPasswordConfirmation ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                            </button>
                        </div>
                        <InputError message={errors.password_confirmation} className="mt-2" />
                    </div>

                    <div className="space-y-2 pt-1">
                        <PrimaryButton className="w-full justify-center bg-slate-900 py-2.5 text-sm normal-case tracking-normal hover:bg-slate-800" disabled={processing}>
                            {t.auth.actions.resetPassword}
                        </PrimaryButton>

                        <div className="text-center">
                            <Link href={route('login')} className="text-xs text-slate-600 underline underline-offset-4 transition hover:text-slate-900 sm:text-sm">
                                {t.auth.links.backToLogin}
                            </Link>
                        </div>
                    </div>
                </form>
            </AuthSplitLayout>
        </>
    );
}
