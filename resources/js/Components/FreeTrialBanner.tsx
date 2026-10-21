import { usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import { Clock, Zap } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { useLocale } from '@/contexts/LocaleContext';

interface SubscriptionData {
    has_subscription: boolean;
    plan_name: string | null;
    plan_slug: string | null;
    expires_at: string | null;
    status: string;
}

export default function FreeTrialBanner() {
    const { subscription } = usePage<PageProps & { subscription: SubscriptionData | null }>().props;
    const { t } = useLocale();

    if (!subscription || !subscription.has_subscription || subscription.plan_slug !== 'free') {
        return null;
    }

    const expiresAt = subscription.expires_at ? new Date(subscription.expires_at) : null;
    const now = new Date();
    const daysRemaining = expiresAt ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    const isUrgent = daysRemaining <= 7;
    const isWarning = daysRemaining > 7 && daysRemaining <= 14;

    const bgColor = isUrgent
        ? 'bg-gradient-to-r from-rose-100 to-orange-100 border-rose-300 dark:from-rose-500/20 dark:to-orange-500/20 dark:border-rose-500/30'
        : isWarning
        ? 'bg-gradient-to-r from-amber-100 to-orange-100 border-amber-300 dark:from-amber-500/20 dark:to-orange-500/20 dark:border-amber-500/30'
        : 'bg-gradient-to-r from-blue-100 to-purple-100 border-blue-300 dark:from-blue-500/20 dark:to-purple-500/20 dark:border-blue-500/30';

    const textColor = isUrgent ? 'text-rose-700 dark:text-rose-200' : isWarning ? 'text-amber-700 dark:text-amber-200' : 'text-blue-700 dark:text-blue-200';
    const iconColor = isUrgent ? 'text-rose-600 dark:text-rose-300' : isWarning ? 'text-amber-600 dark:text-amber-300' : 'text-blue-600 dark:text-blue-300';

    return (
        <div className={`rounded-xl border p-4 ${bgColor}`}>
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                    <div className={`rounded-lg bg-black/5 dark:bg-white/10 p-2 ${iconColor}`}>
                        <Clock className="size-5" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                            {t.freeTrialBanner.title(daysRemaining)}
                        </h3>
                        <p className={`mt-1 text-sm ${textColor}`}>
                            {isUrgent ? t.freeTrialBanner.urgentText : t.freeTrialBanner.normalText}
                        </p>
                    </div>
                </div>
                <Link
                    href="/plans"
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-400 to-orange-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:from-amber-300 hover:to-orange-300 whitespace-nowrap shadow-lg shadow-amber-500/20"
                >
                    <Zap className="size-4" />
                    {t.freeTrialBanner.cta}
                </Link>
            </div>
        </div>
    );
}
