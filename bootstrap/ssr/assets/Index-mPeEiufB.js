import { jsxs, jsx } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { H as Head_default, L as Link_default, r as router3 } from "../ssr.js";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { T as Table, c as TableActions, d as TableActionButton } from "./Table-Cvz7wd2g.js";
import { useState } from "react";
import { u as useRoute } from "./route-C2Ac8FMA.js";
import { C as Currency } from "./Currency-BX_NSrIs.js";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
function InvoicesIndex({ invoices }) {
  const route = useRoute();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const handleSearch = () => {
    router3.get(
      route("invoices.index"),
      { search: searchTerm, status: statusFilter },
      { preserveState: true }
    );
  };
  const handleDelete = (invoice) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la facture ${invoice.invoice_number} ?`)) {
      router3.delete(route("invoices.destroy", { invoice: invoice.id }));
    }
  };
  const getStatusBadge = (status) => {
    const badges = {
      draft: { bg: "bg-slate-500/20", text: "text-slate-300" },
      sent: { bg: "bg-blue-500/20", text: "text-blue-300" },
      paid: { bg: "bg-green-500/20", text: "text-green-300" },
      overdue: { bg: "bg-red-500/20", text: "text-red-300" },
      cancelled: { bg: "bg-gray-500/20", text: "text-gray-300" }
    };
    const statusLabels = {
      draft: "Brouillon",
      sent: "Envoyée",
      paid: "Payée",
      overdue: "En retard",
      cancelled: "Annulée"
    };
    const badge = badges[status] || badges.draft;
    return /* @__PURE__ */ jsx(
      "span",
      {
        className: `inline-flex rounded-full px-2 py-1 text-xs font-medium ${badge.bg} ${badge.text}`,
        children: statusLabels[status] || status
      }
    );
  };
  const getInvoiceTotal = (invoice) => {
    const value = Number(invoice.total ?? invoice.total_amount ?? 0);
    return Number.isFinite(value) ? value : 0;
  };
  const columns = [
    {
      key: "invoice_number",
      label: "Numéro",
      render: (invoice) => /* @__PURE__ */ jsx("span", { className: "font-medium text-amber-300", children: invoice.invoice_number })
    },
    {
      key: "customer",
      label: "Client",
      render: (invoice) => invoice.customer.name
    },
    {
      key: "invoice_date",
      label: "Date",
      render: (invoice) => new Date(invoice.invoice_date).toLocaleDateString("fr-FR")
    },
    {
      key: "due_date",
      label: "Échéance",
      render: (invoice) => new Date(invoice.due_date).toLocaleDateString("fr-FR")
    },
    {
      key: "status",
      label: "Statut",
      render: (invoice) => getStatusBadge(invoice.status)
    },
    {
      key: "total",
      label: "Montant TTC",
      render: (invoice) => /* @__PURE__ */ jsx("span", { className: "font-semibold", children: /* @__PURE__ */ jsx(Currency, { amount: getInvoiceTotal(invoice) }) })
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (invoice) => /* @__PURE__ */ jsxs(TableActions, { children: [
        /* @__PURE__ */ jsxs(
          Link_default,
          {
            href: route("invoices.show", { invoice: invoice.id }),
            className: "inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/10",
            children: [
              /* @__PURE__ */ jsx(Eye, { className: "size-3.5" }),
              " Voir"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Link_default,
          {
            href: route("invoices.edit", { invoice: invoice.id }),
            className: "inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/10",
            children: [
              /* @__PURE__ */ jsx(Pencil, { className: "size-3.5" }),
              " Modifier"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(TableActionButton, { variant: "danger", onClick: () => handleDelete(invoice), children: [
          /* @__PURE__ */ jsx(Trash2, { className: "size-3.5" }),
          " Supprimer"
        ] })
      ] })
    }
  ];
  return /* @__PURE__ */ jsxs(Authenticated, { header: /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-white", children: "Factures" }), children: [
    /* @__PURE__ */ jsx(Head_default, { title: "Factures" }),
    /* @__PURE__ */ jsxs("section", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-white/10 bg-white/5 p-4", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: "Total factures" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-2xl font-bold text-white", children: invoices.total })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-white/10 bg-white/5 p-4", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: "Payées" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-2xl font-bold text-green-400", children: invoices.data.filter((inv) => inv.status === "paid").length })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-white/10 bg-white/5 p-4", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: "En attente" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-2xl font-bold text-blue-400", children: invoices.data.filter((inv) => inv.status === "sent").length })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-white/10 bg-white/5 p-4", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: "En retard" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-2xl font-bold text-red-400", children: invoices.data.filter((inv) => inv.status === "overdue").length })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-4", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            placeholder: "Rechercher par numéro ou client...",
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            onKeyPress: (e) => e.key === "Enter" && handleSearch(),
            className: "flex-1 rounded-lg border border-white/15 bg-slate-900/70 px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
          }
        ),
        /* @__PURE__ */ jsxs(
          "select",
          {
            value: statusFilter,
            onChange: (e) => setStatusFilter(e.target.value),
            className: "rounded-lg border border-white/15 bg-slate-900/70 px-4 py-2 text-sm text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
            children: [
              /* @__PURE__ */ jsx("option", { value: "", children: "Tous les statuts" }),
              /* @__PURE__ */ jsx("option", { value: "draft", children: "Brouillon" }),
              /* @__PURE__ */ jsx("option", { value: "sent", children: "Envoyée" }),
              /* @__PURE__ */ jsx("option", { value: "paid", children: "Payée" }),
              /* @__PURE__ */ jsx("option", { value: "overdue", children: "En retard" }),
              /* @__PURE__ */ jsx("option", { value: "cancelled", children: "Annulée" })
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleSearch,
            className: "rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5",
            children: "Rechercher"
          }
        ),
        /* @__PURE__ */ jsxs(
          Link_default,
          {
            href: route("invoices.create"),
            className: "inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-200",
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "size-4" }),
              " Nouvelle facture"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx(
        Table,
        {
          columns,
          data: invoices.data
        }
      ),
      invoices.links && /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center gap-1", children: invoices.links.map((link, index) => /* @__PURE__ */ jsx(
        Link_default,
        {
          href: link.url || "#",
          className: `rounded-lg px-3 py-2 text-sm ${link.active ? "bg-amber-300 text-slate-950 font-semibold" : "border border-white/15 text-slate-200 hover:bg-white/10"} ${!link.url ? "opacity-50 cursor-not-allowed" : ""}`,
          dangerouslySetInnerHTML: { __html: link.label }
        },
        index
      )) })
    ] })
  ] });
}
export {
  InvoicesIndex as default
};
