import { jsxs, jsx } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { H as Head_default, L as Link_default, r as router3 } from "../ssr.js";
import { Plus, Trash2, TrendingUp, TrendingDown, Package } from "lucide-react";
import { T as Table, c as TableActions, d as TableActionButton } from "./Table-Cvz7wd2g.js";
import { useState } from "react";
import { u as useRoute } from "./route-C2Ac8FMA.js";
import { C as ConfirmDeleteModal } from "./ConfirmDeleteModal-GTROztIR.js";
import { P as ProductImage } from "./ProductImage-5zmeiiH5.js";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
import "./Modal-BeSeEOS3.js";
import "@headlessui/react";
function StocksIndex({ movements, shops, filters }) {
  const route = useRoute();
  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const [typeFilter, setTypeFilter] = useState(filters.type || "");
  const [shopFilter, setShopFilter] = useState(filters.shop_id || "");
  const [dateFrom, setDateFrom] = useState(filters.date_from || "");
  const [dateTo, setDateTo] = useState(filters.date_to || "");
  const [deleteModal, setDeleteModal] = useState({ show: false, movement: null });
  const [deleting, setDeleting] = useState(false);
  const handleSearch = () => {
    router3.get(
      route("stocks.index"),
      { search: searchTerm, type: typeFilter, shop_id: shopFilter, date_from: dateFrom, date_to: dateTo },
      { preserveState: true }
    );
  };
  const handleDelete = (movement) => {
    setDeleteModal({ show: true, movement });
  };
  const confirmDelete = () => {
    if (!deleteModal.movement) return;
    setDeleting(true);
    router3.delete(route("stocks.destroy", { stockMovement: deleteModal.movement.id }), {
      onSuccess: () => {
        setDeleteModal({ show: false, movement: null });
        setDeleting(false);
      },
      onError: () => setDeleting(false)
    });
  };
  const getTypeBadge = (type) => {
    const types = {
      in: { label: "Entrée", bg: "bg-green-500/20", text: "text-green-300", icon: TrendingUp },
      out: { label: "Sortie", bg: "bg-red-500/20", text: "text-red-300", icon: TrendingDown },
      transfer: { label: "Transfert", bg: "bg-blue-500/20", text: "text-blue-300", icon: Package },
      adjustment: { label: "Ajustement", bg: "bg-amber-500/20", text: "text-amber-300", icon: Package },
      sale: { label: "Vente", bg: "bg-purple-500/20", text: "text-purple-300", icon: TrendingDown },
      return: { label: "Retour", bg: "bg-cyan-500/20", text: "text-cyan-300", icon: TrendingUp }
    };
    const typeInfo = types[type] || types.adjustment;
    const Icon = typeInfo.icon;
    return /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${typeInfo.bg} ${typeInfo.text}`, children: [
      /* @__PURE__ */ jsx(Icon, { className: "size-3" }),
      typeInfo.label
    ] });
  };
  const columns = [
    {
      key: "movement_date",
      label: "Date",
      render: (movement) => new Date(movement.movement_date).toLocaleDateString("fr-FR")
    },
    {
      key: "product",
      label: "Produit",
      render: (movement) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(ProductImage, { src: movement.product.image, name: movement.product.name, thumbnailClass: "size-9" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "font-medium text-slate-200", children: movement.product.name }),
          movement.product.sku && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400", children: [
            "SKU: ",
            movement.product.sku
          ] })
        ] })
      ] })
    },
    {
      key: "type",
      label: "Type",
      render: (movement) => getTypeBadge(movement.type)
    },
    {
      key: "quantity",
      label: "Quantité",
      align: "center",
      render: (movement) => /* @__PURE__ */ jsxs("span", { className: `font-semibold ${movement.quantity > 0 ? "text-green-400" : "text-red-400"}`, children: [
        movement.quantity > 0 ? "+" : "",
        movement.quantity
      ] })
    },
    {
      key: "shop",
      label: "Boutique",
      render: (movement) => movement.shop.name
    },
    {
      key: "user",
      label: "Par",
      render: (movement) => /* @__PURE__ */ jsx("span", { className: "text-sm text-slate-300", children: movement.user.name })
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (movement) => /* @__PURE__ */ jsxs(TableActions, { children: [
        /* @__PURE__ */ jsx(
          Link_default,
          {
            href: route("stocks.show", { stockMovement: movement.id }),
            className: "inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/10",
            children: "Voir"
          }
        ),
        /* @__PURE__ */ jsxs(TableActionButton, { variant: "danger", onClick: () => handleDelete(movement), children: [
          /* @__PURE__ */ jsx(Trash2, { className: "size-3.5" }),
          " Supprimer"
        ] })
      ] })
    }
  ];
  return /* @__PURE__ */ jsxs(Authenticated, { header: /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-white", children: "Mouvements de stock" }), children: [
    /* @__PURE__ */ jsx(Head_default, { title: "Mouvements de stock" }),
    /* @__PURE__ */ jsxs("section", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-6", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              placeholder: "Rechercher produit...",
              value: searchTerm,
              onChange: (e) => setSearchTerm(e.target.value),
              onKeyPress: (e) => e.key === "Enter" && handleSearch(),
              className: "md:col-span-2 rounded-lg border border-white/15 bg-slate-900/70 px-4 py-2 text-sm text-slate-200 placeholder-slate-500"
            }
          ),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: typeFilter,
              onChange: (e) => setTypeFilter(e.target.value),
              className: "rounded-lg border border-white/15 bg-slate-900/70 px-4 py-2 text-sm text-slate-200",
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "Tous les types" }),
                /* @__PURE__ */ jsx("option", { value: "in", children: "Entrée" }),
                /* @__PURE__ */ jsx("option", { value: "out", children: "Sortie" }),
                /* @__PURE__ */ jsx("option", { value: "transfer", children: "Transfert" }),
                /* @__PURE__ */ jsx("option", { value: "adjustment", children: "Ajustement" })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: shopFilter,
              onChange: (e) => setShopFilter(e.target.value),
              className: "rounded-lg border border-white/15 bg-slate-900/70 px-4 py-2 text-sm text-slate-200",
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "Toutes les boutiques" }),
                shops.map((shop) => /* @__PURE__ */ jsx("option", { value: shop.id, children: shop.name }, shop.id))
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "date",
              value: dateFrom,
              onChange: (e) => setDateFrom(e.target.value),
              className: "rounded-lg border border-white/15 bg-slate-900/70 px-4 py-2 text-sm text-slate-200",
              placeholder: "Date début"
            }
          ),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "date",
              value: dateTo,
              onChange: (e) => setDateTo(e.target.value),
              className: "rounded-lg border border-white/15 bg-slate-900/70 px-4 py-2 text-sm text-slate-200",
              placeholder: "Date fin"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 flex justify-between", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleSearch,
              className: "rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/5",
              children: "Rechercher"
            }
          ),
          /* @__PURE__ */ jsxs(
            Link_default,
            {
              href: route("stocks.create"),
              className: "inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200",
              children: [
                /* @__PURE__ */ jsx(Plus, { className: "size-4" }),
                " Nouveau mouvement"
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx(Table, { columns, data: movements.data }),
      movements.links && /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center gap-1", children: movements.links.map((link, index) => /* @__PURE__ */ jsx(
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
          onClose: () => setDeleteModal({ show: false, movement: null }),
          onConfirm: confirmDelete,
          message: `Êtes-vous sûr de vouloir supprimer ce mouvement de stock ? Le stock sera ajusté automatiquement.`,
          processing: deleting
        }
      )
    ] })
  ] });
}
export {
  StocksIndex as default
};
