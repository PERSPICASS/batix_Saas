import { usePage, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import { AlertTriangle, Zap } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';

interface SubscriptionData {
    has_subscription: boolean;
    in_grace_period: boolean;
    grace_period_ends_at: string | null;
}

export default function SubscriptionGraceBanner() {
    const { subscription } = usePage<PageProps & { subscription: SubscriptionData | null }>().props;
    const { t } = useLocale();

    if (!subscription || !subscription.has_subscription || !subscription.in_grace_period || !subscription.grace_period_ends_at) {
        return null;
    }

    const graceEndsAt = new Date(subscription.grace_period_ends_at);
    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((graceEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    const isUrgent = daysRemaining <= 5;

    const bgColor = isUrgent
        ? 'bg-gradient-to-r from-rose-500/20 to-orange-500/20 border-rose-500/30'
        : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/30';
    const textColor = isUrgent ? 'text-rose-200' : 'text-amber-200';
    const iconColor = isUrgent ? 'text-rose-300' : 'text-amber-300';

    return (
        <div className={`rounded-xl border p-4 ${bgColor}`}>
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                    <div className={`rounded-lg bg-white/10 p-2 ${iconColor}`}>
                        <AlertTriangle className="size-5" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-white">
                            {t.subscriptionGraceBanner.title(daysRemaining)}
                        </h3>
                        <p className={`mt-1 text-sm ${textColor}`}>
                            {isUrgent ? t.subscriptionGraceBanner.urgentText : t.subscriptionGraceBanner.normalText}
                        </p>
                    </div>
                </div>
                <Link
                    href="/plans"
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-400 to-orange-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:from-amber-300 hover:to-orange-300 whitespace-nowrap shadow-lg shadow-amber-500/20"
                >
                    <Zap className="size-4" />
                    {t.subscriptionGraceBanner.cta}
                </Link>
            </div>
        </div>
    );
}
