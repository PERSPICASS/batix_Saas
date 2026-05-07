import { jsxs, jsx } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { H as Head_default, r as router3 } from "../ssr.js";
import { Wallet, ShoppingCart, TrendingUp, Percent, Users, BarChart3, Package, CreditCard, Store, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { P as ProductImage } from "./ProductImage-5zmeiiH5.js";
import "react";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
const periods = [
  { value: "today", label: "Aujourd'hui" },
  { value: "week", label: "Cette semaine" },
  { value: "month", label: "Ce mois" },
  { value: "quarter", label: "Ce trimestre" },
  { value: "year", label: "Cette année" }
];
function formatNumber(value) {
  if (value >= 1e6) {
    return (value / 1e6).toFixed(1).replace(".", ",") + "M";
  }
  if (value >= 1e3) {
    return Math.round(value / 1e3) + "k";
  }
  return value.toLocaleString("fr-FR");
}
function formatCurrency(value, symbol) {
  return formatNumber(value) + " " + symbol;
}
const chartColors = [
  "bg-amber-400",
  "bg-orange-400",
  "bg-rose-400",
  "bg-purple-400",
  "bg-blue-400",
  "bg-cyan-400",
  "bg-emerald-400",
  "bg-lime-400"
];
function Index({
  kpis,
  salesChart,
  topProducts,
  salesByCategory,
  topCustomers,
  paymentMethods,
  shopPerformance,
  currentPeriod,
  currencySymbol
}) {
  const handlePeriodChange = (period) => {
    router3.get(window.location.pathname, { period }, {
      preserveState: true,
      preserveScroll: true
    });
  };
  const maxChartValue = Math.max(...salesChart.map((item) => item.value), 1);
  return /* @__PURE__ */ jsxs(
    Authenticated,
    {
      header: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-white", children: "Analytics" }),
        /* @__PURE__ */ jsx("div", { className: "flex gap-1", children: periods.map((period) => /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => handlePeriodChange(period.value),
            className: `rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${currentPeriod === period.value ? "bg-amber-300 text-slate-900" : "bg-white/10 text-slate-300 hover:bg-white/20"}`,
            children: period.label
          },
          period.value
        )) })
      ] }),
      children: [
        /* @__PURE__ */ jsx(Head_default, { title: "Analytics" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-5", children: [
            /* @__PURE__ */ jsx(
              KPICard,
              {
                label: "Chiffre d'affaires",
                value: formatCurrency(kpis.revenue.value, currencySymbol),
                growth: kpis.revenue.growth,
                icon: Wallet,
                color: "amber"
              }
            ),
            /* @__PURE__ */ jsx(
              KPICard,
              {
                label: "Nombre de ventes",
                value: kpis.salesCount.value.toString(),
                growth: kpis.salesCount.growth,
                icon: ShoppingCart,
                color: "emerald"
              }
            ),
            /* @__PURE__ */ jsx(
              KPICard,
              {
                label: "Panier moyen",
                value: formatCurrency(kpis.avgBasket.value, currencySymbol),
                growth: kpis.avgBasket.growth,
                icon: TrendingUp,
                color: "blue"
              }
            ),
            /* @__PURE__ */ jsx(
              KPICard,
              {
                label: "Taux de marge",
                value: `${kpis.marginRate.value}%`,
                subValue: kpis.marginRate.margin ? formatCurrency(kpis.marginRate.margin, currencySymbol) : void 0,
                icon: Percent,
                color: "purple"
              }
            ),
            /* @__PURE__ */ jsx(
              KPICard,
              {
                label: "Nouveaux clients",
                value: kpis.newCustomers.value.toString(),
                icon: Users,
                color: "rose"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-6", children: [
              /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-amber-300/15 p-2", children: /* @__PURE__ */ jsx(BarChart3, { className: "size-5 text-amber-300" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-white", children: "Évolution des ventes" }),
                /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-400", children: [
                  "Total: ",
                  formatCurrency(salesChart.reduce((sum, item) => sum + item.value, 0), currencySymbol)
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex items-end gap-2 h-48", children: salesChart.map((item, index) => /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col items-center gap-2", children: [
              /* @__PURE__ */ jsx("div", { className: "w-full flex items-end justify-center h-40 bg-slate-900/40 rounded-lg p-1", children: /* @__PURE__ */ jsx(
                "div",
                {
                  className: "w-full max-w-[40px] rounded-md bg-gradient-to-t from-amber-400 to-orange-300 transition-all duration-300",
                  style: { height: `${Math.max(item.value / maxChartValue * 100, 3)}%` },
                  title: formatCurrency(item.value, currencySymbol)
                }
              ) }),
              /* @__PURE__ */ jsx("span", { className: "text-[10px] text-slate-400 truncate max-w-full", children: item.label })
            ] }, index)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
                /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-emerald-400/15 p-2", children: /* @__PURE__ */ jsx(Package, { className: "size-5 text-emerald-400" }) }),
                /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-white", children: "Top 10 Produits" })
              ] }),
              topProducts.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400 text-center py-8", children: "Aucune vente sur cette période" }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: topProducts.map((product, index) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("span", { className: `flex shrink-0 items-center justify-center size-6 rounded-full text-xs font-bold ${index < 3 ? "bg-amber-400 text-slate-900" : "bg-slate-700 text-slate-300"}`, children: index + 1 }),
                /* @__PURE__ */ jsx(ProductImage, { src: product.image, name: product.name, thumbnailClass: "size-9" }),
                /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-white truncate", children: product.name }),
                  /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400", children: [
                    product.quantity,
                    " vendus"
                  ] })
                ] }),
                /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-emerald-400 shrink-0", children: formatCurrency(product.revenue, currencySymbol) })
              ] }, product.id)) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
                /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-purple-400/15 p-2", children: /* @__PURE__ */ jsx(BarChart3, { className: "size-5 text-purple-400" }) }),
                /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-white", children: "Ventes par catégorie" })
              ] }),
              salesByCategory.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400 text-center py-8", children: "Aucune vente sur cette période" }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: salesByCategory.map((category, index) => /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-sm text-white", children: category.name }),
                  /* @__PURE__ */ jsxs("span", { className: "text-sm text-slate-400", children: [
                    formatCurrency(category.revenue, currencySymbol),
                    " (",
                    category.percentage,
                    "%)"
                  ] })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "h-2 bg-slate-800 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: `h-full ${chartColors[index % chartColors.length]} transition-all duration-500`,
                    style: { width: `${category.percentage}%` }
                  }
                ) })
              ] }, category.name)) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
                /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-blue-400/15 p-2", children: /* @__PURE__ */ jsx(Users, { className: "size-5 text-blue-400" }) }),
                /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-white", children: "Meilleurs clients" })
              ] }),
              topCustomers.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400 text-center py-8", children: "Aucun client identifié sur cette période" }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: topCustomers.slice(0, 5).map((customer, index) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("span", { className: `flex items-center justify-center size-6 rounded-full text-xs font-bold ${index < 3 ? "bg-blue-400 text-slate-900" : "bg-slate-700 text-slate-300"}`, children: index + 1 }),
                /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-white truncate", children: customer.name }),
                  /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400", children: [
                    customer.salesCount,
                    " achats"
                  ] })
                ] }),
                /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-blue-400", children: formatCurrency(customer.totalSpent, currencySymbol) })
              ] }, customer.id)) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
                /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-rose-400/15 p-2", children: /* @__PURE__ */ jsx(CreditCard, { className: "size-5 text-rose-400" }) }),
                /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-white", children: "Méthodes de paiement" })
              ] }),
              paymentMethods.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400 text-center py-8", children: "Aucune vente sur cette période" }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: paymentMethods.map((method, index) => /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-sm text-white", children: method.method }),
                  /* @__PURE__ */ jsxs("span", { className: "text-sm text-slate-400", children: [
                    method.count,
                    " (",
                    method.percentage,
                    "%)"
                  ] })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "h-2 bg-slate-800 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: `h-full ${chartColors[index % chartColors.length]} transition-all duration-500`,
                    style: { width: `${method.percentage}%` }
                  }
                ) })
              ] }, method.method)) })
            ] })
          ] }),
          shopPerformance.length > 1 && /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
              /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-cyan-400/15 p-2", children: /* @__PURE__ */ jsx(Store, { className: "size-5 text-cyan-400" }) }),
              /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-white", children: "Performance par boutique" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: shopPerformance.map((shop, index) => /* @__PURE__ */ jsxs(
              "div",
              {
                className: "rounded-xl border border-white/10 bg-slate-900/50 p-4",
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
                    /* @__PURE__ */ jsx("span", { className: `flex items-center justify-center size-6 rounded-full text-xs font-bold ${index === 0 ? "bg-amber-400 text-slate-900" : "bg-slate-700 text-slate-300"}`, children: index + 1 }),
                    /* @__PURE__ */ jsx("h3", { className: "font-medium text-white truncate", children: shop.name })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
                      /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "CA" }),
                      /* @__PURE__ */ jsx("span", { className: "font-semibold text-emerald-400", children: formatCurrency(shop.revenue, currencySymbol) })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
                      /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Ventes" }),
                      /* @__PURE__ */ jsx("span", { className: "text-white", children: shop.salesCount })
                    ] })
                  ] })
                ]
              },
              shop.id
            )) })
          ] })
        ] })
      ]
    }
  );
}
function KPICard({
  label,
  value,
  growth,
  subValue,
  icon: Icon,
  color
}) {
  const colorClasses = {
    amber: "bg-amber-400/15 text-amber-400",
    emerald: "bg-emerald-400/15 text-emerald-400",
    blue: "bg-blue-400/15 text-blue-400",
    purple: "bg-purple-400/15 text-purple-400",
    rose: "bg-rose-400/15 text-rose-400"
  };
  return /* @__PURE__ */ jsxs("article", { className: "rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
      /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: label }),
      /* @__PURE__ */ jsx("div", { className: `rounded-lg p-2 ${colorClasses[color]}`, children: /* @__PURE__ */ jsx(Icon, { className: "size-4" }) })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-2xl font-bold text-white", children: value }),
    subValue && /* @__PURE__ */ jsx("p", { className: "mt-0.5 text-xs text-slate-400", children: subValue }),
    growth !== void 0 && /* @__PURE__ */ jsxs("p", { className: `mt-1 inline-flex items-center gap-1 text-xs ${growth >= 0 ? "text-emerald-400" : "text-red-400"}`, children: [
      growth >= 0 ? /* @__PURE__ */ jsx(ArrowUpRight, { className: "size-3" }) : /* @__PURE__ */ jsx(ArrowDownRight, { className: "size-3" }),
      growth >= 0 ? "+" : "",
      growth,
      "% vs période préc."
    ] })
  ] });
}
export {
  Index as default
};
