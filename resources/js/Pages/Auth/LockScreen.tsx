import { FormEventHandler, useEffect, useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Lock, Eye, EyeOff, HardHat, User } from 'lucide-react';

interface Props {
    user: {
        id: number;
        name: string;
        email: string;
        avatar?: string;
    };
    returnUrl?: string;
}

export default function LockScreen({ user, returnUrl }: Props) {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    useEffect(() => {
        // Focus sur le champ mot de passe au chargement
        document.getElementById('password')?.focus();

        return () => {
            reset('password');
        };
    }, []);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('lock-screen.unlock'));
    };

    // Get user initials for avatar fallback
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <>
            <Head title="Écran verrouillé" />

            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-[url('/images/grid.svg')] bg-center opacity-10"></div>
                
                <div className="relative z-10 w-full max-w-md px-6">
                    {/* Logo Batix */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center  justify-center w-16 h-16 rounded-lg bg-amber-300 mb-3">
                            <HardHat className="size-9 text-slate-950" />
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200 mb-1">
                            Batix SaaS
                        </p>
                        <p className="text-xs text-slate-400 mb-2">
                            Espace sécurisé de gestion
                        </p>
                        <h1 className="text-2xl font-bold text-white mb-2">
                            Écran Verrouillé
                        </h1>
                        <p className="text-slate-400">
                            Entrez votre mot de passe pour déverrouiller
                        </p>
                    </div>

                    {/* User Card */}
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl p-8">
                        {/* User Avatar & Info */}
                        <div className="text-center mb-6">
                            {user.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-amber-300/30"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-full mx-auto mb-4 border-4 border-amber-300/30 bg-amber-300 flex items-center justify-center">
                                    <User className="size-10 text-slate-950" />
                                </div>
                            )}
                            <h2 className="text-xl font-semibold text-white mb-1">
                                {user.name}
                            </h2>
                            <p className="text-sm text-slate-400">{user.email}</p>
                        </div>

                        {/* Unlock Form */}
                        <form onSubmit={submit} className="space-y-4">
                            {/* Password Input */}
                            <div>
                                <label htmlFor="password" className="sr-only">
                                    Mot de passe
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={data.password}
                                        className={`block w-full rounded-lg border ${
                                            errors.password
                                                ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                                                : 'border-white/10 focus:border-amber-300 focus:ring-amber-300/20'
                                        } bg-slate-900/50 px-4 py-3 pr-12 text-white placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 transition-colors`}
                                        placeholder="Entrez votre mot de passe"
                                        onChange={(e) => setData('password', e.target.value)}
                                        autoComplete="current-password"
                                        disabled={processing}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="size-5" />
                                        ) : (
                                            <Eye className="size-5" />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-2 text-sm text-red-400">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Unlock Button */}
                            <button
                                type="submit"
                                disabled={processing || !data.password}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-300 text-slate-950 font-semibold rounded-lg shadow-lg shadow-amber-300/30 hover:shadow-amber-300/50 hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            >
                                {processing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-950 border-t-transparent"></div>
                                        <span>Déverrouillage...</span>
                                    </>
                                ) : (
                                    <>
                                        <Lock className="size-5" />
                                        <span>Déverrouiller</span>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-slate-800/50 text-slate-400">
                                    ou
                                </span>
                            </div>
                        </div>

                        {/* Switch User Link */}
                        <div className="text-center">
                            <a
                                href={route('logout')}
                                className="text-sm text-slate-400 hover:text-white transition-colors"
                                onClick={(e) => {
                                    e.preventDefault();
                                    const form = document.createElement('form');
                                    form.method = 'POST';
                                    form.action = route('logout');
                                    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                                    if (token) {
                                        const input = document.createElement('input');
                                        input.type = 'hidden';
                                        input.name = '_token';
                                        input.value = token;
                                        form.appendChild(input);
                                    }
                                    document.body.appendChild(form);
                                    form.submit();
                                }}
                            >
                                Se connecter avec un autre compte
                            </a>
                        </div>
                    </div>

                    {/* Hint */}
                    <p className="text-center text-sm text-slate-500 mt-6">
                        Votre session est sécurisée et sera restaurée après déverrouillage
                    </p>
                </div>
            </div>
        </>
    );
}
