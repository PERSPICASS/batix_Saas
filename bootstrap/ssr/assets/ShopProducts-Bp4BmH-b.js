import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { H as Head_default, L as Link_default, r as router3 } from "../ssr.js";
import { Search, Package, ArrowLeft } from "lucide-react";
import { T as Table, b as TableBadge } from "./Table-Cvz7wd2g.js";
import { useState } from "react";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
function ShopProducts({ shop, products, categories, filters }) {
  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const handleSearch = (e) => {
    e.preventDefault();
    router3.get(
      route("platform.shops.products", shop.id),
      { search: searchTerm, category_id: filters.category_id, status: filters.status },
      { preserveState: true }
    );
  };
  const handleCategoryFilter = (categoryId) => {
    router3.get(
      route("platform.shops.products", shop.id),
      { search: filters.search, category_id: categoryId === "" ? void 0 : categoryId, status: filters.status },
      { preserveState: true }
    );
  };
  const handleStatusFilter = (status) => {
    router3.get(
      route("platform.shops.products", shop.id),
      { search: filters.search, category_id: filters.category_id, status },
      { preserveState: true }
    );
  };
  const formatPrice = (price) => {
    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };
  const columns = [
    {
      key: "name",
      label: "Produit",
      render: (product) => /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "font-medium text-white", children: product.name }),
        product.sku && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400", children: [
          "SKU: ",
          product.sku
        ] }),
        product.barcode && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-500", children: [
          "Code-barres: ",
          product.barcode
        ] })
      ] })
    },
    {
      key: "category",
      label: "Catégorie",
      render: (product) => /* @__PURE__ */ jsx("div", { children: product.category ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-white", children: product.category.name }),
        product.subcategory && /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: product.subcategory.name })
      ] }) : /* @__PURE__ */ jsx("span", { className: "text-sm text-slate-500", children: "Sans catégorie" }) })
    },
    {
      key: "price",
      label: "Prix",
      render: (product) => /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "font-medium text-white", children: formatPrice(product.price) }),
        product.cost_price && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400", children: [
          "Coût: ",
          formatPrice(product.cost_price)
        ] })
      ] })
    },
    {
      key: "stock",
      label: "Stock",
      render: (product) => {
        if (!product.track_stock) {
          return /* @__PURE__ */ jsx("span", { className: "text-sm text-slate-400", children: "Non suivi" });
        }
        const isLowStock = product.min_stock_alert && product.stock_quantity <= product.min_stock_alert;
        return /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: `font-medium ${isLowStock ? "text-red-400" : "text-white"}`, children: product.stock_quantity }),
          product.min_stock_alert && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400", children: [
            "Alerte: ",
            product.min_stock_alert
          ] })
        ] });
      }
    },
    {
      key: "status",
      label: "Statut",
      render: (product) => /* @__PURE__ */ jsx(TableBadge, { variant: product.is_active ? "success" : "danger", children: product.is_active ? "Actif" : "Inactif" })
    },
    {
      key: "created_at",
      label: "Créé le",
      render: (product) => /* @__PURE__ */ jsx("span", { className: "text-sm text-slate-400", children: new Date(product.created_at).toLocaleDateString("fr-FR") })
    }
  ];
  return /* @__PURE__ */ jsxs(
    Authenticated,
    {
      header: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-xl font-semibold text-white", children: [
            "Produits de ",
            shop.name
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-slate-400", children: [
            "Propriétaire: ",
            shop.owner.name,
            " (",
            shop.owner.email,
            ")"
          ] })
        ] }),
        /* @__PURE__ */ jsxs(
          Link_default,
          {
            href: route("platform.shops"),
            className: "flex items-center gap-2 text-sm text-amber-300 hover:text-amber-200",
            children: [
              /* @__PURE__ */ jsx(ArrowLeft, { className: "size-4" }),
              "Retour aux boutiques"
            ]
          }
        )
      ] }),
      children: [
        /* @__PURE__ */ jsx(Head_default, { title: `Produits - ${shop.name} - Admin Plateforme` }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4", children: [
            /* @__PURE__ */ jsx("form", { onSubmit: handleSearch, className: "flex-1", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: searchTerm,
                  onChange: (e) => setSearchTerm(e.target.value),
                  placeholder: "Rechercher par nom, SKU ou code-barres...",
                  className: "w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-300/20"
                }
              )
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center", children: [
              /* @__PURE__ */ jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsxs(
                "select",
                {
                  value: filters.category_id || "",
                  onChange: (e) => handleCategoryFilter(e.target.value),
                  className: "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-300/20",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "Toutes les catégories" }),
                    categories.map((category) => /* @__PURE__ */ jsx("option", { value: category.id, children: category.name }, category.id))
                  ]
                }
              ) }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => handleStatusFilter(""),
                    className: `rounded-lg px-3 py-2 text-sm transition ${!filters.status ? "bg-amber-300 text-slate-950" : "border border-white/10 text-slate-300 hover:bg-white/5"}`,
                    children: "Tous"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => handleStatusFilter("active"),
                    className: `rounded-lg px-3 py-2 text-sm transition ${filters.status === "active" ? "bg-amber-300 text-slate-950" : "border border-white/10 text-slate-300 hover:bg-white/5"}`,
                    children: "Actifs"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => handleStatusFilter("inactive"),
                    className: `rounded-lg px-3 py-2 text-sm transition ${filters.status === "inactive" ? "bg-amber-300 text-slate-950" : "border border-white/10 text-slate-300 hover:bg-white/5"}`,
                    children: "Inactifs"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => handleStatusFilter("low_stock"),
                    className: `rounded-lg px-3 py-2 text-sm transition ${filters.status === "low_stock" ? "bg-amber-300 text-slate-950" : "border border-white/10 text-slate-300 hover:bg-white/5"}`,
                    children: "Stock bas"
                  }
                )
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-4 sm:grid-cols-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl", children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: "Total produits" }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 text-2xl font-bold text-white", children: products.total })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl", children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: "Sur cette page" }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 text-2xl font-bold text-white", children: products.data.length })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl", children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: "Page actuelle" }),
              /* @__PURE__ */ jsxs("p", { className: "mt-1 text-2xl font-bold text-white", children: [
                products.current_page,
                " / ",
                products.last_page
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl", children: products.data.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "p-8 text-center", children: [
            /* @__PURE__ */ jsx(Package, { className: "mx-auto size-12 text-slate-600" }),
            /* @__PURE__ */ jsx("p", { className: "mt-4 text-slate-400", children: filters.search || filters.category_id || filters.status ? "Aucun produit ne correspond aux critères de recherche." : "Cette boutique n'a pas encore de produits." })
          ] }) : /* @__PURE__ */ jsx(
            Table,
            {
              columns,
              data: products.data,
              emptyMessage: "Aucun produit trouvé."
            }
          ) })
        ] })
      ]
    }
  );
}
export {
  ShopProducts as default
};
