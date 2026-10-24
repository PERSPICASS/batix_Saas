import { Package, TrendingDown, TrendingUp } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';

const STYLES: Record<string, { bg: string; text: string; icon: typeof Package }> = {
    in: { bg: 'bg-green-500/20', text: 'text-green-300', icon: TrendingUp },
    out: { bg: 'bg-red-500/20', text: 'text-red-300', icon: TrendingDown },
    transfer: { bg: 'bg-blue-500/20', text: 'text-blue-300', icon: Package },
    adjustment: { bg: 'bg-amber-500/20', text: 'text-amber-300', icon: Package },
    sale: { bg: 'bg-purple-500/20', text: 'text-purple-300', icon: TrendingDown },
    return: { bg: 'bg-cyan-500/20', text: 'text-cyan-300', icon: TrendingUp },
    return_defective: { bg: 'bg-cyan-500/20', text: 'text-cyan-300', icon: TrendingUp },
};

/** Type d'un mouvement de stock, suivi de son motif s'il a été saisi à la main. */
export default function StockMovementTypeBadge({ type, reason }: { type: string; reason?: string | null }) {
    const { t } = useLocale();
    const style = STYLES[type] ?? STYLES.adjustment;
    const Icon = style.icon;
    const label = t.stocks.types[type as keyof typeof t.stocks.types] ?? type;
    const reasonLabel = reason ? t.stocks.reasons[reason as keyof typeof t.stocks.reasons] ?? reason : null;

    return (
        <span className="inline-flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${style.bg} ${style.text}`}>
                <Icon className="size-3" />
                {label}
            </span>
            {reasonLabel && <span className="text-xs text-slate-500 dark:text-slate-400">{reasonLabel}</span>}
        </span>
    );
}
