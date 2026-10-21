import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Users,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    BarChart2,
    Target,
} from 'lucide-react';
import {
    Area,
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    ComposedChart,
} from 'recharts';
import { useLocale } from '@/contexts/LocaleContext';
import { fmtCompact, fmtMonth, fmtNumber, fmtXAF } from '@/utils/platformFormat';

// ── Types ─────────────────────────────────────────────────────────────────────
// Tous les montants sont en FCFA ; méthode de calcul : app/Services/PlatformMetrics.php

interface Kpis {
    mrr: number;
    arr: number;
    arpu: number;
    mrr_growth: number;
    churn_rate: number;
    churned_mrr: number;
    new_mrr: number;
    expansion_mrr: number;
    nrr: number;
    ltv: number;
    active_count: number;
}

interface MrrPoint {
    month: string; // « 2026-10 »
    mrr: number;
    new_mrr: number;
    expansion_mrr: number;
    churned_mrr: number;
    count: number;
}

interface ChurnPoint {
    month: string;
    churned: number;
    churn_rate: number;
}

interface RevenuePoint {
    month: string;
    revenue: number;
}

interface PlanMrr {
    name: string;
    mrr: number;
    count: number;
    color: string;
}

interface ChurnEntry {
    user: string;
    email: string;
    plan: string;
    amount: number;
    churned_at: string | null;
    reason: 'cancelled' | 'expired';
}

interface AtRiskEntry {
    user: string;
    email: string;
    plan: string;
    expires_at: string;
    days_left: number;
    amount: number;
}

interface Props {
    kpis: Kpis;
    mrr_history: MrrPoint[];
    churn_history: ChurnPoint[];
    revenue_history: RevenuePoint[];
    mrr_by_plan: PlanMrr[];
    recent_churns: ChurnEntry[];
    at_risk: AtRiskEntry[];
}

const card = 'rounded-2xl border border-gray-200 bg-white p-6 backdrop-blur-xl dark:border-white/10 dark:bg-white/5';
const row = 'flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3 dark:border-white/5 dark:bg-white/5';

// ── KPI card ──────────────────────────────────────────────────────────────────

interface KpiCardProps {
    label: string;
    value: string;
    sub?: string;
    trend?: number; // positif = bien (sauf invertTrend)
    invertTrend?: boolean;
    icon: React.ElementType;
    color: string;
    bgColor: string;
}

