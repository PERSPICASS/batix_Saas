import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Calendar, Package, ShoppingCart, Store, TrendingUp, Wallet } from 'lucide-react';
import FreeTrialBanner from '@/Components/FreeTrialBanner';
import SubscriptionGraceBanner from '@/Components/SubscriptionGraceBanner';
import GettingStarted from '@/Components/GettingStarted';
import { useLocale } from '@/contexts/LocaleContext';

interface PerformanceItem {
    label: string;
    shortLabel: string;
    total: number;
    percentage: number;
}

interface DashboardProps {
    stats: {
        todaySales: number;
        salesTrend: number;
        activeShops: number;
        totalShops: number;
        productsInStock: number;
        newProductsThisWeek: number;
        lowStockAlerts: number;
    };
    performanceData: {
        items: PerformanceItem[];
        total: number;
        periodLabel: string;
    };
    currentPeriod: string;
    recentActivities: Array<{
        type: string;
        title: string;
        description: string;
        shop: string;
        time: string;
    }>;
    currencySymbol: string;
    onboarding: {
        has_shop: boolean;
        has_product: boolean;
        has_sale: boolean;
        is_complete: boolean;
    };
}

function formatNumber(value: number): string {
    if (value >= 1000000) {
        return (value / 1000000).toFixed(1).replace('.', ',') + 'M';
    }
    if (value >= 1000) {
        return (value / 1000).toFixed(0) + 'k';
    }
    return value.toLocaleString('fr-FR');
}

function formatCurrency(value: number, symbol: string): string {
    return formatNumber(value) + ' ' + symbol;
}

