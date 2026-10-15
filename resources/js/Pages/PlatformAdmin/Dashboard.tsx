import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import {
    Building2,
    Users,
    Store,
    DollarSign,
    ArrowUpRight,
    CheckCircle,
    Clock,
    XCircle
} from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLocale } from '@/contexts/LocaleContext';
import { fmtCompact, fmtDate, fmtMonth, fmtNumber, fmtXAF } from '@/utils/platformFormat';

// Tous les montants sont en FCFA (voir PlatformMetrics côté serveur).
interface Stats {
    total_accounts: number;
    total_shops: number;
    active_shops: number;
    total_users: number;
    monthly_revenue: number;
    monthly_fixed_costs: number;
    monthly_profit: number;
    profit_margin: number;
    paying_subscriptions: number;
    active_subscriptions: number;
    trial_subscriptions: number;
    expired_subscriptions: number;
    cancelled_subscriptions: number;
}

interface ChartDataPoint {
    month: string; // « 2026-10 »
    count?: number;
    revenue?: number;
}

interface SubscriptionByPlan {
    name: string;
    count: number;
    revenue: number;
}

interface Charts {
    accounts_growth: ChartDataPoint[];
    shops_growth: ChartDataPoint[];
    subscriptions_by_plan: SubscriptionByPlan[];
    revenue_growth: ChartDataPoint[];
}

interface Account {
    id: number;
    name: string;
    email: string;
    code_user: string;
    shops_count: number;
    created_at: string;
}

interface Shop {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
    owner: {
        id: number | null;
        name: string | null;
        email: string | null;
    };
    created_at: string;
}

interface Props {
    stats: Stats;
    charts: Charts;
    recent_accounts: Account[];
    recent_shops: Shop[];
}

const COLORS = {
    primary: '#f59e0b',
    success: '#10b981',
    purple: '#a855f7',
};

const PIE_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#a855f7', '#f97316'];

const card = 'rounded-2xl border border-gray-200 bg-white p-6 backdrop-blur-xl dark:border-white/10 dark:bg-white/5';

