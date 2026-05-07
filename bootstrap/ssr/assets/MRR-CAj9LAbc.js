import { jsxs, jsx } from "react/jsx-runtime";
import { H as Head_default, L as Link_default } from "../ssr.js";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Users, TrendingDown, Activity, Target, AlertTriangle, BarChart2 } from "lucide-react";
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Area, Bar, LineChart, Line, BarChart, PieChart, Pie, Cell } from "recharts";
import "@inertiajs/core";
import "react";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
const PIE_COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#a855f7", "#f97316", "#ec4899"];
const fmt = (n) => n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : n.toLocaleString("fr-FR");
const fmtXAF = (n) => `${fmt(n)} FCFA`;
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-white/10 bg-slate-900/95 p-3 shadow-xl text-xs", children: [
    /* @__PURE__ */ jsx("p", { className: "mb-1.5 font-semibold text-slate-300", children: label }),
    payload.map((entry, i) => /* @__PURE__ */ jsxs("p", { style: { color: entry.color }, className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx("span", { className: "inline-block h-2 w-2 rounded-full", style: { background: entry.color } }),
      entry.name,
      ": ",
      /* @__PURE__ */ jsx("span", { className: "font-bold text-white", children: entry.value.toLocaleString("fr-FR") })
    ] }, i))
  ] });
};
function KpiCard({ label, value, sub, trend, invertTrend, icon: Icon, color, bgColor, formula }) {
  const isGood = invertTrend ? (trend ?? 0) < 0 : (trend ?? 0) >= 0;
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl flex flex-col gap-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 font-medium uppercase tracking-wide", children: label }),
        /* @__PURE__ */ jsx("p", { className: "mt-1.5 text-2xl font-bold text-white", children: value }),
        sub && /* @__PURE__ */ jsx("p", { className: "mt-0.5 text-xs text-slate-400", children: sub })
      ] }),
      /* @__PURE__ */ jsx("div", { className: `rounded-xl ${bgColor} p-2.5 ${color}`, children: /* @__PURE__ */ jsx(Icon, { className: "size-5" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      trend !== void 0 ? /* @__PURE__ */ jsxs("div", { className: `flex items-center gap-1 text-xs font-semibold ${isGood ? "text-emerald-400" : "text-red-400"}`, children: [
        isGood ? /* @__PURE__ */ jsx(ArrowUpRight, { className: "size-3.5" }) : /* @__PURE__ */ jsx(ArrowDownRight, { className: "size-3.5" }),
        Math.abs(trend),
        "%"
      ] }) : /* @__PURE__ */ jsx("div", {}),
      formula && /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-500 font-mono", children: formula })
    ] })
  ] });
}
function MRRDashboard({
  kpis,
  mrr_history,
  churn_history,
  revenue_history,
  mrr_by_plan,
  recent_churns,
  at_risk
}) {
  return /* @__PURE__ */ jsxs(
    Authenticated,
    {
      header: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-white", children: "Dashboard MRR" }),
          /* @__PURE__ */ jsx("p", { className: "mt-0.5 text-sm text-slate-400", children: "Monthly Recurring Revenue · Churn · Rétention" })
        ] }),
        /* @__PURE__ */ jsx(
          Link_default,
          {
            href: route("platform.dashboard"),
            className: "rounded-lg border border-white/15 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/10",
            children: "← Dashboard général"
          }
        )
      ] }),
      children: [
        /* @__PURE__ */ jsx(Head_default, { title: "MRR Dashboard" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4", children: [
            /* @__PURE__ */ jsx(
              KpiCard,
              {
                label: "MRR",
                value: fmtXAF(kpis.mrr),
                sub: "Revenu récurrent mensuel",
                trend: kpis.mrr_growth,
                icon: DollarSign,
                color: "text-amber-300",
                bgColor: "bg-amber-500/10",
                formula: "Σ(montant / cycle)"
              }
            ),
            /* @__PURE__ */ jsx(
              KpiCard,
              {
                label: "ARR",
                value: fmtXAF(kpis.arr),
                sub: "Revenu récurrent annuel",
                icon: TrendingUp,
                color: "text-blue-300",
                bgColor: "bg-blue-500/10",
                formula: "MRR × 12"
              }
            ),
            /* @__PURE__ */ jsx(
              KpiCard,
              {
                label: "New MRR",
                value: fmtXAF(kpis.new_mrr),
                sub: "Nouveaux ce mois",
                icon: ArrowUpRight,
                color: "text-emerald-300",
                bgColor: "bg-emerald-500/10",
                formula: "Σ nouveaux abonnés (mois)"
              }
            ),
            /* @__PURE__ */ jsx(
              KpiCard,
              {
                label: "Churned MRR",
                value: fmtXAF(kpis.churned_mrr),
                sub: "Perdu ce mois",
                icon: ArrowDownRight,
                color: "text-red-300",
                bgColor: "bg-red-500/10",
                formula: "Σ annulés + expirés (mois)"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4", children: [
            /* @__PURE__ */ jsx(
              KpiCard,
              {
                label: "ARPU",
                value: fmtXAF(kpis.arpu),
                sub: `Sur ${kpis.active_count} abonnés actifs`,
                icon: Users,
                color: "text-purple-300",
                bgColor: "bg-purple-500/10",
                formula: "MRR / nb actifs"
              }
            ),
            /* @__PURE__ */ jsx(
              KpiCard,
              {
                label: "Churn Rate",
                value: `${kpis.churn_rate}%`,
                sub: "Taux d'attrition mensuel",
                trend: kpis.churn_rate,
                invertTrend: true,
                icon: TrendingDown,
                color: "text-orange-300",
                bgColor: "bg-orange-500/10",
                formula: "Churned / Actifs début mois"
              }
            ),
            /* @__PURE__ */ jsx(
              KpiCard,
              {
                label: "NRR",
                value: `${kpis.nrr}%`,
                sub: "Net Revenue Retention",
                trend: kpis.nrr - 100,
                icon: Activity,
                color: "text-cyan-300",
                bgColor: "bg-cyan-500/10",
                formula: "(MRR − Churn) / MRR prev × 100"
              }
            ),
            /* @__PURE__ */ jsx(
              KpiCard,
              {
                label: "LTV estimée",
                value: kpis.ltv > 0 ? fmtXAF(kpis.ltv) : "∞",
                sub: "Valeur vie client moyenne",
                icon: Target,
                color: "text-pink-300",
                bgColor: "bg-pink-500/10",
                formula: "ARPU / Churn Rate"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl", children: [
            /* @__PURE__ */ jsx("h2", { className: "mb-1 text-base font-semibold text-white", children: "Évolution MRR (12 mois)" }),
            /* @__PURE__ */ jsx("p", { className: "mb-4 text-xs text-slate-500", children: "MRR = somme normalisée en mensuel de tous les abonnements actifs" }),
            /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 300, children: /* @__PURE__ */ jsxs(ComposedChart, { data: mrr_history, children: [
              /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "gMrr", x1: "0", y1: "0", x2: "0", y2: "1", children: [
                /* @__PURE__ */ jsx("stop", { offset: "5%", stopColor: "#f59e0b", stopOpacity: 0.25 }),
                /* @__PURE__ */ jsx("stop", { offset: "95%", stopColor: "#f59e0b", stopOpacity: 0 })
              ] }) }),
              /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#ffffff10" }),
              /* @__PURE__ */ jsx(XAxis, { dataKey: "month", stroke: "#94a3b8", style: { fontSize: 11 } }),
              /* @__PURE__ */ jsx(YAxis, { stroke: "#94a3b8", style: { fontSize: 11 }, tickFormatter: fmt }),
              /* @__PURE__ */ jsx(Tooltip, { content: /* @__PURE__ */ jsx(CustomTooltip, {}) }),
              /* @__PURE__ */ jsx(Legend, { wrapperStyle: { fontSize: 12, color: "#94a3b8" } }),
              /* @__PURE__ */ jsx(
                Area,
                {
                  type: "monotone",
                  dataKey: "mrr",
                  fill: "url(#gMrr)",
                  stroke: "#f59e0b",
                  strokeWidth: 2,
                  name: "MRR (FCFA)"
                }
              ),
              /* @__PURE__ */ jsx(Bar, { dataKey: "new_mrr", fill: "#10b981", radius: [4, 4, 0, 0], name: "New MRR", barSize: 8 }),
              /* @__PURE__ */ jsx(Bar, { dataKey: "churned_mrr", fill: "#ef4444", radius: [4, 4, 0, 0], name: "Churned MRR", barSize: 8 })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl", children: [
              /* @__PURE__ */ jsx("h2", { className: "mb-1 text-base font-semibold text-white", children: "Churn Rate mensuel (%)" }),
              /* @__PURE__ */ jsx("p", { className: "mb-4 text-xs text-slate-500", children: "Churn = nb annulés+expirés / nb actifs début de mois × 100" }),
              /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 250, children: /* @__PURE__ */ jsxs(LineChart, { data: churn_history, children: [
                /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#ffffff10" }),
                /* @__PURE__ */ jsx(XAxis, { dataKey: "month", stroke: "#94a3b8", style: { fontSize: 11 } }),
                /* @__PURE__ */ jsx(YAxis, { stroke: "#94a3b8", style: { fontSize: 11 }, unit: "%" }),
                /* @__PURE__ */ jsx(Tooltip, { content: /* @__PURE__ */ jsx(CustomTooltip, {}) }),
                /* @__PURE__ */ jsx(
                  Line,
                  {
                    type: "monotone",
                    dataKey: "churn_rate",
                    stroke: "#f97316",
                    strokeWidth: 2,
                    dot: { r: 3, fill: "#f97316" },
                    name: "Churn Rate (%)"
                  }
                ),
                /* @__PURE__ */ jsx(
                  Line,
                  {
                    type: "monotone",
                    dataKey: "churned",
                    stroke: "#ef4444",
                    strokeWidth: 1.5,
                    strokeDasharray: "4 2",
                    dot: false,
                    name: "Nb churned"
                  }
                )
              ] }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl", children: [
              /* @__PURE__ */ jsx("h2", { className: "mb-1 text-base font-semibold text-white", children: "Revenus encaissés (12 mois)" }),
              /* @__PURE__ */ jsx("p", { className: "mb-4 text-xs text-slate-500", children: "Basé sur les factures avec status=paid" }),
              /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 250, children: /* @__PURE__ */ jsxs(BarChart, { data: revenue_history, children: [
                /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#ffffff10" }),
                /* @__PURE__ */ jsx(XAxis, { dataKey: "month", stroke: "#94a3b8", style: { fontSize: 11 } }),
                /* @__PURE__ */ jsx(YAxis, { stroke: "#94a3b8", style: { fontSize: 11 }, tickFormatter: fmt }),
                /* @__PURE__ */ jsx(Tooltip, { content: /* @__PURE__ */ jsx(CustomTooltip, {}) }),
                /* @__PURE__ */ jsx(
                  Bar,
                  {
                    dataKey: "revenue",
                    fill: "#a855f7",
                    radius: [6, 6, 0, 0],
                    name: "Revenus (FCFA)"
                  }
                )
              ] }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl", children: [
            /* @__PURE__ */ jsx("h2", { className: "mb-4 text-base font-semibold text-white", children: "Répartition MRR par plan" }),
            /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-2 items-center", children: [
              /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 260, children: /* @__PURE__ */ jsxs(PieChart, { children: [
                /* @__PURE__ */ jsx(
                  Pie,
                  {
                    data: mrr_by_plan,
                    cx: "50%",
                    cy: "50%",
                    innerRadius: 60,
                    outerRadius: 110,
                    dataKey: "mrr",
                    label: ({ name, percent }) => `${name} · ${(percent * 100).toFixed(0)}%`,
                    labelLine: false,
                    children: mrr_by_plan.map((_, i) => /* @__PURE__ */ jsx(Cell, { fill: PIE_COLORS[i % PIE_COLORS.length] }, i))
                  }
                ),
                /* @__PURE__ */ jsx(Tooltip, { content: /* @__PURE__ */ jsx(CustomTooltip, {}) })
              ] }) }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                mrr_by_plan.map((plan, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between rounded-xl bg-white/5 px-4 py-3", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                    /* @__PURE__ */ jsx(
                      "div",
                      {
                        className: "h-3 w-3 rounded-full flex-shrink-0",
                        style: { backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }
                      }
                    ),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-white", children: plan.name }),
                      /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400", children: [
                        plan.count,
                        " abonné",
                        plan.count > 1 ? "s" : ""
                      ] })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-white", children: fmtXAF(plan.mrr) }),
                    /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: "/ mois" })
                  ] })
                ] }, plan.name)),
                mrr_by_plan.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 text-center py-4", children: "Aucun abonnement actif" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl", children: [
              /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(AlertTriangle, { className: "size-4 text-orange-400" }),
                /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold text-white", children: "Abonnements à risque" }),
                /* @__PURE__ */ jsx("span", { className: "ml-auto rounded-full bg-orange-500/20 px-2 py-0.5 text-xs text-orange-300", children: "expire ≤ 30j" })
              ] }),
              at_risk.length === 0 ? /* @__PURE__ */ jsx("p", { className: "py-6 text-center text-sm text-slate-500", children: "Aucun abonnement à risque 🎉" }) : /* @__PURE__ */ jsx("div", { className: "space-y-2", children: at_risk.map((entry, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-3", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsx("p", { className: "truncate text-sm font-medium text-white", children: entry.user }),
                  /* @__PURE__ */ jsx("p", { className: "truncate text-xs text-slate-400", children: entry.email }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: entry.plan })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-right ml-3 flex-shrink-0", children: [
                  /* @__PURE__ */ jsxs("p", { className: `text-xs font-bold ${entry.days_left <= 7 ? "text-red-400" : "text-orange-300"}`, children: [
                    "J-",
                    entry.days_left
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: fmtXAF(entry.amount) })
                ] })
              ] }, i)) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl", children: [
              /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(TrendingDown, { className: "size-4 text-red-400" }),
                /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold text-white", children: "Churns récents" }),
                /* @__PURE__ */ jsx("span", { className: "ml-auto rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-300", children: "30 derniers jours" })
              ] }),
              recent_churns.length === 0 ? /* @__PURE__ */ jsx("p", { className: "py-6 text-center text-sm text-slate-500", children: "Aucun churn ce mois 🎉" }) : /* @__PURE__ */ jsx("div", { className: "space-y-2", children: recent_churns.map((entry, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-3", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsx("p", { className: "truncate text-sm font-medium text-white", children: entry.user }),
                  /* @__PURE__ */ jsx("p", { className: "truncate text-xs text-slate-400", children: entry.email }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: entry.plan })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-right ml-3 flex-shrink-0", children: [
                  /* @__PURE__ */ jsx("span", { className: `rounded px-1.5 py-0.5 text-[10px] font-medium ${entry.reason === "cancelled" ? "bg-red-500/20 text-red-300" : "bg-orange-500/20 text-orange-300"}`, children: entry.reason === "cancelled" ? "Annulé" : "Expiré" }),
                  /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-slate-400", children: fmtXAF(entry.amount) })
                ] })
              ] }, i)) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl", children: [
            /* @__PURE__ */ jsxs("h2", { className: "mb-4 text-base font-semibold text-white flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(BarChart2, { className: "size-4 text-slate-400" }),
              "Formules de calcul"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs", children: [
              { label: "MRR", formula: "Σ abonnements actifs (monthly) + Σ (yearly / 12)" },
              { label: "ARR", formula: "MRR × 12" },
              { label: "ARPU", formula: "MRR / nombre d'abonnés actifs" },
              { label: "New MRR", formula: "MRR des abonnements démarrés ce mois" },
              { label: "Churned MRR", formula: "MRR des abonnements annulés/expirés ce mois" },
              { label: "Net MRR Growth", formula: "New MRR − Churned MRR" },
              { label: "Churn Rate", formula: "Churned / Actifs (début de mois) × 100" },
              { label: "NRR", formula: "(MRR fin − Churned MRR) / MRR début × 100" },
              { label: "LTV", formula: "ARPU / Churn Rate mensuel" }
            ].map(({ label, formula }) => /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white/5 p-3", children: [
              /* @__PURE__ */ jsx("p", { className: "font-semibold text-amber-300 mb-1", children: label }),
              /* @__PURE__ */ jsx("p", { className: "text-slate-400 font-mono leading-relaxed", children: formula })
            ] }, label)) })
          ] })
        ] })
      ]
    }
  );
}
export {
  MRRDashboard as default
};
