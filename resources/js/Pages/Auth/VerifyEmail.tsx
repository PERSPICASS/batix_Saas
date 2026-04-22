import AuthSplitLayout from '@/Components/AuthSplitLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head } from '@inertiajs/react';
import { FormEventHandler, KeyboardEvent, ClipboardEvent, useEffect, useRef, useState } from 'react';
import { MailCheck, RefreshCw, ShieldCheck } from 'lucide-react';
import { useRoute } from '@/utils/route';
import axios from 'axios';

interface Props {
    email: string;
    canResend: boolean;
}

export default function VerifyEmail({ email, canResend }: Props) {
    const route = useRoute();
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [verificationError, setVerificationError] = useState('');
    const [resendSuccess, setResendSuccess] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (resendCooldown <= 0) {
            return;
        }

        const timer = window.setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
        return () => window.clearTimeout(timer);
    }, [resendCooldown]);

    const handleCodeChange = (index: number, value: string) => {
        const numericValue = value.replace(/[^0-9]/g, '');

        if (numericValue.length > 1) {
            return;
        }

        const newCode = [...code];
        newCode[index] = numericValue;
        setCode(newCode);
        setVerificationError('');

        if (numericValue && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        if (index === 5 && numericValue && newCode.every((digit) => digit !== '')) {
            handleVerify(newCode.join(''));
        }
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
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
            const { data } = await axios.post(route('verification.code.verify'), {
                code: verificationCode,
            });

            if (data.redirect) {
                window.location.href = data.redirect;
            } else if (data.step === 3) {
                window.location.href = route('shop.create.initial');
            }
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Code invalide. Veuillez reessayer.';
            setVerificationError(message);
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
        if (resendCooldown > 0 || isResending) {
            return;
        }

        setResendSuccess(false);
        setVerificationError('');
        setResendCooldown(60);
        setIsResending(true);

        try {
            await axios.post(route('verification.code.resend'));

            setResendSuccess(true);
            setCode(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
            window.setTimeout(() => setResendSuccess(false), 5000);
        } catch {
            setVerificationError('Impossible de renvoyer le code. Veuillez reessayer.');
            setResendCooldown(0);
        } finally {
            setIsResending(false);
        }
    };

    return (
        <>
            <Head title="Verification email" />

            <AuthSplitLayout
                title="Verifiez votre email"
                description={`Un code a 6 chiffres a ete envoye a ${email}.`}
                icon={<MailCheck className="size-5" />}
                stepper={
                    <div className="mb-4 flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-semibold text-white">✓</div>
                        <div className="h-1 w-10 rounded-full bg-emerald-400" />
                        <div className="flex size-7 items-center justify-center rounded-full bg-amber-500 text-xs font-semibold text-white">2</div>
                        <div className="h-1 w-10 rounded-full bg-[#d5c9b2]" />
                        <div className="flex size-7 items-center justify-center rounded-full bg-[#d5c9b2] text-xs font-semibold text-slate-700">3</div>
                    </div>
                }
                sideStepLabel="Etape 2 sur 3"
                sideTitle="Validez votre acces en toute securite."
                sideDescription="Confirmez votre email pour activer votre espace et continuer la configuration."
            >
                <form onSubmit={submit} className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <ShieldCheck className="size-4 text-amber-700" />
                        Entrez le code a 6 chiffres
                    </label>

                    <div className="flex gap-2">
                        {code.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => {
                                    inputRefs.current[index] = el;
                                }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleCodeChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={index === 0 ? handlePaste : undefined}
                                disabled={isVerifying}
                                className={`h-12 w-full rounded-lg border text-center text-xl font-semibold transition-all ${
                                    verificationError
                                        ? 'border-red-300 bg-red-50 text-red-700'
                                        : digit
                                          ? 'border-amber-300 bg-amber-50 text-amber-800'
                                          : 'border-[#cfc3ac] bg-white text-slate-800'
                                } focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200`}
                                autoFocus={index === 0}
                            />
                        ))}
                    </div>

                    {verificationError && (
                        <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{verificationError}</p>
                    )}

                    {resendSuccess && (
                        <p className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Un nouveau code a ete envoye.</p>
                    )}

                    <PrimaryButton
                        type="submit"
                        disabled={code.join('').length !== 6 || isVerifying}
                        className="w-full justify-center bg-slate-900 py-2.5 text-sm normal-case tracking-normal hover:bg-slate-800"
                    >
                        {isVerifying ? 'Verification...' : 'Verifier'}
                    </PrimaryButton>

                    <div className="text-center">
                        {canResend && resendCooldown === 0 ? (
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={isResending}
                                className="inline-flex items-center gap-2 text-sm text-slate-700 underline underline-offset-4 transition hover:text-slate-900"
                            >
                                <RefreshCw className={`size-4 ${isResending ? 'animate-spin' : ''}`} />
                                Renvoyer le code
                            </button>
                        ) : resendCooldown > 0 ? (
                            <p className="text-sm text-slate-600">
                                Nouveau code dans <span className="font-semibold text-amber-700">{resendCooldown}s</span>
                            </p>
                        ) : (
                            <p className="text-sm text-slate-600">Consultez votre boite de reception</p>
                        )}
                    </div>
                </form>
            </AuthSplitLayout>
        </>
    );
}
