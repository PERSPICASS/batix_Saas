import { jsxs, jsx } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { T as Table, b as TableBadge, c as TableActions, d as TableActionButton } from "./Table-Cvz7wd2g.js";
import { r as router3, H as Head_default, L as Link_default } from "../ssr.js";
import { Search, X, SlidersHorizontal, Plus, Eye, Trash2, RotateCcw } from "lucide-react";
import { C as Currency } from "./Currency-BX_NSrIs.js";
import { u as useRoute } from "./route-C2Ac8FMA.js";
import { useState, useEffect } from "react";
import { C as ConfirmDeleteModal } from "./ConfirmDeleteModal-GTROztIR.js";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
import "./Modal-BeSeEOS3.js";
import "@headlessui/react";
const paymentMethodLabels = {
  cash: "Espèces",
  card: "Carte",
  transfer: "Virement",
  check: "Chèque",
  mobile: "Mobile",
  multiple: "Multiple",
  credit: "Crédit"
};
const statusLabels = {
  completed: "Terminée",
  pending: "En attente",
  cancelled: "Annulée",
  returned: "Retournée"
};
function SalesIndex({ sales, stats, shops, filters, auth }) {
  const route = useRoute();
  const [deleteModal, setDeleteModal] = useState({ show: false, sale: null });
  const [restoreModal, setRestoreModal] = useState({ show: false, sale: null });
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState(filters.search ?? "");
  const [status, setStatus] = useState(filters.status ?? "");
  const [paymentMethod, setPaymentMethod] = useState(filters.payment_method ?? "");
  const [dateFrom, setDateFrom] = useState(filters.date_from ?? "");
  const [dateTo, setDateTo] = useState(filters.date_to ?? "");
  const [creditOnly, setCreditOnly] = useState(filters.credit_only === "1" || filters.credit_only === "true");
  const canCancelSale = auth.user?.role !== "cashier" && auth.user?.role !== "caisse";
  const isAdmin = auth.user?.role === "super_admin" || auth.user?.role === "manager";
  const activeFilterCount = [status, paymentMethod, dateFrom, dateTo, creditOnly ? "1" : ""].filter(Boolean).length;
  const applyFilters = () => {
    router3.get(route("sales.index"), {
      ...search ? { search } : {},
      ...status ? { status } : {},
      ...paymentMethod ? { payment_method: paymentMethod } : {},
      ...dateFrom ? { date_from: dateFrom } : {},
      ...dateTo ? { date_to: dateTo } : {},
      ...creditOnly ? { credit_only: "1" } : {}
    }, { preserveState: true, replace: true });
  };
  const resetFilters = () => {
    setSearch("");
    setStatus("");
    setPaymentMethod("");
    setDateFrom("");
    setDateTo("");
    setCreditOnly(false);
    router3.get(route("sales.index"), {}, { preserveState: false, replace: true });
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      router3.get(route("sales.index"), {
        ...search ? { search } : {},
        ...status ? { status } : {},
        ...paymentMethod ? { payment_method: paymentMethod } : {},
        ...dateFrom ? { date_from: dateFrom } : {},
        ...dateTo ? { date_to: dateTo } : {},
        ...creditOnly ? { credit_only: "1" } : {}
      }, { preserveState: true, replace: true });
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);
  const handleDelete = (sale) => setDeleteModal({ show: true, sale });
  const handleRestore = (sale) => setRestoreModal({ show: true, sale });
  const confirmRestore = () => {
    if (!restoreModal.sale) return;
    setRestoring(true);
    router3.patch(route("sales.restore", { sale: restoreModal.sale.id }), {}, {
      onSuccess: () => {
        setRestoreModal({ show: false, sale: null });
        setRestoring(false);
      },
      onError: () => setRestoring(false)
    });
  };
  const confirmDelete = () => {
    if (!deleteModal.sale) return;
    setDeleting(true);
    router3.delete(route("sales.destroy", { sale: deleteModal.sale.id }), {
      onSuccess: () => {
        setDeleteModal({ show: false, sale: null });
        setDeleting(false);
      },
      onError: () => setDeleting(false)
    });
  };
  const getStatusVariant = (status2) => {
    switch (status2) {
      case "completed":
        return "success";
      case "pending":
        return "warning";
      case "cancelled":
      case "returned":
        return "danger";
      default:
        return "default";
    }
  };
  return /* @__PURE__ */ jsxs(Authenticated, { header: /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-white", children: "Ventes" }), children: [
    /* @__PURE__ */ jsx(Head_default, { title: "Ventes" }),
    /* @__PURE__ */ jsxs("section", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm text-slate-400", children: "Chiffre d'affaires total" }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-3xl font-bold text-amber-300", children: /* @__PURE__ */ jsx(Currency, { amount: parseFloat(String(stats.total_revenue)) }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm text-slate-400", children: "Nombre de ventes" }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-3xl font-bold text-white", children: stats.total_sales })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm text-slate-400", children: "Total créances" }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-3xl font-bold text-rose-400", children: /* @__PURE__ */ jsx(Currency, { amount: parseFloat(String(stats.total_credit_remaining)) }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm text-slate-400", children: "Ventes à crédit" }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-3xl font-bold text-amber-300", children: stats.total_credit_sales })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative flex-1 max-w-sm", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              placeholder: "N° ticket, client...",
              value: search,
              onChange: (e) => setSearch(e.target.value),
              className: "w-full rounded-lg border border-white/15 bg-slate-900/70 pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:border-amber-300 focus:outline-none"
            }
          ),
          search && /* @__PURE__ */ jsx("button", { onClick: () => setSearch(""), className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white", children: /* @__PURE__ */ jsx(X, { className: "size-4" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setShowFilters((v) => !v),
              className: `inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${showFilters || activeFilterCount > 0 ? "border-amber-300/50 bg-amber-300/10 text-amber-300" : "border-white/15 text-slate-300 hover:bg-white/5"}`,
              children: [
                /* @__PURE__ */ jsx(SlidersHorizontal, { className: "size-4" }),
                "Filtres",
                activeFilterCount > 0 && /* @__PURE__ */ jsx("span", { className: "flex size-5 items-center justify-center rounded-full bg-amber-300 text-xs font-bold text-slate-950", children: activeFilterCount })
              ]
            }
          ),
          (search || activeFilterCount > 0) && /* @__PURE__ */ jsxs("button", { onClick: resetFilters, className: "inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-400 hover:text-white", children: [
            /* @__PURE__ */ jsx(X, { className: "size-4" }),
            " Réinitialiser"
          ] }),
          /* @__PURE__ */ jsxs(
            Link_default,
            {
              href: route("sales.create"),
              className: "inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200",
              children: [
                /* @__PURE__ */ jsx(Plus, { className: "size-4" }),
                " Nouvelle vente"
              ]
            }
          )
        ] })
      ] }),
      showFilters && /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "mb-1 block text-xs text-slate-400", children: "Statut" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: status,
                onChange: (e) => setStatus(e.target.value),
                className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-white focus:border-amber-300 focus:outline-none",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "", children: "Toutes (hors annulées)" }),
                  /* @__PURE__ */ jsx("option", { value: "completed", children: "Terminée" }),
                  /* @__PURE__ */ jsx("option", { value: "pending", children: "En attente / Crédit" }),
                  /* @__PURE__ */ jsx("option", { value: "cancelled", children: "Annulées uniquement" }),
                  /* @__PURE__ */ jsx("option", { value: "returned", children: "Retournée" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "mb-1 block text-xs text-slate-400", children: "Mode de paiement" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: paymentMethod,
                onChange: (e) => setPaymentMethod(e.target.value),
                className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-white focus:border-amber-300 focus:outline-none",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "", children: "Tous les modes" }),
                  /* @__PURE__ */ jsx("option", { value: "cash", children: "Espèces" }),
                  /* @__PURE__ */ jsx("option", { value: "card", children: "Carte" }),
                  /* @__PURE__ */ jsx("option", { value: "transfer", children: "Virement" }),
                  /* @__PURE__ */ jsx("option", { value: "check", children: "Chèque" }),
                  /* @__PURE__ */ jsx("option", { value: "mobile", children: "Mobile" }),
                  /* @__PURE__ */ jsx("option", { value: "multiple", children: "Multiple" }),
                  /* @__PURE__ */ jsx("option", { value: "credit", children: "Crédit" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "mb-1 block text-xs text-slate-400", children: "Du" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: dateFrom,
                onChange: (e) => setDateFrom(e.target.value),
                className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-white focus:border-amber-300 focus:outline-none"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "mb-1 block text-xs text-slate-400", children: "Au" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: dateTo,
                onChange: (e) => setDateTo(e.target.value),
                className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-white focus:border-amber-300 focus:outline-none"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-3 flex items-center gap-3", children: /* @__PURE__ */ jsxs("label", { className: "flex cursor-pointer items-center gap-2 text-sm text-slate-300", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "checkbox",
              checked: creditOnly,
              onChange: (e) => setCreditOnly(e.target.checked),
              className: "size-4 rounded border-white/20 bg-slate-800 accent-amber-300"
            }
          ),
          "Afficher uniquement les ventes à crédit non soldées"
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 flex justify-end", children: /* @__PURE__ */ jsx(
          "button",
          {
            onClick: applyFilters,
            className: "rounded-lg bg-amber-300 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200",
            children: "Appliquer les filtres"
          }
        ) })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-400", children: [
        sales.meta?.total ?? sales.data.length,
        " vente",
        (sales.meta?.total ?? sales.data.length) > 1 ? "s" : "",
        (search || activeFilterCount > 0) && " · filtré(es)"
      ] }),
      /* @__PURE__ */ jsx(
        Table,
        {
          data: sales.data,
          columns: [
            { key: "ticket_number", label: "N° Ticket" },
            {
              key: "sale_date",
              label: "Date",
              render: (sale) => new Date(sale.sale_date).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })
            },
            {
              key: "customer",
              label: "Client",
              render: (sale) => sale.customer?.name || "Anonyme"
            },
            {
              key: "payment_method",
              label: "Paiement",
              render: (sale) => paymentMethodLabels[sale.payment_method] || sale.payment_method
            },
            {
              key: "total",
              label: "Total",
              align: "right",
              render: (sale) => /* @__PURE__ */ jsx(Currency, { amount: parseFloat(sale.total) })
            },
            {
              key: "remaining_amount",
              label: "Reste",
              align: "right",
              render: (sale) => parseFloat(sale.remaining_amount) > 0 ? /* @__PURE__ */ jsx("span", { className: "font-semibold text-rose-400", children: /* @__PURE__ */ jsx(Currency, { amount: parseFloat(sale.remaining_amount) }) }) : /* @__PURE__ */ jsx("span", { className: "text-slate-500", children: "—" })
            },
            {
              key: "status",
              label: "Statut",
              align: "center",
              render: (sale) => /* @__PURE__ */ jsx(TableBadge, { variant: getStatusVariant(sale.status), children: statusLabels[sale.status] || sale.status })
            },
            {
              key: "user",
              label: "Vendeur",
              render: (sale) => sale.user.name
            },
            {
              key: "actions",
              label: "Actions",
              align: "right",
              render: (sale) => /* @__PURE__ */ jsxs(TableActions, { children: [
                /* @__PURE__ */ jsxs(
                  Link_default,
                  {
                    href: route("sales.show", { sale: sale.id }),
                    className: "inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/10",
                    children: [
                      /* @__PURE__ */ jsx(Eye, { className: "size-3.5" }),
                      " Voir"
                    ]
                  }
                ),
                canCancelSale && sale.status !== "cancelled" && (isAdmin || sale.status === "completed") && /* @__PURE__ */ jsxs(
                  TableActionButton,
                  {
                    variant: "danger",
                    onClick: () => handleDelete(sale),
                    children: [
                      /* @__PURE__ */ jsx(Trash2, { className: "size-3.5" }),
                      " Annuler"
                    ]
                  }
                ),
                isAdmin && sale.status === "cancelled" && /* @__PURE__ */ jsxs(
                  TableActionButton,
                  {
                    variant: "success",
                    onClick: () => handleRestore(sale),
                    children: [
                      /* @__PURE__ */ jsx(RotateCcw, { className: "size-3.5" }),
                      " Réactiver"
                    ]
                  }
                )
              ] })
            }
          ],
          emptyMessage: "Aucune vente trouvée"
        }
      ),
      sales.links && /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center gap-1", children: sales.links.map((link, index) => /* @__PURE__ */ jsx(
        Link_default,
        {
          href: link.url || "#",
          className: `rounded-lg px-3 py-2 text-sm ${link.active ? "bg-amber-300 text-slate-950 font-semibold" : "border border-white/15 text-slate-200 hover:bg-white/10"} ${!link.url ? "opacity-50 cursor-not-allowed" : ""}`,
          dangerouslySetInnerHTML: { __html: link.label }
        },
        index
      )) }),
      /* @__PURE__ */ jsx(
        ConfirmDeleteModal,
        {
          show: deleteModal.show,
          onClose: () => setDeleteModal({ show: false, sale: null }),
          onConfirm: confirmDelete,
          title: "Annuler la vente",
          message: `Êtes-vous sûr de vouloir annuler la vente "${deleteModal.sale?.ticket_number}" ?`,
          confirmText: "Annuler la vente",
          processing: deleting
        }
      ),
      restoreModal.show && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-xl", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "flex size-10 items-center justify-center rounded-full bg-emerald-400/10", children: /* @__PURE__ */ jsx(RotateCcw, { className: "size-5 text-emerald-400" }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-white", children: "Réactiver la vente" })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "mb-2 text-sm text-slate-300", children: [
          "Voulez-vous réactiver la vente ",
          /* @__PURE__ */ jsx("strong", { className: "text-white", children: restoreModal.sale?.ticket_number }),
          " ?"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mb-6 text-xs text-slate-400", children: 'Le statut repassera à "Terminée" et le stock des produits tracés sera de nouveau déduit.' }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: confirmRestore,
              disabled: restoring,
              className: "flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50",
              children: restoring ? "Réactivation..." : "Confirmer"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setRestoreModal({ show: false, sale: null }),
              className: "flex-1 rounded-xl border border-white/15 py-2.5 text-sm text-slate-300 hover:bg-white/5",
              children: "Fermer"
            }
          )
        ] })
      ] }) })
    ] })
  ] });
}
export {
  SalesIndex as default
};
