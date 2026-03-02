import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
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
        <GuestLayout>
            <Head title="Inscription" />

            {/* Indicateur d'étapes */}
            <div className="mb-6 flex items-center justify-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-full bg-amber-300 text-sm font-semibold text-slate-950">
                    1
                </div>
                <div className="h-1 w-12 rounded-full bg-slate-700"></div>
                <div className="flex size-8 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-slate-400">
                    2
                </div>
                <div className="h-1 w-12 rounded-full bg-slate-700"></div>
                <div className="flex size-8 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-slate-400">
                    3
                </div>
            </div>

            <div className="mb-5 text-center">
                <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-amber-300/10">
                    <User className="size-7 text-amber-300" />
                </div>
                <h2 className="text-xl font-bold text-white">
                    Créer un compte
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                    Commencez votre essai gratuit de 30 jours
                </p>
            </div>

            <form onSubmit={submit} className="space-y-3">
                <div>
                    <InputLabel
                        htmlFor="name"
                        value="Nom complet"
                    />

                    <TextInput
                        id="name"
                        name="name"
                        value={data.name}
                        className="mt-1 block w-full"
                        autoComplete="name"
                        isFocused={true}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        placeholder="Jean Dupont"
                    />

                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div>
                    <InputLabel
                        htmlFor="email"
                        value="Email"
                    />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        placeholder="jean@exemple.com"
                    />

                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div>
                    <InputLabel
                        htmlFor="password"
                        value="Mot de passe"
                    />

                    <div className="relative mt-1">
                        <TextInput
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={data.password}
                            className="block w-full pr-10"
                            autoComplete="new-password"
                            onChange={(e) => setData('password', e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none"
                        >
                            {showPassword ? (
                                <EyeOff className="size-5" />
                            ) : (
                                <Eye className="size-5" />
                            )}
                        </button>
                    </div>

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div>
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirmer le mot de passe"
                    />

                    <div className="relative mt-1">
                        <TextInput
                            id="password_confirmation"
                            type={showPasswordConfirmation ? 'text' : 'password'}
                            name="password_confirmation"
                            value={data.password_confirmation}
                            className="block w-full pr-10"
                            autoComplete="new-password"
                            onChange={(e) =>
                                setData('password_confirmation', e.target.value)
                            }
                            required
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none"
                        >
                            {showPasswordConfirmation ? (
                                <EyeOff className="size-5" />
                            ) : (
                                <Eye className="size-5" />
                            )}
                        </button>
                    </div>

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2"
                    />
                </div>

                <div className="space-y-3 pt-1">
                    <PrimaryButton className="w-full justify-center" disabled={processing}>
                        {processing ? 'Création en cours...' : 'Continuer →'}
                    </PrimaryButton>

                    <div className="text-center">
                        <Link
                            href={route('login')}
                            className="text-sm text-slate-400 underline underline-offset-4 transition hover:text-white"
                        >
                            Déjà inscrit ? Se connecter
                        </Link>
                    </div>
                </div>
            </form>
        </GuestLayout>
    );
}
