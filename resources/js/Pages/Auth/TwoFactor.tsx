import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { Lock, Shield, Copy, Check, X } from 'lucide-react';
import axios from 'axios';
import { useLocale } from '@/contexts/LocaleContext';

interface Props {
    twoFactorEnabled: boolean;
    hasSecret: boolean;
}

export default function TwoFactor({ twoFactorEnabled, hasSecret }: Props) {
    const { t } = useLocale();
    const [showSetup, setShowSetup] = useState(false);
    const [qrCode, setQrCode] = useState('');
    const [secret, setSecret] = useState('');
    const [code, setCode] = useState('');
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
    const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [disablePassword, setDisablePassword] = useState('');
    const [showDisableModal, setShowDisableModal] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const generateSecret = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.post('/two-factor/generate-secret');
            setQrCode(response.data.qrCodeUrl);
            setSecret(response.data.secret);
            setShowSetup(true);
        } catch (err: any) {
            setError(err.response?.data?.message || t.auth.messages.secretGenerationError);
        } finally {
            setLoading(false);
        }
    };

    const verifyCode = async () => {
        if (code.length !== 6) {
            setError(t.auth.messages.enterSixDigitCode);
            return;
        }

        setLoading(true);
        setError('');
        try {
            const response = await axios.post('/two-factor/verify', { code });

            if (response.data.recoveryCodes) {
                setRecoveryCodes(response.data.recoveryCodes);
                setShowRecoveryCodes(true);
                setSuccess(t.auth.messages.twoFactorEnabled);
                setCode('');
            } else {
                setError(t.auth.messages.recoveryCodesError);
                console.error('Response missing recoveryCodes:', response.data);
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || t.auth.messages.invalidCode;
            setError(errorMsg);
            console.error('2FA verification error:', {
                status: err.response?.status,
                message: err.response?.data?.message,
                debug: err.response?.data?.debug,
                fullError: err.response?.data,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDisable = async () => {
        setLoading(true);
        setError('');
        try {
            await axios.post('/two-factor/disable', { password: disablePassword });
            setSuccess(t.auth.messages.twoFactorDisabled);
            setShowDisableModal(false);
            setDisablePassword('');
            // Reload page
            window.location.reload();
        } catch (err: any) {
            setError(err.response?.data?.message || t.auth.messages.disableError);
        } finally {
            setLoading(false);
        }
    };

    const copyCode = (index: number, code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    return (
        <AuthenticatedLayout
            header={<h1 className="text-xl font-semibold text-slate-900 dark:text-white">{t.auth.pages.twoFactor.heading}</h1>}
        >
            <Head title={t.auth.pages.twoFactor.title} />

            <div className="max-w-2xl space-y-6">
                {/* Status Card */}
                <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/50 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Shield className={`size-8 ${twoFactorEnabled ? 'text-green-500' : 'text-slate-500 dark:text-slate-400'}`} />
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t.auth.pages.twoFactor.heading}</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {twoFactorEnabled
                                        ? t.auth.pages.twoFactor.statusEnabled
                                        : t.auth.pages.twoFactor.statusDisabled}
                                </p>
                            </div>
                        </div>
                        {twoFactorEnabled && (
                            <button
                                onClick={() => setShowDisableModal(true)}
                                className="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
                            >
                                {t.auth.actions.disableTwoFactor}
                            </button>
                        )}
                    </div>
                </div>

                {/* Messages */}
                {error && (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-green-400">
                        {success}
                    </div>
                )}

                {!twoFactorEnabled ? (
                    <>
                        {/* Setup Instructions */}
                        <div className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-6 dark:border-white/10 dark:bg-slate-900/40">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t.auth.pages.twoFactor.setupSection}</h3>

                            <div className="space-y-3 text-sm text-slate-300">
                                <p>{t.auth.pages.twoFactor.setupDescription}</p>
                                <p>{t.auth.pages.twoFactor.authenticatorAppLabel}</p>
                                <ul className="ml-4 space-y-2">
                                    <li>🔹 {t.auth.pages.twoFactor.authenticatorApps.googleAuth}</li>
                                    <li>🔹 {t.auth.pages.twoFactor.authenticatorApps.microsoftAuth}</li>
                                    <li>🔹 {t.auth.pages.twoFactor.authenticatorApps.authy}</li>
                                </ul>
                            </div>

                            {!showSetup && (
                                <button
                                    onClick={generateSecret}
                                    disabled={loading}
                                    className="mt-4 rounded-lg bg-amber-300 px-6 py-2 font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50"
                                >
                                    {loading ? t.auth.actions.generating : t.auth.actions.startSetup}
                                </button>
                            )}
                        </div>

                        {/* QR Code Setup */}
                        {showSetup && !showRecoveryCodes && (
                            <div className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-6 dark:border-white/10 dark:bg-slate-900/40">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t.auth.pages.twoFactor.step1Title}</h3>

                                {qrCode && (
                                    <div className="flex flex-col items-center gap-4">
                                        <img
                                            src={qrCode}
                                            alt="QR Code"
                                            className="rounded-lg border border-white/10 p-2"
                                        />
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {t.auth.pages.twoFactor.manualSecretLabel} <code className="font-mono text-amber-300">{secret}</code>
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                        {t.auth.pages.twoFactor.step2Title}
                                    </label>
                                    <input
                                        type="text"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="000000"
                                        maxLength={6}
                                        className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-4 py-3 text-center font-mono text-2xl tracking-widest text-slate-200 focus:border-amber-300 focus:outline-none"
                                    />
                                </div>

                                <button
                                    onClick={verifyCode}
                                    disabled={loading || code.length !== 6}
                                    className="w-full rounded-lg bg-amber-300 px-4 py-2 font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50"
                                >
                                    {loading ? t.auth.actions.verifying : t.auth.actions.verifyAndActivate}
                                </button>
                            </div>
                        )}

                        {/* Recovery Codes */}
                        {showRecoveryCodes && recoveryCodes && recoveryCodes.length > 0 && (
                            <div className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-6 dark:border-white/10 dark:bg-slate-900/40">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t.auth.pages.twoFactor.recoveryCodes}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {t.auth.pages.twoFactor.recoveryCodesDescription}
                                </p>

                                <div className="space-y-2">
                                    {recoveryCodes.map((recoveryCode, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900/50 p-3"
                                        >
                                            <code className="font-mono text-slate-300">{recoveryCode}</code>
                                            <button
                                                onClick={() => copyCode(index, recoveryCode)}
                                                className="rounded p-2 hover:bg-white/10"
                                            >
                                                {copiedIndex === index ? (
                                                    <Check className="size-4 text-green-400" />
                                                ) : (
                                                    <Copy className="size-4 text-slate-500 dark:text-slate-400" />
                                                )}
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => window.location.reload()}
                                    className="w-full rounded-lg bg-amber-300 px-4 py-2 font-semibold text-slate-950 hover:bg-amber-200"
                                >
                                    {t.auth.actions.finishSetup}
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-6">
                        <div className="flex items-center gap-3">
                            <Check className="size-5 text-green-400" />
                            <div>
                                <h3 className="font-semibold text-green-400">{t.auth.pages.twoFactor.enabledMessage}</h3>
                                <p className="text-sm text-green-300">{t.auth.pages.twoFactor.enabledDescription}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Disable Modal */}
                {showDisableModal && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="rounded-2xl border border-white/10 bg-slate-950 p-6 max-w-md">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t.auth.pages.twoFactor.disableModalTitle}</h3>
                            <p className="mt-2 text-sm text-slate-400">
                                {t.auth.pages.twoFactor.disableModalDescription}
                            </p>

                            <input
                                type="password"
                                value={disablePassword}
                                onChange={(e) => setDisablePassword(e.target.value)}
                                placeholder={t.auth.form.password}
                                className="mt-4 w-full rounded-lg border border-white/15 bg-slate-900/70 px-4 py-2 text-slate-200 focus:border-red-500 focus:outline-none"
                            />

                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={() => setShowDisableModal(false)}
                                    className="flex-1 rounded-lg border border-white/15 px-4 py-2 text-slate-200 hover:bg-white/5"
                                >
                                    {t.auth.actions.cancel}
                                </button>
                                <button
                                    onClick={handleDisable}
                                    disabled={loading || !disablePassword}
                                    className="flex-1 rounded-lg bg-red-500 px-4 py-2 font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                                >
                                    {loading ? t.auth.actions.disabling : t.auth.actions.disableTwoFactor}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
