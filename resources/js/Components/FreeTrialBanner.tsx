import { usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import { Clock, Zap } from 'lucide-react';
import { Link } from '@inertiajs/react';

interface SubscriptionData {
    has_subscription: boolean;
    plan_name: string | null;
    plan_slug: string | null;
    expires_at: string | null;
    status: string;
}

export default function FreeTrialBanner() {
    const { subscription } = usePage<PageProps & { subscription: SubscriptionData | null }>().props;

    // Ne pas afficher si pas d'abonnement ou si ce n'est pas le plan FREE
    if (!subscription || !subscription.has_subscription || subscription.plan_slug !== 'free') {
        return null;
    }

    // Calculer les jours restants
    const expiresAt = subscription.expires_at ? new Date(subscription.expires_at) : null;
    const now = new Date();
    const daysRemaining = expiresAt ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    // Déterminer la couleur en fonction des jours restants
    const isUrgent = daysRemaining <= 7;
    const isWarning = daysRemaining > 7 && daysRemaining <= 14;

    const bgColor = isUrgent 
        ? 'bg-gradient-to-r from-rose-500/20 to-orange-500/20 border-rose-500/30' 
        : isWarning 
        ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/30'
        : 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30';

    const textColor = isUrgent ? 'text-rose-200' : isWarning ? 'text-amber-200' : 'text-blue-200';
    const iconColor = isUrgent ? 'text-rose-300' : isWarning ? 'text-amber-300' : 'text-blue-300';

    return (
        <div className={`rounded-xl border p-4 ${bgColor}`}>
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                    <div className={`rounded-lg bg-white/10 p-2 ${iconColor}`}>
                        <Clock className="size-5" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-white">
                            Plan Gratuit - Essai {daysRemaining} jour{daysRemaining > 1 ? 's' : ''} restant{daysRemaining > 1 ? 's' : ''}
                        </h3>
                        <p className={`mt-1 text-sm ${textColor}`}>
                            {isUrgent ? (
                                <>⚠️ Votre essai gratuit se termine bientôt. Passez à un plan payant pour continuer à utiliser toutes les fonctionnalités.</>
                            ) : (
                                <>Profitez de votre essai gratuit ! Vous pouvez créer <strong>1 boutique</strong> et <strong>2 utilisateurs</strong>.</>
                            )}
                        </p>
                    </div>
                </div>
                <Link
                    href="/plans"
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-400 to-orange-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:from-amber-300 hover:to-orange-300 whitespace-nowrap shadow-lg shadow-amber-500/20"
                >
                    <Zap className="size-4" />
                    Changer de plan
                </Link>
            </div>
        </div>
    );
}
