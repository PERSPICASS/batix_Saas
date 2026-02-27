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
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Stats {
    total_accounts: number;
    total_shops: number;
    active_shops: number;
    total_users: number;
    monthly_revenue: number;
    active_subscriptions: number;
    trial_subscriptions: number;
    expired_subscriptions: number;
    cancelled_subscriptions: number;
}

interface ChartDataPoint {
    month: string;
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
        id: number;
        name: string;
        email: string;
    };
    created_at: string;
}

interface Props {
    stats: Stats;
    charts: Charts;
    recent_accounts: Account[];
    recent_shops: Shop[];
}

// Couleurs pour les graphiques
const COLORS = {
    primary: '#f59e0b', // amber
    secondary: '#3b82f6', // blue
    success: '#10b981', // emerald
    danger: '#ef4444', // red
    warning: '#f97316', // orange
    purple: '#a855f7',
};

const PIE_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#a855f7', '#f97316'];

export default function PlatformAdminDashboard({ stats, charts, recent_accounts, recent_shops }: Props) {
    const kpis = [
        {
            label: 'Comptes totaux',
            value: stats.total_accounts.toString(),
            icon: Users,
            color: 'text-blue-300',
            bgColor: 'bg-blue-500/10',
        },
        {
            label: 'Boutiques actives',
            value: `${stats.active_shops} / ${stats.total_shops}`,
            icon: Store,
            color: 'text-emerald-300',
            bgColor: 'bg-emerald-500/10',
        },
        {
            label: 'Abonnements actifs',
            value: stats.active_subscriptions.toString(),
            icon: CheckCircle,
            color: 'text-amber-300',
            bgColor: 'bg-amber-500/10',
        },
        {
            label: 'Revenus mensuels',
            value: `${stats.monthly_revenue.toLocaleString()} XAF`,
            icon: DollarSign,
            color: 'text-purple-300',
            bgColor: 'bg-purple-500/10',
        },
    ];

    const subscriptionStats = [
        {
            label: 'Actifs',
            value: stats.active_subscriptions,
            icon: CheckCircle,
            color: 'text-emerald-400',
        },
        {
            label: 'Essai',
            value: stats.trial_subscriptions,
            icon: Clock,
            color: 'text-blue-400',
        },
        {
            label: 'Expirés',
            value: stats.expired_subscriptions,
            icon: XCircle,
            color: 'text-orange-400',
        },
        {
            label: 'Annulés',
            value: stats.cancelled_subscriptions,
            icon: XCircle,
            color: 'text-red-400',
        },
    ];

    // Custom tooltip pour les graphiques
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="rounded-lg border border-white/10 bg-slate-900 p-3 shadow-lg">
                    <p className="text-sm text-slate-400">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm font-semibold text-white">
                            {entry.name}: {entry.value.toLocaleString()}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-white">Administration Plateforme</h1>
                    <div className="flex items-center gap-2 rounded-lg bg-purple-500/20 px-3 py-1.5 text-sm text-purple-200">
                        <Building2 className="size-4" />
                        Admin Plateforme
                    </div>
                </div>
            }
        >
            <Head title="Admin Plateforme" />

            <div className="space-y-6">
                {/* KPIs principaux */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {kpis.map((kpi) => (
                        <div
                            key={kpi.label}
                            className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-slate-400">{kpi.label}</p>
                                    <p className="mt-2 text-3xl font-bold text-white">{kpi.value}</p>
                                </div>
                                <div className={`rounded-lg ${kpi.bgColor} p-2.5 ${kpi.color}`}>
                                    <kpi.icon className="size-5" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Statistiques des abonnements */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                    <h2 className="mb-4 text-lg font-semibold text-white">Statut des abonnements</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {subscriptionStats.map((stat) => (
                            <div key={stat.label} className="flex items-center gap-3 rounded-xl bg-white/5 p-4">
                                <stat.icon className={`size-8 ${stat.color}`} />
                                <div>
                                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                                    <p className="text-sm text-slate-400">{stat.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Graphiques - Rangée 1 */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Évolution des comptes */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                        <h2 className="mb-4 text-lg font-semibold text-white">Évolution des comptes</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={charts.accounts_growth}>
                                <defs>
                                    <linearGradient id="colorAccounts" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                <XAxis 
                                    dataKey="month" 
                                    stroke="#94a3b8"
                                    style={{ fontSize: '12px' }}
                                />
                                <YAxis 
                                    stroke="#94a3b8"
                                    style={{ fontSize: '12px' }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area 
                                    type="monotone" 
                                    dataKey="count" 
                                    stroke={COLORS.primary} 
                                    fill="url(#colorAccounts)"
                                    strokeWidth={2}
                                    name="Comptes"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Évolution des boutiques */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                        <h2 className="mb-4 text-lg font-semibold text-white">Évolution des boutiques</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={charts.shops_growth}>
                                <defs>
                                    <linearGradient id="colorShops" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor={COLORS.success} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                <XAxis 
                                    dataKey="month" 
                                    stroke="#94a3b8"
                                    style={{ fontSize: '12px' }}
                                />
                                <YAxis 
                                    stroke="#94a3b8"
                                    style={{ fontSize: '12px' }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area 
                                    type="monotone" 
                                    dataKey="count" 
                                    stroke={COLORS.success} 
                                    fill="url(#colorShops)"
                                    strokeWidth={2}
                                    name="Boutiques"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Graphiques - Rangée 2 */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Répartition des abonnements */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                        <h2 className="mb-4 text-lg font-semibold text-white">Répartition par plan</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={charts.subscriptions_by_plan}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="count"
                                >
                                    {charts.subscriptions_by_plan.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="mt-4 space-y-2">
                            {charts.subscriptions_by_plan.map((plan, index) => (
                                <div key={plan.name} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div 
                                            className="h-3 w-3 rounded-full" 
                                            style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                                        />
                                        <span className="text-slate-300">{plan.name}</span>
                                    </div>
                                    <span className="font-semibold text-white">
                                        {plan.revenue.toLocaleString()} XAF
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Évolution des revenus */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                        <h2 className="mb-4 text-lg font-semibold text-white">Évolution des revenus</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={charts.revenue_growth}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                <XAxis 
                                    dataKey="month" 
                                    stroke="#94a3b8"
                                    style={{ fontSize: '12px' }}
                                />
                                <YAxis 
                                    stroke="#94a3b8"
                                    style={{ fontSize: '12px' }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar 
                                    dataKey="revenue" 
                                    fill={COLORS.purple}
                                    radius={[8, 8, 0, 0]}
                                    name="Revenus (XAF)"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Actions rapides */}
                <div className="grid gap-4 lg:grid-cols-4">
                    <Link
                        href={route('platform.accounts')}
                        className="group rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-transparent p-6 transition hover:border-blue-500/30"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-white">Comptes</h3>
                                <p className="mt-1 text-sm text-slate-400">
                                    Gérer les comptes
                                </p>
                            </div>
                            <ArrowUpRight className="size-5 text-blue-300 transition group-hover:translate-x-1 group-hover:-translate-y-1" />
                        </div>
                    </Link>

                    <Link
                        href={route('platform.shops')}
                        className="group rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-transparent p-6 transition hover:border-emerald-500/30"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-white">Boutiques</h3>
                                <p className="mt-1 text-sm text-slate-400">
                                    Voir les boutiques
                                </p>
                            </div>
                            <ArrowUpRight className="size-5 text-emerald-300 transition group-hover:translate-x-1 group-hover:-translate-y-1" />
                        </div>
                    </Link>

                    <Link
                        href={route('platform.subscriptions.index')}
                        className="group rounded-2xl border border-white/10 bg-gradient-to-br from-amber-500/10 to-transparent p-6 transition hover:border-amber-500/30"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-white">Plans</h3>
                                <p className="mt-1 text-sm text-slate-400">
                                    Gérer les plans
                                </p>
                            </div>
                            <ArrowUpRight className="size-5 text-amber-300 transition group-hover:translate-x-1 group-hover:-translate-y-1" />
                        </div>
                    </Link>

                    <Link
                        href={route('platform.active-subscriptions')}
                        className="group rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/10 to-transparent p-6 transition hover:border-purple-500/30"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-white">Abonnements</h3>
                                <p className="mt-1 text-sm text-slate-400">
                                    Gérer les abonnements
                                </p>
                            </div>
                            <ArrowUpRight className="size-5 text-purple-300 transition group-hover:translate-x-1 group-hover:-translate-y-1" />
                        </div>
                    </Link>
                </div>

                {/* Comptes et Boutiques récents */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Comptes récents */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">Comptes récents</h3>
                            <Link
                                href={route('platform.accounts')}
                                className="text-sm text-amber-300 hover:text-amber-200"
                            >
                                Voir tout
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {recent_accounts.map((account) => (
                                <div
                                    key={account.id}
                                    className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-3"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium text-white">{account.name}</p>
                                        <p className="text-xs text-slate-400">{account.email}</p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Code: {account.code_user}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-amber-300">
                                            {account.shops_count} boutique{account.shops_count > 1 ? 's' : ''}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {new Date(account.created_at).toLocaleDateString('fr-FR')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Boutiques récentes */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">Boutiques récentes</h3>
                            <Link
                                href={route('platform.shops')}
                                className="text-sm text-amber-300 hover:text-amber-200"
                            >
                                Voir tout
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {recent_shops.map((shop) => (
                                <div
                                    key={shop.id}
                                    className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-3"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-white">{shop.name}</p>
                                            {shop.is_active ? (
                                                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="rounded bg-slate-500/20 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                                                    Inactive
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-400">{shop.owner.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500">
                                            {new Date(shop.created_at).toLocaleDateString('fr-FR')}
                                        </p>
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
