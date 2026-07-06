import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import {
    ArrowLeft, Check, CreditCard, Smartphone, Building2,
    Loader2, ShieldCheck, AlertTriangle, Zap, RefreshCw,
    CheckCircle2, XCircle,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import LemonSqueezyPayment from '@/Components/LemonSqueezyPayment';
import PaddlePayment from '@/Components/PaddlePayment';
import { useLocale } from '@/contexts/LocaleContext';

import logoWave   from '../../../images/logo-wave.jpg';
import logoOrange from '../../../images/logo_orange_money.png';
import logoMtn    from '../../../images/logo_mtn_money.jpg';
import logoMoov   from '../../../images/logo_moov_money.png';

/* ─────────────────────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────────────────────── */

interface Plan {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    price_eur: string;
    max_shops: number;
    max_users: number;
    max_products: number;
    max_depots: number;
    has_unlimited_shops: boolean;
    has_unlimited_users: boolean;
    has_unlimited_products: boolean;
    has_unlimited_depots: boolean;
    is_active?: boolean;
}

interface Props extends PageProps {
    plan: Plan;
    currentPlan: { name: string; slug: string } | null;
    paymentNumbers: Record<string, string>;
    currency: string;
    isSandbox: boolean;
}

type PaymentMode = 'pawapay' | 'jeko' | 'lemonsqueezy' | 'paddle' | 'manual';
type PawaPayStatus = 'idle' | 'pending' | 'completed' | 'failed';
type JekoStatus = 'idle' | 'redirecting' | 'failed';

interface Country {
    name: string;
    flag: string;
    currency: string;
    dialCode: string;
}

/* ─────────────────────────────────────────────────────────────────────────────
   PawaPay correspondents catalogue
   Codes: https://docs.pawapay.cloud/#tag/Deposits
───────────────────────────────────────────────────────────────────────────── */

interface Correspondent {
    id: string;
    label: string;
    country: string;
    currency: string;
    logo: string | null;
}

const COUNTRIES: Country[] = [
    { name: 'Sénégal',       flag: '🇸🇳', currency: 'XOF', dialCode: '+221' },
    { name: "Côte d'Ivoire", flag: '🇨🇮', currency: 'XOF', dialCode: '+225' },
    { name: 'Burkina Faso',  flag: '🇧🇫', currency: 'XOF', dialCode: '+226' },
    { name: 'Bénin',         flag: '🇧🇯', currency: 'XOF', dialCode: '+229' },
    { name: 'Ghana',         flag: '🇬🇭', currency: 'GHS', dialCode: '+233' },
];

const CORRESPONDENTS: Correspondent[] = [
    { id: 'ORANGE_SEN',     label: 'Orange Money',     country: 'Sénégal',       currency: 'XOF', logo: logoOrange },
    { id: 'FREE_SEN',       label: 'Free Money',       country: 'Sénégal',       currency: 'XOF', logo: null       },
    { id: 'ORANGE_CIV',     label: 'Orange Money',     country: "Côte d'Ivoire", currency: 'XOF', logo: logoOrange },
    { id: 'MTN_MOMO_CIV',   label: 'MTN Mobile Money', country: "Côte d'Ivoire", currency: 'XOF', logo: logoMtn    },
    { id: 'MOOV_BFA',       label: 'Moov Money',       country: 'Burkina Faso',  currency: 'XOF', logo: logoMoov   },
    { id: 'MTN_MOMO_BEN',   label: 'MTN Mobile Money', country: 'Bénin',         currency: 'XOF', logo: logoMtn    },
    { id: 'MOOV_BEN',       label: 'Moov Money',       country: 'Bénin',         currency: 'XOF', logo: logoMoov   },
    { id: 'MTN_MOMO_GHA',   label: 'MTN Mobile Money', country: 'Ghana',         currency: 'GHS', logo: logoMtn    },
    { id: 'VODAFONE_GHA',   label: 'Vodafone Cash',    country: 'Ghana',         currency: 'GHS', logo: null       },
    { id: 'AIRTELTIGO_GHA', label: 'AirtelTigo Money', country: 'Ghana',         currency: 'GHS', logo: null       },
];

// Jèko payment methods
const JEKO_METHODS = [
    { id: 'wave',   label: 'Wave',          logo: logoWave   },
    { id: 'orange', label: 'Orange Money',  logo: logoOrange },
    { id: 'mtn',    label: 'MTN',           logo: logoMtn    },
    { id: 'moov',   label: 'Moov Money',    logo: logoMoov   },
];

// Manual fallback methods (Wave manual + virement) — "wave" has no fixed label, it's translated at render time
const MANUAL_METHODS = [
    { id: 'wave',         label: null as string | null, logo: logoWave   },
    { id: 'orange_money', label: 'Orange Money',         logo: logoOrange },
    { id: 'mtn_money',    label: 'MTN Money',            logo: logoMtn    },
    { id: 'moov_money',   label: 'Moov Money',           logo: logoMoov   },
];

/* ─────────────────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────────────────── */

function getCsrfToken(): string {
    return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────────────────────── */

export default function Checkout({ plan, currentPlan, paymentNumbers = {}, currency = 'XOF', isSandbox = false, auth }: Props) {
    const { t } = useLocale();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [paymentMode, setPaymentMode] = useState<PaymentMode>('paddle');

    // PawaPay state — étape 1 : pays, étape 2 : opérateur
    const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
    const [correspondent, setCorrespondent] = useState('');
    const [localNumber, setLocalNumber] = useState('');
    const [pawaPayStatus, setPawaPayStatus] = useState<PawaPayStatus>('idle');
    const [depositId, setDepositId] = useState<string | null>(null);
    const [pawaPayError, setPawaPayError] = useState('');
    const [initiating, setInitiating] = useState(false);
    const [simulating, setSimulating] = useState(false);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Jèko payment state
    const [jekoMethod, setJekoMethod] = useState('');
    const [jekoInitiating, setJekoInitiating] = useState(false);
    const [jekoError, setJekoError] = useState('');
    const [jekoStatus, setJekoStatus] = useState<JekoStatus>('idle');

    // Manual payment state
    const [manualMethod, setManualMethod] = useState('');
    const [phone, setPhone] = useState('');
    const [transactionRef, setTransactionRef] = useState('');
    const [submittingManual, setSubmittingManual] = useState(false);
    const [manualSuccess, setManualSuccess] = useState(false);

    // Pricing
    const isLocalCurrency = ['XOF', 'FCFA', 'GNF', 'MRU', 'SLL'].includes(currency);
    const basePrice    = isLocalCurrency
        ? Number(plan.price)
        : parseFloat(plan.price_eur?.replace(/[^0-9.]/g, '') || String(plan.price));
    const currencyLabel = isLocalCurrency ? currency : '€';
    const yearlyPrice   = Math.round(basePrice * 10);
    const displayPrice  = billingCycle === 'yearly' ? yearlyPrice : basePrice;
    const saving        = Math.round(basePrice * 12 - yearlyPrice);

    const formatPrice = (val: number) =>
        isLocalCurrency
            ? val.toLocaleString('fr-FR')
            : val.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

    // Features list — kept in sync with Plans/Index.tsx's getPlanFeatures()
    const features = [
        plan.has_unlimited_shops    ? t.plans.features.unlimitedShops    : t.plans.features.shopsCount(plan.max_shops),
        plan.has_unlimited_users    ? t.plans.features.unlimitedUsers    : t.plans.features.usersCount(plan.max_users),
        plan.has_unlimited_products ? t.plans.features.unlimitedProducts : t.plans.features.productsCount(plan.max_products),
        plan.max_depots === 0       ? t.plans.features.noDepot
            : plan.has_unlimited_depots ? t.plans.features.unlimitedDepots
            : t.plans.features.depotsCount(plan.max_depots),
        t.plans.features.salesAndPos,
        t.plans.features.purchaseManagement,
        t.plans.features.reportsAndStats,
        ...(['growth', 'pro', 'enterprise'].includes(plan.slug) ? [t.plans.features.aiAgent] : []),
    ];

    // Countries that have at least one correspondent matching the shop currency (fallback to XOF)
    const targetCurrency = CORRESPONDENTS.some(c => c.currency === currency) ? currency : 'XOF';
    const availableCountries = COUNTRIES.filter(co =>
        co.currency === targetCurrency && CORRESPONDENTS.some(c => c.country === co.name)
    );

    // Operators for the selected country
    const countryOperators = selectedCountry
        ? CORRESPONDENTS.filter(c => c.country === selectedCountry.name)
        : [];

    /* ── PawaPay polling ──────────────────────────────────────────────── */

    useEffect(() => {
        if (pawaPayStatus === 'pending' && depositId) {
            pollRef.current = setInterval(async () => {
                try {
                    const res = await axios.get(`/pawapay/status/${depositId}`, {
                        headers: { 'X-CSRF-TOKEN': getCsrfToken() },
                    });
                    const { status, subscriptionActivated } = res.data;

                    if (status === 'COMPLETED' && subscriptionActivated) {
                        clearInterval(pollRef.current!);
                        setPawaPayStatus('completed');
                        // Redirect to confirmation after a brief moment
                        setTimeout(() => {
                            window.location.href = `/${auth.user?.code_user}/dashboard`;
                        }, 1500);
                    } else if (status === 'FAILED' || status === 'DUPLICATE_IGNORED') {
                        clearInterval(pollRef.current!);
                        setPawaPayStatus('failed');
                        setPawaPayError('Le paiement a échoué ou a été annulé. Veuillez réessayer.');
                    }
                } catch {
                    // Ignore network errors during polling
                }
            }, 3000);
        }

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [pawaPayStatus, depositId]);

    /* ── PawaPay submit ───────────────────────────────────────────────── */

    const handlePawaPaySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!correspondent || !localNumber) return;

        // Build full E.164 MSISDN: dial code digits + local number digits
        const msisdn = (selectedCountry?.dialCode ?? '') + localNumber;

        setInitiating(true);
        setPawaPayError('');

        try {
            const res = await axios.post(`/pawapay/initiate/${plan.slug}`, {
                billing_cycle:  billingCycle,
                correspondent,
                msisdn,
                currency,
            }, {
                headers: {
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Content-Type': 'application/json',
                },
            });

            if (res.data.success) {
                setDepositId(res.data.depositId);
                setPawaPayStatus('pending');
            } else {
                setPawaPayError(res.data.message ?? 'Erreur inconnue.');
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message
                ?? err?.response?.data?.errors?.msisdn?.[0]
                ?? 'Impossible de contacter le serveur de paiement.';
            setPawaPayError(msg);
        } finally {
            setInitiating(false);
        }
    };

    /* ── Sandbox simulate ────────────────────────────────────────────── */

    const handleSimulate = async () => {
        if (!depositId) return;
        setSimulating(true);
        try {
            await axios.post(`/pawapay/simulate/${depositId}`, {}, {
                headers: { 'X-CSRF-TOKEN': getCsrfToken() },
            });
        } catch {
            // polling will pick up the status change
        } finally {
            setSimulating(false);
        }
    };

    /* ── Manual payment submit ────────────────────────────────────────── */

    /* ── Jèko submit ────────────────────────────────────────── */

    const handleJekoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!jekoMethod) return;

        setJekoInitiating(true);
        setJekoError('');

        try {
            const res = await axios.post(`/jeko/initiate/${plan.slug}`, {
                billing_cycle: billingCycle,
                payment_method: jekoMethod,
            }, {
                headers: {
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Content-Type': 'application/json',
                },
            });

            if (res.data.success && res.data.redirectUrl) {
                setJekoStatus('redirecting');
                // Redirect to Jèko payment page
                window.location.href = res.data.redirectUrl;
            } else {
                setJekoError(res.data.message ?? 'Erreur inconnue.');
                setJekoStatus('failed');
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message
                ?? err?.response?.data?.errors?.payment_method?.[0]
                ?? 'Impossible de contacter le serveur de paiement.';
            setJekoError(msg);
            setJekoStatus('failed');
        } finally {
            setJekoInitiating(false);
        }
    };

    /* ── Manual payment submit ────────────────────────────────── */

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittingManual(true);

        try {
            const response = await axios.post(`/plans/${plan.slug}/process`, {
                payment_method:  manualMethod,
                billing_cycle:   billingCycle,
                phone,
                transaction_ref: transactionRef,
            }, {
                headers: {
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 200 || response.status === 201) {
                setManualSuccess(true);
            }
        } catch (err: any) {
            console.error('Payment error:', err);
            alert(`Erreur: ${err.response?.data?.message || t.plans.checkout.manual.genericError}`);
        } finally {
            setSubmittingManual(false);
        }
    };

    /* ── Plan gratuit ─────────────────────────────────────────────────── */

    if (plan.price === 0) {
        return (
            <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t.plans.checkout.freePlanTitle}</h2>}>
                <Head title={t.plans.checkout.freePlanHeadTitle} />
                <div className="mx-auto max-w-md space-y-6">
                    <Link href="/plans" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition">
                        <ArrowLeft className="size-4" /> {t.plans.checkout.backToPlans}
                    </Link>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center space-y-4">
                        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/20">
                            <Check className="size-7 text-emerald-400" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t.plans.checkout.freePlanName(plan.name)}</h2>
                        <p className="text-slate-500 dark:text-slate-400">{t.plans.checkout.freePlanNoPaymentRequired}</p>
                        <form method="POST" action={`/plans/${plan.id}/process`}>
                            <input type="hidden" name="_token" value={getCsrfToken()} />
                            <input type="hidden" name="payment_method" value="wave" />
                            <input type="hidden" name="billing_cycle" value="monthly" />
                            <button type="submit" className="w-full rounded-xl bg-amber-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-amber-200">
                                {t.plans.checkout.activateFree}
                            </button>
                        </form>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    /* ── Main render ──────────────────────────────────────────────────── */

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t.plans.checkout.title}</h2>}>
            <Head title={`${t.plans.checkout.title} — ${plan.name}`} />

            <div className="mx-auto max-w-5xl space-y-6">
                <Link href="/plans" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition">
                    <ArrowLeft className="size-4" /> {t.plans.checkout.backToPlans}
                </Link>

                {currentPlan && currentPlan.slug !== plan.slug && (
                    <div className="flex items-start gap-3 rounded-xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm text-amber-200">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        <span>{t.plans.checkout.switchingPlanWarning(currentPlan.name, plan.name)}</span>
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-5">

                    {/* ── Récapitulatif ── */}
                    <aside className="lg:col-span-2 space-y-4">
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-5 dark:border-white/10 dark:bg-white/5">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-widest text-amber-200">{t.plans.checkout.selectedPlan}</p>
                                <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                                {plan.description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{plan.description}</p>}
                            </div>

                            {/* Cycle de facturation */}
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{t.plans.checkout.billingCycle}</p>
                                <div className="flex gap-2">
                                    {(['monthly', 'yearly'] as const).map(cycle => (
                                        <button
                                            key={cycle}
                                            type="button"
                                            onClick={() => setBillingCycle(cycle)}
                                            className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition ${billingCycle === cycle ? 'border-amber-300 bg-amber-300/10 text-amber-200' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}
                                        >
                                            {cycle === 'monthly' ? t.plans.checkout.monthly : <>{t.plans.checkout.yearly} <span className="text-xs text-emerald-400">{t.plans.checkout.twoMonthsFree}</span></>}
                                        </button>
                                    ))}
                                </div>
                                {billingCycle === 'yearly' && (
                                    <p className="text-xs text-emerald-400">{t.plans.checkout.yearlySaving(formatPrice(saving), currencyLabel)}</p>
                                )}
                            </div>

                            {/* Prix */}
                            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-500 dark:text-slate-400">{billingCycle === 'yearly' ? t.plans.checkout.amountYearly : t.plans.checkout.amountMonthly}</span>
                                    <span className="text-lg font-bold text-slate-900 dark:text-white">{formatPrice(displayPrice)} {currencyLabel}</span>
                                </div>
                                {billingCycle === 'yearly' && (
                                    <p className="text-xs text-right text-slate-500 line-through">{formatPrice(basePrice * 12)} {currencyLabel}</p>
                                )}
                                {isLocalCurrency && (
                                    <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                                        <span className="text-sm text-slate-500 dark:text-slate-400">{t.plans.checkout.inEuros}</span>
                                        <span className="text-lg font-bold text-amber-300">
                                            €{billingCycle === 'yearly'
                                                ? (parseFloat(plan.price_eur?.replace(/[^0-9.]/g, '') || '0') * 10).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                                : plan.price_eur
                                            }
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Inclus */}
                            <ul className="space-y-2 text-sm text-slate-300">
                                {features.map(f => (
                                    <li key={f} className="flex items-center gap-2">
                                        <Check className="size-4 shrink-0 text-emerald-400" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-400">
                            <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
                            {t.plans.checkout.securePaymentPaddle}
                        </div>
                    </aside>

                    {/* ── Formulaire ── */}
                    <div className="lg:col-span-3 space-y-4">

                        {/* ── Sélection du mode de paiement ── */}
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.plans.checkout.paymentModeLabel}</p>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setPaymentMode('paddle')}
                                    className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                                        paymentMode === 'paddle'
                                            ? 'border-amber-300 bg-amber-300/10 text-amber-200'
                                            : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                                    }`}
                                >
                                    <CreditCard className="inline size-4 mr-2" />
                                    {t.plans.checkout.paddleCard}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentMode('manual')}
                                    className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                                        paymentMode === 'manual'
                                            ? 'border-amber-300 bg-amber-300/10 text-amber-200'
                                            : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                                    }`}
                                >
                                    <Building2 className="inline size-4 mr-2" />
                                    {t.plans.checkout.manual.title}
                                </button>
                            </div>
                        </div>

                        {/* ══════════════════ PADDLE FLOW ══════════════════ */}
                        {paymentMode === 'paddle' && (
                            <PaddlePayment plan={plan} billingCycle={billingCycle} />
                        )}

                        {/* ══════════════════ PAWAPAY FLOW (HIDDEN) ══════════════════ */}
                        {false && paymentMode === 'pawapay' && (
                            <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-6 dark:border-white/10 dark:bg-white/5">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Zap className="size-5 text-amber-300" />
                                    Paiement mobile automatique
                                </h3>

                                {/* ── Waiting for USSD ── */}
                                {pawaPayStatus === 'pending' && (
                                    <div className="flex flex-col items-center gap-4 py-8 text-center">
                                        <div className="relative">
                                            <div className="size-16 rounded-full border-4 border-amber-300/20 border-t-amber-300 animate-spin" />
                                            <Smartphone className="absolute inset-0 m-auto size-6 text-amber-300" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900 dark:text-white">Confirmation en attente</p>
                                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                Vérifiez votre téléphone et confirmez le paiement de{' '}
                                                <strong className="text-slate-900 dark:text-white">{formatPrice(displayPrice)} {currencyLabel}</strong> via USSD.
                                            </p>
                                        </div>
                                        {isSandbox && (
                                            <button
                                                type="button"
                                                onClick={handleSimulate}
                                                disabled={simulating}
                                                className="inline-flex items-center gap-2 rounded-lg border border-amber-300/40 bg-amber-300/10 px-4 py-2 text-xs font-medium text-amber-300 transition hover:bg-amber-300/20 disabled:opacity-50"
                                            >
                                                {simulating ? <Loader2 className="size-3 animate-spin" /> : <Zap className="size-3" />}
                                                Simuler la complétion (sandbox)
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => { setPawaPayStatus('idle'); setDepositId(null); }}
                                            className="text-xs text-slate-500 hover:text-slate-300 underline"
                                        >
                                            Annuler et réessayer
                                        </button>
                                    </div>
                                )}

                                {/* ── Success ── */}
                                {pawaPayStatus === 'completed' && (
                                    <div className="flex flex-col items-center gap-3 py-8 text-center">
                                        <CheckCircle2 className="size-14 text-emerald-400" />
                                        <p className="font-semibold text-slate-900 dark:text-white">Paiement confirmé !</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Redirection en cours…</p>
                                    </div>
                                )}

                                {/* ── Failed ── */}
                                {pawaPayStatus === 'failed' && (
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-300">
                                            <XCircle className="mt-0.5 size-4 shrink-0" />
                                            {pawaPayError}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => { setPawaPayStatus('idle'); setDepositId(null); setPawaPayError(''); }}
                                            className="inline-flex items-center gap-2 text-sm text-amber-300 hover:text-amber-200"
                                        >
                                            <RefreshCw className="size-4" /> Réessayer
                                        </button>
                                    </div>
                                )}

                                {/* ── Form ── */}
                                {pawaPayStatus === 'idle' && (
                                    <form onSubmit={handlePawaPaySubmit} className="space-y-6">
                                        {pawaPayError && (
                                            <div className="flex items-start gap-3 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-300">
                                                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                                                {pawaPayError}
                                            </div>
                                        )}

                                        {/* Étape 1 — Pays */}
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Étape 1 — Votre pays <span className="text-red-400">*</span>
                                            </p>
                                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                                {availableCountries.map(co => (
                                                    <button
                                                        key={co.name}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedCountry(co);
                                                            setCorrespondent('');
                                                            setLocalNumber('');
                                                        }}
                                                        className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                                                            selectedCountry?.name === co.name
                                                                ? 'border-amber-300 bg-amber-300/10 text-amber-200'
                                                                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                                                        }`}
                                                    >
                                                        <span className="text-lg leading-none">{co.flag}</span>
                                                        <span className="truncate">{co.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Étape 2 — Opérateur (visible uniquement si pays sélectionné) */}
                                        {selectedCountry && (
                                            <div className="space-y-2">
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    Étape 2 — Votre opérateur <span className="text-red-400">*</span>
                                                </p>
                                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                                    {countryOperators.map(op => (
                                                        <button
                                                            key={op.id}
                                                            type="button"
                                                            onClick={() => setCorrespondent(op.id)}
                                                            className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-3 text-xs font-medium transition ${
                                                                correspondent === op.id
                                                                    ? 'border-amber-300 bg-amber-300/10 text-amber-200'
                                                                    : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                                                            }`}
                                                        >
                                                            {op.logo ? (
                                                                <img src={op.logo} alt={op.label} className="h-7 w-auto object-contain" />
                                                            ) : (
                                                                <Smartphone className="size-6 text-slate-500 dark:text-slate-400" />
                                                            )}
                                                            {op.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Numéro (visible si opérateur sélectionné) */}
                                        {correspondent && (
                                            <div className="space-y-1.5">
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    Numéro Mobile Money <span className="text-red-400">*</span>
                                                </label>
                                                <div className="flex overflow-hidden rounded-xl border border-white/15 bg-white/5 focus-within:border-amber-300/50 focus-within:ring-1 focus-within:ring-amber-300/50">
                                                    <span className="flex items-center gap-1.5 border-r border-white/10 bg-white/10 px-3 text-sm font-medium text-slate-300 select-none whitespace-nowrap">
                                                        {selectedCountry?.flag} {selectedCountry?.dialCode}
                                                    </span>
                                                    <input
                                                        type="tel"
                                                        value={localNumber}
                                                        onChange={e => setLocalNumber(e.target.value.replace(/[^0-9]/g, ''))}
                                                        placeholder="77 000 00 00"
                                                        className="flex-1 bg-transparent px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
                                                    />
                                                </div>
                                                <p className="text-xs text-slate-500">Un push USSD sera envoyé sur ce numéro pour confirmer.</p>
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={initiating || !correspondent || !localNumber}
                                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {initiating ? (
                                                <><Loader2 className="size-4 animate-spin" /> Initiation…</>
                                            ) : (
                                                <><Zap className="size-4" /> Payer {formatPrice(displayPrice)} {currencyLabel}</>
                                            )}
                                        </button>

                                        <p className="text-center text-xs text-slate-500">
                                            Powered by <span className="font-semibold text-slate-400">PawaPay</span> — push USSD sécurisé.
                                        </p>
                                    </form>
                                )}
                            </div>
                        )}

                        {/* ══════════════════ JÈKO FLOW (HIDDEN) ══════════════════ */}
                        {false && paymentMode === 'jeko' && (
                            <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-6 dark:border-white/10 dark:bg-white/5">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Zap className="size-5 text-amber-300" />
                                    Paiement Jèko
                                </h3>

                                {jekoStatus === 'failed' && (
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-300">
                                            <XCircle className="mt-0.5 size-4 shrink-0" />
                                            {jekoError}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => { setJekoStatus('idle'); setJekoError(''); setJekoMethod(''); }}
                                            className="inline-flex items-center gap-2 text-sm text-amber-300 hover:text-amber-200"
                                        >
                                            <RefreshCw className="size-4" /> Réessayer
                                        </button>
                                    </div>
                                )}

                                {jekoStatus === 'idle' && (
                                    <form onSubmit={handleJekoSubmit} className="space-y-6">
                                        <div className="rounded-xl border border-blue-400/20 bg-blue-400/10 p-3 text-xs text-blue-200">
                                            Choisissez votre opérateur mobile et confirmez le paiement sur la page Jèko.
                                        </div>

                                        {/* Méthode de paiement Jèko */}
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Opérateur mobile</p>
                                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                                                {JEKO_METHODS.map(method => (
                                                    <button
                                                        key={method.id}
                                                        type="button"
                                                        onClick={() => setJekoMethod(method.id)}
                                                        className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-medium transition ${
                                                            jekoMethod === method.id
                                                                ? 'border-amber-300 bg-amber-300/10 text-amber-200'
                                                                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                                                        }`}
                                                    >
                                                        <img src={method.logo} alt={method.label} className="h-6 w-auto object-contain" />
                                                        {method.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={jekoInitiating || !jekoMethod}
                                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {jekoInitiating ? (
                                                <><Loader2 className="size-4 animate-spin" /> Redirection…</>
                                            ) : (
                                                <><Zap className="size-4" /> Payer {formatPrice(displayPrice)} {currencyLabel}</>
                                            )}
                                        </button>

                                        <p className="text-center text-xs text-slate-500">
                                            Powered by <span className="font-semibold text-slate-400">Jèko</span> — paiement sécurisé.
                                        </p>
                                    </form>
                                )}

                                {jekoStatus === 'redirecting' && (
                                    <div className="flex flex-col items-center gap-4 py-8 text-center">
                                        <div className="relative">
                                            <div className="size-16 rounded-full border-4 border-amber-300/20 border-t-amber-300 animate-spin" />
                                            <Zap className="absolute inset-0 m-auto size-6 text-amber-300" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900 dark:text-white">Redirection vers Jèko</p>
                                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Veuillez patienter…</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ══════════════════ LEMONSQUEEZY FLOW (HIDDEN) ══════════════════ */}
                        {false && paymentMode === 'lemonsqueezy' && (
                            <LemonSqueezyPayment plan={plan} />
                        )}

                        {/* ══════════════════ MANUAL FLOW — SUCCESS ══════════════════ */}
                        {paymentMode === 'manual' && manualSuccess && (
                            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-6 text-center space-y-4">
                                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-400/20">
                                    <CheckCircle2 className="size-8 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{t.plans.checkout.manual.successTitle}</p>
                                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t.plans.checkout.manual.successMessage}</p>
                                </div>
                                <a
                                    href={`/${auth.user?.code_user}/dashboard`}
                                    className="inline-flex items-center gap-2 rounded-xl bg-amber-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-amber-200"
                                >
                                    {t.plans.checkout.manual.goToDashboard}
                                    <ArrowLeft className="size-4 rotate-180" />
                                </a>
                            </div>
                        )}

                        {/* ══════════════════ MANUAL FLOW ══════════════════ */}
                        {paymentMode === 'manual' && !manualSuccess && (
                            <form onSubmit={handleManualSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 space-y-6 dark:border-white/10 dark:bg-white/5">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                    <CreditCard className="size-5 text-amber-200" />
                                    {t.plans.checkout.manual.title}
                                </h3>

                                <div className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-3 text-xs text-amber-200">
                                    {t.plans.checkout.manual.intro}
                                </div>

                                {/* Méthode */}
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    {MANUAL_METHODS.map(method => {
                                        const label = method.label ?? t.plans.checkout.manual.waveManual;
                                        return (
                                            <button
                                                key={method.id}
                                                type="button"
                                                onClick={() => setManualMethod(method.id)}
                                                className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-medium transition ${
                                                    manualMethod === method.id
                                                        ? 'border-amber-300 bg-amber-300/10 text-amber-200'
                                                        : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                                                }`}
                                            >
                                                <img src={method.logo} alt={label} className="h-8 w-auto object-contain" />
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Instructions */}
                                {manualMethod && (
                                    <div className="rounded-xl border border-blue-400/20 bg-blue-400/10 p-4 text-sm text-blue-200 space-y-2">
                                        <p className="font-semibold flex items-center gap-2">
                                            <Smartphone className="size-4" /> {t.plans.checkout.manual.instructions}
                                        </p>
                                        {paymentNumbers[manualMethod] ? (
                                            <p>{t.plans.checkout.manual.sendTo} <strong className="text-slate-900 dark:text-white">{paymentNumbers[manualMethod]}</strong></p>
                                        ) : (
                                            <p className="text-amber-200">{t.plans.checkout.manual.contactSupportForDetails}</p>
                                        )}
                                        <p>{t.plans.checkout.manual.amountColon} <strong className="text-slate-900 dark:text-white">{formatPrice(displayPrice)} {currencyLabel}</strong></p>
                                        <p>{t.plans.checkout.manual.referenceColon} <strong className="text-slate-900 dark:text-white">BTX-{plan.id}-{Date.now().toString().slice(-6)}</strong></p>
                                    </div>
                                )}

                                {/* Téléphone */}
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t.plans.checkout.manual.phoneUsedLabel}</label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        placeholder="ex: +221 77 000 00 00"
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-300/50 focus:outline-none focus:ring-1 focus:ring-amber-300/50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder-slate-500"
                                    />
                                </div>

                                {/* Référence */}
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {t.plans.checkout.manual.transactionRefLabel}
                                        <span className="ml-1 text-xs text-slate-500">{t.plans.checkout.manual.optionalRecommended}</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={transactionRef}
                                        onChange={e => setTransactionRef(e.target.value)}
                                        placeholder="ex: TXN-123456789"
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-300/50 focus:outline-none focus:ring-1 focus:ring-amber-300/50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder-slate-500"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submittingManual || !manualMethod}
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {submittingManual ? (
                                        <><Loader2 className="size-4 animate-spin" /> {t.plans.checkout.manual.processing}</>
                                    ) : (
                                        <><Building2 className="size-4" /> {t.plans.checkout.manual.confirmButton(`${formatPrice(displayPrice)} ${currencyLabel}`)}</>
                                    )}
                                </button>

                                <p className="text-center text-xs text-slate-500">
                                    {t.plans.checkout.manual.activationNote}
                                </p>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
