import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { AlertTriangle, Download, Eye } from 'lucide-react';
import { useRoute } from '@/utils/route';
import { useLocale } from '@/contexts/LocaleContext';
import { Figures, money, Period, PeriodFilters, PeriodPicker, periodQuery, Trend } from '@/Components/ShopsOverview/shared';

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
    period: Period;
    filters: PeriodFilters;
}

export default function ShopsOverview({ rows, totals, period, filters }: Props) {
    const route = useRoute();
    const { t } = useLocale();
    const o = t.shopsOverview;

    // L'export et le détail reprennent la période affichée, pas celle en cours de saisie.
    const exportUrl = `${route('shops.overview.export')}?${periodQuery(period)}`;
    const detailUrl = (row: Row) => `${route('shops.overview.show', { shop: row.id })}?${periodQuery(period)}`;
    const open = (row: Row) => router.visit(detailUrl(row));

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
                <PeriodPicker
                    url={route('shops.overview')}
                    period={period}
                    filters={filters}
                    actions={
                        <a
                            href={exportUrl}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
                        >
                            <Download className="size-4" /> {o.export}
                        </a>
                    }
                />

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
                                        <th className="px-2 py-3"><span className="sr-only">{o.details}</span></th>
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
                                            <td className="px-2 py-3 text-right">
                                                <span className="inline-flex rounded-lg p-1.5 text-amber-600 dark:text-amber-300" aria-hidden="true">
                                                    <Eye className="size-4" />
                                                </span>
                                            </td>
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
                                            <td />
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
                                        {!card.isTotal && <Eye className="size-4 shrink-0 text-amber-600 dark:text-amber-300" />}
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
