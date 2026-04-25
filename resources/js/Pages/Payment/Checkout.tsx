import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import { ArrowLeft, Check, CreditCard, Smartphone, Building2, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

import logoWave        from '../../../images/logo-wave.jpg';
import logoOrange      from '../../../images/logo_orange_money.png';
import logoMtn         from '../../../images/logo_mtn_money.jpg';
import logoMoov        from '../../../images/logo_moov_money.png';

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
}

interface Props extends PageProps {
    plan: Plan;
    currentPlan: { name: string; slug: string } | null;
    paymentNumbers: Record<string, string>;
}

const PAYMENT_METHODS = [
    { id: 'wave',         label: 'Wave',         logo: logoWave   },
    { id: 'orange_money', label: 'Orange Money', logo: logoOrange },
    { id: 'mtn_money',    label: 'MTN Money',    logo: logoMtn    },
    { id: 'moov_money',   label: 'Moov Money',   logo: logoMoov   },
    /* { id: 'virement',     label: 'Virement bancaire', icon: '🏦' },
    { id: 'carte',        label: 'Carte bancaire',   icon: '💳' }, */
];

export default function Checkout({ plan, currentPlan, paymentNumbers = {} }: Props) {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    const yearlyPrice  = Math.round(plan.price * 12 * 0.85);
    const displayPrice = billingCycle === 'yearly' ? yearlyPrice : plan.price;
    const saving       = Math.round(plan.price * 12 - yearlyPrice);

    const { data, setData, post, processing, errors } = useForm({
        payment_method:  '',
        billing_cycle:   billingCycle,
        phone:           '',
        transaction_ref: '',
    });

    const selectedMethod = PAYMENT_METHODS.find(m => m.id === data.payment_method);
    const needsPhone = ['wave', 'orange_money', 'mtn_money', 'moov_money'].includes(data.payment_method);

    const ul = 'Illimité';
    const features = [
        plan.has_unlimited_shops   ? `${ul} boutiques`     : `${plan.max_shops} boutique${plan.max_shops > 1 ? 's' : ''}`,
        plan.has_unlimited_users   ? `${ul} utilisateurs`  : `${plan.max_users} utilisateur${plan.max_users > 1 ? 's' : ''}`,
        plan.has_unlimited_products? `${ul} produits`      : `${plan.max_products} produit${plan.max_products > 1 ? 's' : ''}`,
        plan.max_depots === 0      ? 'Sans dépôt'
            : plan.has_unlimited_depots ? `${ul} dépôts`
            : `${plan.max_depots} dépôt${plan.max_depots > 1 ? 's' : ''}`,
        'Ventes & caisse',
        'Gestion des achats',
        'Rapports & statistiques',
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setData('billing_cycle', billingCycle);
        post(`/plans/${plan.id}/process`);
    };

    // Plan gratuit → activation directe
    if (plan.price === 0) {
        return (
            <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-white">Activer le plan gratuit</h2>}>
                <Head title="Plan gratuit" />
                <div className="mx-auto max-w-md space-y-6">
                    <Link href="/plans" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition">
                        <ArrowLeft className="size-4" /> Retour aux plans
                    </Link>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center space-y-4">
                        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/20">
                            <Check className="size-7 text-emerald-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Plan {plan.name}</h2>
                        <p className="text-slate-400">Aucun paiement requis. Activez votre plan immédiatement.</p>
                        <form method="POST" action={`/plans/${plan.id}/process`}>
                            <input type="hidden" name="_token" value={document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? ''} />
                            <input type="hidden" name="payment_method" value="wave" />
                            <input type="hidden" name="billing_cycle" value="monthly" />
                            <button type="submit" className="w-full rounded-xl bg-amber-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-amber-200">
                                Activer gratuitement
                            </button>
                        </form>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-white">Paiement</h2>}>
            <Head title={`Paiement — ${plan.name}`} />

            <div className="mx-auto max-w-5xl space-y-6">
                {/* Retour */}
                <Link href="/plans" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition">
                    <ArrowLeft className="size-4" /> Retour aux plans
                </Link>

                {/* Upgrade warning */}
                {currentPlan && currentPlan.slug !== plan.slug && (
                    <div className="flex items-start gap-3 rounded-xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm text-amber-200">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        <span>Vous passez du plan <strong>{currentPlan.name}</strong> au plan <strong>{plan.name}</strong>. Votre abonnement actuel sera remplacé après confirmation du paiement.</span>
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-5">

                    {/* ── Récapitulatif du plan ── */}
                    <aside className="lg:col-span-2 space-y-4">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-widest text-amber-200">Plan sélectionné</p>
                                <h3 className="mt-1 text-2xl font-bold text-white">{plan.name}</h3>
                                {plan.description && <p className="mt-1 text-sm text-slate-400">{plan.description}</p>}
                            </div>

                            {/* Cycle de facturation */}
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Cycle de facturation</p>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => { setBillingCycle('monthly'); setData('billing_cycle', 'monthly'); }}
                                        className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition ${billingCycle === 'monthly' ? 'border-amber-300 bg-amber-300/10 text-amber-200' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}
                                    >
                                        Mensuel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setBillingCycle('yearly'); setData('billing_cycle', 'yearly'); }}
                                        className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition ${billingCycle === 'yearly' ? 'border-amber-300 bg-amber-300/10 text-amber-200' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}
                                    >
                                        Annuel <span className="text-xs text-emerald-400">−15%</span>
                                    </button>
                                </div>
                                {billingCycle === 'yearly' && (
                                    <p className="text-xs text-emerald-400">Économie de {saving.toLocaleString('fr-FR')} FCFA/an</p>
                                )}
                            </div>

                            {/* Prix */}
                            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-400">Montant {billingCycle === 'yearly' ? '(annuel)' : '(mensuel)'}</span>
                                    <span className="text-lg font-bold text-white">{displayPrice.toLocaleString('fr-FR')} FCFA</span>
                                </div>
                                {billingCycle === 'yearly' && (
                                    <p className="text-xs text-right text-slate-500 line-through">{(plan.price * 12).toLocaleString('fr-FR')} FCFA</p>
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

                        {/* Sécurité */}
                        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-400">
                            <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
                            Paiement sécurisé. Votre abonnement est activé après vérification manuelle dans quelques secondes.
                        </div>
                    </aside>

                    {/* ── Formulaire de paiement ── */}
                    <div className="lg:col-span-3">
                        <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <CreditCard className="size-5 text-amber-200" />
                                Mode de paiement
                            </h3>

                            {/* Choix du moyen de paiement */}
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                {PAYMENT_METHODS.map(method => (
                                    <button
                                        key={method.id}
                                        type="button"
                                        onClick={() => setData('payment_method', method.id)}
                                        className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-medium transition ${
                                            data.payment_method === method.id
                                                ? 'border-amber-300 bg-amber-300/10 text-amber-200'
                                                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                                        }`}
                                    >
                                        <img
                                            src={method.logo}
                                            alt={method.label}
                                            className="h-8 w-auto object-contain"
                                        />
                                        {method.label}
                                    </button>
                                ))}
                            </div>
                            {errors.payment_method && <p className="text-xs text-red-400">{errors.payment_method}</p>}

                            {/* Instructions selon le mode */}
                            {selectedMethod && (
                                <div className="rounded-xl border border-blue-400/20 bg-blue-400/10 p-4 text-sm text-blue-200 space-y-2">
                                    <p className="font-semibold flex items-center gap-2">
                                        <Smartphone className="size-4" />
                                        Instructions de paiement
                                    </p>
                                    {paymentNumbers[selectedMethod.id] ? (
                                        <p>
                                            {needsPhone ? 'Envoyez au' : 'Coordonnées'} :{' '}
                                            <strong className="text-white">{paymentNumbers[selectedMethod.id]}</strong>
                                        </p>
                                    ) : (
                                        <p className="text-amber-200">Contactez le support pour obtenir les coordonnées de paiement.</p>
                                    )}
                                    <p>Montant : <strong className="text-white">{displayPrice.toLocaleString('fr-FR')} FCFA</strong></p>
                                    <p>Référence à indiquer : <strong className="text-white">BTX-{plan.id}-{Date.now().toString().slice(-6)}</strong></p>
                                </div>
                            )}

                            {/* Numéro de téléphone (mobile money) */}
                            {needsPhone && (
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-300">
                                        Numéro de téléphone utilisé <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        value={data.phone}
                                        onChange={e => setData('phone', e.target.value)}
                                        placeholder="ex: +221 77 000 00 00"
                                        className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-300/50 focus:outline-none focus:ring-1 focus:ring-amber-300/50"
                                    />
                                    {errors.phone && <p className="text-xs text-red-400">{errors.phone}</p>}
                                </div>
                            )}

                            {/* Référence de transaction */}
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-slate-300">
                                    Référence / ID de transaction
                                    <span className="ml-1 text-xs text-slate-500">(facultatif mais recommandé)</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.transaction_ref}
                                    onChange={e => setData('transaction_ref', e.target.value)}
                                    placeholder="ex: TXN-123456789"
                                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-300/50 focus:outline-none focus:ring-1 focus:ring-amber-300/50"
                                />
                                {errors.transaction_ref && <p className="text-xs text-red-400">{errors.transaction_ref}</p>}
                            </div>

                            {/* Bouton soumettre */}
                            <button
                                type="submit"
                                disabled={processing || !data.payment_method}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing ? (
                                    <><Loader2 className="size-4 animate-spin" /> Traitement…</>
                                ) : (
                                    <>
                                        <Building2 className="size-4" />
                                        Confirmer — {displayPrice.toLocaleString('fr-FR')} FCFA
                                    </>
                                )}
                            </button>

                            <p className="text-center text-xs text-slate-500">
                                En confirmant, vous acceptez nos conditions d'utilisation. L'abonnement sera activé après vérification dans quelques secondes.
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
