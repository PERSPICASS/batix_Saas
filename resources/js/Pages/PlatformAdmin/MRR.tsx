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
    Minus,
    Activity,
    BarChart2,
    Target,
} from 'lucide-react';
import {
    AreaChart,
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

// ── Types ─────────────────────────────────────────────────────────────────────

interface Kpis {
    mrr: number;
    arr: number;
    arpu: number;
    mrr_growth: number;
    churn_rate: number;
    churned_mrr: number;
    new_mrr: number;
    nrr: number;
    ltv: number;
    active_count: number;
}

interface MrrPoint {
    month: string;
    mrr: number;
    new_mrr: number;
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
    churned_at: string;
    reason: string;
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

// ── Helpers ───────────────────────────────────────────────────────────────────

const PIE_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#a855f7', '#f97316', '#ec4899'];

const fmt = (n: number) =>
    n >= 1_000_000
        ? `${(n / 1_000_000).toFixed(1)}M`
        : n >= 1_000
        ? `${(n / 1_000).toFixed(1)}k`
        : n.toLocaleString('fr-FR');

const fmtXAF = (n: number) => `${fmt(n)} FCFA`;

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl border border-white/10 bg-slate-900/95 p-3 shadow-xl text-xs">
            <p className="mb-1.5 font-semibold text-slate-300">{label}</p>
            {payload.map((entry: any, i: number) => (
                <p key={i} style={{ color: entry.color }} className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ background: entry.color }} />
                    {entry.name}: <span className="font-bold text-white">{entry.value.toLocaleString('fr-FR')}</span>
                </p>
            ))}
        </div>
    );
};

// ── Composant KPI card ─────────────────────────────────────────────────────────

interface KpiCardProps {
    label: string;
    value: string;
    sub?: string;
    trend?: number; // positif = bien, négatif = mauvais (sauf churn)
    invertTrend?: boolean; // pour le churn : tendance inverse
    icon: React.ElementType;
    color: string;
    bgColor: string;
    formula?: string;
}