export default function Dashboard({ stats, performanceData, currentPeriod, recentActivities, currencySymbol, onboarding }: DashboardProps) {
    const { t } = useLocale();

    const periods = [
        { value: 'day', label: t.dashboard.periods.day, shortLabel: t.dashboard.periods.dayShort },
        { value: 'week', label: t.dashboard.periods.week, shortLabel: t.dashboard.periods.weekShort },
        { value: 'month', label: t.dashboard.periods.month, shortLabel: t.dashboard.periods.monthShort },
        { value: 'quarter', label: t.dashboard.periods.quarter, shortLabel: t.dashboard.periods.quarterShort },
        { value: 'semester', label: t.dashboard.periods.semester, shortLabel: t.dashboard.periods.semesterShort },
        { value: 'year', label: t.dashboard.periods.year, shortLabel: t.dashboard.periods.yearShort },
    ];

    const handlePeriodChange = (period: string) => {
        router.get(window.location.pathname, { period }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const kpis = [
        {
            label: t.dashboard.kpis.revenue,
            value: formatCurrency(stats.todaySales, currencySymbol),
            trend: stats.salesTrend,
            trendLabel: stats.salesTrend >= 0 ? `+${stats.salesTrend}%` : `${stats.salesTrend}%`,
            icon: Wallet,
            positive: stats.salesTrend >= 0,
        },
        {
            label: t.dashboard.kpis.activeShops,
            value: `${stats.activeShops} / ${stats.totalShops}`,
            trend: null,
            trendLabel: t.dashboard.kpis.online,
            icon: Store,
            positive: true,
        },
        {
            label: t.dashboard.kpis.productsInStock,
            value: formatNumber(stats.productsInStock),
            trend: stats.newProductsThisWeek,
            trendLabel: t.dashboard.kpis.thisWeek(stats.newProductsThisWeek),
            icon: Package,
            positive: true,
        },
        {
            label: t.dashboard.kpis.stockAlerts,
            value: stats.lowStockAlerts.toString(),
            trend: null,
            trendLabel: stats.lowStockAlerts > 0 ? t.dashboard.kpis.toProcess : t.dashboard.kpis.ok,
            icon: AlertTriangle,
            positive: stats.lowStockAlerts === 0,
        },
    ];

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'sale':
                return <ShoppingCart className="size-4 text-emerald-400" />;
            case 'low_stock':
                return <AlertTriangle className="size-4 text-amber-400" />;
            case 'stock_movement':
                return <TrendingUp className="size-4 text-blue-400" />;
            default:
                return <Package className="size-4 text-slate-400" />;
        }
    };

    const getGridCols = () => {
        const count = performanceData.items.length;
        if (count <= 4) return 'grid-cols-4';
        if (count <= 6) return 'grid-cols-6';
        if (count <= 7) return 'grid-cols-7';
        if (count <= 12) return 'grid-cols-12';
        return 'grid-cols-12';
    };

    return (
        <AuthenticatedLayout
            header={<h1 className="text-xl font-semibold text-slate-900 dark:text-white">{t.dashboard.title}</h1>}
        >
            <Head title={t.dashboard.title} />

            <section className="space-y-6">
                <FreeTrialBanner />
                <SubscriptionGraceBanner />
                <GettingStarted onboarding={onboarding} />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {kpis.map((kpi) => (
                        <article
                            key={kpi.label}
                            className="rounded-2xl border border-gray-200 bg-white p-5 backdrop-blur-xl dark:border-white/10 dark:bg-white/5"
                        >
                            <div className="flex items-start justify-between">
                                <p className="text-sm text-slate-600 dark:text-slate-300">{kpi.label}</p>
                                <div className={`rounded-lg p-2 ${kpi.positive ? 'bg-amber-100 text-amber-700 dark:bg-amber-300/15 dark:text-amber-200' : 'bg-red-100 text-red-600 dark:bg-red-400/15 dark:text-red-300'}`}>
                                    <kpi.icon className="size-4" />
                                </div>
                            </div>
                            <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{kpi.value}</p>
                            <p className={`mt-1 inline-flex items-center gap-1 text-xs ${kpi.positive ? 'text-emerald-600 dark:text-emerald-300' : 'text-red-600 dark:text-red-300'}`}>
                                {kpi.trend !== null && (
                                    kpi.positive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />
                                )}
                                {kpi.trendLabel}
                            </p>
                        </article>
                    ))}
                </div>

                <div className="grid gap-4 xl:grid-cols-3">
                    <article className="rounded-2xl border border-gray-200 bg-white p-6 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 xl:col-span-2">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t.dashboard.performance.title}</h2>
                                <p className="mt-1 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                    <Calendar className="size-4" />
                                    {performanceData.periodLabel}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-1">
                                {periods.map((period) => (
                                    <button
                                        key={period.value}
                                        onClick={() => handlePeriodChange(period.value)}
                                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                                            currentPeriod === period.value
                                                ? 'bg-amber-300 text-slate-900'
                                                : 'bg-gray-100 text-slate-600 hover:bg-gray-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10'
                                        }`}
                                    >
                                        <span className="hidden sm:inline">{period.label}</span>
                                        <span className="sm:hidden">{period.shortLabel}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={`mt-6 ${currentPeriod === 'day' ? 'overflow-x-auto' : ''}`}>
                            <div className={`grid gap-1 ${currentPeriod === 'day' ? 'min-w-[800px] grid-cols-12' : getGridCols()}`}>
                                {performanceData.items.map((item, index) => (
                                    <div key={index} className="flex flex-col items-center gap-2">
                                        <div className="flex h-32 w-full items-end rounded-lg bg-gray-100 p-1 dark:bg-slate-900/60">
                                            <div
                                                className="w-full rounded-md bg-gradient-to-t from-amber-300 to-orange-300 transition-all duration-300"
                                                style={{ height: `${Math.max(item.percentage, 5)}%` }}
                                                title={`${formatCurrency(item.total, currencySymbol)}`}
                                            />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] font-medium text-slate-600 dark:text-slate-300 truncate max-w-[60px]">
                                                {item.shortLabel}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {currentPeriod === 'day' && (
                                <p className="mt-2 text-xs text-slate-500 text-center">
                                    {t.dashboard.performance.scrollHint}
                                </p>
                            )}
                        </div>

                        {performanceData.items.length > 0 && (
                            <div className="mt-4 flex items-center justify-between text-sm border-t border-gray-200 pt-4 dark:border-white/10">
                                <span className="text-slate-500 dark:text-slate-400">{t.dashboard.performance.totalLabel}</span>
                                <span className="font-semibold text-slate-900 dark:text-white text-lg">
                                    {formatCurrency(performanceData.total, currencySymbol)}
                                </span>
                            </div>
                        )}
                    </article>

                    <article className="rounded-2xl border border-gray-200 bg-white p-6 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t.dashboard.recentActivity.title}</h2>
                        {recentActivities.length === 0 ? (
                            <div className="mt-4 flex flex-col items-center justify-center py-8 text-center">
                                <Package className="size-12 text-slate-300 dark:text-slate-600" />
                                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t.dashboard.recentActivity.empty}</p>
                                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                                    {t.dashboard.recentActivity.emptyHint}
                                </p>
                            </div>
                        ) : (
                            <ul className="mt-4 space-y-3">
                                {recentActivities.map((event, index) => (
                                    <li
                                        key={index}
                                        className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-slate-900/70"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5">
                                                {getActivityIcon(event.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">{event.title}</p>
                                                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 truncate">{event.description}</p>
                                                {event.shop && (
                                                    <p className="mt-1 text-[11px] text-slate-500">{event.shop}</p>
                                                )}
                                                <p className="mt-1 text-[11px] text-slate-400">{event.time}</p>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </article>
                </div>
            </section>
        </AuthenticatedLayout>
    );
}
