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
    const { locale, t } = useLocale();
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
            setOtpError(error?.response?.data?.message || t.auth.messages.invalidCode);
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
            setOtpError(t.auth.messages.resendError);
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
            <div className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold ${step > 1 ? 'bg-emerald-500 text-white' : step === 1 ? 'bg-amber-300 text-slate-900' : 'bg-gray-200 text-slate-700'}`}>
                {step > 1 ? '✓' : '1'}
            </div>
            <div className={`h-1 w-10 rounded-full ${step > 1 ? 'bg-emerald-400' : 'bg-gray-200'}`} />
            <div className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold ${step > 2 ? 'bg-emerald-500 text-white' : step === 2 ? 'bg-amber-300 text-slate-900' : 'bg-gray-200 text-slate-700'}`}>
                {step > 2 ? '✓' : '2'}
            </div>
            <div className={`h-1 w-10 rounded-full ${step > 2 ? 'bg-emerald-400' : 'bg-gray-200'}`} />
            <div className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold ${step === 3 ? 'bg-amber-300 text-slate-900' : 'bg-gray-200 text-slate-700'}`}>
                3
            </div>
        </div>
    );

    // ── ÉTAPE 1 ───────────────────────────────────────────────────────────
    if (step === 1) {
        return (
            <>
                <Head title={t.auth.pages.register.step1.title} />
                <AuthSplitLayout
                    title={t.auth.pages.register.step1.heading}
                    description={t.auth.pages.register.step1.description}
                    icon={<User className="size-5" />}
                    stepper={stepper}
                    sideStepLabel={t.auth.pages.register.step1.sideLabel}
                    sideTitle={t.auth.pages.register.step1.sideTitle}
                    sideDescription={t.auth.pages.register.step1.sideDescription}
                >
                    <form onSubmit={handleStep1} className="space-y-3">
                        <div>
                            <InputLabel htmlFor="name" value={t.auth.form.fullName} className="text-slate-700" />
                            <TextInput id="name" value={name} className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 text-slate-900 placeholder-slate-400 focus:border-terre-400 focus:ring-terre-400/20" autoComplete="name" isFocused onChange={(e) => setName(e.target.value)} required placeholder={t.auth.form.fullNamePlaceholder} />
                            <InputError message={step1Errors.name} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="email" value={t.auth.form.email} className="text-slate-700" />
                            <TextInput id="email" type="email" value={email} className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 text-slate-900 placeholder-slate-400 focus:border-terre-400 focus:ring-terre-400/20" autoComplete="username" onChange={(e) => setEmail(e.target.value)} required placeholder={t.auth.form.emailPlaceholder} />
                            <InputError message={step1Errors.email} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="country" value={countriesI18n[locale].label} className="text-slate-700" />
                            <select
                                id="country"
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-slate-900 shadow-sm focus:border-terre-400 focus:outline-none focus:ring-1 focus:ring-terre-400"
                            >
                                <option value="">{countriesI18n[locale].placeholder}</option>
                                {countriesI18n[locale].list.map((countryName) => (
                                    <option key={countryName} value={countryName}>{countryName}</option>
                                ))}
                            </select>
                            <InputError message={step1Errors.country} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="password" value={t.auth.form.password} className="text-slate-700" />
                            <div className="relative mt-1">
                                <TextInput id="password" type={showPassword ? 'text' : 'password'} value={password} className="block w-full rounded-xl border border-gray-200 bg-gray-50 pr-10 text-slate-900 placeholder-slate-400 focus:border-terre-400 focus:ring-terre-400/20" autoComplete="new-password" onChange={(e) => setPassword(e.target.value)} required placeholder={t.auth.form.passwordPlaceholder} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700">
                                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                                </button>
                            </div>
                            <InputError message={step1Errors.password} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="password_confirmation" value={t.auth.form.passwordConfirm} className="text-slate-700" />
                            <div className="relative mt-1">
                                <TextInput id="password_confirmation" type={showPasswordConfirmation ? 'text' : 'password'} value={passwordConfirmation} className="block w-full rounded-xl border border-gray-200 bg-gray-50 pr-10 text-slate-900 placeholder-slate-400 focus:border-terre-400 focus:ring-terre-400/20" autoComplete="new-password" onChange={(e) => setPasswordConfirmation(e.target.value)} required placeholder={t.auth.form.passwordPlaceholder} />
                                <button type="button" onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700">
                                    {showPasswordConfirmation ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                                </button>
                            </div>
                            <InputError message={step1Errors.password_confirmation} className="mt-2" />
                        </div>
                        <div className="space-y-2 pt-1">
                            <PrimaryButton className="w-full justify-center rounded-xl !bg-amber-300 py-2.5 text-sm font-bold normal-case tracking-normal !text-slate-900 shadow-md hover:!bg-amber-400 focus:!ring-amber-300" disabled={step1Processing}>
                                {step1Processing ? t.auth.actions.creating : t.auth.actions.register}
                            </PrimaryButton>
                            <div className="text-center">
                                <Link href={route('login')} className="text-xs text-slate-600 underline underline-offset-4 transition hover:text-terre-700 sm:text-sm">
                                    {t.auth.links.alreadyAccount}
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
                <Head title={t.auth.pages.register.step2.title} />
                <AuthSplitLayout
                    title={t.auth.pages.register.step2.heading}
                    description={t.auth.pages.register.step2.description.replace('{email}', email)}
                    icon={<MailCheck className="size-5" />}
                    stepper={stepper}
                    sideStepLabel={t.auth.pages.register.step2.sideLabel}
                    sideTitle={t.auth.pages.register.step2.sideTitle}
                    sideDescription={t.auth.pages.register.step2.sideDescription}
                >
                    <form onSubmit={handleOtpSubmit} className="space-y-4">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <ShieldCheck className="size-4 text-amber-700" />
                            {t.auth.messages.enterCode}
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
                                    className={`h-12 w-full rounded-lg border text-center text-xl font-semibold transition-all focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 ${otpError ? 'border-red-300 bg-red-50 text-red-700' : digit ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-gray-200 bg-gray-50 text-slate-800'}`}
                                />
                            ))}
                        </div>
                        {otpError && <p className="text-sm text-red-600">{otpError}</p>}
                        <PrimaryButton type="submit" className="w-full justify-center rounded-xl !bg-amber-300 py-2.5 text-sm font-bold normal-case tracking-normal !text-slate-900 shadow-md hover:!bg-amber-400 focus:!ring-amber-300" disabled={otpProcessing || otp.join('').length < 6}>
                            {otpProcessing ? t.auth.actions.verifying : t.auth.actions.verifyCode}
                        </PrimaryButton>
                        <div className="text-center">
                            <button type="button" onClick={handleResend} disabled={resendCooldown > 0} className="text-xs text-slate-600 underline underline-offset-4 transition hover:text-terre-700 disabled:cursor-not-allowed disabled:opacity-50">
                                {resendCooldown > 0 ? t.auth.actions.resendIn.replace('{seconds}', resendCooldown.toString()) : t.auth.actions.resendCode}
                            </button>
                        </div>
                        {resendSuccess && <p className="text-center text-xs text-emerald-600">{t.auth.messages.codeResent}</p>}
                        {devOtpCode && (
                            <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-center text-sm font-mono font-bold text-amber-800">
                                {t.auth.messages.devCode.replace('{code}', devOtpCode)}
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
            <Head title={t.auth.pages.register.step3.title} />
            <AuthSplitLayout
                title={t.auth.pages.register.step3.heading}
                description={t.auth.pages.register.step3.description}
                icon={<Store className="size-5" />}
                stepper={stepper}
                sideStepLabel={t.auth.pages.register.step3.sideLabel}
                sideTitle={t.auth.pages.register.step3.sideTitle}
                sideDescription={t.auth.pages.register.step3.sideDescription}
            >
                <form onSubmit={handleStep3} className="space-y-3">
                    <div>
                        <InputLabel htmlFor="shop_name" value={t.auth.shop.nameLabel} className="text-slate-700" />
                        <TextInput id="shop_name" value={shopName} className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 text-slate-900 placeholder-slate-400 focus:border-terre-400 focus:ring-terre-400/20" isFocused onChange={(e) => setShopName(e.target.value)} required placeholder={t.auth.shop.namePlaceholder} />
                        <InputError message={step3Errors.name} className="mt-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <InputLabel htmlFor="shop_city" value={t.auth.shop.cityLabel} className="text-slate-700" />
                            <TextInput id="shop_city" value={shopCity} className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 text-slate-900 placeholder-slate-400 focus:border-terre-400 focus:ring-terre-400/20" onChange={(e) => setShopCity(e.target.value)} placeholder={t.auth.shop.registerCityPlaceholder} />
                            <InputError message={step3Errors.city} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="shop_phone" value={t.auth.shop.phoneLabel} className="text-slate-700" />
                            <TextInput id="shop_phone" value={shopPhone} className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 text-slate-900 placeholder-slate-400 focus:border-terre-400 focus:ring-terre-400/20" onChange={(e) => setShopPhone(e.target.value)} placeholder={t.auth.shop.registerPhonePlaceholder} />
                            <InputError message={step3Errors.phone} className="mt-2" />
                        </div>
                    </div>
                    <div>
                        <InputLabel htmlFor="shop_address" value={t.auth.shop.addressLabel} className="text-slate-700" />
                        <TextInput id="shop_address" value={shopAddress} className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 text-slate-900 placeholder-slate-400 focus:border-terre-400 focus:ring-terre-400/20" onChange={(e) => setShopAddress(e.target.value)} placeholder={t.auth.shop.registerAddressPlaceholder} />
                        <InputError message={step3Errors.address} className="mt-2" />
                    </div>
                    <div className="pt-1">
                        <PrimaryButton className="w-full justify-center rounded-xl !bg-amber-300 py-2.5 text-sm font-bold normal-case tracking-normal !text-slate-900 shadow-md hover:!bg-amber-400 focus:!ring-amber-300" disabled={step3Processing}>
                            {step3Processing ? t.auth.actions.creating : t.auth.actions.launchSpace}
                        </PrimaryButton>
                    </div>
                </form>
            </AuthSplitLayout>
        </>
    );
}
