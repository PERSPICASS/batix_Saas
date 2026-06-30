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

interface PaddlePaymentProps {
    plan: Plan;
    billingCycle?: 'monthly' | 'yearly';
}

export default function PaddlePayment({ plan, billingCycle = 'monthly' }: PaddlePaymentProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Calculate annual price (10 months of payment, 2 free)
    const monthlyPrice = parseFloat(plan.price_eur?.replace(/[^0-9.]/g, '') || '0');
    const annualPrice = Math.round(monthlyPrice * 10 * 100) / 100;
    const displayPrice = billingCycle === 'yearly' ? annualPrice : monthlyPrice;
    const formatPrice = (val: number) => val.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const handleCheckout = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.post(`/paddle/checkout/${plan.slug}`, {
                billing_cycle: billingCycle,
            });

            if (response.data.checkout_url) {
                // Redirect to Paddle checkout
                window.location.href = response.data.checkout_url;
            } else {
                setError('Failed to create checkout');
            }
        } catch (err: any) {
            setError(
                err.response?.data?.error ||
                'Failed to create checkout'
            );
            console.error('Paddle checkout error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Paddle</h3>
            </div>

            <p className="text-sm text-blue-700">
                Secure payment with Paddle. Multiple payment methods accepted.
            </p>

            {error && (
                <div className="flex gap-2 rounded-md bg-red-100 p-3 text-sm text-red-700">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            <div className="rounded-md bg-white p-3">
                <p className="text-sm font-medium text-gray-900">
                    €{formatPrice(displayPrice)}
                </p>
                <p className="text-xs text-gray-500">
                    {billingCycle === 'yearly' ? 'Annual subscription (2 months free)' : 'Monthly subscription'}
                </p>
                {billingCycle === 'yearly' && monthlyPrice > 0 && (
                    <p className="text-xs text-gray-400 line-through">
                        €{formatPrice(monthlyPrice * 12)}
                    </p>
                )}
            </div>

            <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
            >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Redirecting to checkout...
                    </span>
                ) : (
                    `Pay €${formatPrice(displayPrice)}`
                )}
            </button>

            <p className="text-center text-xs text-gray-500">
                Secure payment • No extra fees
            </p>
        </div>
    );
}
