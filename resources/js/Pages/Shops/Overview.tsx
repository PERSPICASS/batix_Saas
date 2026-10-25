import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { AlertTriangle, ChevronRight, TrendingDown, TrendingUp } from 'lucide-react';
import { useRoute } from '@/utils/route';
import { useLocale } from '@/contexts/LocaleContext';

type PeriodKey = 'today' | 'week' | 'month' | 'year' | 'custom';

interface Figures {
    revenue: number;
    count: number;
    average_basket: number;
    gross_margin: number;
    expenses: number;
    // Situation à ce jour : absents de la période de comparaison.
    receivables?: number;
    stock_value?: number;
    low_stock?: number;
}

interface Row {
    id: number;
    name: string;
    currency: string;
    currency_symbol: string;
    is_active: boolean;
    figures: Figures;
    previous: Figures;
}

interface Total {
    currency: string;
    currency_symbol: string;
    figures: Figures;
    previous: Figures;
}

interface Props {
    rows: Row[];
    totals: Total[];
    period: { key: PeriodKey; start: string; end: string; previous_start: string; previous_end: string };
    filters: { period?: PeriodKey; date_from?: string; date_to?: string };
}

const PERIODS: PeriodKey[] = ['today', 'week', 'month', 'year', 'custom'];

/** Le montant arrondi à l'unité : à cette échelle, les centimes brouillent la comparaison. */
function money(amount: number, symbol: string): string {
    return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount)} ${symbol}`;
}

function shortDate(iso: string, locale: string): string {
    return new Date(`${iso}T00:00:00`).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Évolution par rapport à la période précédente ; rien quand il n'y a pas de base. */
function Trend({ current, previous }: { current: number; previous: number }) {
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

export default function ShopsOverview({ rows, totals, period, filters }: Props) {
    const route = useRoute();
    const { t, locale } = useLocale();
    const o = t.shopsOverview;

    const [dateFrom, setDateFrom] = useState(filters.date_from ?? period.start);
    const [dateTo, setDateTo] = useState(filters.date_to ?? period.end);
    const [showCustom, setShowCustom] = useState(period.key === 'custom');

    const choose = (key: PeriodKey) => {
        if (key === 'custom') {
            setShowCustom(true);
            return;
        }
        setShowCustom(false);
        router.get(route('shops.overview'), { period: key }, { preserveScroll: true });
    };

    const applyCustom = () => router.get(route('shops.overview'), { period: 'custom', date_from: dateFrom, date_to: dateTo }, { preserveScroll: true });

    // Cliquer une boutique la rend active et ouvre son tableau de bord (même mécanisme que
    // le sélecteur de l'en-tête : `?shop=`).
    const open = (row: Row) => router.visit(`${route('dashboard')}?shop=${row.id}`);

    const metrics: { key: keyof Figures; label: string; money: boolean; trend: boolean }[] = [
        { key: 'revenue', label: o.columns.revenue, money: true, trend: true },
        { key: 'count', label: o.columns.count, money: false, trend: true },
        { key: 'average_basket', label: o.columns.averageBasket, money: true, trend: true },
        { key: 'gross_margin', label: o.columns.grossMargin, money: true, trend: true },
        { key: 'expenses', label: o.columns.expenses, money: true, trend: false },
        { key: 'receivables', label: o.columns.receivables, money: true, trend: false },
        { key: 'stock_value', label: o.columns.stockValue, money: true, trend: false },
    ];

    const value = (f: Figures, key: keyof Figures, symbol: string, isMoney: boolean) =>
        isMoney ? money(Number(f[key] ?? 0), symbol) : new Intl.NumberFormat('fr-FR').format(Number(f[key] ?? 0));

    const lowStock = (count?: number) =>
        count ? (
            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="size-3.5" /> {count}
            </span>
        ) : (
            <span className="text-slate-400">0</span>
        );

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-slate-900 dark:text-white">{o.title}</h1>}>
            <Head title={o.title} />

            <div className="space-y-6">
                {/* Période */}
                <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex flex-wrap items-center gap-2">
                        {PERIODS.map((key) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => choose(key)}
                                aria-pressed={(showCustom ? 'custom' : period.key) === key}
                                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                                    (showCustom ? 'custom' : period.key) === key
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

                {rows.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">{o.empty}</p>
                ) : (
                    <>
                        {/* Ordinateur : un tableau, une ligne par boutique, puis un total par devise. */}
                        <div className="hidden overflow-x-auto rounded-2xl border border-gray-200 bg-white lg:block dark:border-white/10 dark:bg-white/5">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 text-left text-xs uppercase text-slate-500 dark:border-white/10 dark:text-slate-400">
                                        <th className="px-4 py-3">{o.columns.shop}</th>
                                        {metrics.map((m) => <th key={m.key} className="px-4 py-3 text-right">{m.label}</th>)}
                                        <th className="px-4 py-3 text-right">{o.columns.lowStock}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row) => (
                                        <tr key={row.id} onClick={() => open(row)} title={o.openShop}
                                            className="cursor-pointer border-b border-gray-100 transition hover:bg-gray-50 dark:border-white/5 dark:hover:bg-white/5">
                                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                                                {row.name}
                                                {!row.is_active && <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-normal text-slate-600 dark:bg-white/10 dark:text-slate-300">{o.inactive}</span>}
                                            </td>
                                            {metrics.map((m) => (
                                                <td key={m.key} className="whitespace-nowrap px-4 py-3 text-right text-slate-700 dark:text-slate-200">
                                                    <div>{value(row.figures, m.key, row.currency_symbol, m.money)}</div>
                                                    {m.trend && <Trend current={Number(row.figures[m.key])} previous={Number(row.previous[m.key])} />}
                                                </td>
                                            ))}
                                            <td className="px-4 py-3 text-right">{lowStock(row.figures.low_stock)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    {totals.map((total) => (
                                        <tr key={total.currency} className="bg-gray-50 font-semibold text-slate-900 dark:bg-white/5 dark:text-white">
                                            <td className="px-4 py-3">{totals.length > 1 ? o.totalIn(total.currency_symbol) : o.total}</td>
                                            {metrics.map((m) => (
                                                <td key={m.key} className="whitespace-nowrap px-4 py-3 text-right">
                                                    <div>{value(total.figures, m.key, total.currency_symbol, m.money)}</div>
                                                    {m.trend && <Trend current={Number(total.figures[m.key])} previous={Number(total.previous[m.key])} />}
                                                </td>
                                            ))}
                                            <td className="px-4 py-3 text-right">{lowStock(total.figures.low_stock)}</td>
                                        </tr>
                                    ))}
                                </tfoot>
                            </table>
                        </div>

                        {/* Mobile et tablette : une carte par boutique. */}
                        <div className="space-y-3 lg:hidden">
                            {[...rows.map((row) => ({ ...row, isTotal: false })), ...totals.map((total) => ({
                                ...total, id: `total-${total.currency}`, name: totals.length > 1 ? o.totalIn(total.currency_symbol) : o.total, is_active: true, isTotal: true,
                            }))].map((card) => (
                                <button
                                    key={card.id}
                                    type="button"
                                    disabled={card.isTotal}
                                    onClick={() => !card.isTotal && open(card as Row)}
                                    className={`block w-full rounded-2xl border p-4 text-left ${card.isTotal
                                        ? 'border-amber-300/40 bg-amber-300/10'
                                        : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10'}`}
                                >
                                    <div className="mb-3 flex items-center justify-between gap-2">
                                        <span className="font-semibold text-slate-900 dark:text-white">
                                            {card.name}
                                            {!card.is_active && <span className="ml-2 text-xs font-normal text-slate-500">{o.inactive}</span>}
                                        </span>
                                        {!card.isTotal && <ChevronRight className="size-4 shrink-0 text-slate-400" />}
                                    </div>
                                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                        {metrics.map((m) => (
                                            <div key={m.key} className="min-w-0">
                                                <dt className="text-xs text-slate-500 dark:text-slate-400">{m.label}</dt>
                                                <dd className="font-medium text-slate-900 dark:text-white">
                                                    {value(card.figures, m.key, card.currency_symbol, m.money)}{' '}
                                                    {m.trend && <Trend current={Number(card.figures[m.key])} previous={Number(card.previous[m.key])} />}
                                                </dd>
                                            </div>
                                        ))}
                                        <div>
                                            <dt className="text-xs text-slate-500 dark:text-slate-400">{o.columns.lowStock}</dt>
                                            <dd className="font-medium">{lowStock(card.figures.low_stock)}</dd>
                                        </div>
                                    </dl>
                                </button>
                            ))}
                        </div>
                    </>
                )}

                <p className="text-xs text-slate-500 dark:text-slate-400">{o.definitions}</p>
            </div>
        </AuthenticatedLayout>
    );
}
