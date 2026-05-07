import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { H as Head_default, L as Link_default, r as router3 } from "../ssr.js";
import { Plus, Eye, Pencil, ClipboardCheck, Trash2 } from "lucide-react";
import { T as Table, c as TableActions, d as TableActionButton } from "./Table-Cvz7wd2g.js";
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
function InventoryIndex({ inventories, filters }) {
  const route = useRoute();
  const [statusFilter, setStatusFilter] = useState(filters.status || "");
  const [deleteModal, setDeleteModal] = useState({ show: false, inventory: null });
  const [completeModal, setCompleteModal] = useState({ show: false, inventory: null });
  const [processing, setProcessing] = useState(false);
  const handleSearch = () => {
    router3.get(route("inventory.index"), { status: statusFilter }, { preserveState: true });
  };
  const handleDelete = (inventory) => {
    setDeleteModal({ show: true, inventory });
  };
  const confirmDelete = () => {
    if (!deleteModal.inventory) return;
    setProcessing(true);
    router3.delete(route("inventory.destroy", { inventory: deleteModal.inventory.id }), {
      onSuccess: () => {
        setDeleteModal({ show: false, inventory: null });
        setProcessing(false);
      },
      onError: () => setProcessing(false)
    });
  };
  const handleComplete = (inventory) => {
    setCompleteModal({ show: true, inventory });
  };
  const confirmComplete = () => {
    if (!completeModal.inventory) return;
    setProcessing(true);
    router3.post(route("inventory.complete", { inventory: completeModal.inventory.id }), {}, {
      onSuccess: () => {
        setCompleteModal({ show: false, inventory: null });
        setProcessing(false);
      },
      onError: () => setProcessing(false)
    });
  };
  const getStatusBadge = (status) => {
    const statuses = {
      draft: { label: "Brouillon", bg: "bg-slate-500/20", text: "text-slate-300" },
      in_progress: { label: "En cours", bg: "bg-blue-500/20", text: "text-blue-300" },
      completed: { label: "Terminé", bg: "bg-green-500/20", text: "text-green-300" },
      cancelled: { label: "Annulé", bg: "bg-red-500/20", text: "text-red-300" }
    };
    const statusInfo = statuses[status] || statuses.draft;
    return /* @__PURE__ */ jsx("span", { className: `inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`, children: statusInfo.label });
  };
  const columns = [
    {
      key: "inventory_number",
      label: "Numéro",
      render: (inventory) => /* @__PURE__ */ jsx("span", { className: "font-medium text-amber-300", children: inventory.inventory_number })
    },
    {
      key: "inventory_date",
      label: "Date",
      render: (inventory) => new Date(inventory.inventory_date).toLocaleDateString("fr-FR")
    },
    {
      key: "shop",
      label: "Boutique",
      render: (inventory) => inventory.shop.name
    },
    {
      key: "total_items",
      label: "Produits",
      align: "center",
      render: (inventory) => /* @__PURE__ */ jsx("span", { className: "font-semibold text-slate-200", children: inventory.total_items })
    },
    {
      key: "total_discrepancies",
      label: "Écarts",
      align: "center",
      render: (inventory) => /* @__PURE__ */ jsx("span", { className: `font-semibold ${inventory.total_discrepancies > 0 ? "text-amber-400" : "text-green-400"}`, children: inventory.total_discrepancies })
    },
    {
      key: "status",
      label: "Statut",
      render: (inventory) => getStatusBadge(inventory.status)
    },
    {
      key: "user",
      label: "Créé par",
      render: (inventory) => /* @__PURE__ */ jsx("span", { className: "text-sm text-slate-300", children: inventory.user.name })
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (inventory) => /* @__PURE__ */ jsxs(TableActions, { children: [
        /* @__PURE__ */ jsxs(
          Link_default,
          {
            href: route("inventory.show", { inventory: inventory.id }),
            className: "inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/10",
            children: [
              /* @__PURE__ */ jsx(Eye, { className: "size-3.5" }),
              " Voir"
            ]
          }
        ),
        inventory.status !== "completed" && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs(
            Link_default,
            {
              href: route("inventory.edit", { inventory: inventory.id }),
              className: "inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/10",
              children: [
                /* @__PURE__ */ jsx(Pencil, { className: "size-3.5" }),
                " Modifier"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(TableActionButton, { variant: "success", onClick: () => handleComplete(inventory), children: [
            /* @__PURE__ */ jsx(ClipboardCheck, { className: "size-3.5" }),
            " Terminer"
          ] }),
          /* @__PURE__ */ jsxs(TableActionButton, { variant: "danger", onClick: () => handleDelete(inventory), children: [
            /* @__PURE__ */ jsx(Trash2, { className: "size-3.5" }),
            " Supprimer"
          ] })
        ] })
      ] })
    }
  ];
  return /* @__PURE__ */ jsxs(Authenticated, { header: /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-white", children: "Inventaires" }), children: [
    /* @__PURE__ */ jsx(Head_default, { title: "Inventaires" }),
    /* @__PURE__ */ jsxs("section", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: statusFilter,
              onChange: (e) => setStatusFilter(e.target.value),
              className: "rounded-lg border border-white/15 bg-slate-900/70 px-4 py-2 text-sm text-slate-200",
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "Tous les statuts" }),
                /* @__PURE__ */ jsx("option", { value: "draft", children: "Brouillon" }),
                /* @__PURE__ */ jsx("option", { value: "in_progress", children: "En cours" }),
                /* @__PURE__ */ jsx("option", { value: "completed", children: "Terminé" }),
                /* @__PURE__ */ jsx("option", { value: "cancelled", children: "Annulé" })
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleSearch,
              className: "rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/5",
              children: "Filtrer"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs(
          Link_default,
          {
            href: route("inventory.create"),
            className: "inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200",
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "size-4" }),
              " Nouvel inventaire"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx(Table, { columns, data: inventories.data }),
      inventories.links && /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center gap-1", children: inventories.links.map((link, index) => /* @__PURE__ */ jsx(
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
          onClose: () => setDeleteModal({ show: false, inventory: null }),
          onConfirm: confirmDelete,
          message: `Êtes-vous sûr de vouloir supprimer l'inventaire "${deleteModal.inventory?.inventory_number}" ?`,
          processing
        }
      ),
      /* @__PURE__ */ jsx(
        ConfirmDeleteModal,
        {
          show: completeModal.show,
          onClose: () => setCompleteModal({ show: false, inventory: null }),
          onConfirm: confirmComplete,
          title: "Terminer l'inventaire",
          message: `Terminer l'inventaire "${completeModal.inventory?.inventory_number}" ? Les différences seront appliquées au stock.`,
          confirmText: "Terminer",
          processing
        }
      )
    ] })
  ] });
}
export {
  InventoryIndex as default
};
