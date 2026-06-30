import { Head, router } from '@inertiajs/react';
import { Lock } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';

export default function VerifyTwoFactor() {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!code.trim()) {
            setError('Veuillez entrer un code');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await axios.post('/two-factor/check-code', {
                code: code.trim(),
            });

            if (response.data.verified) {
                // Redirection au dashboard
                window.location.href = '/dashboard';
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Code invalide. Réessayez.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Head title="Vérification 2FA" />

            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 px-4">
                <div className="w-full max-w-md">
                    {/* Card */}
                    <div className="rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-xl p-8">
                        {/* Logo */}
                        <div className="mb-8 flex justify-center">
                            <div className="rounded-full bg-amber-300/10 p-4">
                                <Lock className="size-6 text-amber-300" />
                            </div>
                        </div>

                        {/* Title */}
                        <h1 className="mb-2 text-center text-2xl font-bold text-white">
                            Vérification 2FA
                        </h1>
                        <p className="mb-6 text-center text-sm text-slate-400">
                            Entrez le code à 6 chiffres de votre application authenticateur
                        </p>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Error */}
                            {error && (
                                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                                    {error}
                                </div>
                            )}

                            {/* Code Input */}
                            <div>
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                        setCode(val);
                                    }}
                                    placeholder="000000"
                                    maxLength={6}
                                    className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-4 py-3 text-center font-mono text-4xl tracking-widest text-slate-200 placeholder-slate-600 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                    disabled={loading}
                                    autoFocus
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading || code.length !== 6}
                                className="w-full rounded-lg bg-amber-300 py-2 font-semibold text-slate-950 transition-colors hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Vérification...' : 'Vérifier'}
                            </button>
                        </form>

                        {/* Recovery Code Option */}
                        <p className="mt-6 text-center text-xs text-slate-500">
                            Vous pouvez aussi entrer un code de secours
                        </p>
                    </div>

                    {/* Footer */}
                    <p className="mt-8 text-center text-xs text-slate-600">
                        © 2026 BATIXPRO. Tous droits réservés.
                    </p>
                </div>
            </div>
        </>
    );
}
