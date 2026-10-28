import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { ReactNode } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRightLeft, FileDown } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useRoute } from '@/utils/route';
import { useLocale } from '@/contexts/LocaleContext';
import { Figures, money, Period, PeriodFilters, PeriodPicker, periodQuery, Trend } from '@/Components/ShopsOverview/shared';

interface Report {
    figures: Figures;
    previous: Figures;
    split: { counter: number; invoices: number };
    timeline: { unit: 'day' | 'month'; current: { label: string; revenue: number }[]; previous: { label: string; revenue: number }[] };
    products: { product_id: number | null; name: string; category: string | null; quantity: number; revenue: number; margin: number }[];
    categories: { name: string | null; revenue: number }[];
    sellers: { name: string | null; count: number; revenue: number }[];
    payment_methods: { method: string; count: number; revenue: number }[];
    expenses: { category: string; count: number; amount: number }[];
    low_stock: { id: number; name: string; stock: number; min: number }[];
    debtors: { id: number; name: string | null; owed: number }[];
}

interface Props {
    shop: { id: number; name: string; currency: string; currency_symbol: string; is_active: boolean };
    report: Report;
    period: Period;
    filters: PeriodFilters;
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
            <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
            {children}
        </section>
    );
}

function Kpi({ label, value, trend, hint, tone }: { label: string; value: string; trend?: ReactNode; hint?: ReactNode; tone?: 'warning' | 'negative' }) {
    const color = tone === 'warning' ? 'text-amber-600 dark:text-amber-300' : tone === 'negative' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white';

    return (
        <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
            <p className={`mt-1 break-words text-base font-bold sm:text-xl ${color}`}>{value}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                {trend}
                {hint}
            </div>
        </div>
    );
}

/** Une barre proportionnelle à la plus grande valeur de la liste. */
function ShareBar({ value, max }: { value: number; max: number }) {
    return (
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <div className="h-full rounded-full bg-amber-400" style={{ width: `${max > 0 ? Math.max((value / max) * 100, 2) : 0}%` }} />
        </div>
    );
}

