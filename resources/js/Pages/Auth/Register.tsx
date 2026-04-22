import AuthSplitLayout from '@/Components/AuthSplitLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { Eye, EyeOff, User } from 'lucide-react';

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Inscription" />

            <AuthSplitLayout
                title="Commencons par votre compte"
                description="Entrez vos informations pour activer votre essai gratuit de 30 jours."
                icon={<User className="size-5" />}
                stepper={
                    <div className="mb-4 flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-full bg-amber-500 text-xs font-semibold text-white">1</div>
                        <div className="h-1 w-10 rounded-full bg-amber-400" />
                        <div className="flex size-7 items-center justify-center rounded-full bg-[#d5c9b2] text-xs font-semibold text-slate-700">2</div>
                        <div className="h-1 w-10 rounded-full bg-[#d5c9b2]" />
                        <div className="flex size-7 items-center justify-center rounded-full bg-[#d5c9b2] text-xs font-semibold text-slate-700">3</div>
                    </div>
                }
                sideStepLabel="Etape 1 sur 3"
                sideTitle="Un bon demarrage change tout le reste."
                sideDescription="Creez votre compte maintenant, puis ajoutez votre boutique et vos premiers produits dans la prochaine etape."
            >
                <form onSubmit={submit} className="space-y-3">
                    <div>
                        <InputLabel htmlFor="name" value="Nom complet" className="text-slate-700" />

                        <TextInput
                            id="name"
                            name="name"
                            value={data.name}
                            className="mt-1 block w-full border border-[#cfc3ac] bg-white text-slate-900 placeholder-slate-400"
                            autoComplete="name"
                            isFocused={true}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                            placeholder="Jean Dupont"
                        />

                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="email" value="Email" className="text-slate-700" />

                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="mt-1 block w-full border border-[#cfc3ac] bg-white text-slate-900 placeholder-slate-400"
                            autoComplete="username"
                            onChange={(e) => setData('email', e.target.value)}
                            required
                            placeholder="jean@exemple.com"
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
                                autoComplete="new-password"
                                onChange={(e) => setData('password', e.target.value)}
                                required
                                placeholder="••••••••"
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
                        <InputLabel htmlFor="password_confirmation" value="Confirmer le mot de passe" className="text-slate-700" />

                        <div className="relative mt-1">
                            <TextInput
                                id="password_confirmation"
                                type={showPasswordConfirmation ? 'text' : 'password'}
                                name="password_confirmation"
                                value={data.password_confirmation}
                                className="block w-full border border-[#cfc3ac] bg-white pr-10 text-slate-900 placeholder-slate-400"
                                autoComplete="new-password"
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                required
                                placeholder="••••••••"
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
                            {processing ? 'Création en cours...' : 'Continuer'}
                        </PrimaryButton>

                        <div className="text-center">
                            <Link href={route('login')} className="text-xs text-slate-600 underline underline-offset-4 transition hover:text-slate-900 sm:text-sm">
                                Deja inscrit ? Se connecter
                            </Link>
                        </div>
                    </div>
                </form>
            </AuthSplitLayout>
        </>
    );
}
