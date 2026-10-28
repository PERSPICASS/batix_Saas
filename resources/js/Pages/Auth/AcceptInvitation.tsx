import AuthSplitLayout from '@/Components/AuthSplitLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';

interface Props {
    token: string;
    valid: boolean;
    user: { name: string; email: string; shop: string | null; pending: boolean } | null;
}

/** L'employé choisit son mot de passe depuis le lien reçu (cf. UserInvitation côté serveur). */
export default function AcceptInvitation({ token, valid, user }: Props) {
    const { t } = useLocale();
    const page = t.auth.pages.acceptInvitation;
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('invitation.accept', { token }), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const inputClass = 'mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 text-slate-900 placeholder-slate-400 focus:border-terre-400 focus:ring-terre-400/20';

    return (
        <>
            <Head title={page.title} />

            <AuthSplitLayout
                title={valid ? page.heading : page.invalidTitle}
                description={valid && user ? (user.pending ? page.description(user.shop ?? 'BATIX PRO') : page.resetDescription) : page.invalidText}
                icon={<KeyRound className="size-5" />}
                sideStepLabel={page.sideLabel}
                sideTitle={page.sideTitle}
                sideDescription={page.sideDescription}
            >
                {valid && user ? (
                    <form onSubmit={submit} className="space-y-3">
                        <div>
                            <InputLabel htmlFor="email" value={t.auth.form.email} className="text-slate-700" />
                            {/* Lecture seule : l'adresse est celle du compte, on la montre parce
                                que c'est elle qui servira à se connecter. */}
                            <TextInput id="email" type="email" value={user.email} readOnly autoComplete="username" className={`${inputClass} opacity-70`} />
                        </div>

                        <div>
                            <InputLabel htmlFor="password" value={t.auth.form.passwordNew} className="text-slate-700" />
                            <div className="relative mt-1">
                                <TextInput
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={data.password}
                                    className={inputClass}
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
                            <TextInput
                                id="password_confirmation"
                                type={showPassword ? 'text' : 'password'}
                                name="password_confirmation"
                                value={data.password_confirmation}
                                className={inputClass}
                                autoComplete="new-password"
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                            />
                            <InputError message={errors.password_confirmation} className="mt-2" />
                        </div>

                        <PrimaryButton className="w-full justify-center bg-slate-900 py-2.5 text-sm normal-case tracking-normal hover:bg-slate-800" disabled={processing}>
                            {page.submit}
                        </PrimaryButton>
                    </form>
                ) : (
                    <Link href={route('login')} className="inline-flex w-full justify-center rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
                        {page.toLogin}
                    </Link>
                )}
            </AuthSplitLayout>
        </>
    );
}
