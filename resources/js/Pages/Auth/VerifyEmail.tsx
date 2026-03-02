import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useState, useRef, useEffect } from 'react';
import { Mail, Shield, ArrowRight, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRoute } from '@/utils/route';

interface Props {
    email: string;
    canResend: boolean;
}

export default function VerifyEmail({ email, canResend }: Props) {
    const route = useRoute();
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationError, setVerificationError] = useState('');
    const [resendSuccess, setResendSuccess] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const { post, processing } = useForm({});

    // Timer pour le cooldown de renvoi
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleCodeChange = (index: number, value: string) => {
        // Ne garder que les chiffres
        const numericValue = value.replace(/[^0-9]/g, '');
        
        if (numericValue.length <= 1) {
            const newCode = [...code];
            newCode[index] = numericValue;
            setCode(newCode);
            setVerificationError('');

            // Passer au champ suivant si un chiffre est entré
            if (numericValue && index < 5) {
                inputRefs.current[index + 1]?.focus();
            }

            // Soumettre automatiquement si tous les champs sont remplis
            if (index === 5 && numericValue && newCode.every(digit => digit !== '')) {
                handleVerify(newCode.join(''));
            }
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
        
        if (pastedData.length === 6) {
            const newCode = pastedData.split('');
            setCode(newCode);
            setVerificationError('');
            inputRefs.current[5]?.focus();
            handleVerify(pastedData);
        }
    };

    const handleVerify = async (verificationCode: string) => {
        setIsVerifying(true);
        setVerificationError('');

        try {
            const response = await fetch(route('verification.code.verify'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ code: verificationCode }),
            });

            const data = await response.json();

            if (response.ok) {
                // Rediriger vers le dashboard
                window.location.href = data.redirect;
            } else {
                setVerificationError(data.message);
                setCode(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            }
        } catch (error) {
            setVerificationError('Une erreur est survenue. Veuillez réessayer.');
            setCode(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setIsVerifying(false);
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const verificationCode = code.join('');
        
        if (verificationCode.length === 6) {
            handleVerify(verificationCode);
        }
    };

    const handleResend = async () => {
        setResendSuccess(false);
        setVerificationError('');
        setResendCooldown(60); // Cooldown de 60 secondes

        try {
            const response = await fetch(route('verification.code.resend'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            const data = await response.json();
            setResendSuccess(true);
            setCode(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
            
            setTimeout(() => setResendSuccess(false), 5000);
        } catch (error) {
            setVerificationError('Impossible de renvoyer le code. Veuillez réessayer.');
        }
    };

    return (
        <GuestLayout>
            <Head title="Vérification Email" />

            <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-12">
                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -left-1/4 -top-1/4 h-1/2 w-1/2 rounded-full bg-amber-300/5 blur-3xl" />
                    <div className="absolute -bottom-1/4 -right-1/4 h-1/2 w-1/2 rounded-full bg-purple-500/5 blur-3xl" />
                </div>

                <div className="relative w-full max-w-md">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 shadow-lg shadow-amber-300/20">
                            <Mail className="h-10 w-10 text-slate-950" />
                        </div>
                        <h1 className="mb-2 text-3xl font-bold text-white">Vérifiez votre email</h1>
                        <p className="text-slate-400">
                            Un code de vérification a été envoyé à<br />
                            <span className="font-semibold text-amber-300">{email}</span>
                        </p>
                    </div>

                    {/* Form Card */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
                        <form onSubmit={submit} className="space-y-6">
                            {/* Code Input */}
                            <div>
                                <label className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200">
                                    <Shield className="h-4 w-4 text-amber-300" />
                                    Entrez le code à 6 chiffres
                                </label>
                                <div className="flex gap-2">
                                    {code.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={el => inputRefs.current[index] = el}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleCodeChange(index, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(index, e)}
                                            onPaste={index === 0 ? handlePaste : undefined}
                                            disabled={isVerifying}
                                            className={`h-14 w-full rounded-lg border text-center text-2xl font-bold transition-all ${
                                                verificationError
                                                    ? 'border-red-500/50 bg-red-500/10 text-red-400'
                                                    : digit
                                                    ? 'border-amber-300/50 bg-amber-300/10 text-amber-300'
                                                    : 'border-white/15 bg-slate-900/70 text-slate-200'
                                            } focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/50 disabled:opacity-50`}
                                            autoFocus={index === 0}
                                        />
                                    ))}
                                </div>
                                
                                {verificationError && (
                                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
                                        <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-400" />
                                        <p className="text-sm text-red-400">{verificationError}</p>
                                    </div>
                                )}

                                {resendSuccess && (
                                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2">
                                        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-400" />
                                        <p className="text-sm text-green-400">Un nouveau code a été envoyé !</p>
                                    </div>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={code.join('').length !== 6 || isVerifying}
                                className="group flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-300 to-amber-500 px-6 py-3 text-base font-semibold text-slate-950 shadow-lg shadow-amber-300/20 transition-all hover:shadow-xl hover:shadow-amber-300/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isVerifying ? (
                                    <>
                                        <RefreshCw className="h-5 w-5 animate-spin" />
                                        Vérification en cours...
                                    </>
                                ) : (
                                    <>
                                        Vérifier
                                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                    </>
                                )}
                            </button>

                            {/* Divider */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/10" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-slate-900 px-2 text-slate-500">Ou</span>
                                </div>
                            </div>

                            {/* Resend Code */}
                            <div className="text-center">
                                {canResend && resendCooldown === 0 ? (
                                    <button
                                        type="button"
                                        onClick={handleResend}
                                        disabled={processing}
                                        className="inline-flex items-center gap-2 text-sm font-medium text-amber-300 transition-colors hover:text-amber-200"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                        Renvoyer le code
                                    </button>
                                ) : resendCooldown > 0 ? (
                                    <p className="text-sm text-slate-500">
                                        Renvoyer le code dans{' '}
                                        <span className="font-semibold text-amber-300">{resendCooldown}s</span>
                                    </p>
                                ) : (
                                    <p className="text-sm text-slate-500">Vérifiez votre boîte de réception</p>
                                )}
                            </div>
                        </form>

                        {/* Info Box */}
                        <div className="mt-6 rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
                            <p className="text-xs text-blue-300">
                                <strong>💡 Astuce :</strong> Vérifiez également votre dossier spam ou courrier indésirable.
                                Le code expire dans 15 minutes.
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="mt-6 text-center text-sm text-slate-500">
                        Besoin d'aide ?{' '}
                        <a href="#" className="font-medium text-amber-300 hover:text-amber-200">
                            Contactez le support
                        </a>
                    </p>
                </div>
            </div>
        </GuestLayout>
    );
}
