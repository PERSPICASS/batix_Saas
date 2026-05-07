import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { r as router3, H as Head_default, L as Link_default } from "../ssr.js";
import { CreditCard, AlertTriangle, Clock, Calendar, Search, X, Download, Eye, Check } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { u as useRoute } from "./route-C2Ac8FMA.js";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
function PaymentModal({ sale, onClose, routeFn }) {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const maxAmount = parseFloat(sale.remaining_amount.toString());
  const handleSubmit = (e) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setError("Veuillez saisir un montant valide.");
      return;
    }
    if (parsed > maxAmount) {
      setError(`Le montant ne peut pas dépasser ${maxAmount.toLocaleString("fr-FR")} FCFA.`);
      return;
    }
    setError("");
    setSubmitting(true);
    router3.post(
      routeFn("sales.credits.pay", { sale: sale.id }),
      {
        amount: parsed,
        payment_method: paymentMethod,
        notes: notes || void 0,
        new_due_date: newDueDate || void 0
      },
      {
        onSuccess: () => onClose(),
        onError: (errors) => {
          setError(Object.values(errors).join(" "));
          setSubmitting(false);
        },
        onFinish: () => setSubmitting(false)
      }
    );
  };
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-6 py-4 border-b border-slate-700", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-white", children: "Enregistrer un paiement" }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-400 mt-0.5", children: [
          "Ticket ",
          sale.ticket_number,
          " —",
          " ",
          sale.customer?.name ?? /* @__PURE__ */ jsx("span", { className: "italic", children: "Client inconnu" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: onClose, className: "text-slate-400 hover:text-white transition-colors", children: /* @__PURE__ */ jsx(X, { className: "h-5 w-5" }) })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "p-6 space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 rounded-xl bg-slate-800/60 p-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "Total vente" }),
          /* @__PURE__ */ jsxs("p", { className: "font-semibold text-white", children: [
            Number(sale.total).toLocaleString("fr-FR"),
            " FCFA"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "Déjà payé" }),
          /* @__PURE__ */ jsxs("p", { className: "font-semibold text-emerald-400", children: [
            Number(sale.amount_paid).toLocaleString("fr-FR"),
            " FCFA"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "Reste à payer" }),
          /* @__PURE__ */ jsxs("p", { className: "text-xl font-bold text-amber-400", children: [
            Number(sale.remaining_amount).toLocaleString("fr-FR"),
            " FCFA"
          ] })
        ] })
      ] }),
      error && /* @__PURE__ */ jsx("p", { className: "rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-400", children: error }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium text-slate-300 mb-1.5", children: [
          "Montant du paiement (FCFA) ",
          /* @__PURE__ */ jsx("span", { className: "text-red-400", children: "*" })
        ] }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "number",
            min: "1",
            max: maxAmount,
            step: "1",
            value: amount,
            onChange: (e) => setAmount(e.target.value),
            placeholder: `Max: ${maxAmount.toLocaleString("fr-FR")}`,
            className: "w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500",
            required: true
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => setAmount(maxAmount.toString()),
            className: "mt-1 text-xs text-amber-400 hover:text-amber-300 transition-colors",
            children: [
              "Solder entièrement (",
              maxAmount.toLocaleString("fr-FR"),
              " FCFA)"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-300 mb-1.5", children: "Mode de paiement" }),
        /* @__PURE__ */ jsxs(
          "select",
          {
            value: paymentMethod,
            onChange: (e) => setPaymentMethod(e.target.value),
            className: "w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500",
            children: [
              /* @__PURE__ */ jsx("option", { value: "cash", children: "Espèces" }),
              /* @__PURE__ */ jsx("option", { value: "card", children: "Carte bancaire" }),
              /* @__PURE__ */ jsx("option", { value: "transfer", children: "Virement" }),
              /* @__PURE__ */ jsx("option", { value: "mobile", children: "Mobile Money" }),
              /* @__PURE__ */ jsx("option", { value: "check", children: "Chèque" })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium text-slate-300 mb-1.5", children: [
          "Nouvelle échéance ",
          /* @__PURE__ */ jsx("span", { className: "text-slate-500", children: "(optionnel)" })
        ] }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "date",
            value: newDueDate,
            onChange: (e) => setNewDueDate(e.target.value),
            min: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
            className: "w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium text-slate-300 mb-1.5", children: [
          "Notes ",
          /* @__PURE__ */ jsx("span", { className: "text-slate-500", children: "(optionnel)" })
        ] }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            value: notes,
            onChange: (e) => setNotes(e.target.value),
            rows: 2,
            placeholder: "Observation sur ce paiement...",
            className: "w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3 pt-1", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: onClose,
            className: "flex-1 rounded-lg border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors",
            children: "Annuler"
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "submit",
            disabled: submitting,
            className: "flex-1 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2",
            children: [
              submitting ? /* @__PURE__ */ jsx("span", { className: "inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-r-transparent" }) : /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }),
              "Valider"
            ]
          }
        )
      ] })
    ] })
  ] }) });
}
function DueDateModal({ sale, onClose, routeFn }) {
  const [dueDate, setDueDate] = useState(sale.credit_due_date ?? "");
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    router3.patch(
      routeFn("sales.credits.update-due-date", { sale: sale.id }),
      { credit_due_date: dueDate || null },
      {
        onSuccess: () => onClose(),
        onFinish: () => setSubmitting(false)
      }
    );
  };
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-6 py-4 border-b border-slate-700", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-white", children: "Modifier l'échéance" }),
      /* @__PURE__ */ jsx("button", { onClick: onClose, className: "text-slate-400 hover:text-white transition-colors", children: /* @__PURE__ */ jsx(X, { className: "h-5 w-5" }) })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "p-6 space-y-4", children: [
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-400", children: [
        "Ticket ",
        /* @__PURE__ */ jsx("span", { className: "text-white font-medium", children: sale.ticket_number })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-300 mb-1.5", children: "Date d'échéance" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "date",
            value: dueDate,
            onChange: (e) => setDueDate(e.target.value),
            className: "w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          }
        ),
        dueDate && /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => setDueDate(""),
            className: "mt-1 text-xs text-slate-400 hover:text-slate-300 transition-colors",
            children: "Supprimer l'échéance"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3 pt-1", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: onClose,
            className: "flex-1 rounded-lg border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors",
            children: "Annuler"
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "submit",
            disabled: submitting,
            className: "flex-1 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-amber-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2",
            children: [
              submitting ? /* @__PURE__ */ jsx("span", { className: "inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-r-transparent" }) : /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }),
              "Enregistrer"
            ]
          }
        )
      ] })
    ] })
  ] }) });
}
function KpiCard({
  label,
  value,
  sub,
  color,
  icon: Icon
}) {
  const colors = {
    amber: "border-amber-500/30  bg-amber-500/10  text-amber-400",
    red: "border-red-500/30    bg-red-500/10    text-red-400",
    orange: "border-orange-500/30 bg-orange-500/10 text-orange-400",
    slate: "border-slate-600/40  bg-slate-700/20  text-slate-400"
  };
  return /* @__PURE__ */ jsx("div", { className: `rounded-2xl border p-5 ${colors[color]}`, children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("p", { className: "text-xs font-medium opacity-70", children: label }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-2xl font-bold", children: value }),
      sub && /* @__PURE__ */ jsx("p", { className: "mt-0.5 text-xs opacity-60", children: sub })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "rounded-xl p-2.5 bg-current/10 opacity-60", children: /* @__PURE__ */ jsx(Icon, { className: "h-5 w-5" }) })
  ] }) });
}
function DueBadge({ sale }) {
  if (!sale.credit_due_date) {
    return /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-slate-700/60 px-2.5 py-1 text-xs text-slate-400", children: [
      /* @__PURE__ */ jsx(Clock, { className: "h-3 w-3" }),
      " Sans date"
    ] });
  }
  if (sale.overdue) {
    return /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-medium text-red-400", children: [
      /* @__PURE__ */ jsx(AlertTriangle, { className: "h-3 w-3" }),
      sale.days_overdue != null ? `${sale.days_overdue}j de retard` : "En retard"
    ] });
  }
  if (sale.due_soon) {
    return /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2.5 py-1 text-xs font-medium text-orange-400", children: [
      /* @__PURE__ */ jsx(Clock, { className: "h-3 w-3" }),
      sale.days_until_due != null ? `Dans ${sale.days_until_due}j` : "Bientôt"
    ] });
  }
  return /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-400", children: [
    /* @__PURE__ */ jsx(Calendar, { className: "h-3 w-3" }),
    new Date(sale.credit_due_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
  ] });
}
function Credits({ credits, shops = [], kpis, filters = {}, auth }) {
  const buildRoute = useRoute();
  const isFirstRender = useRef(true);
  const safeFilters = filters && typeof filters === "object" && !Array.isArray(filters) ? filters : {};
  const safeShops = Array.isArray(shops) ? shops : [];
  const getFilterValue = (value, fallback = "") => typeof value === "string" ? value : fallback;
  const [search, setSearch] = useState(getFilterValue(safeFilters.search));
  const [shopId, setShopId] = useState(getFilterValue(safeFilters.shop_id));
  const [sortBy, setSortBy] = useState(getFilterValue(safeFilters.sort, "overdue_first"));
  const [statusTab, setStatusTab] = useState(getFilterValue(safeFilters.status));
  const [payModal, setPayModal] = useState(null);
  const [dueDateModal, setDueDateModal] = useState(null);
  const safeKpis = kpis ?? {
    total_remaining: 0,
    total_count: 0,
    overdue_remaining: 0,
    overdue_count: 0,
    due_soon_count: 0,
    no_date_count: 0
  };
  const safeCredits = {
    data: Array.isArray(credits?.data) ? credits.data : [],
    links: Array.isArray(credits?.links) ? credits.links : [],
    meta: credits?.meta ?? { last_page: 1, from: 0, to: 0, total: 0 }
  };
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => applyFilters(), 400);
    return () => clearTimeout(timer);
  }, [search]);
  const applyFilters = (overrides = {}) => {
    router3.get(
      buildRoute("sales.credits"),
      {
        ...search ? { search } : {},
        ...shopId ? { shop_id: shopId } : {},
        ...sortBy ? { sort: sortBy } : {},
        ...statusTab ? { status: statusTab } : {},
        ...overrides
      },
      { preserveState: true, replace: true }
    );
  };
  const handleStatusTab = (val) => {
    setStatusTab(val);
    applyFilters({ status: val });
  };
  const handleSortChange = (val) => {
    setSortBy(val);
    applyFilters({ sort: val });
  };
  const handleShopChange = (val) => {
    setShopId(val);
    applyFilters({ shop_id: val });
  };
  const resetFilters = () => {
    setSearch("");
    setShopId("");
    setSortBy("overdue_first");
    setStatusTab("");
    router3.get(buildRoute("sales.credits"), {}, { preserveState: false, replace: true });
  };
  const exportUrl = buildRoute("sales.credits.export", {
    ...search ? { search } : {},
    ...shopId ? { shop_id: shopId } : {},
    ...statusTab ? { status: statusTab } : {}
  });
  const statusTabs = [
    { value: "", label: "Tous", count: safeKpis.total_count },
    { value: "overdue", label: "En retard", count: safeKpis.overdue_count },
    { value: "due_soon", label: "Échéance proche", count: safeKpis.due_soon_count },
    { value: "no_date", label: "Sans date", count: safeKpis.no_date_count }
  ];
  return /* @__PURE__ */ jsxs(
    Authenticated,
    {
      header: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(CreditCard, { className: "h-6 w-6 text-amber-400" }),
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-white", children: "Créances" })
      ] }),
      children: [
        /* @__PURE__ */ jsx(Head_default, { title: "Créances" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4 sm:grid-cols-4", children: [
            /* @__PURE__ */ jsx(
              KpiCard,
              {
                label: "Total à recouvrer",
                value: `${safeKpis.total_remaining.toLocaleString("fr-FR")} FCFA`,
                sub: `${safeKpis.total_count} vente${safeKpis.total_count !== 1 ? "s" : ""}`,
                color: "amber",
                icon: CreditCard
              }
            ),
            /* @__PURE__ */ jsx(
              KpiCard,
              {
                label: "En retard",
                value: `${safeKpis.overdue_remaining.toLocaleString("fr-FR")} FCFA`,
                sub: `${safeKpis.overdue_count} vente${safeKpis.overdue_count !== 1 ? "s" : ""}`,
                color: "red",
                icon: AlertTriangle
              }
            ),
            /* @__PURE__ */ jsx(
              KpiCard,
              {
                label: "Échéance proche",
                value: safeKpis.due_soon_count,
                sub: "dans les 7 prochains jours",
                color: "orange",
                icon: Clock
              }
            ),
            /* @__PURE__ */ jsx(
              KpiCard,
              {
                label: "Sans échéance",
                value: safeKpis.no_date_count,
                sub: "pas de date fixée",
                color: "slate",
                icon: Calendar
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-slate-700/60 bg-slate-800/40 p-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "relative flex-1 min-w-48", children: [
                /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: search,
                    onChange: (e) => setSearch(e.target.value),
                    placeholder: "Rechercher ticket, client...",
                    className: "w-full rounded-lg border border-slate-600 bg-slate-800 pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  }
                )
              ] }),
              safeShops.length > 1 && /* @__PURE__ */ jsxs(
                "select",
                {
                  value: shopId,
                  onChange: (e) => handleShopChange(e.target.value),
                  className: "rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "Toutes les boutiques" }),
                    safeShops.map((s) => /* @__PURE__ */ jsx("option", { value: s.id, children: s.name }, s.id))
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: sortBy,
                  onChange: (e) => handleSortChange(e.target.value),
                  className: "rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "overdue_first", children: "Retards en premier" }),
                    /* @__PURE__ */ jsx("option", { value: "amount_desc", children: "Montant ↓" }),
                    /* @__PURE__ */ jsx("option", { value: "amount_asc", children: "Montant ↑" }),
                    /* @__PURE__ */ jsx("option", { value: "date_asc", children: "Échéance la plus proche" }),
                    /* @__PURE__ */ jsx("option", { value: "date_desc", children: "Échéance la plus tardive" }),
                    /* @__PURE__ */ jsx("option", { value: "oldest", children: "Ventes les plus anciennes" })
                  ]
                }
              ),
              (search || shopId || sortBy !== "overdue_first" || statusTab) && /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: resetFilters,
                  className: "flex items-center gap-1.5 rounded-lg border border-slate-600 px-3 py-2.5 text-sm text-slate-400 hover:text-white hover:border-slate-500 transition-colors",
                  children: [
                    /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }),
                    " Réinitialiser"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "a",
                {
                  href: exportUrl,
                  className: "ml-auto flex items-center gap-1.5 rounded-lg bg-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-600 hover:text-white transition-colors",
                  children: [
                    /* @__PURE__ */ jsx(Download, { className: "h-4 w-4" }),
                    " Export CSV"
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mt-3 flex flex-wrap gap-2", children: statusTabs.map((tab) => /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => handleStatusTab(tab.value),
                className: `flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${statusTab === tab.value ? "bg-amber-500 text-slate-900" : "bg-slate-700/60 text-slate-400 hover:bg-slate-700 hover:text-white"}`,
                children: [
                  tab.label,
                  /* @__PURE__ */ jsx("span", { className: `rounded-full px-1.5 py-0.5 text-[10px] font-bold ${statusTab === tab.value ? "bg-slate-900/30" : "bg-slate-600"}`, children: tab.count })
                ]
              },
              tab.value
            )) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-slate-700/60 bg-slate-800/40 overflow-hidden", children: safeCredits.data.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-16 text-slate-500", children: [
            /* @__PURE__ */ jsx(CreditCard, { className: "mb-3 h-10 w-10 opacity-30" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: "Aucune créance trouvée" }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs opacity-70", children: search || statusTab || shopId ? "Essayez de modifier vos filtres" : "Toutes les ventes sont soldées" })
          ] }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-slate-700/60 bg-slate-900/40", children: [
              /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400", children: "Client / Ticket" }),
              safeShops.length > 1 && /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400", children: "Boutique" }),
              /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400", children: "Date vente" }),
              /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400", children: "Total" }),
              /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400", children: "Payé" }),
              /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400", children: "Reste" }),
              /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400", children: "Échéance" }),
              /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400", children: "Actions" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-700/40", children: safeCredits.data.map((sale) => /* @__PURE__ */ jsxs(
              "tr",
              {
                className: `group transition-colors hover:bg-slate-700/20 ${sale.overdue ? "bg-red-500/5" : ""}`,
                children: [
                  /* @__PURE__ */ jsxs("td", { className: "px-4 py-3", children: [
                    /* @__PURE__ */ jsx("div", { className: "font-medium text-white", children: sale.customer?.name ?? /* @__PURE__ */ jsx("span", { className: "italic text-slate-500", children: "Client de passage" }) }),
                    /* @__PURE__ */ jsxs("div", { className: "text-xs text-slate-500 flex items-center gap-1 mt-0.5", children: [
                      /* @__PURE__ */ jsx("span", { className: "font-mono", children: sale.ticket_number }),
                      sale.customer?.phone && /* @__PURE__ */ jsxs(Fragment, { children: [
                        /* @__PURE__ */ jsx("span", { className: "text-slate-700", children: "·" }),
                        /* @__PURE__ */ jsx("span", { children: sale.customer.phone })
                      ] })
                    ] })
                  ] }),
                  safeShops.length > 1 && /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-slate-400 text-xs", children: sale.shop.name }),
                  /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-slate-400 text-xs whitespace-nowrap", children: new Date(sale.sale_date).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                  }) }),
                  /* @__PURE__ */ jsxs("td", { className: "px-4 py-3 text-right text-white font-medium whitespace-nowrap", children: [
                    Number(sale.total).toLocaleString("fr-FR"),
                    /* @__PURE__ */ jsx("span", { className: "ml-1 text-xs text-slate-500", children: "FCFA" })
                  ] }),
                  /* @__PURE__ */ jsxs("td", { className: "px-4 py-3 text-right text-emerald-400 whitespace-nowrap", children: [
                    Number(sale.amount_paid).toLocaleString("fr-FR"),
                    /* @__PURE__ */ jsx("span", { className: "ml-1 text-xs text-emerald-600", children: "FCFA" })
                  ] }),
                  /* @__PURE__ */ jsxs("td", { className: "px-4 py-3 text-right whitespace-nowrap", children: [
                    /* @__PURE__ */ jsx("span", { className: `font-semibold ${sale.overdue ? "text-red-400" : "text-amber-400"}`, children: Number(sale.remaining_amount).toLocaleString("fr-FR") }),
                    /* @__PURE__ */ jsx("span", { className: "ml-1 text-xs text-slate-500", children: "FCFA" })
                  ] }),
                  /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-center", children: /* @__PURE__ */ jsx(DueBadge, { sale }) }),
                  /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-1.5", children: [
                    /* @__PURE__ */ jsxs(
                      "button",
                      {
                        onClick: () => setPayModal(sale),
                        title: "Enregistrer un paiement",
                        className: "flex items-center gap-1 rounded-lg bg-amber-500/15 px-2.5 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/25 transition-colors",
                        children: [
                          /* @__PURE__ */ jsx(CreditCard, { className: "h-3.5 w-3.5" }),
                          "Payer"
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => setDueDateModal(sale),
                        title: "Modifier l'échéance",
                        className: "rounded-lg bg-slate-700/50 p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors",
                        children: /* @__PURE__ */ jsx(Calendar, { className: "h-3.5 w-3.5" })
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      Link_default,
                      {
                        href: buildRoute("sales.show", { sale: sale.id }),
                        title: "Voir la vente",
                        className: "rounded-lg bg-slate-700/50 p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors",
                        children: /* @__PURE__ */ jsx(Eye, { className: "h-3.5 w-3.5" })
                      }
                    )
                  ] }) })
                ]
              },
              sale.id
            )) })
          ] }) }) }),
          safeCredits.meta?.last_page > 1 && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm text-slate-400", children: [
            /* @__PURE__ */ jsxs("span", { children: [
              safeCredits.meta.from,
              "–",
              safeCredits.meta.to,
              " sur ",
              safeCredits.meta.total,
              " créances"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex gap-1", children: safeCredits.links.map((link, i) => /* @__PURE__ */ jsx(
              Link_default,
              {
                href: link.url ?? "#",
                preserveState: true,
                className: `rounded-lg px-3 py-1.5 transition-colors ${link.active ? "bg-amber-500 text-slate-900 font-semibold" : link.url ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-800/40 text-slate-600 cursor-default pointer-events-none"}`,
                dangerouslySetInnerHTML: { __html: link.label }
              },
              i
            )) })
          ] })
        ] }),
        payModal && /* @__PURE__ */ jsx(
          PaymentModal,
          {
            sale: payModal,
            onClose: () => setPayModal(null),
            routeFn: buildRoute
          }
        ),
        dueDateModal && /* @__PURE__ */ jsx(
          DueDateModal,
          {
            sale: dueDateModal,
            onClose: () => setDueDateModal(null),
            routeFn: buildRoute
          }
        )
      ]
    }
  );
}
export {
  Credits as default
};
