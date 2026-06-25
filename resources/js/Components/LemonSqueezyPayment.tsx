import { CreditCard, Loader2, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';

interface Plan {
    id: number;
    name: string;
    slug: string;
    price: number;
    price_eur: string;
}

interface LemonSqueezyPaymentProps {
    plan: Plan;
}

export default function LemonSqueezyPayment({ plan }: LemonSqueezyPaymentProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCheckout = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.post(
                `/lemonsqueezy/checkout/${plan.slug}`,
                {
                    redirect_url: window.location.href,
                }
            );

            if (response.data.checkout_url) {
                window.location.href = response.data.checkout_url;
            } else {
                setError('URL de paiement invalide');
            }
        } catch (err: any) {
            setError(
                err.response?.data?.error ||
                'Erreur lors de la création du paiement'
            );
            console.error('LemonSqueezy checkout error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4 rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-green-900">LemonSqueezy</h3>
            </div>

            <p className="text-sm text-green-700">
                Paiement sécurisé avec carte bancaire ou autres moyens de paiement
            </p>

            {error && (
                <div className="flex gap-2 rounded-md bg-red-100 p-3 text-sm text-red-700">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            <div className="rounded-md bg-white p-3">
                <p className="text-sm font-medium text-gray-900">
                    {plan.price_eur}
                </p>
                <p className="text-xs text-gray-500">Abonnement mensuel</p>
            </div>

            <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700 disabled:bg-gray-400"
            >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Redirection en cours...
                    </span>
                ) : (
                    'Payer avec LemonSqueezy'
                )}
            </button>

            <p className="text-center text-xs text-gray-500">
                Paiement sécurisé • Aucune commission supplémentaire
            </p>
        </div>
    );
}