function KpiCard({ label, value, sub, trend, invertTrend, icon: Icon, color, bgColor }: KpiCardProps) {
    const isGood = invertTrend ? (trend ?? 0) <= 0 : (trend ?? 0) >= 0;
    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
                    <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
                    {sub && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
                </div>
                <div className={`rounded-xl ${bgColor} p-2.5 ${color}`}>
                    <Icon className="size-5" />
                </div>
            </div>
            {trend !== undefined && (
                <div className={`flex items-center gap-1 text-xs font-semibold ${isGood ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                    {trend >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                    {Math.abs(trend)}%
                </div>
            )}
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MRRDashboard({
    kpis,
    mrr_history,
    churn_history,
    revenue_history,
    mrr_by_plan,
    recent_churns,
    at_risk,
}: Props) {
    const { t, locale } = useLocale();
    const tr = t.platformAdmin.mrr;
    const common = t.platformAdmin.common;
    const statuses = t.platformAdmin.statuses;

    const xaf = (n: number) => fmtXAF(n, locale);
    const compact = (n: number) => fmtCompact(n, locale);
    const withLabel = <T extends { month: string }>(rows: T[]) =>
        rows.map((r) => ({ ...r, label: fmtMonth(r.month, locale) }));

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload?.length) return null;
        return (
            <div className="rounded-xl border border-white/10 bg-slate-900/95 p-3 text-xs shadow-xl">
                <p className="mb-1.5 font-semibold text-slate-300">{label}</p>
                {payload.map((entry: any, i: number) => (
                    <p key={i} style={{ color: entry.color }} className="flex items-center gap-2">
                        <span className="inline-block h-2 w-2 rounded-full" style={{ background: entry.color }} />
                        {entry.name}: <span className="font-bold text-white">{fmtNumber(entry.value, locale)}</span>
                    </p>
                ))}
            </div>
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{tr.title}</h1>
                        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{tr.subtitle}</p>
                    </div>
                    <Link
                        href={route('platform.dashboard')}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/10"
                    >
                        {tr.back}
                    </Link>
                </div>
            }
        >
            <Head title={tr.title} />

            <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <KpiCard
                        label={tr.kpis.mrr[0]}
                        value={xaf(kpis.mrr)}
                        sub={tr.kpis.mrr[1]}
                        trend={kpis.mrr_growth}
                        icon={DollarSign}
                        color="text-amber-600 dark:text-amber-300"
                        bgColor="bg-amber-500/10"
                    />
                    <KpiCard
                        label={tr.kpis.arr[0]}
                        value={xaf(kpis.arr)}
                        sub={tr.kpis.arr[1]}
                        icon={TrendingUp}
                        color="text-blue-500 dark:text-blue-300"
                        bgColor="bg-blue-500/10"
                    />
                    <KpiCard
                        label={tr.kpis.newMrr[0]}
                        value={xaf(kpis.new_mrr)}
                        sub={`${tr.kpis.newMrr[1]} · ${tr.series.expansion} ${xaf(kpis.expansion_mrr)}`}
                        icon={ArrowUpRight}
                        color="text-emerald-600 dark:text-emerald-300"
                        bgColor="bg-emerald-500/10"
                    />
                    <KpiCard
                        label={tr.kpis.churnedMrr[0]}
                        value={xaf(kpis.churned_mrr)}
                        sub={tr.kpis.churnedMrr[1]}
                        icon={ArrowDownRight}
                        color="text-red-500 dark:text-red-300"
                        bgColor="bg-red-500/10"
                    />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <KpiCard
                        label={tr.kpis.arpu}
                        value={xaf(kpis.arpu)}
                        sub={tr.kpis.arpuSub(kpis.active_count)}
                        icon={Users}
                        color="text-purple-600 dark:text-purple-300"
                        bgColor="bg-purple-500/10"
                    />
                    <KpiCard
                        label={tr.kpis.churnRate[0]}
                        value={`${kpis.churn_rate}%`}
                        sub={tr.kpis.churnRate[1]}
                        icon={TrendingDown}
                        color="text-orange-500 dark:text-orange-300"
                        bgColor="bg-orange-500/10"
                    />
                    <KpiCard
                        label={tr.kpis.nrr[0]}
                        value={`${kpis.nrr}%`}
                        sub={tr.kpis.nrr[1]}
                        trend={Math.round((kpis.nrr - 100) * 10) / 10}
                        icon={Activity}
                        color="text-cyan-600 dark:text-cyan-300"
                        bgColor="bg-cyan-500/10"
                    />
                    <KpiCard
                        label={tr.kpis.ltv[0]}
                        value={kpis.ltv > 0 ? xaf(kpis.ltv) : '∞'}
                        sub={tr.kpis.ltv[1]}
                        icon={Target}
                        color="text-pink-600 dark:text-pink-300"
                        bgColor="bg-pink-500/10"
                    />
                </div>

                <div className={card}>
                    <h2 className="mb-1 text-base font-semibold text-slate-900 dark:text-white">{tr.mrrChart}</h2>
                    <p className="mb-4 text-xs text-slate-500">{tr.mrrChartHint}</p>
                    <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={withLabel(mrr_history)}>
                            <defs>
                                <linearGradient id="gMrr" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" />
                            <XAxis dataKey="label" stroke="#94a3b8" style={{ fontSize: 11 }} />
                            <YAxis stroke="#94a3b8" style={{ fontSize: 11 }} tickFormatter={compact} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                            <Area type="monotone" dataKey="mrr" fill="url(#gMrr)" stroke="#f59e0b" strokeWidth={2} name={tr.series.mrr} />
                            <Bar dataKey="new_mrr" fill="#10b981" radius={[4, 4, 0, 0]} name={tr.series.newMrr} barSize={8} />
                            <Bar dataKey="expansion_mrr" fill="#3b82f6" radius={[4, 4, 0, 0]} name={tr.series.expansion} barSize={8} />
                            <Bar dataKey="churned_mrr" fill="#ef4444" radius={[4, 4, 0, 0]} name={tr.series.churned} barSize={8} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <div className={card}>
                        <h2 className="mb-1 text-base font-semibold text-slate-900 dark:text-white">{tr.churnChart}</h2>
                        <p className="mb-4 text-xs text-slate-500">{tr.churnChartHint}</p>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={withLabel(churn_history)}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" />
                                <XAxis dataKey="label" stroke="#94a3b8" style={{ fontSize: 11 }} />
                                <YAxis stroke="#94a3b8" style={{ fontSize: 11 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line type="monotone" dataKey="churn_rate" stroke="#f97316" strokeWidth={2} dot={{ r: 3, fill: '#f97316' }} name={tr.series.churnRate} />
                                <Line type="monotone" dataKey="churned" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 2" dot={false} name={tr.series.churnedCount} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className={card}>
                        <h2 className="mb-1 text-base font-semibold text-slate-900 dark:text-white">{tr.revenueChart}</h2>
                        <p className="mb-4 text-xs text-slate-500">{tr.revenueChartHint}</p>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={withLabel(revenue_history)}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" />
                                <XAxis dataKey="label" stroke="#94a3b8" style={{ fontSize: 11 }} />
                                <YAxis stroke="#94a3b8" style={{ fontSize: 11 }} tickFormatter={compact} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="revenue" fill="#a855f7" radius={[6, 6, 0, 0]} name={tr.series.revenue} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className={card}>
                    <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">{tr.byPlan}</h2>
                    {mrr_by_plan.length === 0 ? (
                        <p className="py-4 text-center text-sm text-slate-500">{tr.noPaying}</p>
                    ) : (
                        <div className="grid items-center gap-6 lg:grid-cols-2">
                            <ResponsiveContainer width="100%" height={260}>
                                <PieChart>
                                    <Pie
                                        data={mrr_by_plan}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={110}
                                        dataKey="mrr"
                                        label={({ name, percent }: any) => `${name} · ${(percent * 100).toFixed(0)}%`}
                                        labelLine={false}
                                    >
                                        {mrr_by_plan.map((plan, i) => (
                                            <Cell key={i} fill={plan.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-3">
                                {mrr_by_plan.map((plan) => (
                                    <div key={plan.name} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 dark:bg-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: plan.color }} />
                                            <div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">{plan.name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{tr.subscribers(plan.count)}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{xaf(plan.mrr)}</p>
                                            <p className="text-xs text-slate-500">{common.perMonth}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <div className={card}>
                        <div className="mb-4 flex items-center gap-2">
                            <AlertTriangle className="size-4 text-orange-400" />
                            <h2 className="text-base font-semibold text-slate-900 dark:text-white">{tr.atRisk}</h2>
                            <span className="ml-auto rounded-full bg-orange-500/20 px-2 py-0.5 text-xs text-orange-700 dark:text-orange-300">
                                {tr.atRiskBadge}
                            </span>
                        </div>
                        {at_risk.length === 0 ? (
                            <p className="py-6 text-center text-sm text-slate-500">{tr.atRiskEmpty}</p>
                        ) : (
                            <div className="space-y-2">
                                {at_risk.map((entry, i) => (
                                    <div key={i} className={row}>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{entry.user}</p>
                                            <p className="truncate text-xs text-slate-400">{entry.email}</p>
                                            <p className="text-xs text-slate-500">{entry.plan}</p>
                                        </div>
                                        <div className="ml-3 flex-shrink-0 text-right">
                                            <p className={`text-xs font-bold ${entry.days_left <= 7 ? 'text-red-500 dark:text-red-400' : 'text-orange-600 dark:text-orange-300'}`}>
                                                {tr.daysLeft(entry.days_left)}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{xaf(entry.amount)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className={card}>
                        <div className="mb-4 flex items-center gap-2">
                            <TrendingDown className="size-4 text-red-400" />
                            <h2 className="text-base font-semibold text-slate-900 dark:text-white">{tr.recentChurns}</h2>
                            <span className="ml-auto rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-700 dark:text-red-300">
                                {tr.recentChurnsBadge}
                            </span>
                        </div>
                        {recent_churns.length === 0 ? (
                            <p className="py-6 text-center text-sm text-slate-500">{tr.recentChurnsEmpty}</p>
                        ) : (
                            <div className="space-y-2">
                                {recent_churns.map((entry, i) => (
                                    <div key={i} className={row}>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{entry.user}</p>
                                            <p className="truncate text-xs text-slate-400">{entry.email}</p>
                                            <p className="text-xs text-slate-500">{entry.plan}</p>
                                        </div>
                                        <div className="ml-3 flex-shrink-0 text-right">
                                            <span
                                                className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                                    entry.reason === 'cancelled'
                                                        ? 'bg-red-500/20 text-red-700 dark:text-red-300'
                                                        : 'bg-orange-500/20 text-orange-700 dark:text-orange-300'
                                                }`}
                                            >
                                                {statuses[entry.reason]}
                                            </span>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{xaf(entry.amount)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className={card}>
                    <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                        <BarChart2 className="size-4 text-slate-500 dark:text-slate-400" />
                        {tr.formulasTitle}
                    </h2>
                    <div className="grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
                        {tr.formulas.map(([label, formula]) => (
                            <div key={label} className="rounded-lg bg-gray-50 p-3 dark:bg-white/5">
                                <p className="mb-1 font-semibold text-amber-600 dark:text-amber-300">{label}</p>
                                <p className="leading-relaxed text-slate-600 dark:text-slate-400">{formula}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
