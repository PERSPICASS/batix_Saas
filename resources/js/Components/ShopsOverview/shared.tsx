import { router } from '@inertiajs/react';
import { ReactNode, useState } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';

/** Ce que partagent la liste « Mes boutiques » et le détail d'une boutique. */

export type PeriodKey = 'today' | 'week' | 'month' | 'year' | 'custom';

export interface Period {
    key: PeriodKey;
    start: string;
    end: string;
    previous_start: string;
    previous_end: string;
}

export interface PeriodFilters {
    period?: PeriodKey;
    date_from?: string;
    date_to?: string;
}

export interface Figures {
    revenue: number;
    count: number;
    average_basket: number;
    gross_margin: number;
    expenses: number;
    // Situation à ce jour : absents de la période de comparaison.
    receivables?: number;
    /** Les avoirs que la boutique doit encore à ses clients. */
    customer_credit?: number;
    stock_value?: number;
    low_stock?: number;
}

const PERIODS: PeriodKey[] = ['today', 'week', 'month', 'year', 'custom'];

/** Le montant arrondi à l'unité : à cette échelle, les centimes brouillent la comparaison. */
export function money(amount: number, symbol: string): string {
    return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount)} ${symbol}`;
}

export function shortDate(iso: string, locale: string): string {
    return new Date(`${iso}T00:00:00`).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Les paramètres d'URL de la période affichée, pour l'export ou un lien vers le détail. */
export function periodQuery(period: Period): string {
    return new URLSearchParams(
        period.key === 'custom' ? { period: 'custom', date_from: period.start, date_to: period.end } : { period: period.key },
    ).toString();
}

/** Évolution par rapport à la période précédente ; rien quand il n'y a pas de base. */
export function Trend({ current, previous }: { current: number; previous: number }) {
    if (!previous) {
        return null;
    }
    const change = Math.round(((current - previous) / Math.abs(previous)) * 100);
    const up = change >= 0;
    const Icon = up ? TrendingUp : TrendingDown;

    return (
        <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${up ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            <Icon className="size-3" />
            {up ? '+' : ''}{change} %
        </span>
    );
}

/**
 * Le choix de la période, avec la plage affichée et celle de comparaison. `url` est la page à
 * recharger ; `actions` se placent à droite (export, lien…).
 */
export function PeriodPicker({ url, period, filters, actions }: { url: string; period: Period; filters: PeriodFilters; actions?: ReactNode }) {
    const { t, locale } = useLocale();
    const o = t.shopsOverview;

    const [dateFrom, setDateFrom] = useState(filters.date_from ?? period.start);
    const [dateTo, setDateTo] = useState(filters.date_to ?? period.end);
    const [showCustom, setShowCustom] = useState(period.key === 'custom');
    const selected = showCustom ? 'custom' : period.key;

    const choose = (key: PeriodKey) => {
        if (key === 'custom') {
            setShowCustom(true);
            return;
        }
        setShowCustom(false);
        router.get(url, { period: key }, { preserveScroll: true });
    };

    const applyCustom = () => router.get(url, { period: 'custom', date_from: dateFrom, date_to: dateTo }, { preserveScroll: true });

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
            <div className="flex flex-wrap items-center gap-2">
                {actions && <div className="order-last flex flex-wrap gap-2 sm:ml-auto">{actions}</div>}
                {PERIODS.map((key) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => choose(key)}
                        aria-pressed={selected === key}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                            selected === key
                                ? 'bg-amber-300 text-slate-950'
                                : 'border border-gray-300 text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10'
                        }`}
                    >
                        {o.periods[key]}
                    </button>
                ))}
            </div>

            {showCustom && (
                <div className="mt-3 flex flex-wrap items-end gap-3">
                    <label className="text-sm text-slate-600 dark:text-slate-300">
                        {o.from}
                        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                            className="mt-1 block rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200" />
                    </label>
                    <label className="text-sm text-slate-600 dark:text-slate-300">
                        {o.to}
                        <input type="date" value={dateTo} min={dateFrom} onChange={(e) => setDateTo(e.target.value)}
                            className="mt-1 block rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200" />
                    </label>
                    <button type="button" onClick={applyCustom} disabled={!dateFrom || !dateTo}
                        className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50">
                        {o.apply}
                    </button>
                </div>
            )}

            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                {o.range(shortDate(period.start, locale), shortDate(period.end, locale))}
                {' · '}
                {o.comparedWith(shortDate(period.previous_start, locale), shortDate(period.previous_end, locale))}
            </p>
        </div>
    );
}