function KpiCard({ label, value, sub, trend, invertTrend, icon: Icon, color, bgColor, formula }: KpiCardProps) {
    const isGood = invertTrend ? (trend ?? 0) < 0 : (trend ?? 0) >= 0;
    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl flex flex-col gap-3">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
                    <p className="mt-1.5 text-2xl font-bold text-white">{value}</p>
                    {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
                </div>
                <div className={`rounded-xl ${bgColor} p-2.5 ${color}`}>
                    <Icon className="size-5" />
                </div>
            </div>
            <div className="flex items-center justify-between">
                {trend !== undefined ? (
                    <div className={`flex items-center gap-1 text-xs font-semibold ${isGood ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isGood ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                        {Math.abs(trend)}%
                    </div>
                ) : (
                    <div />
                )}
                {formula && (
                    <p className="text-[10px] text-slate-500 font-mono">{formula}</p>
                )}
            </div>
        </div>
    );
}

// ── Page principale ────────────────────────────────────────────────────────────

export default function MRRDashboard({
    kpis,
    mrr_history,
    churn_history,
    revenue_history,
    mrr_by_plan,
    recent_churns,
    at_risk,
}: Props) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-white">Dashboard MRR</h1>
                        <p className="mt-0.5 text-sm text-slate-400">
                            Monthly Recurring Revenue · Churn · Rétention
                        </p>
                    </div>
                    <Link
                        href={route('platform.dashboard')}
                        className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/10"
                    >
                        ← Dashboard général
                    </Link>
                </div>
            }
        >
            <Head title="MRR Dashboard" />

            <div className="space-y-6">

                {/* ── KPIs Row 1 : MRR, ARR, New MRR, Churned MRR ─── */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <KpiCard
                        label="MRR"
                        value={fmtXAF(kpis.mrr)}
                        sub="Revenu récurrent mensuel"
                        trend={kpis.mrr_growth}
                        icon={DollarSign}
                        color="text-amber-300"
                        bgColor="bg-amber-500/10"
                        formula="Σ(montant / cycle)"
                    />
                    <KpiCard
                        label="ARR"
                        value={fmtXAF(kpis.arr)}
                        sub="Revenu récurrent annuel"
                        icon={TrendingUp}
                        color="text-blue-300"
                        bgColor="bg-blue-500/10"
                        formula="MRR × 12"
                    />
                    <KpiCard
                        label="New MRR"
                        value={fmtXAF(kpis.new_mrr)}
                        sub="Nouveaux ce mois"
                        icon={ArrowUpRight}
                        color="text-emerald-300"
                        bgColor="bg-emerald-500/10"
                        formula="Σ nouveaux abonnés (mois)"
                    />
                    <KpiCard
                        label="Churned MRR"
                        value={fmtXAF(kpis.churned_mrr)}
                        sub="Perdu ce mois"
                        icon={ArrowDownRight}
                        color="text-red-300"
                        bgColor="bg-red-500/10"
                        formula="Σ annulés + expirés (mois)"
                    />
                </div>

                {/* ── KPIs Row 2 : ARPU, Churn Rate, NRR, LTV ─── */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <KpiCard
                        label="ARPU"
                        value={fmtXAF(kpis.arpu)}
                        sub={`Sur ${kpis.active_count} abonnés actifs`}
                        icon={Users}
                        color="text-purple-300"
                        bgColor="bg-purple-500/10"
                        formula="MRR / nb actifs"
                    />
                    <KpiCard
                        label="Churn Rate"
                        value={`${kpis.churn_rate}%`}
                        sub="Taux d'attrition mensuel"
                        trend={kpis.churn_rate}
                        invertTrend
                        icon={TrendingDown}
                        color="text-orange-300"
                        bgColor="bg-orange-500/10"
                        formula="Churned / Actifs début mois"
                    />
                    <KpiCard
                        label="NRR"
                        value={`${kpis.nrr}%`}
                        sub="Net Revenue Retention"
                        trend={kpis.nrr - 100}
                        icon={Activity}
                        color="text-cyan-300"
                        bgColor="bg-cyan-500/10"
                        formula="(MRR − Churn) / MRR prev × 100"
                    />
                    <KpiCard
                        label="LTV estimée"
                        value={kpis.ltv > 0 ? fmtXAF(kpis.ltv) : '∞'}
                        sub="Valeur vie client moyenne"
                        icon={Target}
                        color="text-pink-300"
                        bgColor="bg-pink-500/10"
                        formula="ARPU / Churn Rate"
                    />
                </div>

                {/* ── Graphique MRR + New MRR + Churned MRR ─── */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                    <h2 className="mb-1 text-base font-semibold text-white">Évolution MRR (12 mois)</h2>
                    <p className="mb-4 text-xs text-slate-500">MRR = somme normalisée en mensuel de tous les abonnements actifs</p>
                    <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={mrr_history}>
                            <defs>
                                <linearGradient id="gMrr" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                            <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: 11 }} />
                            <YAxis stroke="#94a3b8" style={{ fontSize: 11 }} tickFormatter={fmt} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                            <Area
                                type="monotone"
                                dataKey="mrr"
                                fill="url(#gMrr)"
                                stroke="#f59e0b"
                                strokeWidth={2}
                                name="MRR (FCFA)"
                            />
                            <Bar dataKey="new_mrr" fill="#10b981" radius={[4, 4, 0, 0]} name="New MRR" barSize={8} />
                            <Bar dataKey="churned_mrr" fill="#ef4444" radius={[4, 4, 0, 0]} name="Churned MRR" barSize={8} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>

                {/* ── Churn Rate + Revenue réel ─── */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Churn Rate mensuel */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                        <h2 className="mb-1 text-base font-semibold text-white">Churn Rate mensuel (%)</h2>
                        <p className="mb-4 text-xs text-slate-500">
                            Churn = nb annulés+expirés / nb actifs début de mois × 100
                        </p>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={churn_history}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: 11 }} />
                                <YAxis stroke="#94a3b8" style={{ fontSize: 11 }} unit="%" />
                                <Tooltip content={<CustomTooltip />} />
                                <Line
                                    type="monotone"
                                    dataKey="churn_rate"
                                    stroke="#f97316"
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: '#f97316' }}
                                    name="Churn Rate (%)"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="churned"
                                    stroke="#ef4444"
                                    strokeWidth={1.5}
                                    strokeDasharray="4 2"
                                    dot={false}
                                    name="Nb churned"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Revenue réel (factures payées) */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                        <h2 className="mb-1 text-base font-semibold text-white">Revenus encaissés (12 mois)</h2>
                        <p className="mb-4 text-xs text-slate-500">
                            Basé sur les factures avec status=paid
                        </p>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={revenue_history}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: 11 }} />
                                <YAxis stroke="#94a3b8" style={{ fontSize: 11 }} tickFormatter={fmt} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar
                                    dataKey="revenue"
                                    fill="#a855f7"
                                    radius={[6, 6, 0, 0]}
                                    name="Revenus (FCFA)"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* ── MRR par plan (Pie + légende) ─── */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                    <h2 className="mb-4 text-base font-semibold text-white">Répartition MRR par plan</h2>
                    <div className="grid gap-6 lg:grid-cols-2 items-center">
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie
                                    data={mrr_by_plan}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={110}
                                    dataKey="mrr"
                                    label={({ name, percent }: any) =>
                                        `${name} · ${(percent * 100).toFixed(0)}%`
                                    }
                                    labelLine={false}
                                >
                                    {mrr_by_plan.map((_, i) => (
                                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-3">
                            {mrr_by_plan.map((plan, i) => (
                                <div key={plan.name} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="h-3 w-3 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-white">{plan.name}</p>
                                            <p className="text-xs text-slate-400">{plan.count} abonné{plan.count > 1 ? 's' : ''}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-white">{fmtXAF(plan.mrr)}</p>
                                        <p className="text-xs text-slate-500">/ mois</p>
                                    </div>
                                </div>
                            ))}
                            {mrr_by_plan.length === 0 && (
                                <p className="text-sm text-slate-500 text-center py-4">Aucun abonnement actif</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Abonnements à risque + Churns récents ─── */}
                <div className="grid gap-6 lg:grid-cols-2">

                    {/* À risque */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                        <div className="mb-4 flex items-center gap-2">
                            <AlertTriangle className="size-4 text-orange-400" />
                            <h2 className="text-base font-semibold text-white">Abonnements à risque</h2>
                            <span className="ml-auto rounded-full bg-orange-500/20 px-2 py-0.5 text-xs text-orange-300">
                                expire ≤ 30j
                            </span>
                        </div>
                        {at_risk.length === 0 ? (
                            <p className="py-6 text-center text-sm text-slate-500">Aucun abonnement à risque 🎉</p>
                        ) : (
                            <div className="space-y-2">
                                {at_risk.map((entry, i) => (
                                    <div key={i} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="truncate text-sm font-medium text-white">{entry.user}</p>
                                            <p className="truncate text-xs text-slate-400">{entry.email}</p>
                                            <p className="text-xs text-slate-500">{entry.plan}</p>
                                        </div>
                                        <div className="text-right ml-3 flex-shrink-0">
                                            <p className={`text-xs font-bold ${entry.days_left <= 7 ? 'text-red-400' : 'text-orange-300'}`}>
                                                J-{entry.days_left}
                                            </p>
                                            <p className="text-xs text-slate-400">{fmtXAF(entry.amount)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Churns récents */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                        <div className="mb-4 flex items-center gap-2">
                            <TrendingDown className="size-4 text-red-400" />
                            <h2 className="text-base font-semibold text-white">Churns récents</h2>
                            <span className="ml-auto rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-300">
                                30 derniers jours
                            </span>
                        </div>
                        {recent_churns.length === 0 ? (
                            <p className="py-6 text-center text-sm text-slate-500">Aucun churn ce mois 🎉</p>
                        ) : (
                            <div className="space-y-2">
                                {recent_churns.map((entry, i) => (
                                    <div key={i} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="truncate text-sm font-medium text-white">{entry.user}</p>
                                            <p className="truncate text-xs text-slate-400">{entry.email}</p>
                                            <p className="text-xs text-slate-500">{entry.plan}</p>
                                        </div>
                                        <div className="text-right ml-3 flex-shrink-0">
                                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                                entry.reason === 'cancelled'
                                                    ? 'bg-red-500/20 text-red-300'
                                                    : 'bg-orange-500/20 text-orange-300'
                                            }`}>
                                                {entry.reason === 'cancelled' ? 'Annulé' : 'Expiré'}
                                            </span>
                                            <p className="mt-1 text-xs text-slate-400">{fmtXAF(entry.amount)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Explications des formules ─── */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                    <h2 className="mb-4 text-base font-semibold text-white flex items-center gap-2">
                        <BarChart2 className="size-4 text-slate-400" />
                        Formules de calcul
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">
                        {[
                            { label: 'MRR', formula: 'Σ abonnements actifs (monthly) + Σ (yearly / 12)' },
                            { label: 'ARR', formula: 'MRR × 12' },
                            { label: 'ARPU', formula: 'MRR / nombre d\'abonnés actifs' },
                            { label: 'New MRR', formula: 'MRR des abonnements démarrés ce mois' },
                            { label: 'Churned MRR', formula: 'MRR des abonnements annulés/expirés ce mois' },
                            { label: 'Net MRR Growth', formula: 'New MRR − Churned MRR' },
                            { label: 'Churn Rate', formula: 'Churned / Actifs (début de mois) × 100' },
                            { label: 'NRR', formula: '(MRR fin − Churned MRR) / MRR début × 100' },
                            { label: 'LTV', formula: 'ARPU / Churn Rate mensuel' },
                        ].map(({ label, formula }) => (
                            <div key={label} className="rounded-lg bg-white/5 p-3">
                                <p className="font-semibold text-amber-300 mb-1">{label}</p>
                                <p className="text-slate-400 font-mono leading-relaxed">{formula}</p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </AuthenticatedLayout>
    );
}
