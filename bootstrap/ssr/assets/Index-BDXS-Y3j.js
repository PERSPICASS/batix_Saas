import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { H as Head_default, L as Link_default, r as router3 } from "../ssr.js";
import { Plus, Search, ShoppingCart, Package, DollarSign, Calendar, Eye, Pencil, Trash2 } from "lucide-react";
import { T as Table, c as TableActions, d as TableActionButton, b as TableBadge } from "./Table-Cvz7wd2g.js";
import { useState } from "react";
import { u as useRoute } from "./route-C2Ac8FMA.js";
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
function PurchasesIndex({ code_user, purchases, suppliers, currency, filters }) {
  const route = useRoute();
  const [search, setSearch] = useState(filters.search || "");
  const [status, setStatus] = useState(filters.status || "all");
  const [supplierId, setSupplierId] = useState(filters.supplier_id || "");
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    purchase: null
  });
  const [deleting, setDeleting] = useState(false);
  const handleFilter = (e) => {
    e.preventDefault();
    router3.get(
      route("purchases.index", { code_user }),
      { search, status: status !== "all" ? status : void 0, supplier_id: supplierId || void 0 },
      { preserveState: true, preserveScroll: true }
    );
  };
  const handleDelete = (purchase) => {
    setDeleteModal({ show: true, purchase });
  };
  const confirmDelete = () => {
    if (!deleteModal.purchase) return;
    setDeleting(true);
    router3.delete(route("purchases.destroy", { code_user, purchase: deleteModal.purchase.id }), {
      onSuccess: () => {
        setDeleteModal({ show: false, purchase: null });
        setDeleting(false);
      },
      onError: () => setDeleting(false)
    });
  };
  const getStatusBadge = (status2) => {
    const statusConfig = {
      draft: { label: "Brouillon", variant: "default" },
      confirmed: { label: "Confirmé", variant: "info" },
      partial: { label: "Partiel", variant: "warning" },
      received: { label: "Reçu", variant: "success" },
      cancelled: { label: "Annulé", variant: "danger" }
    };
    const config = statusConfig[status2];
    return /* @__PURE__ */ jsx(TableBadge, { variant: config.variant, children: config.label });
  };
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };
  const formatCurrency = (amount, currency2) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency2
    }).format(parseFloat(amount));
  };
  const columns = [
    {
      key: "reference",
      label: "Référence",
      render: (purchase) => /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(ShoppingCart, { className: "size-4 text-amber-300" }),
          /* @__PURE__ */ jsx("span", { className: "font-medium", children: purchase.reference })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-0.5 text-xs text-slate-400", children: [
          purchase.items.length,
          " article",
          purchase.items.length > 1 ? "s" : ""
        ] })
      ] })
    },
    {
      key: "supplier",
      label: "Fournisseur",
      render: (purchase) => /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "font-medium", children: purchase.supplier.name }),
        purchase.supplier.company_name && /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-400", children: purchase.supplier.company_name })
      ] })
    },
    {
      key: "dates",
      label: "Dates",
      render: (purchase) => /* @__PURE__ */ jsxs("div", { className: "space-y-1 text-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-slate-300", children: [
          /* @__PURE__ */ jsx(Calendar, { className: "size-3.5" }),
          /* @__PURE__ */ jsxs("span", { children: [
            "Commande: ",
            formatDate(purchase.order_date)
          ] })
        ] }),
        purchase.expected_date && /* @__PURE__ */ jsxs("div", { className: "text-xs text-slate-400", children: [
          "Prévue: ",
          formatDate(purchase.expected_date)
        ] }),
        purchase.received_date && /* @__PURE__ */ jsxs("div", { className: "text-xs text-green-400", children: [
          "Reçue: ",
          formatDate(purchase.received_date)
        ] })
      ] })
    },
    {
      key: "status",
      label: "Statut",
      render: (purchase) => getStatusBadge(purchase.status)
    },
    {
      key: "total",
      label: "Total",
      render: (purchase) => /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsx("span", { className: "font-semibold text-green-400", children: formatCurrency(purchase.total, purchase.currency) }) })
    },
    {
      key: "actions",
      label: "Actions",
      render: (purchase) => /* @__PURE__ */ jsxs(TableActions, { children: [
        /* @__PURE__ */ jsx(Link_default, { href: route("purchases.show", { code_user, purchase: purchase.id }), children: /* @__PURE__ */ jsxs(TableActionButton, { children: [
          /* @__PURE__ */ jsx(Eye, { className: "size-4" }),
          "Voir"
        ] }) }),
        purchase.status === "draft" && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Link_default, { href: route("purchases.edit", { code_user, purchase: purchase.id }), children: /* @__PURE__ */ jsxs(TableActionButton, { children: [
            /* @__PURE__ */ jsx(Pencil, { className: "size-4" }),
            "Modifier"
          ] }) }),
          /* @__PURE__ */ jsxs(
            TableActionButton,
            {
              onClick: () => handleDelete(purchase),
              variant: "danger",
              children: [
                /* @__PURE__ */ jsx(Trash2, { className: "size-4" }),
                "Supprimer"
              ]
            }
          )
        ] }),
        purchase.status === "cancelled" && /* @__PURE__ */ jsxs(
          TableActionButton,
          {
            onClick: () => handleDelete(purchase),
            variant: "danger",
            children: [
              /* @__PURE__ */ jsx(Trash2, { className: "size-4" }),
              "Supprimer"
            ]
          }
        )
      ] })
    }
  ];
  return /* @__PURE__ */ jsxs(Authenticated, { children: [
    /* @__PURE__ */ jsx(Head_default, { title: "Bons de commande" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-white", children: "Bons de commande" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-400", children: "Gérez vos commandes fournisseurs et réceptionnez la marchandise" })
        ] }),
        /* @__PURE__ */ jsxs(
          Link_default,
          {
            href: route("purchases.create", { code_user }),
            className: "inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400",
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "size-5" }),
              "Nouveau bon de commande"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx("form", { onSubmit: handleFilter, className: "rounded-xl bg-slate-800/50 p-4", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-slate-300", children: "Recherche" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: search,
                onChange: (e) => setSearch(e.target.value),
                placeholder: "Référence, fournisseur...",
                className: "w-full rounded-lg border-slate-700 bg-slate-900/50 py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-amber-300 focus:ring-amber-300"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-slate-300", children: "Statut" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: status,
              onChange: (e) => setStatus(e.target.value),
              className: "w-full rounded-lg border-slate-700 bg-slate-900/50 py-2 px-4 text-sm text-white focus:border-amber-300 focus:ring-amber-300",
              children: [
                /* @__PURE__ */ jsx("option", { value: "all", children: "Tous les statuts" }),
                /* @__PURE__ */ jsx("option", { value: "draft", children: "Brouillon" }),
                /* @__PURE__ */ jsx("option", { value: "confirmed", children: "Confirmé" }),
                /* @__PURE__ */ jsx("option", { value: "partial", children: "Partiel" }),
                /* @__PURE__ */ jsx("option", { value: "received", children: "Reçu" }),
                /* @__PURE__ */ jsx("option", { value: "cancelled", children: "Annulé" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-slate-300", children: "Fournisseur" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: supplierId,
              onChange: (e) => setSupplierId(e.target.value),
              className: "w-full rounded-lg border-slate-700 bg-slate-900/50 py-2 px-4 text-sm text-white focus:border-amber-300 focus:ring-amber-300",
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "Tous les fournisseurs" }),
                suppliers.map((supplier) => /* @__PURE__ */ jsx("option", { value: supplier.id, children: supplier.name }, supplier.id))
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex items-end", children: /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            className: "w-full rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400",
            children: "Filtrer"
          }
        ) })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-4", children: [
        /* @__PURE__ */ jsx("div", { className: "rounded-xl bg-slate-800/50 p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-blue-500/10 p-3", children: /* @__PURE__ */ jsx(ShoppingCart, { className: "size-6 text-blue-400" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-white", children: purchases.total }),
            /* @__PURE__ */ jsx("div", { className: "text-sm text-slate-400", children: "Total commandes" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "rounded-xl bg-slate-800/50 p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-yellow-500/10 p-3", children: /* @__PURE__ */ jsx(Package, { className: "size-6 text-yellow-400" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-white", children: purchases.data.filter((p) => p.status === "confirmed" || p.status === "partial").length }),
            /* @__PURE__ */ jsx("div", { className: "text-sm text-slate-400", children: "En attente" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "rounded-xl bg-slate-800/50 p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-green-500/10 p-3", children: /* @__PURE__ */ jsx(Package, { className: "size-6 text-green-400" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-white", children: purchases.data.filter((p) => p.status === "received").length }),
            /* @__PURE__ */ jsx("div", { className: "text-sm text-slate-400", children: "Reçues" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "rounded-xl bg-slate-800/50 p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-amber-500/10 p-3", children: /* @__PURE__ */ jsx(DollarSign, { className: "size-6 text-amber-400" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-white", children: formatCurrency(
              purchases.data.filter((p) => p.status !== "cancelled").reduce((sum, p) => sum + parseFloat(p.total), 0).toString(),
              currency
            ) }),
            /* @__PURE__ */ jsx("div", { className: "text-sm text-slate-400", children: "Valeur totale" })
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsx(
        Table,
        {
          columns,
          data: purchases.data,
          emptyMessage: "Aucun bon de commande trouvé"
        }
      ),
      purchases.last_page > 1 && /* @__PURE__ */ jsx("div", { className: "mt-6 flex items-center justify-center gap-2", children: purchases.links.map((link, index) => {
        if (link.url === null) {
          return /* @__PURE__ */ jsx(
            "span",
            {
              className: "rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-500",
              dangerouslySetInnerHTML: { __html: link.label }
            },
            index
          );
        }
        return /* @__PURE__ */ jsx(
          Link_default,
          {
            href: link.url,
            preserveState: true,
            preserveScroll: true,
            className: `rounded-lg border px-4 py-2 text-sm transition-colors ${link.active ? "border-amber-300 bg-amber-300 text-slate-950 font-semibold" : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"}`,
            dangerouslySetInnerHTML: { __html: link.label }
          },
          index
        );
      }) })
    ] }),
    /* @__PURE__ */ jsx(
      ConfirmDeleteModal,
      {
        show: deleteModal.show,
        onClose: () => setDeleteModal({ show: false, purchase: null }),
        onConfirm: confirmDelete,
        title: "Supprimer le bon de commande",
        message: `Êtes-vous sûr de vouloir supprimer le bon de commande ${deleteModal.purchase?.reference} ? Cette action est irréversible.`,
        processing: deleting
      }
    )
  ] });
}
export {
  PurchasesIndex as default
};
