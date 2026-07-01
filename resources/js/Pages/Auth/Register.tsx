import AuthSplitLayout from '@/Components/AuthSplitLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link } from '@inertiajs/react';
import { useLocale } from '@/contexts/LocaleContext';
import axios from 'axios';
import { ClipboardEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, MailCheck, ShieldCheck, Store, User } from 'lucide-react';
import { countriesI18n } from '@/i18n/countries';

interface Props {
    initialStep?: number;
    initialEmail?: string;
}

export default function Register({ initialStep = 1, initialEmail = '' }: Props) {
    const { locale } = useLocale();
    const [step, setStep] = useState(initialStep);

    // Étape 1
    const [name, setName] = useState('');
    const [email, setEmail] = useState(initialEmail);
    const [country, setCountry] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
    const [step1Processing, setStep1Processing] = useState(false);
    const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});

    // Étape 2
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [otpError, setOtpError] = useState('');
    const [otpProcessing, setOtpProcessing] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [resendSuccess, setResendSuccess] = useState(false);
    const [devOtpCode, setDevOtpCode] = useState<string | null>(null);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Étape 3
    const [shopName, setShopName] = useState('');
    const [shopCity, setShopCity] = useState('');
    const [shopPhone, setShopPhone] = useState('');
    const [shopAddress, setShopAddress] = useState('');
    const [step3Processing, setStep3Processing] = useState(false);
    const [step3Errors, setStep3Errors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const t = window.setTimeout(() => setResendCooldown((v) => v - 1), 1000);
        return () => window.clearTimeout(t);
    }, [resendCooldown]);

    const handleStep1 = async (e: React.FormEvent) => {
        e.preventDefault();
        setStep1Processing(true);
        setStep1Errors({});
        try {
            await axios.post(route('register'), { name, email, country, password, password_confirmation: passwordConfirmation });
            setStep(2);
        } catch (error: any) {
            if (error?.response?.status === 422) {
                setStep1Errors(error.response.data.errors ?? {});
            }
        } finally {
            setStep1Processing(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        const v = value.replace(/[^0-9]/g, '');
        if (v.length > 1) return;
        const next = [...otp];
        next[index] = v;
        setOtp(next);
        setOtpError('');
        if (v && index < 5) otpRefs.current[index + 1]?.focus();
        if (index === 5 && v && next.every((d) => d !== '')) handleVerifyOtp(next.join(''));
    };

    const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
    };

    const handleOtpPaste = (e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
        if (pasted.length === 6) {
            const next = pasted.split('');
            setOtp(next);
            setOtpError('');
            otpRefs.current[5]?.focus();
            handleVerifyOtp(pasted);
        }
    };

    const handleVerifyOtp = async (code: string) => {
        setOtpProcessing(true);
        setOtpError('');
        try {
            const { data } = await axios.post(route('verification.code.verify'), { code });
            if (data.step === 3) {
                setStep(3);
            } else if (data.redirect) {
                window.location.href = data.redirect;
            }
        } catch (error: any) {
            setOtpError(error?.response?.data?.message || 'Code invalide. Veuillez reessayer.');
            setOtp(['', '', '', '', '', '']);
            otpRefs.current[0]?.focus();
        } finally {
            setOtpProcessing(false);
        }
    };

    const handleOtpSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length === 6) handleVerifyOtp(code);
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        setResendCooldown(60);
        setResendSuccess(false);
        setDevOtpCode(null);
        try {
            const { data } = await axios.post(route('verification.code.resend'));
            setResendSuccess(true);
            if (data.code) setDevOtpCode(data.code);
            setOtp(['', '', '', '', '', '']);
            otpRefs.current[0]?.focus();
            window.setTimeout(() => setResendSuccess(false), 5000);
        } catch {
            setOtpError('Impossible de renvoyer le code. Veuillez reessayer.');
            setResendCooldown(0);
        }
    };

    const handleStep3 = async (e: React.FormEvent) => {
        e.preventDefault();
        setStep3Processing(true);
        setStep3Errors({});
        try {
            const { data } = await axios.post(route('shop.store.initial'), {
                name: shopName,
                city: shopCity,
                phone: shopPhone,
                address: shopAddress,
            });
            if (data.redirect) window.location.href = data.redirect;
        } catch (error: any) {
            if (error?.response?.status === 422) {
                setStep3Errors(error.response.data.errors ?? {});
            }
        } finally {
            setStep3Processing(false);
        }
    };

    const stepper = (
        <div className="mb-4 flex items-center gap-2">
            <div className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold ${step > 1 ? 'bg-emerald-500 text-white' : step === 1 ? 'bg-amber-500 text-white' : 'bg-[#d5c9b2] text-slate-700'}`}>
                {step > 1 ? '✓' : '1'}
            </div>
            <div className={`h-1 w-10 rounded-full ${step > 1 ? 'bg-emerald-400' : 'bg-[#d5c9b2]'}`} />
            <div className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold ${step > 2 ? 'bg-emerald-500 text-white' : step === 2 ? 'bg-amber-500 text-white' : 'bg-[#d5c9b2] text-slate-700'}`}>
                {step > 2 ? '✓' : '2'}
            </div>
            <div className={`h-1 w-10 rounded-full ${step > 2 ? 'bg-emerald-400' : 'bg-[#d5c9b2]'}`} />
            <div className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold ${step === 3 ? 'bg-amber-500 text-white' : 'bg-[#d5c9b2] text-slate-700'}`}>
                3
            </div>
        </div>
    );

    // ── ÉTAPE 1 ───────────────────────────────────────────────────────────
    if (step === 1) {
        return (
            <>
                <Head title="Inscription" />
                <AuthSplitLayout
                    title="Commencons par votre compte"
                    description="Entrez vos informations pour activer votre essai gratuit de 14 jours."
                    icon={<User className="size-5" />}
                    stepper={stepper}
                    sideStepLabel="Etape 1 sur 3"
                    sideTitle="Un bon demarrage change tout le reste."
                    sideDescription="Creez votre compte maintenant, puis verifiez votre email et configurez votre boutique."
                >
                    <form onSubmit={handleStep1} className="space-y-3">
                        <div>
                            <InputLabel htmlFor="name" value="Nom complet" className="text-slate-700" />
                            <TextInput id="name" value={name} className="mt-1 block w-full border border-[#cfc3ac] bg-white text-slate-900 placeholder-slate-400" autoComplete="name" isFocused onChange={(e) => setName(e.target.value)} required placeholder="Jean Dupont" />
                            <InputError message={step1Errors.name} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="email" value="Email" className="text-slate-700" />
                            <TextInput id="email" type="email" value={email} className="mt-1 block w-full border border-[#cfc3ac] bg-white text-slate-900 placeholder-slate-400" autoComplete="username" onChange={(e) => setEmail(e.target.value)} required placeholder="jean@exemple.com" />
                            <InputError message={step1Errors.email} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="country" value={countriesI18n[locale].label} className="text-slate-700" />
                            <select
                                id="country"
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-[#cfc3ac] bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            >
                                <option value="">{countriesI18n[locale].placeholder}</option>
                                {countriesI18n[locale].list.map((countryName) => (
                                    <option key={countryName} value={countryName}>{countryName}</option>
                                ))}
                            </select>
                            <InputError message={step1Errors.country} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="password" value="Mot de passe" className="text-slate-700" />
                            <div className="relative mt-1">
                                <TextInput id="password" type={showPassword ? 'text' : 'password'} value={password} className="block w-full border border-[#cfc3ac] bg-white pr-10 text-slate-900 placeholder-slate-400" autoComplete="new-password" onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700">
                                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                                </button>
                            </div>
                            <InputError message={step1Errors.password} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="password_confirmation" value={t.common.actions.confirm || "Confirmer"} le mot de passe" className="text-slate-700" />
                            <div className="relative mt-1">
                                <TextInput id="password_confirmation" type={showPasswordConfirmation ? 'text' : 'password'} value={passwordConfirmation} className="block w-full border border-[#cfc3ac] bg-white pr-10 text-slate-900 placeholder-slate-400" autoComplete="new-password" onChange={(e) => setPasswordConfirmation(e.target.value)} required placeholder="••••••••" />
                                <button type="button" onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700">
                                    {showPasswordConfirmation ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                                </button>
                            </div>
                            <InputError message={step1Errors.password_confirmation} className="mt-2" />
                        </div>
                        <div className="space-y-2 pt-1">
                            <PrimaryButton className="w-full justify-center bg-slate-900 py-2.5 text-sm normal-case tracking-normal hover:bg-slate-800" disabled={step1Processing}>
                                {step1Processing ? 'Création en cours...' : 'Continuer'}
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

    // ── ÉTAPE 2 ───────────────────────────────────────────────────────────
    if (step === 2) {
        return (
            <>
                <Head title="Verification email" />
                <AuthSplitLayout
                    title="Verifiez votre email"
                    description={`Un code a 6 chiffres a ete envoye a ${email}.`}
                    icon={<MailCheck className="size-5" />}
                    stepper={stepper}
                    sideStepLabel="Etape 2 sur 3"
                    sideTitle="Validez votre acces en toute securite."
                    sideDescription="Confirmez votre email pour activer votre espace et continuer la configuration."
                >
                    <form onSubmit={handleOtpSubmit} className="space-y-4">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <ShieldCheck className="size-4 text-amber-700" />
                            Entrez le code a 6 chiffres
                        </label>
                        <div className="flex gap-2">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => { otpRefs.current[index] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                    onPaste={index === 0 ? handleOtpPaste : undefined}
                                    disabled={otpProcessing}
                                    autoFocus={index === 0}
                                    className={`h-12 w-full rounded-lg border text-center text-xl font-semibold transition-all focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 ${otpError ? 'border-red-300 bg-red-50 text-red-700' : digit ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-[#cfc3ac] bg-white text-slate-800'}`}
                                />
                            ))}
                        </div>
                        {otpError && <p className="text-sm text-red-600">{otpError}</p>}
                        <PrimaryButton type="submit" className="w-full justify-center bg-slate-900 py-2.5 text-sm normal-case tracking-normal hover:bg-slate-800" disabled={otpProcessing || otp.join('').length < 6}>
                            {otpProcessing ? 'Verification...' : 'Verifier le code'}
                        </PrimaryButton>
                        <div className="text-center">
                            <button type="button" onClick={handleResend} disabled={resendCooldown > 0} className="text-xs text-slate-600 underline underline-offset-4 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50">
                                {resendCooldown > 0 ? `Renvoyer dans ${resendCooldown}s` : 'Renvoyer le code'}
                            </button>
                        </div>
                        {resendSuccess && <p className="text-center text-xs text-emerald-600">Nouveau code envoye avec succes.</p>}
                        {devOtpCode && (
                            <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-center text-sm font-mono font-bold text-amber-800">
                                [DEV] Code : {devOtpCode}
                            </div>
                        )}
                    </form>
                </AuthSplitLayout>
            </>
        );
    }

    // ── ÉTAPE 3 ───────────────────────────────────────────────────────────
    return (
        <>
            <Head title="Votre boutique" />
            <AuthSplitLayout
                title="Creez votre premiere boutique"
                description="Donnez un nom a votre boutique pour finaliser votre inscription."
                icon={<Store className="size-5" />}
                stepper={stepper}
                sideStepLabel="Etape 3 sur 3"
                sideTitle="Votre espace est presque pret."
                sideDescription="Ajoutez les informations de base de votre boutique. Vous pourrez tout completer plus tard."
            >
                <form onSubmit={handleStep3} className="space-y-3">
                    <div>
                        <InputLabel htmlFor="shop_name" value="Nom de la boutique" className="text-slate-700" />
                        <TextInput id="shop_name" value={shopName} className="mt-1 block w-full border border-[#cfc3ac] bg-white text-slate-900 placeholder-slate-400" isFocused onChange={(e) => setShopName(e.target.value)} required placeholder="Ma Quincaillerie" />
                        <InputError message={step3Errors.name} className="mt-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <InputLabel htmlFor="shop_city" value="Ville" className="text-slate-700" />
                            <TextInput id="shop_city" value={shopCity} className="mt-1 block w-full border border-[#cfc3ac] bg-white text-slate-900 placeholder-slate-400" onChange={(e) => setShopCity(e.target.value)} placeholder="Abidjan" />
                            <InputError message={step3Errors.city} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="shop_phone" value="Telephone" className="text-slate-700" />
                            <TextInput id="shop_phone" value={shopPhone} className="mt-1 block w-full border border-[#cfc3ac] bg-white text-slate-900 placeholder-slate-400" onChange={(e) => setShopPhone(e.target.value)} placeholder="+225 07 00 00 00" />
                            <InputError message={step3Errors.phone} className="mt-2" />
                        </div>
                    </div>
                    <div>
                        <InputLabel htmlFor="shop_address" value="Adresse (optionnel)" className="text-slate-700" />
                        <TextInput id="shop_address" value={shopAddress} className="mt-1 block w-full border border-[#cfc3ac] bg-white text-slate-900 placeholder-slate-400" onChange={(e) => setShopAddress(e.target.value)} placeholder="Rue des Palmiers, Cocody" />
                        <InputError message={step3Errors.address} className="mt-2" />
                    </div>
                    <div className="pt-1">
                        <PrimaryButton className="w-full justify-center bg-slate-900 py-2.5 text-sm normal-case tracking-normal hover:bg-slate-800" disabled={step3Processing}>
                            {step3Processing ? 'Création en cours...' : 'Lancer mon espace'}
                        </PrimaryButton>
                    </div>
                </form>
            </AuthSplitLayout>
        </>
    );
}
