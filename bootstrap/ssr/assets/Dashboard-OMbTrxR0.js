import { jsxs, jsx } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { H as Head_default, L as Link_default } from "../ssr.js";
import { Users, Store, CheckCircle, DollarSign, Clock, XCircle, ArrowUpRight, Building2 } from "lucide-react";
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import "react";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
const COLORS = {
  primary: "#f59e0b",
  // blue
  success: "#10b981",
  // orange
  purple: "#a855f7"
};
const PIE_COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#a855f7", "#f97316"];
function PlatformAdminDashboard({ stats, charts, recent_accounts, recent_shops }) {
  const kpis = [
    {
      label: "Comptes totaux",
      value: stats.total_accounts.toString(),
      icon: Users,
      color: "text-blue-300",
      bgColor: "bg-blue-500/10"
    },
    {
      label: "Boutiques actives",
      value: `${stats.active_shops} / ${stats.total_shops}`,
      icon: Store,
      color: "text-emerald-300",
      bgColor: "bg-emerald-500/10"
    },
    {
      label: "Abonnements actifs",
      value: stats.active_subscriptions.toString(),
      icon: CheckCircle,
      color: "text-amber-300",
      bgColor: "bg-amber-500/10"
    },
    {
      label: "Revenus mensuels",
      value: `${stats.monthly_revenue.toLocaleString()} FCFA`,
      icon: DollarSign,
      color: "text-purple-300",
      bgColor: "bg-purple-500/10"
    }
  ];
  const subscriptionStats = [
    {
      label: "Actifs",
      value: stats.active_subscriptions,
      icon: CheckCircle,
      color: "text-emerald-400"
    },
    {
      label: "Essai",
      value: stats.trial_subscriptions,
      icon: Clock,
      color: "text-blue-400"
    },
    {
      label: "Expirés",
      value: stats.expired_subscriptions,
      icon: XCircle,
      color: "text-orange-400"
    },
    {
      label: "Annulés",
      value: stats.cancelled_subscriptions,
      icon: XCircle,
      color: "text-red-400"
    }
  ];
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-white/10 bg-slate-900 p-3 shadow-lg", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: label }),
        payload.map((entry, index) => /* @__PURE__ */ jsxs("p", { className: "text-sm font-semibold text-white", children: [
          entry.name,
          ": ",
          entry.value.toLocaleString()
        ] }, index))
      ] });
    }
    return null;
  };
  return /* @__PURE__ */ jsxs(
    Authenticated,
    {
      header: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-white", children: "Administration Plateforme" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 rounded-lg bg-purple-500/20 px-3 py-1.5 text-sm text-purple-200", children: [
          /* @__PURE__ */ jsx(Building2, { className: "size-4" }),
          "Admin Plateforme"
        ] })
      ] }),
      children: [
        /* @__PURE__ */ jsx(Head_default, { title: "Admin Plateforme" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: kpis.map((kpi) => /* @__PURE__ */ jsx(
            "div",
            {
              className: "rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl",
              children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: kpi.label }),
                  /* @__PURE__ */ jsx("p", { className: "mt-2 text-3xl font-bold text-white", children: kpi.value })
                ] }),
                /* @__PURE__ */ jsx("div", { className: `rounded-lg ${kpi.bgColor} p-2.5 ${kpi.color}`, children: /* @__PURE__ */ jsx(kpi.icon, { className: "size-5" }) })
              ] })
            },
            kpi.label
          )) }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl", children: [
            /* @__PURE__ */ jsx("h2", { className: "mb-4 text-lg font-semibold text-white", children: "Statut des abonnements" }),
            /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: subscriptionStats.map((stat) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 rounded-xl bg-white/5 p-4", children: [
              /* @__PURE__ */ jsx(stat.icon, { className: `size-8 ${stat.color}` }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-white", children: stat.value }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: stat.label })
              ] })
            ] }, stat.label)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl", children: [
              /* @__PURE__ */ jsx("h2", { className: "mb-4 text-lg font-semibold text-white", children: "Évolution des comptes" }),
              /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 300, children: /* @__PURE__ */ jsxs(AreaChart, { data: charts.accounts_growth, children: [
                /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "colorAccounts", x1: "0", y1: "0", x2: "0", y2: "1", children: [
                  /* @__PURE__ */ jsx("stop", { offset: "5%", stopColor: COLORS.primary, stopOpacity: 0.3 }),
                  /* @__PURE__ */ jsx("stop", { offset: "95%", stopColor: COLORS.primary, stopOpacity: 0 })
                ] }) }),
                /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#ffffff10" }),
                /* @__PURE__ */ jsx(
                  XAxis,
                  {
                    dataKey: "month",
                    stroke: "#94a3b8",
                    style: { fontSize: "12px" }
                  }
                ),
                /* @__PURE__ */ jsx(
                  YAxis,
                  {
                    stroke: "#94a3b8",
                    style: { fontSize: "12px" }
                  }
                ),
                /* @__PURE__ */ jsx(Tooltip, { content: /* @__PURE__ */ jsx(CustomTooltip, {}) }),
                /* @__PURE__ */ jsx(
                  Area,
                  {
                    type: "monotone",
                    dataKey: "count",
                    stroke: COLORS.primary,
                    fill: "url(#colorAccounts)",
                    strokeWidth: 2,
                    name: "Comptes"
                  }
                )
              ] }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl", children: [
              /* @__PURE__ */ jsx("h2", { className: "mb-4 text-lg font-semibold text-white", children: "Évolution des boutiques" }),
              /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 300, children: /* @__PURE__ */ jsxs(AreaChart, { data: charts.shops_growth, children: [
                /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "colorShops", x1: "0", y1: "0", x2: "0", y2: "1", children: [
                  /* @__PURE__ */ jsx("stop", { offset: "5%", stopColor: COLORS.success, stopOpacity: 0.3 }),
                  /* @__PURE__ */ jsx("stop", { offset: "95%", stopColor: COLORS.success, stopOpacity: 0 })
                ] }) }),
                /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#ffffff10" }),
                /* @__PURE__ */ jsx(
                  XAxis,
                  {
                    dataKey: "month",
                    stroke: "#94a3b8",
                    style: { fontSize: "12px" }
                  }
                ),
                /* @__PURE__ */ jsx(
                  YAxis,
                  {
                    stroke: "#94a3b8",
                    style: { fontSize: "12px" }
                  }
                ),
                /* @__PURE__ */ jsx(Tooltip, { content: /* @__PURE__ */ jsx(CustomTooltip, {}) }),
                /* @__PURE__ */ jsx(
                  Area,
                  {
                    type: "monotone",
                    dataKey: "count",
                    stroke: COLORS.success,
                    fill: "url(#colorShops)",
                    strokeWidth: 2,
                    name: "Boutiques"
                  }
                )
              ] }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl", children: [
              /* @__PURE__ */ jsx("h2", { className: "mb-4 text-lg font-semibold text-white", children: "Répartition par plan" }),
              /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 300, children: /* @__PURE__ */ jsxs(PieChart, { children: [
                /* @__PURE__ */ jsx(
                  Pie,
                  {
                    data: charts.subscriptions_by_plan,
                    cx: "50%",
                    cy: "50%",
                    labelLine: false,
                    label: ({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`,
                    outerRadius: 100,
                    fill: "#8884d8",
                    dataKey: "count",
                    children: charts.subscriptions_by_plan.map((entry, index) => /* @__PURE__ */ jsx(Cell, { fill: PIE_COLORS[index % PIE_COLORS.length] }, `cell-${index}`))
                  }
                ),
                /* @__PURE__ */ jsx(Tooltip, { content: /* @__PURE__ */ jsx(CustomTooltip, {}) })
              ] }) }),
              /* @__PURE__ */ jsx("div", { className: "mt-4 space-y-2", children: charts.subscriptions_by_plan.map((plan, index) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(
                    "div",
                    {
                      className: "h-3 w-3 rounded-full",
                      style: { backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { className: "text-slate-300", children: plan.name })
                ] }),
                /* @__PURE__ */ jsxs("span", { className: "font-semibold text-white", children: [
                  plan.revenue.toLocaleString(),
                  " FCFA"
                ] })
              ] }, plan.name)) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl", children: [
              /* @__PURE__ */ jsx("h2", { className: "mb-4 text-lg font-semibold text-white", children: "Évolution des revenus" }),
              /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 300, children: /* @__PURE__ */ jsxs(BarChart, { data: charts.revenue_growth, children: [
                /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#ffffff10" }),
                /* @__PURE__ */ jsx(
                  XAxis,
                  {
                    dataKey: "month",
                    stroke: "#94a3b8",
                    style: { fontSize: "12px" }
                  }
                ),
                /* @__PURE__ */ jsx(
                  YAxis,
                  {
                    stroke: "#94a3b8",
                    style: { fontSize: "12px" }
                  }
                ),
                /* @__PURE__ */ jsx(Tooltip, { content: /* @__PURE__ */ jsx(CustomTooltip, {}) }),
                /* @__PURE__ */ jsx(
                  Bar,
                  {
                    dataKey: "revenue",
                    fill: COLORS.purple,
                    radius: [8, 8, 0, 0],
                    name: "Revenus (FCFA)"
                  }
                )
              ] }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-4 lg:grid-cols-4", children: [
            /* @__PURE__ */ jsx(
              Link_default,
              {
                href: route("platform.accounts"),
                className: "group rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-transparent p-6 transition hover:border-blue-500/30",
                children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-white", children: "Comptes" }),
                    /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-400", children: "Gérer les comptes" })
                  ] }),
                  /* @__PURE__ */ jsx(ArrowUpRight, { className: "size-5 text-blue-300 transition group-hover:translate-x-1 group-hover:-translate-y-1" })
                ] })
              }
            ),
            /* @__PURE__ */ jsx(
              Link_default,
              {
                href: route("platform.shops"),
                className: "group rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-transparent p-6 transition hover:border-emerald-500/30",
                children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-white", children: "Boutiques" }),
                    /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-400", children: "Voir les boutiques" })
                  ] }),
                  /* @__PURE__ */ jsx(ArrowUpRight, { className: "size-5 text-emerald-300 transition group-hover:translate-x-1 group-hover:-translate-y-1" })
                ] })
              }
            ),
            /* @__PURE__ */ jsx(
              Link_default,
              {
                href: route("platform.subscriptions.index"),
                className: "group rounded-2xl border border-white/10 bg-gradient-to-br from-amber-500/10 to-transparent p-6 transition hover:border-amber-500/30",
                children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-white", children: "Plans" }),
                    /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-400", children: "Gérer les plans" })
                  ] }),
                  /* @__PURE__ */ jsx(ArrowUpRight, { className: "size-5 text-amber-300 transition group-hover:translate-x-1 group-hover:-translate-y-1" })
                ] })
              }
            ),
            /* @__PURE__ */ jsx(
              Link_default,
              {
                href: route("platform.active-subscriptions"),
                className: "group rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/10 to-transparent p-6 transition hover:border-purple-500/30",
                children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-white", children: "Abonnements" }),
                    /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-400", children: "Gérer les abonnements" })
                  ] }),
                  /* @__PURE__ */ jsx(ArrowUpRight, { className: "size-5 text-purple-300 transition group-hover:translate-x-1 group-hover:-translate-y-1" })
                ] })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl", children: [
              /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center justify-between", children: [
                /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-white", children: "Comptes récents" }),
                /* @__PURE__ */ jsx(
                  Link_default,
                  {
                    href: route("platform.accounts"),
                    className: "text-sm text-amber-300 hover:text-amber-200",
                    children: "Voir tout"
                  }
                )
              ] }),
              /* @__PURE__ */ jsx("div", { className: "space-y-3", children: recent_accounts.map((account) => /* @__PURE__ */ jsxs(
                "div",
                {
                  className: "flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-3",
                  children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                      /* @__PURE__ */ jsx("p", { className: "font-medium text-white", children: account.name }),
                      /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: account.email }),
                      /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-slate-500", children: [
                        "Code: ",
                        account.code_user
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                      /* @__PURE__ */ jsxs("p", { className: "text-sm font-semibold text-amber-300", children: [
                        account.shops_count,
                        " boutique",
                        account.shops_count > 1 ? "s" : ""
                      ] }),
                      /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: new Date(account.created_at).toLocaleDateString("fr-FR") })
                    ] })
                  ]
                },
                account.id
              )) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl", children: [
              /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center justify-between", children: [
                /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-white", children: "Boutiques récentes" }),
                /* @__PURE__ */ jsx(
                  Link_default,
                  {
                    href: route("platform.shops"),
                    className: "text-sm text-amber-300 hover:text-amber-200",
                    children: "Voir tout"
                  }
                )
              ] }),
              /* @__PURE__ */ jsx("div", { className: "space-y-3", children: recent_shops.map((shop) => /* @__PURE__ */ jsxs(
                "div",
                {
                  className: "flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-3",
                  children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                        /* @__PURE__ */ jsx("p", { className: "font-medium text-white", children: shop.name }),
                        shop.is_active ? /* @__PURE__ */ jsx("span", { className: "rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300", children: "Active" }) : /* @__PURE__ */ jsx("span", { className: "rounded bg-slate-500/20 px-1.5 py-0.5 text-[10px] font-medium text-slate-400", children: "Inactive" })
                      ] }),
                      /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: shop.owner.name })
                    ] }),
                    /* @__PURE__ */ jsx("div", { className: "text-right", children: /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: new Date(shop.created_at).toLocaleDateString("fr-FR") }) })
                  ]
                },
                shop.id
              )) })
            ] })
          ] })
        ] })
      ]
    }
  );
}
export {
  PlatformAdminDashboard as default
};
