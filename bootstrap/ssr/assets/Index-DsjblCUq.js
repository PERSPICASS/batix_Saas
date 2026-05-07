import { jsxs, jsx } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { H as Head_default, L as Link_default, r as router3 } from "../ssr.js";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { T as Table, b as TableBadge, c as TableActions, d as TableActionButton } from "./Table-Cvz7wd2g.js";
import { u as useRoute } from "./route-C2Ac8FMA.js";
import "react";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
function SubcategoriesIndex({ subcategories, categories }) {
  const route = useRoute();
  const handleDelete = (id) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette sous-catégorie ?")) {
      router3.delete(route("subcategories.destroy", { sous_category: id }));
    }
  };
  const columns = [
    {
      key: "name",
      label: "Nom"
    },
    {
      key: "category",
      label: "Catégorie parente",
      render: (subcategory) => subcategory.category.name
    },
    {
      key: "shop",
      label: "Boutique",
      render: (subcategory) => subcategory.category.shop.name
    },
    {
      key: "is_active",
      label: "Statut",
      align: "center",
      render: (subcategory) => /* @__PURE__ */ jsx(TableBadge, { variant: subcategory.is_active ? "success" : "danger", children: subcategory.is_active ? "Active" : "Inactive" })
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (subcategory) => /* @__PURE__ */ jsxs(TableActions, { children: [
        /* @__PURE__ */ jsx(Link_default, { href: route("subcategories.edit", { sous_category: subcategory.id }), children: /* @__PURE__ */ jsxs(TableActionButton, { children: [
          /* @__PURE__ */ jsx(Pencil, { className: "size-3.5" }),
          " Modifier"
        ] }) }),
        /* @__PURE__ */ jsxs(
          TableActionButton,
          {
            variant: "danger",
            onClick: () => handleDelete(subcategory.id),
            children: [
              /* @__PURE__ */ jsx(Trash2, { className: "size-3.5" }),
              " Supprimer"
            ]
          }
        )
      ] })
    }
  ];
  return /* @__PURE__ */ jsxs(Authenticated, { header: /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-white", children: "Sous-catégories" }), children: [
    /* @__PURE__ */ jsx(Head_default, { title: "Sous categories" }),
    /* @__PURE__ */ jsxs("section", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-300", children: "Gérez les sous-catégories de vos produits." }),
        /* @__PURE__ */ jsxs(Link_default, { href: route("subcategories.create"), className: "inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200", children: [
          /* @__PURE__ */ jsx(Plus, { className: "size-4" }),
          " Nouvelle sous-catégorie"
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        Table,
        {
          columns,
          data: subcategories,
          emptyMessage: "Aucune sous-catégorie. Créez-en une pour commencer."
        }
      )
    ] })
  ] });
}
export {
  SubcategoriesIndex as default
};
