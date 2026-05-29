import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useLocale } from '@/contexts/LocaleContext';
import {
    ArrowDownRight,
    ArrowUpRight,
    BarChart3,
    CreditCard,
    Package,
    Percent,
    ShoppingCart,
    Store,
    TrendingUp,
    Users,
    Wallet,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import ProductImage from '@/Components/ProductImage';
import { useState } from 'react';

interface KPI {
    value: number;
    growth?: number;
    previousValue?: number;
    margin?: number;
}

interface ChartItem {
    label: string;
    value: number;
}

interface TopProduct {
    id: number;
    name: string;
    sku: string;
    image: string | null;
    quantity: number;
    revenue: number;
}

interface CategorySales {
    name: string;
    revenue: number;
    percentage: number;
}

interface TopCustomer {
    id: number;
    name: string;
    email: string;
    phone: string;
    salesCount: number;
    totalSpent: number;
}

interface PaymentMethod {
    method: string;
    count: number;
    total: number;
    percentage: number;
}

interface ShopPerformance {
    id: number;
    name: string;
    salesCount: number;
    revenue: number;
}

interface ComparisonPoint {
    label: string;
    revenue1: number;
    revenue2: number;
    sales1: number;
    sales2: number;
}

interface ComparisonMetric {
    v1: number;
    v2: number;
    growth: number;
}

interface ComparisonData {
    mode: 'year' | 'month';
    label1: string;
    label2: string;
    chart: ComparisonPoint[];
    totals: {
        revenue: ComparisonMetric;
        sales: ComparisonMetric;
        profit: ComparisonMetric;
    };
}

interface AnalyticsProps {
    kpis: {
        revenue: KPI;
        salesCount: KPI;
        avgBasket: KPI;
        marginRate: KPI;
        newCustomers: KPI;
    };
    salesChart: ChartItem[];
    topProducts: TopProduct[];
    salesByCategory: CategorySales[];
    topCustomers: TopCustomer[];
    paymentMethods: PaymentMethod[];
    shopPerformance: ShopPerformance[];
    comparisonData: ComparisonData;
    currentPeriod: string;
    currencySymbol: string;
    shops: Array<{ id: number; name: string }>;
    activeShopId: number | null;
}

const periods = [
    { value: 'today', label: "Aujourd'hui" },
    { value: 'week', label: 'Cette semaine' },
    { value: 'month', label: 'Ce mois' },
    { value: 'quarter', label: 'Ce trimestre' },
    { value: 'year', label: 'Cette année' },
];

function formatNumber(value: number): string {
    if (value >= 1000000) {
        return (value / 1000000).toFixed(1).replace('.', ',') + 'M';
    }
    if (value >= 1000) {
        return Math.round(value / 1000) + 'k';
    }
    return value.toLocaleString('fr-FR');
}

function formatCurrency(value: number, symbol: string): string {
    return formatNumber(value) + ' ' + symbol;
}

// Couleurs pour les graphiques
const chartColors = [
    'bg-amber-400',
    'bg-orange-400',
    'bg-rose-400',
    'bg-purple-400',
    'bg-blue-400',
    'bg-cyan-400',
    'bg-emerald-400',
    'bg-lime-400',
];

export default function Index({
    kpis,
    salesChart,
    topProducts,
    salesByCategory,
    topCustomers,
    paymentMethods,
    shopPerformance,
    comparisonData,
    currentPeriod,
    currencySymbol,
}: AnalyticsProps) {
    const { t } = useLocale();
    const [compareMode, setCompareMode] = useState<'year' | 'month'>(comparisonData.mode);
    const [year1, setYear1] = useState(parseInt(comparisonData.label1));
    const [year2, setYear2] = useState(parseInt(comparisonData.label2));

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - (5 - i));
    const monthOptions = [
        { value: 1, label: 'Janvier' },
        { value: 2, label: 'Février' },
        { value: 3, label: 'Mars' },
        { value: 4, label: 'Avril' },
        { value: 5, label: 'Mai' },
        { value: 6, label: 'Juin' },
        { value: 7, label: 'Juillet' },
        { value: 8, label: 'Août' },
        { value: 9, label: 'Septembre' },
        { value: 10, label: 'Octobre' },
        { value: 11, label: 'Novembre' },
        { value: 12, label: 'Décembre' },
    ];

    const [month1, setMonth1] = useState(currentMonth);
    const [monthYear1, setMonthYear1] = useState(currentYear);
    const [month2, setMonth2] = useState(currentMonth === 1 ? 12 : currentMonth - 1);
    const [monthYear2, setMonthYear2] = useState(currentMonth === 1 ? currentYear - 1 : currentYear);

    const handlePeriodChange = (period: string) => {
        router.get(window.location.pathname, { period }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleCompareChange = () => {
        const params: Record<string, any> = {
            period: currentPeriod,
            compare_mode: compareMode,
        };

        if (compareMode === 'year') {
            params.year1 = year1;
            params.year2 = year2;
        } else {
            params.month1 = month1;
            params.month_year1 = monthYear1;
            params.month2 = month2;
            params.month_year2 = monthYear2;
        }

        router.get(window.location.pathname, params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Calculer le max pour le graphique
    const maxChartValue = Math.max(...salesChart.map(item => item.value), 1);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-white">{t.analytics.title}</h1>
                    
                    {/* Sélecteur de période */}
                    <div className="flex gap-1">
                        {periods.map((period) => (
                            <button
                                key={period.value}
                                onClick={() => handlePeriodChange(period.value)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                                    currentPeriod === period.value
                                        ? 'bg-amber-300 text-slate-900'
                                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                                }`}
                            >
                                {period.label}
                            </button>
                        ))}
                    </div>
                </div>
            }
        >
            <Head title="Analytics" />

            <div className="space-y-6">
                {/* KPIs */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <KPICard
                        label="Chiffre d'affaires"
                        value={formatCurrency(kpis.revenue.value, currencySymbol)}
                        growth={kpis.revenue.growth}
                        icon={Wallet}
                        color="amber"
                    />
                    <KPICard
                        label="Nombre de ventes"
                        value={kpis.salesCount.value.toString()}
                        growth={kpis.salesCount.growth}
                        icon={ShoppingCart}
                        color="emerald"
                    />
                    <KPICard
                        label="Panier moyen"
                        value={formatCurrency(kpis.avgBasket.value, currencySymbol)}
                        growth={kpis.avgBasket.growth}
                        icon={TrendingUp}
                        color="blue"
                    />
                    <KPICard
                        label="Taux de marge"
                        value={`${kpis.marginRate.value}%`}
                        subValue={kpis.marginRate.margin ? formatCurrency(kpis.marginRate.margin, currencySymbol) : undefined}
                        icon={Percent}
                        color="purple"
                    />
                    <KPICard
                        label="Nouveaux clients"
                        value={kpis.newCustomers.value.toString()}
                        icon={Users}
                        color="rose"
                    />
                </div>

                {/* Graphique des ventes */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="rounded-lg bg-amber-300/15 p-2">
                            <BarChart3 className="size-5 text-amber-300" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Évolution des ventes</h2>
                            <p className="text-sm text-slate-400">
                                Total: {formatCurrency(salesChart.reduce((sum, item) => sum + item.value, 0), currencySymbol)}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-end gap-2 h-48">
                        {salesChart.map((item, index) => (
                            <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                <div className="w-full flex items-end justify-center h-40 bg-slate-900/40 rounded-lg p-1">
                                    <div
                                        className="w-full max-w-[40px] rounded-md bg-gradient-to-t from-amber-400 to-orange-300 transition-all duration-300"
                                        style={{ height: `${Math.max((item.value / maxChartValue) * 100, 3)}%` }}
                                        title={formatCurrency(item.value, currencySymbol)}
                                    />
                                </div>
                                <span className="text-[10px] text-slate-400 truncate max-w-full">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section Comparaison */}
                <div className="space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                        <h2 className="text-lg font-semibold text-white mb-4">Comparaison Années/Mois</h2>

                        {/* Contrôles */}
                        <div className="space-y-4 mb-6">
                            {/* Toggle Mode */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setCompareMode('year'); }}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                        compareMode === 'year'
                                            ? 'bg-amber-300 text-slate-900'
                                            : 'bg-white/10 text-slate-300 hover:bg-white/20'
                                    }`}
                                >
                                    Années
                                </button>
                                <button
                                    onClick={() => { setCompareMode('month'); }}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                        compareMode === 'month'
                                            ? 'bg-amber-300 text-slate-900'
                                            : 'bg-white/10 text-slate-300 hover:bg-white/20'
                                    }`}
                                >
                                    Mois
                                </button>
                            </div>

                            {/* Sélecteurs */}
                            {compareMode === 'year' && (
                                <div className="flex gap-4 items-end">
                                    <div className="flex-1">
                                        <label className="block text-xs text-slate-400 mb-1">Année 1</label>
                                        <select
                                            value={year1}
                                            onChange={(e) => setYear1(parseInt(e.target.value))}
                                            className="w-full rounded-lg border border-white/15 bg-slate-800 px-3 py-2 text-white text-sm"
                                        >
                                            {yearOptions.map(year => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs text-slate-400 mb-1">Année 2</label>
                                        <select
                                            value={year2}
                                            onChange={(e) => setYear2(parseInt(e.target.value))}
                                            className="w-full rounded-lg border border-white/15 bg-slate-800 px-3 py-2 text-white text-sm"
                                        >
                                            {yearOptions.map(year => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button
                                        onClick={handleCompareChange}
                                        className="px-4 py-2 rounded-lg bg-amber-300 text-slate-900 text-sm font-medium hover:bg-amber-200 transition"
                                    >
                                        Comparer
                                    </button>
                                </div>
                            )}

                            {compareMode === 'month' && (
                                <div className="space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-4">
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">Mois 1</label>
                                            <select
                                                value={month1}
                                                onChange={(e) => setMonth1(parseInt(e.target.value))}
                                                className="w-full rounded-lg border border-white/15 bg-slate-800 px-3 py-2 text-white text-sm"
                                            >
                                                {monthOptions.map(m => (
                                                    <option key={m.value} value={m.value}>{m.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">Année 1</label>
                                            <select
                                                value={monthYear1}
                                                onChange={(e) => setMonthYear1(parseInt(e.target.value))}
                                                className="w-full rounded-lg border border-white/15 bg-slate-800 px-3 py-2 text-white text-sm"
                                            >
                                                {yearOptions.map(year => (
                                                    <option key={year} value={year}>{year}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">Mois 2</label>
                                            <select
                                                value={month2}
                                                onChange={(e) => setMonth2(parseInt(e.target.value))}
                                                className="w-full rounded-lg border border-white/15 bg-slate-800 px-3 py-2 text-white text-sm"
                                            >
                                                {monthOptions.map(m => (
                                                    <option key={m.value} value={m.value}>{m.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">Année 2</label>
                                            <select
                                                value={monthYear2}
                                                onChange={(e) => setMonthYear2(parseInt(e.target.value))}
                                                className="w-full rounded-lg border border-white/15 bg-slate-800 px-3 py-2 text-white text-sm"
                                            >
                                                {yearOptions.map(year => (
                                                    <option key={year} value={year}>{year}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleCompareChange}
                                        className="px-4 py-2 rounded-lg bg-amber-300 text-slate-900 text-sm font-medium hover:bg-amber-200 transition"
                                    >
                                        Comparer
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Cartes métriques */}
                        <div className="grid gap-4 sm:grid-cols-3 mb-6">
                            {/* CA */}
                            <div className="rounded-lg border border-white/10 bg-slate-900/50 p-4">
                                <p className="text-xs text-slate-400 mb-2">Chiffre d'affaires</p>
                                <div className="space-y-2">
                                    <div>
                                        <span className="text-xs text-slate-500">{comparisonData.label1}</span>
                                        <p className="text-lg font-bold text-amber-300">
                                            {formatCurrency(comparisonData.totals.revenue.v1, currencySymbol)}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-slate-500">{comparisonData.label2}</span>
                                        <p className="text-lg font-bold text-slate-300">
                                            {formatCurrency(comparisonData.totals.revenue.v2, currencySymbol)}
                                        </p>
                                    </div>
                                    <div className={`text-sm font-semibold ${comparisonData.totals.revenue.growth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {comparisonData.totals.revenue.growth >= 0 ? '+' : ''}{comparisonData.totals.revenue.growth}%
                                    </div>
                                </div>
                            </div>

                            {/* Ventes */}
                            <div className="rounded-lg border border-white/10 bg-slate-900/50 p-4">
                                <p className="text-xs text-slate-400 mb-2">Nombre de ventes</p>
                                <div className="space-y-2">
                                    <div>
                                        <span className="text-xs text-slate-500">{comparisonData.label1}</span>
                                        <p className="text-lg font-bold text-amber-300">
                                            {comparisonData.totals.sales.v1}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-slate-500">{comparisonData.label2}</span>
                                        <p className="text-lg font-bold text-slate-300">
                                            {comparisonData.totals.sales.v2}
                                        </p>
                                    </div>
                                    <div className={`text-sm font-semibold ${comparisonData.totals.sales.growth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {comparisonData.totals.sales.growth >= 0 ? '+' : ''}{comparisonData.totals.sales.growth}%
                                    </div>
                                </div>
                            </div>

                            {/* Bénéfice */}
                            <div className="rounded-lg border border-white/10 bg-slate-900/50 p-4">
                                <p className="text-xs text-slate-400 mb-2">Bénéfice brut</p>
                                <div className="space-y-2">
                                    <div>
                                        <span className="text-xs text-slate-500">{comparisonData.label1}</span>
                                        <p className="text-lg font-bold text-amber-300">
                                            {formatCurrency(comparisonData.totals.profit.v1, currencySymbol)}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-slate-500">{comparisonData.label2}</span>
                                        <p className="text-lg font-bold text-slate-300">
                                            {formatCurrency(comparisonData.totals.profit.v2, currencySymbol)}
                                        </p>
                                    </div>
                                    <div className={`text-sm font-semibold ${comparisonData.totals.profit.growth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {comparisonData.totals.profit.growth >= 0 ? '+' : ''}{comparisonData.totals.profit.growth}%
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Graphique recharts */}
                        <div className="mt-6">
                            <p className="text-sm text-slate-400 mb-4">Chiffre d'affaires par {compareMode === 'year' ? 'mois' : 'jour'}</p>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={comparisonData.chart} barGap={4} barSize={14}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis
                                        dataKey="label"
                                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                                    />
                                    <YAxis
                                        tickFormatter={formatNumber}
                                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                                    />
                                    <Tooltip
                                        formatter={(value: number | undefined) => value ? formatCurrency(value, currencySymbol) : '-'}
                                        contentStyle={{
                                            background: '#1e293b',
                                            border: '1px solid #334155',
                                            borderRadius: 8,
                                        }}
                                        labelStyle={{ color: '#cbd5e1' }}
                                    />
                                    <Legend wrapperStyle={{ color: '#cbd5e1', fontSize: 12 }} />
                                    <Bar
                                        dataKey="revenue1"
                                        name={comparisonData.label1}
                                        fill="#fbbf24"
                                        radius={[4, 4, 0, 0]}
                                    />
                                    <Bar
                                        dataKey="revenue2"
                                        name={comparisonData.label2}
                                        fill="#60a5fa"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Grille des analyses */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Top Produits */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="rounded-lg bg-emerald-400/15 p-2">
                                <Package className="size-5 text-emerald-400" />
                            </div>
                            <h2 className="text-lg font-semibold text-white">Top 10 Produits</h2>
                        </div>
                        
                        {topProducts.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-8">Aucune vente sur cette période</p>
                        ) : (
                            <div className="space-y-3">
                                {topProducts.map((product, index) => (
                                    <div key={product.id} className="flex items-center gap-3">
                                        <span className={`flex shrink-0 items-center justify-center size-6 rounded-full text-xs font-bold ${
                                            index < 3 ? 'bg-amber-400 text-slate-900' : 'bg-slate-700 text-slate-300'
                                        }`}>
                                            {index + 1}
                                        </span>
                                        <ProductImage src={product.image} name={product.name} thumbnailClass="size-9" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">{product.name}</p>
                                            <p className="text-xs text-slate-400">{product.quantity} vendus</p>
                                        </div>
                                        <span className="text-sm font-semibold text-emerald-400 shrink-0">
                                            {formatCurrency(product.revenue, currencySymbol)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Ventes par catégorie */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="rounded-lg bg-purple-400/15 p-2">
                                <BarChart3 className="size-5 text-purple-400" />
                            </div>
                            <h2 className="text-lg font-semibold text-white">Ventes par catégorie</h2>
                        </div>
                        
                        {salesByCategory.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-8">Aucune vente sur cette période</p>
                        ) : (
                            <div className="space-y-3">
                                {salesByCategory.map((category, index) => (
                                    <div key={category.name} className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-white">{category.name}</span>
                                            <span className="text-sm text-slate-400">
                                                {formatCurrency(category.revenue, currencySymbol)} ({category.percentage}%)
                                            </span>
                                        </div>
                                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${chartColors[index % chartColors.length]} transition-all duration-500`}
                                                style={{ width: `${category.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Top Clients */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="rounded-lg bg-blue-400/15 p-2">
                                <Users className="size-5 text-blue-400" />
                            </div>
                            <h2 className="text-lg font-semibold text-white">Meilleurs clients</h2>
                        </div>
                        
                        {topCustomers.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-8">Aucun client identifié sur cette période</p>
                        ) : (
                            <div className="space-y-3">
                                {topCustomers.slice(0, 5).map((customer, index) => (
                                    <div key={customer.id} className="flex items-center gap-3">
                                        <span className={`flex items-center justify-center size-6 rounded-full text-xs font-bold ${
                                            index < 3 ? 'bg-blue-400 text-slate-900' : 'bg-slate-700 text-slate-300'
                                        }`}>
                                            {index + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">{customer.name}</p>
                                            <p className="text-xs text-slate-400">{customer.salesCount} achats</p>
                                        </div>
                                        <span className="text-sm font-semibold text-blue-400">
                                            {formatCurrency(customer.totalSpent, currencySymbol)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Méthodes de paiement */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="rounded-lg bg-rose-400/15 p-2">
                                <CreditCard className="size-5 text-rose-400" />
                            </div>
                            <h2 className="text-lg font-semibold text-white">Méthodes de paiement</h2>
                        </div>
                        
                        {paymentMethods.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-8">Aucune vente sur cette période</p>
                        ) : (
                            <div className="space-y-3">
                                {paymentMethods.map((method, index) => (
                                    <div key={method.method} className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-white">{method.method}</span>
                                            <span className="text-sm text-slate-400">
                                                {method.count} ({method.percentage}%)
                                            </span>
                                        </div>
                                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${chartColors[index % chartColors.length]} transition-all duration-500`}
                                                style={{ width: `${method.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Performance par boutique */}
                {shopPerformance.length > 1 && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="rounded-lg bg-cyan-400/15 p-2">
                                <Store className="size-5 text-cyan-400" />
                            </div>
                            <h2 className="text-lg font-semibold text-white">Performance par boutique</h2>
                        </div>
                        
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {shopPerformance.map((shop, index) => (
                                <div 
                                    key={shop.id}
                                    className="rounded-xl border border-white/10 bg-slate-900/50 p-4"
                                >
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className={`flex items-center justify-center size-6 rounded-full text-xs font-bold ${
                                            index === 0 ? 'bg-amber-400 text-slate-900' : 'bg-slate-700 text-slate-300'
                                        }`}>
                                            {index + 1}
                                        </span>
                                        <h3 className="font-medium text-white truncate">{shop.name}</h3>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">CA</span>
                                            <span className="font-semibold text-emerald-400">
                                                {formatCurrency(shop.revenue, currencySymbol)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">Ventes</span>
                                            <span className="text-white">{shop.salesCount}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

// Composant KPI Card
function KPICard({
    label,
    value,
    growth,
    subValue,
    icon: Icon,
    color,
}: {
    label: string;
    value: string;
    growth?: number;
    subValue?: string;
    icon: React.ElementType;
    color: 'amber' | 'emerald' | 'blue' | 'purple' | 'rose';
}) {
    const colorClasses = {
        amber: 'bg-amber-400/15 text-amber-400',
        emerald: 'bg-emerald-400/15 text-emerald-400',
        blue: 'bg-blue-400/15 text-blue-400',
        purple: 'bg-purple-400/15 text-purple-400',
        rose: 'bg-rose-400/15 text-rose-400',
    };

    return (
        <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <div className="flex items-start justify-between">
                <p className="text-xs text-slate-400">{label}</p>
                <div className={`rounded-lg p-2 ${colorClasses[color]}`}>
                    <Icon className="size-4" />
                </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-white">{value}</p>
            {subValue && (
                <p className="mt-0.5 text-xs text-slate-400">{subValue}</p>
            )}
            {growth !== undefined && (
                <p className={`mt-1 inline-flex items-center gap-1 text-xs ${growth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {growth >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                    {growth >= 0 ? '+' : ''}{growth}% vs période préc.
                </p>
            )}
        </article>
    );
}
