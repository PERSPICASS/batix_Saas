import AuthSplitLayout from '@/Components/AuthSplitLayout';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
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
            <Head title="Connexion" />

            <AuthSplitLayout
                title="Ravi de vous revoir"
                description="Connectez-vous pour reprendre vos ventes, vos stocks et vos operations la ou vous les avez laisses."
                icon={<Lock className="size-5" />}
                topLink={{ href: '/', label: "Retour a l'accueil" }}
                sideStepLabel="Acces securise"
                sideTitle="Retrouvez votre espace en un instant."
                sideDescription="Vos donnees restent synchronisees et securisees, pour que vous puissiez continuer sans interruption."
            >
                {status && (
                    <div className="mb-3 rounded-lg border border-emerald-300/60 bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-800">
                        {status}
                    </div>
                )}

                <form onSubmit={submit} className="space-y-3">
                    <div>
                        <InputLabel htmlFor="email" value="Email" className="text-slate-700" />

                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="mt-1 block w-full border border-[#cfc3ac] bg-white text-slate-900 placeholder-slate-400"
                            autoComplete="username"
                            isFocused={true}
                            onChange={(e) => setData('email', e.target.value)}
                        />

                        <InputError message={errors.email} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="password" value="Mot de passe" className="text-slate-700" />

                        <div className="relative mt-1">
                            <TextInput
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={data.password}
                                className="block w-full border border-[#cfc3ac] bg-white pr-10 text-slate-900 placeholder-slate-400"
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
                                className="border-[#cfc3ac] bg-white text-amber-600 focus:ring-amber-300"
                                onChange={(e) => setData('remember', e.target.checked)}
                            />
                            <span className="ms-2 text-sm text-slate-700">Se souvenir de moi</span>
                        </label>

                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="text-sm text-slate-600 underline underline-offset-4 transition hover:text-slate-900"
                            >
                                Mot de passe oublie ?
                            </Link>
                        )}
                    </div>

                    <div className="space-y-2 pt-1">
                        <PrimaryButton className="w-full justify-center bg-slate-900 py-2.5 text-sm normal-case tracking-normal hover:bg-slate-800" disabled={processing}>
                            Se connecter
                        </PrimaryButton>

                        <div className="text-center">
                            <Link href={route('register')} className="text-xs text-slate-600 underline underline-offset-4 transition hover:text-slate-900 sm:text-sm">
                                Nouveau ici ? Creer un compte
                            </Link>
                        </div>
                    </div>
                </form>
            </AuthSplitLayout>
        </>
    );
}
