import { usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import { AlertCircle, Check, X } from 'lucide-react';

interface SubscriptionLimits {
    has_subscription: boolean;
    plan_name: string | null;
    plan_slug: string | null;
    max_shops: number;
    max_users: number;
    unlimited_shops: boolean;
    unlimited_users: boolean;
    current_shops: number;
    current_users: number;
    can_create_shop: boolean;
    can_create_user: boolean;
    remaining_shops: number;
    remaining_users: number;
    expires_at: string | null;
    status: string;
}

interface SubscriptionBannerProps {
    type?: 'shops' | 'users';
    className?: string;
}

export default function SubscriptionBanner({ type, className = '' }: SubscriptionBannerProps) {
    const { subscription } = usePage<PageProps & { subscription: SubscriptionLimits | null }>().props;

    if (!subscription || !subscription.has_subscription) {
        return (
            <div className={`rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 ${className}`}>
                <div className="flex items-start gap-3">
                    <AlertCircle className="size-5 text-rose-400" />
                    <div className="flex-1">
                        <h3 className="font-semibold text-rose-200">Aucun abonnement actif</h3>
                        <p className="mt-1 text-sm text-rose-300">
                            Vous devez avoir un abonnement actif pour créer des boutiques et des utilisateurs.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const renderShopsLimit = () => {
        if (subscription.unlimited_shops) {
            return (
                <div className="flex items-center gap-2 text-sm text-emerald-400">
                    <Check className="size-4" />
                    <span>Boutiques illimitées</span>
                </div>
            );
        }

        const isNearLimit = subscription.remaining_shops <= 1 && subscription.remaining_shops > 0;
        const isAtLimit = subscription.remaining_shops === 0;

        return (
            <div className="flex items-center gap-2 text-sm">
                {isAtLimit ? (
                    <X className="size-4 text-rose-400" />
                ) : (
                    <Check className="size-4 text-emerald-400" />
                )}
                <span className={isAtLimit ? 'text-rose-300' : isNearLimit ? 'text-amber-300' : 'text-slate-300'}>
                    {subscription.current_shops} / {subscription.max_shops} boutiques utilisées
                    {subscription.remaining_shops > 0 && ` (${subscription.remaining_shops} restante${subscription.remaining_shops > 1 ? 's' : ''})`}
                </span>
            </div>
        );
    };

    const renderUsersLimit = () => {
        if (subscription.unlimited_users) {
            return (
                <div className="flex items-center gap-2 text-sm text-emerald-400">
                    <Check className="size-4" />
                    <span>Utilisateurs illimités</span>
                </div>
            );
        }

        const isNearLimit = subscription.remaining_users <= 2 && subscription.remaining_users > 0;
        const isAtLimit = subscription.remaining_users === 0;

        return (
            <div className="flex items-center gap-2 text-sm">
                {isAtLimit ? (
                    <X className="size-4 text-rose-400" />
                ) : (
                    <Check className="size-4 text-emerald-400" />
                )}
                <span className={isAtLimit ? 'text-rose-300' : isNearLimit ? 'text-amber-300' : 'text-slate-300'}>
                    {subscription.current_users} / {subscription.max_users} utilisateurs
                    {subscription.remaining_users > 0 && ` (${subscription.remaining_users} restant${subscription.remaining_users > 1 ? 's' : ''})`}
                </span>
            </div>
        );
    };

    const showWarning = (type === 'shops' && !subscription.can_create_shop) || 
                       (type === 'users' && !subscription.can_create_user);

    if (!showWarning && type) {
        return null; // Ne rien afficher si tout va bien et qu'on demande un type spécifique
    }

    return (
        <div className={`rounded-xl border border-white/10 bg-white/5 p-4 ${className}`}>
            <div className="flex items-start gap-3">
                <div className="rounded-lg bg-amber-500/20 p-2">
                    <AlertCircle className="size-4 text-amber-300" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-white">
                            Plan {subscription.plan_name}
                        </h3>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            subscription.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' :
                            subscription.status === 'trial' ? 'bg-blue-500/20 text-blue-300' :
                            'bg-slate-500/20 text-slate-300'
                        }`}>
                            {subscription.status === 'active' ? 'Actif' : 
                             subscription.status === 'trial' ? 'Essai' : subscription.status}
                        </span>
                    </div>
                    <div className="mt-3 space-y-2">
                        {(!type || type === 'shops') && renderShopsLimit()}
                        {(!type || type === 'users') && renderUsersLimit()}
                    </div>
                    {showWarning && (
                        <p className="mt-3 text-sm text-amber-300">
                            {type === 'shops' ? 
                                'Limite de boutiques atteinte. Veuillez mettre à niveau votre abonnement.' :
                                'Limite d\'utilisateurs atteinte. Veuillez mettre à niveau votre abonnement.'}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

// Hook pour accéder facilement aux limites d'abonnement
export function useSubscriptionLimits() {
    const { subscription } = usePage<PageProps & { subscription: SubscriptionLimits | null }>().props;
    return subscription;
}
