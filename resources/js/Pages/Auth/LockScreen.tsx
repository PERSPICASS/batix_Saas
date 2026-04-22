import AuthSplitLayout from '@/Components/AuthSplitLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import { FormEventHandler, useEffect, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { Eye, EyeOff, Lock, User } from 'lucide-react';

interface Props {
    user: {
        id: number;
        name: string;
        email: string;
        avatar?: string;
    };
    returnUrl?: string;
}

export default function LockScreen({ user }: Props) {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    useEffect(() => {
        document.getElementById('password')?.focus();
        return () => reset('password');
    }, []);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('lock-screen.unlock'));
    };

    return (
        <>
            <Head title="Ecran verrouille" />

            <AuthSplitLayout
                title="Session verrouillee"
                description="Entrez votre mot de passe pour reprendre exactement la ou vous vous etiez arrete."
                icon={<Lock className="size-5" />}
                sideStepLabel="Session securisee"
                sideTitle="Vos donnees restent protegees."
                sideDescription="Deverrouillez votre session pour continuer vos operations sans perdre votre progression."
            >
                <div className="mb-4 rounded-2xl border border-[#d8cfbe] bg-[#f5efe4] p-4">
                    <div className="flex items-center gap-3">
                        {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="size-12 rounded-full object-cover" />
                        ) : (
                            <div className="flex size-12 items-center justify-center rounded-full bg-amber-200 text-amber-800">
                                <User className="size-6" />
                            </div>
                        )}
                        <div>
                            <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                            <p className="text-xs text-slate-600">{user.email}</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-3">
                    <div>
                        <label htmlFor="password" className="text-sm font-medium text-slate-700">
                            Mot de passe
                        </label>
                        <div className="relative mt-1">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={data.password}
                                className={`block w-full rounded-md border px-3 py-2 pr-10 text-slate-900 placeholder-slate-400 ${
                                    errors.password ? 'border-red-300 bg-red-50' : 'border-[#cfc3ac] bg-white'
                                }`}
                                placeholder="Entrez votre mot de passe"
                                onChange={(e) => setData('password', e.target.value)}
                                autoComplete="current-password"
                                disabled={processing}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                            </button>
                        </div>
                        {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
                    </div>

                    <PrimaryButton
                        type="submit"
                        disabled={processing || !data.password}
                        className="w-full justify-center bg-slate-900 py-2.5 text-sm normal-case tracking-normal hover:bg-slate-800"
                    >
                        {processing ? 'Deverrouillage...' : 'Deverrouiller'}
                    </PrimaryButton>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => router.post(route('logout'))}
                            className="text-xs text-slate-600 underline underline-offset-4 transition hover:text-slate-900 sm:text-sm"
                        >
                            Se connecter avec un autre compte
                        </button>
                    </div>
                </form>
            </AuthSplitLayout>
        </>
    );
}