export default function OverviewShow({ shop, report, period, filters }: Props) {
    const route = useRoute();
    const { t, locale } = useLocale();
    const o = t.shopsOverview;
    const d = o.detail;
    const symbol = shop.currency_symbol;
    const f = report.figures;
    const p = report.previous;
    const fmt = (amount: number) => money(amount, symbol);
    const count = (n: number) => new Intl.NumberFormat('fr-FR').format(n);

    const result = f.gross_margin - f.expenses;
    const previousResult = p.gross_margin - p.expenses;

    // Les deux périodes ont le même nombre de cases (jours, ou mois) : on les superpose case à case.
    const chart = report.timeline.current.map((point, index) => ({
        label: report.timeline.unit === 'month'
            ? new Date(`${point.label}-01T00:00:00`).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', { month: 'short' })
            : new Date(`${point.label}T00:00:00`).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', { day: '2-digit', month: '2-digit' }),
        current: point.revenue,
        previous: report.timeline.previous[index]?.revenue ?? 0,
    }));

    const maxCategory = Math.max(0, ...report.categories.map((c) => c.revenue));
    const maxSeller = Math.max(0, ...report.sellers.map((s) => s.revenue));
    const maxMethod = Math.max(0, ...report.payment_methods.map((m) => m.revenue));
    const maxExpense = Math.max(0, ...report.expenses.map((e) => e.amount));

    const empty = <p className="text-sm text-slate-500 dark:text-slate-400">{d.nothing}</p>;

    return (
        <AuthenticatedLayout header={<h1 className="truncate text-xl font-semibold text-slate-900 dark:text-white">{shop.name}</h1>}>
            <Head title={`${shop.name} — ${o.title}`} />

            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link
                        href={`${route('shops.overview')}?${periodQuery(period)}`}
                        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                    >
                        <ArrowLeft className="size-4" /> {d.back}
                    </Link>
                    <div className="flex flex-wrap gap-2">
                    {/* Le PDF de la période affichée, à imprimer ou à transmettre. */}
                    <a
                        href={`${route('shops.overview.pdf', { shop: shop.id })}?${periodQuery(period)}`}
                        target="_blank"
                        rel="noopener"
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
                    >
                        <FileDown className="size-4" /> {d.pdf}
                    </a>
                    {/* Même mécanisme que le sélecteur de l'en-tête : `?shop=` rend la boutique active. */}
                    <Link
                        href={`${route('dashboard')}?shop=${shop.id}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
                    >
                        <ArrowRightLeft className="size-4" /> {d.switchTo}
                    </Link>
                    </div>
                </div>

                <PeriodPicker url={route('shops.overview.show', { shop: shop.id })} period={period} filters={filters} />

                {/* Indicateurs */}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                    <Kpi label={o.columns.revenue} value={fmt(f.revenue)} trend={<Trend current={f.revenue} previous={p.revenue} />}
                        hint={report.split.invoices !== 0 ? `${d.counter} ${fmt(report.split.counter)} · ${d.invoices} ${fmt(report.split.invoices)}` : undefined} />
                    <Kpi label={o.columns.count} value={count(f.count)} trend={<Trend current={f.count} previous={p.count} />} />
                    <Kpi label={o.columns.averageBasket} value={fmt(f.average_basket)} trend={<Trend current={f.average_basket} previous={p.average_basket} />} />
                    <Kpi label={o.columns.grossMargin} value={fmt(f.gross_margin)} trend={<Trend current={f.gross_margin} previous={p.gross_margin} />} tone={f.gross_margin < 0 ? 'negative' : undefined} />
                    <Kpi label={o.columns.expenses} value={fmt(f.expenses)} />
                    <Kpi label={d.result} value={fmt(result)} trend={<Trend current={result} previous={previousResult} />} tone={result < 0 ? 'negative' : undefined} />
                    <Kpi label={o.columns.receivables} value={fmt(f.receivables ?? 0)} tone={(f.receivables ?? 0) > 0 ? 'warning' : undefined} />
                    {(f.customer_credit ?? 0) > 0 && <Kpi label={o.columns.customerCredit} value={fmt(f.customer_credit ?? 0)} />}
                    <Kpi label={o.columns.stockValue} value={fmt(f.stock_value ?? 0)} />
                    <Kpi label={o.columns.lowStock} value={count(f.low_stock ?? 0)} tone={(f.low_stock ?? 0) > 0 ? 'warning' : undefined} />
                </div>

                {/* Évolution du CA, superposée à la période précédente */}
                <Panel title={d.revenueOverTime}>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chart} barGap={2}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} interval="preserveStartEnd" minTickGap={12} />
                                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} width={60}
                                    tickFormatter={(v: number) => new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(v)} />
                                <Tooltip
                                    formatter={(value: number | undefined) => fmt(Number(value ?? 0))}
                                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                                    labelStyle={{ color: '#cbd5e1' }}
                                    cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                                />
                                <Legend wrapperStyle={{ color: '#cbd5e1', fontSize: 12 }} />
                                <Bar dataKey="previous" name={d.previousPeriod} fill="#60a5fa" radius={[3, 3, 0, 0]} />
                                <Bar dataKey="current" name={d.currentPeriod} fill="#fbbf24" radius={[3, 3, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Panel>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <Panel title={d.topProducts}>
                        {report.products.length === 0 ? empty : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                                            <th className="pb-2">{d.product}</th>
                                            <th className="pb-2 text-right">{d.quantity}</th>
                                            <th className="pb-2 text-right">{d.revenue}</th>
                                            <th className="pb-2 text-right">{d.margin}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.products.map((product) => (
                                            <tr key={`${product.product_id}-${product.name}`} className="border-t border-gray-100 dark:border-white/5">
                                                <td className="py-2 pr-3">
                                                    <p className="text-slate-900 dark:text-white">{product.name}</p>
                                                    {product.category && <p className="text-xs text-slate-500 dark:text-slate-400">{product.category}</p>}
                                                </td>
                                                <td className="py-2 text-right text-slate-700 dark:text-slate-200">{count(product.quantity)}</td>
                                                <td className="whitespace-nowrap py-2 text-right text-slate-700 dark:text-slate-200">{fmt(product.revenue)}</td>
                                                <td className={`whitespace-nowrap py-2 text-right ${product.margin < 0 ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>{fmt(product.margin)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Panel>

                    <Panel title={d.categories}>
                        {report.categories.length === 0 ? empty : (
                            <ul className="space-y-3">
                                {report.categories.map((category) => (
                                    <li key={category.name ?? ''} className="text-sm">
                                        <div className="flex justify-between gap-3">
                                            <span className="truncate text-slate-700 dark:text-slate-200">{category.name ?? d.noCategory}</span>
                                            <span className="whitespace-nowrap text-slate-900 dark:text-white">{fmt(category.revenue)}</span>
                                        </div>
                                        <ShareBar value={category.revenue} max={maxCategory} />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Panel>

                    <Panel title={d.sellers}>
                        {report.sellers.length === 0 ? empty : (
                            <ul className="space-y-3">
                                {report.sellers.map((seller, index) => (
                                    <li key={`${seller.name}-${index}`} className="text-sm">
                                        <div className="flex justify-between gap-3">
                                            <span className="truncate text-slate-700 dark:text-slate-200">
                                                {seller.name ?? <span className="italic text-slate-500">{d.unknownSeller}</span>}
                                                <span className="ml-2 text-xs text-slate-500">{count(seller.count)} {d.sales}</span>
                                            </span>
                                            <span className="whitespace-nowrap text-slate-900 dark:text-white">{fmt(seller.revenue)}</span>
                                        </div>
                                        <ShareBar value={seller.revenue} max={maxSeller} />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Panel>

                    <Panel title={d.paymentMethods}>
                        {report.payment_methods.length === 0 ? empty : (
                            <ul className="space-y-3">
                                {report.payment_methods.map((method) => (
                                    <li key={method.method} className="text-sm">
                                        <div className="flex justify-between gap-3">
                                            <span className="text-slate-700 dark:text-slate-200">
                                                {d.methods[method.method] ?? method.method}
                                                <span className="ml-2 text-xs text-slate-500">{count(method.count)} {d.sales}</span>
                                            </span>
                                            <span className="whitespace-nowrap text-slate-900 dark:text-white">{fmt(method.revenue)}</span>
                                        </div>
                                        <ShareBar value={method.revenue} max={maxMethod} />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Panel>

                    <Panel title={d.expenses}>
                        {report.expenses.length === 0 ? empty : (
                            <ul className="space-y-3">
                                {report.expenses.map((expense) => (
                                    <li key={expense.category} className="text-sm">
                                        <div className="flex justify-between gap-3">
                                            <span className="truncate text-slate-700 dark:text-slate-200">{expense.category}</span>
                                            <span className="whitespace-nowrap text-slate-900 dark:text-white">{fmt(expense.amount)}</span>
                                        </div>
                                        <ShareBar value={expense.amount} max={maxExpense} />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Panel>

                    <Panel title={d.debtors}>
                        {report.debtors.length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-400">{d.none}</p> : (
                            <ul className="divide-y divide-gray-100 dark:divide-white/5">
                                {report.debtors.map((debtor) => (
                                    <li key={debtor.id} className="flex justify-between gap-3 py-2 text-sm">
                                        <span className="truncate text-slate-700 dark:text-slate-200">{debtor.name ?? d.unknownCustomer}</span>
                                        <span className="whitespace-nowrap font-medium text-amber-600 dark:text-amber-300">{fmt(debtor.owed)}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Panel>

                    <Panel title={d.lowStock}>
                        {report.low_stock.length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-400">{d.none}</p> : (
                            <ul className="divide-y divide-gray-100 dark:divide-white/5">
                                {report.low_stock.map((product) => (
                                    <li key={product.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                                        <span className="flex min-w-0 items-center gap-2 text-slate-700 dark:text-slate-200">
                                            <AlertTriangle className="size-3.5 shrink-0 text-amber-500" />
                                            <span className="truncate">{product.name}</span>
                                        </span>
                                        <span className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                                            {d.stock} <span className={product.stock <= 0 ? 'font-semibold text-rose-500' : 'font-semibold text-slate-900 dark:text-white'}>{product.stock}</span>
                                            {' / '}{d.threshold} {product.min}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Panel>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">{o.definitions}</p>
            </div>
        </AuthenticatedLayout>
    );
}
