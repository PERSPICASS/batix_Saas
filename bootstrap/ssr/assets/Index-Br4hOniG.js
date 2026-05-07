import { jsxs, jsx } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { H as Head_default, L as Link_default, r as router3 } from "../ssr.js";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { T as Table, a as TableColorIndicator, b as TableBadge, c as TableActions, d as TableActionButton } from "./Table-Cvz7wd2g.js";
import { u as useRoute } from "./route-C2Ac8FMA.js";
import { useState } from "react";
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
function CategoriesIndex({ categories, shops }) {
  const route = useRoute();
  const [deleteModal, setDeleteModal] = useState({ show: false, category: null });
  const [deleting, setDeleting] = useState(false);
  const handleDelete = (category) => {
    setDeleteModal({ show: true, category });
  };
  const confirmDelete = () => {
    if (!deleteModal.category) return;
    setDeleting(true);
    router3.delete(route("categories.destroy", { category: deleteModal.category.id }), {
      onSuccess: () => {
        setDeleteModal({ show: false, category: null });
        setDeleting(false);
      },
      onError: () => setDeleting(false)
    });
  };
  const columns = [
    {
      key: "name",
      label: "Nom",
      render: (category) => /* @__PURE__ */ jsx(TableColorIndicator, { color: category.color, label: category.name })
    },
    {
      key: "description",
      label: "Description",
      render: (category) => category.description || "-"
    },
    {
      key: "is_active",
      label: "Statut",
      align: "center",
      render: (category) => /* @__PURE__ */ jsx(TableBadge, { variant: category.is_active ? "success" : "danger", children: category.is_active ? "Active" : "Inactive" })
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (category) => /* @__PURE__ */ jsxs(TableActions, { children: [
        /* @__PURE__ */ jsx(Link_default, { href: route("categories.edit", { category: category.id }), children: /* @__PURE__ */ jsxs(TableActionButton, { children: [
          /* @__PURE__ */ jsx(Pencil, { className: "size-3.5" }),
          " Modifier"
        ] }) }),
        /* @__PURE__ */ jsxs(
          TableActionButton,
          {
            variant: "danger",
            onClick: () => handleDelete(category),
            children: [
              /* @__PURE__ */ jsx(Trash2, { className: "size-3.5" }),
              " Supprimer"
            ]
          }
        )
      ] })
    }
  ];
  return /* @__PURE__ */ jsxs(Authenticated, { header: /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-white", children: "Catégories" }), children: [
    /* @__PURE__ */ jsx(Head_default, { title: "Categories" }),
    /* @__PURE__ */ jsxs("section", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-300", children: "Gérez les catégories de vos produits." }),
        /* @__PURE__ */ jsxs(Link_default, { href: route("categories.create"), className: "inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200", children: [
          /* @__PURE__ */ jsx(Plus, { className: "size-4" }),
          " Nouvelle catégorie"
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        Table,
        {
          columns,
          data: categories,
          emptyMessage: "Aucune catégorie. Créez-en une pour commencer."
        }
      ),
      /* @__PURE__ */ jsx(
        ConfirmDeleteModal,
        {
          show: deleteModal.show,
          onClose: () => setDeleteModal({ show: false, category: null }),
          onConfirm: confirmDelete,
          message: `Êtes-vous sûr de vouloir supprimer la catégorie "${deleteModal.category?.name}" ?`,
          processing: deleting
        }
      )
    ] })
  ] });
}
export {
  CategoriesIndex as default
};
