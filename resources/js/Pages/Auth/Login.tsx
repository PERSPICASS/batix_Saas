import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const [showPassword, setShowPassword] = useState(false);
    const [isRefreshingToken, setIsRefreshingToken] = useState(false);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();

        // Rafraîchir le token CSRF avant de soumettre pour éviter l'erreur 419
        try {
            setIsRefreshingToken(true);
            await fetch('/sanctum/csrf-cookie', {
                credentials: 'same-origin'
            });
            
            // Mettre à jour le token dans axios
            const newToken = document.head.querySelector('meta[name="csrf-token"]');
            if (newToken && window.axios) {
                const tokenValue = newToken.getAttribute('content');
                if (tokenValue) {
                    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = tokenValue;
                }
            }
            
            setIsRefreshingToken(false);
        } catch (error) {
            console.error('Erreur lors du rafraîchissement du token CSRF:', error);
            setIsRefreshingToken(false);
        }

        // Soumettre le formulaire avec le token frais
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Connexion" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">Connexion</h1>
                <p className="mt-1 text-sm text-slate-300">
                    Accede a ton espace Batix pour gerer tes boutiques.
                </p>
                <Link
                    href="/"
                    className="mt-3 inline-flex text-sm text-amber-200 underline underline-offset-4 transition hover:text-amber-100"
                >
                    Retour a l'accueil
                </Link>
            </div>

            {status && (
                <div className="mb-4 rounded-lg border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-sm font-medium text-emerald-200">
                    {status}
                </div>
            )}

            <form onSubmit={submit}>
                <div>
                    <InputLabel
                        htmlFor="email"
                        value="Email"
                        className="text-slate-200"
                    />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full border-white/15 bg-slate-900/70 text-white placeholder:text-slate-400 focus:border-amber-300 focus:ring-amber-300"
                        autoComplete="username"
                        isFocused={true}
                        onChange={(e) => setData('email', e.target.value)}
                    />

                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel
                        htmlFor="password"
                        value="Mot de passe"
                        className="text-slate-200"
                    />

                    <div className="relative">
                        <TextInput
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={data.password}
                            className="mt-1 block w-full border-white/15 bg-slate-900/70 text-white placeholder:text-slate-400 focus:border-amber-300 focus:ring-amber-300 pr-10"
                            autoComplete="current-password"
                            onChange={(e) => setData('password', e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none"
                        >
                            {showPassword ? (
                                <EyeOff className="h-5 w-5" />
                            ) : (
                                <Eye className="h-5 w-5" />
                            )}
                        </button>
                    </div>

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4 block">
                    <label className="flex items-center">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            className="border-white/20 bg-slate-900 text-amber-300 focus:ring-amber-300"
                            onChange={(e) =>
                                setData(
                                    'remember',
                                    (e.target.checked || false) as false,
                                )
                            }
                        />
                        <span className="ms-2 text-sm text-slate-300">
                            Se souvenir de moi
                        </span>
                    </label>
                </div>

                <div className="mt-4 flex items-center justify-end">
                    {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="rounded-md text-sm text-slate-300 underline underline-offset-4 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-slate-950"
                            >
                                Mot de passe oublie ?
                            </Link>
                        )}

                    <PrimaryButton
                        className="ms-4 border-0 bg-amber-300 text-slate-950 hover:bg-amber-200 focus:bg-amber-200 focus:ring-amber-300 focus:ring-offset-slate-950 active:bg-amber-300"
                        disabled={processing || isRefreshingToken}
                    >
                        {isRefreshingToken ? 'Préparation...' : 'Se connecter'}
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
