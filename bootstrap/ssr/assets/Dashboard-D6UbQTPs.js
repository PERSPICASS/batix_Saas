import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { a as usePage, L as Link_default, H as Head_default, r as router3 } from "../ssr.js";
import { Clock, Zap, Wallet, Store, Package, AlertTriangle, ArrowUpRight, ArrowDownRight, Calendar, TrendingUp, ShoppingCart } from "lucide-react";
import "react";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
function FreeTrialBanner() {
  const { subscription } = usePage().props;
  if (!subscription || !subscription.has_subscription || subscription.plan_slug !== "free") {
    return null;
  }
  const expiresAt = subscription.expires_at ? new Date(subscription.expires_at) : null;
  const now = /* @__PURE__ */ new Date();
  const daysRemaining = expiresAt ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1e3 * 60 * 60 * 24)) : 0;
  const isUrgent = daysRemaining <= 7;
  const isWarning = daysRemaining > 7 && daysRemaining <= 14;
  const bgColor = isUrgent ? "bg-gradient-to-r from-rose-500/20 to-orange-500/20 border-rose-500/30" : isWarning ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/30" : "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30";
  const textColor = isUrgent ? "text-rose-200" : isWarning ? "text-amber-200" : "text-blue-200";
  const iconColor = isUrgent ? "text-rose-300" : isWarning ? "text-amber-300" : "text-blue-300";
  return /* @__PURE__ */ jsx("div", { className: `rounded-xl border p-4 ${bgColor}`, children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 flex-1", children: [
      /* @__PURE__ */ jsx("div", { className: `rounded-lg bg-white/10 p-2 ${iconColor}`, children: /* @__PURE__ */ jsx(Clock, { className: "size-5" }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsxs("h3", { className: "font-semibold text-white", children: [
          "Plan Gratuit - Essai ",
          daysRemaining,
          " jour",
          daysRemaining > 1 ? "s" : "",
          " restant",
          daysRemaining > 1 ? "s" : ""
        ] }),
        /* @__PURE__ */ jsx("p", { className: `mt-1 text-sm ${textColor}`, children: isUrgent ? /* @__PURE__ */ jsx(Fragment, { children: "⚠️ Votre essai gratuit se termine bientôt. Passez à un plan payant pour continuer à utiliser toutes les fonctionnalités." }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          "Profitez de votre essai gratuit ! Vous pouvez créer ",
          /* @__PURE__ */ jsx("strong", { children: "1 boutique" }),
          " et ",
          /* @__PURE__ */ jsx("strong", { children: "2 utilisateurs" }),
          "."
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(
      Link_default,
      {
        href: "/plans",
        className: "inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-400 to-orange-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:from-amber-300 hover:to-orange-300 whitespace-nowrap shadow-lg shadow-amber-500/20",
        children: [
          /* @__PURE__ */ jsx(Zap, { className: "size-4" }),
          "Changer de plan"
        ]
      }
    )
  ] }) });
}
const periods = [
  { value: "day", label: "Jour", shortLabel: "24h" },
  { value: "week", label: "Semaine", shortLabel: "7j" },
  { value: "month", label: "Mois", shortLabel: "4sem" },
  { value: "quarter", label: "Trimestre", shortLabel: "3m" },
  { value: "semester", label: "Semestre", shortLabel: "6m" },
  { value: "year", label: "Année", shortLabel: "12m" }
];
function formatNumber(value) {
  if (value >= 1e6) {
    return (value / 1e6).toFixed(1).replace(".", ",") + "M";
  }
  if (value >= 1e3) {
    return (value / 1e3).toFixed(0) + "k";
  }
  return value.toLocaleString("fr-FR");
}
function formatCurrency(value, symbol) {
  return formatNumber(value) + " " + symbol;
}
function Dashboard({ stats, performanceData, currentPeriod, recentActivities, currencySymbol }) {
  const handlePeriodChange = (period) => {
    router3.get(window.location.pathname, { period }, {
      preserveState: true,
      preserveScroll: true
    });
  };
  const kpis = [
    {
      label: "CA du jour",
      value: formatCurrency(stats.todaySales, currencySymbol),
      trend: stats.salesTrend,
      trendLabel: stats.salesTrend >= 0 ? `+${stats.salesTrend}%` : `${stats.salesTrend}%`,
      icon: Wallet,
      positive: stats.salesTrend >= 0
    },
    {
      label: "Boutiques actives",
      value: `${stats.activeShops} / ${stats.totalShops}`,
      trend: null,
      trendLabel: "En ligne",
      icon: Store,
      positive: true
    },
    {
      label: "Produits en stock",
      value: formatNumber(stats.productsInStock),
      trend: stats.newProductsThisWeek,
      trendLabel: `+${stats.newProductsThisWeek} cette semaine`,
      icon: Package,
      positive: true
    },
    {
      label: "Alertes stock",
      value: stats.lowStockAlerts.toString(),
      trend: null,
      trendLabel: stats.lowStockAlerts > 0 ? "À traiter" : "RAS",
      icon: AlertTriangle,
      positive: stats.lowStockAlerts === 0
    }
  ];
  const getActivityIcon = (type) => {
    switch (type) {
      case "sale":
        return /* @__PURE__ */ jsx(ShoppingCart, { className: "size-4 text-emerald-400" });
      case "low_stock":
        return /* @__PURE__ */ jsx(AlertTriangle, { className: "size-4 text-amber-400" });
      case "stock_movement":
        return /* @__PURE__ */ jsx(TrendingUp, { className: "size-4 text-blue-400" });
      default:
        return /* @__PURE__ */ jsx(Package, { className: "size-4 text-slate-400" });
    }
  };
  const getGridCols = () => {
    const count = performanceData.items.length;
    if (count <= 4) return "grid-cols-4";
    if (count <= 6) return "grid-cols-6";
    if (count <= 7) return "grid-cols-7";
    if (count <= 12) return "grid-cols-12";
    return "grid-cols-12";
  };
  return /* @__PURE__ */ jsxs(
    Authenticated,
    {
      header: /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-white", children: "Dashboard" }),
      children: [
        /* @__PURE__ */ jsx(Head_default, { title: "Dashboard" }),
        /* @__PURE__ */ jsxs("section", { className: "space-y-6", children: [
          /* @__PURE__ */ jsx(FreeTrialBanner, {}),
          /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4", children: kpis.map((kpi) => /* @__PURE__ */ jsxs(
            "article",
            {
              className: "rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-300", children: kpi.label }),
                  /* @__PURE__ */ jsx("div", { className: `rounded-lg p-2 ${kpi.positive ? "bg-amber-300/15 text-amber-200" : "bg-red-400/15 text-red-300"}`, children: /* @__PURE__ */ jsx(kpi.icon, { className: "size-4" }) })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "mt-3 text-3xl font-bold text-white", children: kpi.value }),
                /* @__PURE__ */ jsxs("p", { className: `mt-1 inline-flex items-center gap-1 text-xs ${kpi.positive ? "text-emerald-300" : "text-red-300"}`, children: [
                  kpi.trend !== null && (kpi.positive ? /* @__PURE__ */ jsx(ArrowUpRight, { className: "size-3.5" }) : /* @__PURE__ */ jsx(ArrowDownRight, { className: "size-3.5" })),
                  kpi.trendLabel
                ] })
              ]
            },
            kpi.label
          )) }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-4 xl:grid-cols-3", children: [
            /* @__PURE__ */ jsxs("article", { className: "rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl xl:col-span-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-white", children: "Performance" }),
                  /* @__PURE__ */ jsxs("p", { className: "mt-1 flex items-center gap-2 text-sm text-slate-300", children: [
                    /* @__PURE__ */ jsx(Calendar, { className: "size-4" }),
                    performanceData.periodLabel
                  ] })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1", children: periods.map((period) => /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => handlePeriodChange(period.value),
                    className: `rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${currentPeriod === period.value ? "bg-amber-300 text-slate-900" : "bg-white/5 text-slate-300 hover:bg-white/10"}`,
                    children: [
                      /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: period.label }),
                      /* @__PURE__ */ jsx("span", { className: "sm:hidden", children: period.shortLabel })
                    ]
                  },
                  period.value
                )) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: `mt-6 ${currentPeriod === "day" ? "overflow-x-auto" : ""}`, children: [
                /* @__PURE__ */ jsx("div", { className: `grid gap-1 ${currentPeriod === "day" ? "min-w-[800px] grid-cols-12" : getGridCols()}`, children: performanceData.items.map((item, index) => /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-2", children: [
                  /* @__PURE__ */ jsx("div", { className: "flex h-32 w-full items-end rounded-lg bg-slate-900/60 p-1", children: /* @__PURE__ */ jsx(
                    "div",
                    {
                      className: "w-full rounded-md bg-gradient-to-t from-amber-300 to-orange-300 transition-all duration-300",
                      style: { height: `${Math.max(item.percentage, 5)}%` },
                      title: `${formatCurrency(item.total, currencySymbol)}`
                    }
                  ) }),
                  /* @__PURE__ */ jsx("div", { className: "text-center", children: /* @__PURE__ */ jsx("p", { className: "text-[10px] font-medium text-slate-300 truncate max-w-[60px]", children: item.shortLabel }) })
                ] }, index)) }),
                currentPeriod === "day" && /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs text-slate-500 text-center", children: "Faites défiler pour voir les 24 heures" })
              ] }),
              performanceData.items.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center justify-between text-sm border-t border-white/10 pt-4", children: [
                /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Total période:" }),
                /* @__PURE__ */ jsx("span", { className: "font-semibold text-white text-lg", children: formatCurrency(performanceData.total, currencySymbol) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("article", { className: "rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl", children: [
              /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-white", children: "Activité récente" }),
              recentActivities.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "mt-4 flex flex-col items-center justify-center py-8 text-center", children: [
                /* @__PURE__ */ jsx(Package, { className: "size-12 text-slate-600" }),
                /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-slate-400", children: "Aucune activité récente" }),
                /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-slate-500", children: "Les ventes et mouvements de stock apparaîtront ici" })
              ] }) : /* @__PURE__ */ jsx("ul", { className: "mt-4 space-y-3", children: recentActivities.map((event, index) => /* @__PURE__ */ jsx(
                "li",
                {
                  className: "rounded-xl border border-white/10 bg-slate-900/70 p-3",
                  children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
                    /* @__PURE__ */ jsx("div", { className: "mt-0.5", children: getActivityIcon(event.type) }),
                    /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                      /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-white", children: event.title }),
                      /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-slate-300 truncate", children: event.description }),
                      event.shop && /* @__PURE__ */ jsx("p", { className: "mt-1 text-[11px] text-slate-500", children: event.shop }),
                      /* @__PURE__ */ jsx("p", { className: "mt-1 text-[11px] text-slate-400", children: event.time })
                    ] })
                  ] })
                },
                index
              )) })
            ] })
          ] })
        ] })
      ]
    }
  );
}
export {
  Dashboard as default
};
