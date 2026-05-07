import { jsxs, jsx } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { H as Head_default, L as Link_default, r as router3 } from "../ssr.js";
import { Plus, Search, Filter, Building2, Phone, MapPin, Store, Eye, Pencil, Trash2 } from "lucide-react";
import { T as Table, b as TableBadge, c as TableActions, d as TableActionButton } from "./Table-Cvz7wd2g.js";
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
function SuppliersIndex({ suppliers, filters }) {
  const route = useRoute();
  const [search, setSearch] = useState(filters.search || "");
  const [status, setStatus] = useState(filters.status || "");
  const [deleteModal, setDeleteModal] = useState({ show: false, supplier: null });
  const [deleting, setDeleting] = useState(false);
  const handleFilter = (e) => {
    e.preventDefault();
    router3.get(
      route("suppliers.index"),
      { search, status },
      { preserveState: true, preserveScroll: true }
    );
  };
  const handleDelete = (supplier) => {
    setDeleteModal({ show: true, supplier });
  };
  const confirmDelete = () => {
    if (!deleteModal.supplier) return;
    setDeleting(true);
    router3.delete(route("suppliers.destroy", { supplier: deleteModal.supplier.id }), {
      onSuccess: () => {
        setDeleteModal({ show: false, supplier: null });
        setDeleting(false);
      },
      onError: () => setDeleting(false)
    });
  };
  const columns = [
    {
      key: "name",
      label: "Fournisseur",
      render: (supplier) => /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Building2, { className: "size-4 text-amber-300" }),
          /* @__PURE__ */ jsx("span", { className: "font-medium", children: supplier.name })
        ] }),
        supplier.company_name && /* @__PURE__ */ jsx("div", { className: "mt-0.5 text-xs text-slate-400", children: supplier.company_name })
      ] })
    },
    {
      key: "contact",
      label: "Contact",
      render: (supplier) => /* @__PURE__ */ jsxs("div", { className: "space-y-1 text-sm text-slate-300", children: [
        supplier.phone && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Phone, { className: "size-3.5" }),
          supplier.phone
        ] }),
        supplier.email && /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-400", children: supplier.email })
      ] })
    },
    {
      key: "location",
      label: "Localisation",
      render: (supplier) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-slate-300", children: [
        /* @__PURE__ */ jsx(MapPin, { className: "size-4" }),
        /* @__PURE__ */ jsxs("div", { children: [
          supplier.city && /* @__PURE__ */ jsx("div", { children: supplier.city }),
          /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-400", children: supplier.country })
        ] })
      ] })
    },
    {
      key: "shops",
      label: "Boutiques",
      render: (supplier) => /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1", children: supplier.shops?.map((shop) => /* @__PURE__ */ jsxs(
        "span",
        {
          className: "inline-flex items-center gap-1 rounded-full bg-slate-700/50 px-2 py-0.5 text-xs text-slate-300",
          children: [
            /* @__PURE__ */ jsx(Store, { className: "size-3" }),
            shop.name
          ]
        },
        shop.id
      )) })
    },
    {
      key: "status",
      label: "Statut",
      align: "center",
      render: (supplier) => /* @__PURE__ */ jsx(TableBadge, { variant: supplier.is_active ? "success" : "danger", children: supplier.is_active ? "Actif" : "Inactif" })
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (supplier) => /* @__PURE__ */ jsxs(TableActions, { children: [
        /* @__PURE__ */ jsxs(
          Link_default,
          {
            href: route("suppliers.show", { supplier: supplier.id }),
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
            href: route("suppliers.edit", { supplier: supplier.id }),
            className: "inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/10",
            children: [
              /* @__PURE__ */ jsx(Pencil, { className: "size-3.5" }),
              " Modifier"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(TableActionButton, { variant: "danger", onClick: () => handleDelete(supplier), children: [
          /* @__PURE__ */ jsx(Trash2, { className: "size-3.5" }),
          " Supprimer"
        ] })
      ] })
    }
  ];
  return /* @__PURE__ */ jsxs(Authenticated, { header: /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-white", children: "Fournisseurs" }), children: [
    /* @__PURE__ */ jsx(Head_default, { title: "Fournisseurs" }),
    /* @__PURE__ */ jsxs("section", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-300", children: "Gérez vos fournisseurs et leurs informations" }),
        /* @__PURE__ */ jsxs(
          Link_default,
          {
            href: route("suppliers.create"),
            className: "inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200",
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "size-4" }),
              " Nouveau fournisseur"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx("form", { onSubmit: handleFilter, className: "rounded-2xl border border-white/10 bg-white/5 p-4", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "search", className: "block text-sm font-medium text-slate-200", children: "Recherche" }),
          /* @__PURE__ */ jsxs("div", { className: "relative mt-1", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                id: "search",
                value: search,
                onChange: (e) => setSearch(e.target.value),
                className: "block w-full rounded-lg border border-white/15 bg-slate-900/70 py-2 pl-10 pr-3 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
                placeholder: "Nom, email, téléphone..."
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "status", className: "block text-sm font-medium text-slate-200", children: "Statut" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              id: "status",
              value: status,
              onChange: (e) => setStatus(e.target.value),
              className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "Tous" }),
                /* @__PURE__ */ jsx("option", { value: "active", children: "Actifs" }),
                /* @__PURE__ */ jsx("option", { value: "inactive", children: "Inactifs" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex items-end", children: /* @__PURE__ */ jsxs(
          "button",
          {
            type: "submit",
            className: "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200",
            children: [
              /* @__PURE__ */ jsx(Filter, { className: "size-4" }),
              " Filtrer"
            ]
          }
        ) })
      ] }) }),
      /* @__PURE__ */ jsx(Table, { columns, data: suppliers.data, emptyMessage: "Aucun fournisseur trouvé" }),
      suppliers.links && /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center gap-1", children: suppliers.links.map((link, index) => /* @__PURE__ */ jsx(
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
          onClose: () => setDeleteModal({ show: false, supplier: null }),
          onConfirm: confirmDelete,
          message: `Êtes-vous sûr de vouloir supprimer le fournisseur "${deleteModal.supplier?.name}" ?`,
          processing: deleting
        }
      )
    ] })
  ] });
}
export {
  SuppliersIndex as default
};