export default function PlatformAdminDashboard({ stats, charts, recent_accounts, recent_shops }: Props) {
    const { t, locale } = useLocale();
    const tr = t.platformAdmin.dashboard;
    const common = t.platformAdmin.common;
    const statuses = t.platformAdmin.statuses;

    const withLabel = <T extends { month: string }>(rows: T[]) =>
        rows.map((r) => ({ ...r, label: fmtMonth(r.month, locale) }));

    const kpis = [
        {
            label: tr.kpis.accounts,
            value: fmtNumber(stats.total_accounts, locale),
            icon: Users,
            color: 'text-blue-500 dark:text-blue-300',
            bgColor: 'bg-blue-500/10',
        },
        {
            label: tr.kpis.activeShops,
            value: `${stats.active_shops} / ${stats.total_shops}`,
            icon: Store,
            color: 'text-emerald-600 dark:text-emerald-300',
            bgColor: 'bg-emerald-500/10',
        },
        {
            label: tr.kpis.payingSubscriptions,
            value: fmtNumber(stats.paying_subscriptions, locale),
            icon: CheckCircle,
            color: 'text-amber-600 dark:text-amber-300',
            bgColor: 'bg-amber-500/10',
        },
        {
            label: tr.kpis.revenue,
            value: fmtXAF(stats.monthly_revenue, locale),
            icon: DollarSign,
            color: 'text-purple-600 dark:text-purple-300',
            bgColor: 'bg-purple-500/10',
        },
        {
            label: tr.kpis.fixedCosts,
            value: fmtXAF(stats.monthly_fixed_costs, locale),
            icon: DollarSign,
            color: 'text-red-500 dark:text-red-300',
            bgColor: 'bg-red-500/10',
        },
        {
            label: tr.kpis.profit,
            value: fmtXAF(stats.monthly_profit, locale),
            icon: DollarSign,
            color: stats.monthly_profit >= 0 ? 'text-green-600 dark:text-green-300' : 'text-red-500 dark:text-red-300',
            bgColor: stats.monthly_profit >= 0 ? 'bg-green-500/10' : 'bg-red-500/10',
        },
        {
            label: tr.kpis.margin,
            value: `${stats.profit_margin}%`,
            icon: ArrowUpRight,
            color: stats.profit_margin >= 0 ? 'text-green-600 dark:text-green-300' : 'text-red-500 dark:text-red-300',
            bgColor: stats.profit_margin >= 0 ? 'bg-green-500/10' : 'bg-red-500/10',
        },
    ];

    const subscriptionStats = [
        { label: statuses.active, value: stats.active_subscriptions, icon: CheckCircle, color: 'text-emerald-500 dark:text-emerald-400' },
        { label: statuses.trial, value: stats.trial_subscriptions, icon: Clock, color: 'text-blue-500 dark:text-blue-400' },
        { label: statuses.expired, value: stats.expired_subscriptions, icon: XCircle, color: 'text-orange-500 dark:text-orange-400' },
        { label: statuses.cancelled, value: stats.cancelled_subscriptions, icon: XCircle, color: 'text-red-500 dark:text-red-400' },
    ];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="rounded-lg border border-white/10 bg-slate-900 p-3 shadow-lg">
                    <p className="text-sm text-slate-400">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm font-semibold text-white">
                            {entry.name}: {fmtNumber(entry.value, locale)}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const quickLinks = [
        { href: route('platform.accounts'), text: tr.quick.accounts, gradient: 'from-blue-500/10', hover: 'hover:border-blue-500/30', icon: 'text-blue-500 dark:text-blue-300' },
        { href: route('platform.shops'), text: tr.quick.shops, gradient: 'from-emerald-500/10', hover: 'hover:border-emerald-500/30', icon: 'text-emerald-600 dark:text-emerald-300' },
        { href: route('platform.subscriptions.index'), text: tr.quick.plans, gradient: 'from-amber-500/10', hover: 'hover:border-amber-500/30', icon: 'text-amber-600 dark:text-amber-300' },
        { href: route('platform.active-subscriptions'), text: tr.quick.subscriptions, gradient: 'from-purple-500/10', hover: 'hover:border-purple-500/30', icon: 'text-purple-600 dark:text-purple-300' },
    ];

    const growthChart = (data: ChartDataPoint[], id: string, color: string, name: string) => (
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={withLabel(data)}>
                <defs>
                    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" />
                <XAxis dataKey="label" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" stroke={color} fill={`url(#${id})`} strokeWidth={2} name={name} />
            </AreaChart>
        </ResponsiveContainer>
    );

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{tr.title}</h1>
                    <div className="flex items-center gap-2 rounded-lg bg-purple-500/20 px-3 py-1.5 text-sm text-purple-700 dark:text-purple-200">
                        <Building2 className="size-4" />
                        {tr.badge}
                    </div>
                </div>
            }
        >
            <Head title={tr.badge} />

            <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {kpis.map((kpi) => (
                        <div key={kpi.label} className={card}>
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{kpi.label}</p>
                                    <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{kpi.value}</p>
                                </div>
                                <div className={`rounded-lg ${kpi.bgColor} p-2.5 ${kpi.color}`}>
                                    <kpi.icon className="size-5" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className={card}>
                    <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">{tr.subscriptionStatus}</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {subscriptionStats.map((stat) => (
                            <div key={stat.label} className="flex items-center gap-3 rounded-xl bg-gray-50 p-4 dark:bg-white/5">
                                <stat.icon className={`size-8 ${stat.color}`} />
                                <div>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <div className={card}>
                        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">{tr.accountsGrowth}</h2>
                        {growthChart(charts.accounts_growth, 'colorAccounts', COLORS.primary, tr.seriesAccounts)}
                    </div>
                    <div className={card}>
                        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">{tr.shopsGrowth}</h2>
                        {growthChart(charts.shops_growth, 'colorShops', COLORS.success, tr.seriesShops)}
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <div className={card}>
                        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">{tr.byPlan}</h2>
                        {charts.subscriptions_by_plan.length === 0 ? (
                            <p className="py-12 text-center text-sm text-slate-500">{tr.byPlanEmpty}</p>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={charts.subscriptions_by_plan}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                        outerRadius={100}
                                        dataKey="count"
                                    >
                                        {charts.subscriptions_by_plan.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                        <div className="mt-4 space-y-2">
                            {charts.subscriptions_by_plan.map((plan, index) => (
                                <div key={plan.name} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="h-3 w-3 rounded-full"
                                            style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                                        />
                                        <span className="text-slate-600 dark:text-slate-300">
                                            {plan.name} · {plan.count}
                                        </span>
                                    </div>
                                    <span className="font-semibold text-slate-900 dark:text-white">
                                        {fmtXAF(plan.revenue, locale)} {common.perMonth}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={card}>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{tr.revenueGrowth}</h2>
                        <p className="mb-4 text-xs text-slate-500">{tr.revenueGrowthHint}</p>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={withLabel(charts.revenue_growth)}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" />
                                <XAxis dataKey="label" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                <YAxis
                                    stroke="#94a3b8"
                                    style={{ fontSize: '12px' }}
                                    tickFormatter={(v: number) => fmtCompact(v, locale)}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="revenue" fill={COLORS.purple} radius={[8, 8, 0, 0]} name={tr.seriesRevenue} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-4">
                    {quickLinks.map((q) => (
                        <Link
                            key={q.href}
                            href={q.href}
                            className={`group rounded-2xl border border-gray-200 bg-gradient-to-br ${q.gradient} to-transparent p-6 transition ${q.hover} dark:border-white/10`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{q.text[0]}</h3>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{q.text[1]}</p>
                                </div>
                                <ArrowUpRight className={`size-5 ${q.icon} transition group-hover:-translate-y-1 group-hover:translate-x-1`} />
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <div className={card}>
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{tr.recentAccounts}</h3>
                            <Link href={route('platform.accounts')} className="text-sm text-amber-600 hover:text-amber-500 dark:text-amber-300 dark:hover:text-amber-200">
                                {tr.seeAll}
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {recent_accounts.map((account) => (
                                <div
                                    key={account.id}
                                    className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3 dark:border-white/5 dark:bg-white/5"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-900 dark:text-white">{account.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{account.email}</p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {common.code}: {account.code_user}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-amber-600 dark:text-amber-300">
                                            {tr.shopsCount(account.shops_count)}
                                        </p>
                                        <p className="text-xs text-slate-500">{fmtDate(account.created_at, locale)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={card}>
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{tr.recentShops}</h3>
                            <Link href={route('platform.shops')} className="text-sm text-amber-600 hover:text-amber-500 dark:text-amber-300 dark:hover:text-amber-200">
                                {tr.seeAll}
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {recent_shops.map((shop) => (
                                <div
                                    key={shop.id}
                                    className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3 dark:border-white/5 dark:bg-white/5"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-slate-900 dark:text-white">{shop.name}</p>
                                            {shop.is_active ? (
                                                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                                                    {common.activeFem}
                                                </span>
                                            ) : (
                                                <span className="rounded bg-slate-500/20 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                                    {t.platformAdmin.shops.suspended}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{shop.owner.name ?? common.unknown}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500">{fmtDate(shop.created_at, locale)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
