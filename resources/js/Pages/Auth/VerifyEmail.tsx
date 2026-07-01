import AuthSplitLayout from '@/Components/AuthSplitLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head } from '@inertiajs/react';
import { FormEventHandler, KeyboardEvent, ClipboardEvent, useEffect, useRef, useState } from 'react';
import { MailCheck, RefreshCw, ShieldCheck } from 'lucide-react';
import { useRoute } from '@/utils/route';
import axios from 'axios';
import { useLocale } from '@/contexts/LocaleContext';

interface Props {
    email: string;
    canResend: boolean;
}

export default function VerifyEmail({ email, canResend }: Props) {
    const { t } = useLocale();
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
            const message = error?.response?.data?.message || t.auth.messages.invalidCode;
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
            setVerificationError(t.auth.messages.resendError);
            setResendCooldown(0);
        } finally {
            setIsResending(false);
        }
    };

    return (
        <>
            <Head title={t.auth.pages.verifyEmail.title} />

            <AuthSplitLayout
                title={t.auth.pages.verifyEmail.heading}
                description={t.auth.pages.verifyEmail.description.replace('{email}', email)}
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
                sideStepLabel={t.auth.pages.verifyEmail.sideLabel}
                sideTitle={t.auth.pages.verifyEmail.sideTitle}
                sideDescription={t.auth.pages.verifyEmail.sideDescription}
            >
                <form onSubmit={submit} className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <ShieldCheck className="size-4 text-amber-700" />
                        {t.auth.messages.enterCode}
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
                        <p className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{t.auth.messages.newCodeSent}</p>
                    )}

                    <PrimaryButton
                        type="submit"
                        disabled={code.join('').length !== 6 || isVerifying}
                        className="w-full justify-center bg-slate-900 py-2.5 text-sm normal-case tracking-normal hover:bg-slate-800"
                    >
                        {isVerifying ? t.auth.actions.verifying : t.auth.actions.verify}
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
                                {t.auth.actions.resendCode}
                            </button>
                        ) : resendCooldown > 0 ? (
                            <p className="text-sm text-slate-600">
                                {t.auth.actions.resendIn.replace('{seconds}', resendCooldown.toString())}
                            </p>
                        ) : (
                            <p className="text-sm text-slate-600">{t.auth.messages.checkInbox}</p>
                        )}
                    </div>
                </form>
            </AuthSplitLayout>
        </>
    );
}
