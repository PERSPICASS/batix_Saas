import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { H as Head_default, L as Link_default, r as router3 } from "../ssr.js";
import { Package, AlertTriangle, TrendingUp, TrendingDown, ArrowLeft, Pencil, CheckCircle } from "lucide-react";
import { u as useRoute } from "./route-C2Ac8FMA.js";
import { C as Currency } from "./Currency-BX_NSrIs.js";
import { useState } from "react";
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
function InventoryShow({ inventory }) {
  const route = useRoute();
  const [completeModal, setCompleteModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const getStatusBadge = (status) => {
    const statuses = {
      draft: { label: "Brouillon", bg: "bg-slate-500/20", text: "text-slate-300" },
      in_progress: { label: "En cours", bg: "bg-blue-500/20", text: "text-blue-300" },
      completed: { label: "Terminé", bg: "bg-green-500/20", text: "text-green-300" },
      cancelled: { label: "Annulé", bg: "bg-red-500/20", text: "text-red-300" }
    };
    const statusInfo = statuses[status] || statuses.draft;
    return /* @__PURE__ */ jsx("span", { className: `inline-flex rounded-full px-3 py-1 text-sm font-medium ${statusInfo.bg} ${statusInfo.text}`, children: statusInfo.label });
  };
  const handleComplete = () => {
    setCompleteModal(true);
  };
  const confirmComplete = () => {
    setProcessing(true);
    router3.post(route("inventory.complete", { inventory: inventory.id }), {}, {
      onSuccess: () => {
        setCompleteModal(false);
        setProcessing(false);
      },
      onError: () => setProcessing(false)
    });
  };
  const totalExpected = inventory.items.reduce((sum, item) => sum + item.expected_quantity, 0);
  const totalCounted = inventory.items.reduce((sum, item) => sum + (item.counted_quantity || 0), 0);
  const totalDifference = totalCounted - totalExpected;
  const totalValue = inventory.items.reduce((sum, item) => sum + item.difference * item.unit_cost, 0);
  return /* @__PURE__ */ jsxs(
    Authenticated,
    {
      header: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-xl font-semibold text-white", children: [
          "Inventaire ",
          inventory.inventory_number
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: inventory.status !== "completed" && inventory.status !== "cancelled" && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs(
            Link_default,
            {
              href: route("inventory.edit", { inventory: inventory.id }),
              className: "inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10",
              children: [
                /* @__PURE__ */ jsx(Pencil, { className: "size-4" }),
                "Modifier"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: handleComplete,
              className: "inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-500",
              children: [
                /* @__PURE__ */ jsx(CheckCircle, { className: "size-4" }),
                "Terminer l'inventaire"
              ]
            }
          )
        ] }) })
      ] }),
      children: [
        /* @__PURE__ */ jsx(Head_default, { title: `Inventaire ${inventory.inventory_number}` }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6", children: /* @__PURE__ */ jsx("div", { className: "flex items-start justify-between", children: /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-white", children: "Informations générales" }),
            /* @__PURE__ */ jsxs("div", { className: "mt-4 grid grid-cols-2 gap-6 md:grid-cols-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: "Boutique" }),
                /* @__PURE__ */ jsx("p", { className: "font-medium text-white", children: inventory.shop.name })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: "Date" }),
                /* @__PURE__ */ jsx("p", { className: "font-medium text-white", children: new Date(inventory.inventory_date).toLocaleDateString("fr-FR") })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: "Effectué par" }),
                /* @__PURE__ */ jsx("p", { className: "font-medium text-white", children: inventory.user.name })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: "Statut" }),
                /* @__PURE__ */ jsx("div", { className: "mt-1", children: getStatusBadge(inventory.status) })
              ] })
            ] }),
            inventory.notes && /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: "Notes" }),
              /* @__PURE__ */ jsx("p", { className: "text-white", children: inventory.notes })
            ] })
          ] }) }) }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4 md:grid-cols-4", children: [
            /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-white/10 bg-white/5 p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-blue-500/20 p-2", children: /* @__PURE__ */ jsx(Package, { className: "size-5 text-blue-300" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: "Articles" }),
                /* @__PURE__ */ jsx("p", { className: "text-xl font-bold text-white", children: inventory.total_items })
              ] })
            ] }) }),
            /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-white/10 bg-white/5 p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-amber-500/20 p-2", children: /* @__PURE__ */ jsx(AlertTriangle, { className: "size-5 text-amber-300" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: "Écarts" }),
                /* @__PURE__ */ jsx("p", { className: "text-xl font-bold text-white", children: inventory.total_discrepancies })
              ] })
            ] }) }),
            /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-white/10 bg-white/5 p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: `rounded-lg p-2 ${totalDifference >= 0 ? "bg-green-500/20" : "bg-red-500/20"}`, children: totalDifference >= 0 ? /* @__PURE__ */ jsx(TrendingUp, { className: "size-5 text-green-300" }) : /* @__PURE__ */ jsx(TrendingDown, { className: "size-5 text-red-300" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: "Différence totale" }),
                /* @__PURE__ */ jsxs("p", { className: `text-xl font-bold ${totalDifference >= 0 ? "text-green-300" : "text-red-300"}`, children: [
                  totalDifference > 0 ? "+" : "",
                  totalDifference
                ] })
              ] })
            ] }) }),
            /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-white/10 bg-white/5 p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: `rounded-lg p-2 ${totalValue >= 0 ? "bg-green-500/20" : "bg-red-500/20"}`, children: totalValue >= 0 ? /* @__PURE__ */ jsx(TrendingUp, { className: "size-5 text-green-300" }) : /* @__PURE__ */ jsx(TrendingDown, { className: "size-5 text-red-300" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: "Valeur écart" }),
                /* @__PURE__ */ jsx("p", { className: `text-xl font-bold ${totalValue >= 0 ? "text-green-300" : "text-red-300"}`, children: /* @__PURE__ */ jsx(Currency, { amount: Math.abs(totalValue) }) })
              ] })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6", children: [
            /* @__PURE__ */ jsx("h2", { className: "mb-4 text-lg font-semibold text-white", children: "Articles inventoriés" }),
            /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full", children: [
              /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-white/10 text-left text-sm text-slate-400", children: [
                /* @__PURE__ */ jsx("th", { className: "pb-3 pr-4", children: "Produit" }),
                /* @__PURE__ */ jsx("th", { className: "pb-3 pr-4 text-right", children: "Stock théorique" }),
                /* @__PURE__ */ jsx("th", { className: "pb-3 pr-4 text-right", children: "Stock réel" }),
                /* @__PURE__ */ jsx("th", { className: "pb-3 pr-4 text-right", children: "Écart" }),
                /* @__PURE__ */ jsx("th", { className: "pb-3 text-right", children: "Valeur écart" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-white/5", children: inventory.items.map((item) => /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "py-3 pr-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsx(ProductImage, { src: item.product.image, name: item.product.name, thumbnailClass: "size-9" }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "font-medium text-white", children: item.product.name }),
                    /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400", children: [
                      "SKU: ",
                      item.product.sku
                    ] })
                  ] })
                ] }) }),
                /* @__PURE__ */ jsx("td", { className: "py-3 pr-4 text-right text-slate-300", children: item.expected_quantity }),
                /* @__PURE__ */ jsx("td", { className: "py-3 pr-4 text-right text-white", children: item.counted_quantity ?? "-" }),
                /* @__PURE__ */ jsx("td", { className: "py-3 pr-4 text-right", children: /* @__PURE__ */ jsxs("span", { className: `font-medium ${item.difference === 0 ? "text-slate-400" : item.difference > 0 ? "text-green-300" : "text-red-300"}`, children: [
                  item.difference > 0 ? "+" : "",
                  item.difference
                ] }) }),
                /* @__PURE__ */ jsx("td", { className: "py-3 text-right", children: /* @__PURE__ */ jsx("span", { className: `font-medium ${item.difference === 0 ? "text-slate-400" : item.difference > 0 ? "text-green-300" : "text-red-300"}`, children: /* @__PURE__ */ jsx(Currency, { amount: Math.abs(item.difference * item.unit_cost) }) }) })
              ] }, item.id)) })
            ] }) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex justify-start", children: /* @__PURE__ */ jsxs(
            Link_default,
            {
              href: route("inventory.index"),
              className: "inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10",
              children: [
                /* @__PURE__ */ jsx(ArrowLeft, { className: "size-4" }),
                "Retour à la liste"
              ]
            }
          ) }),
          /* @__PURE__ */ jsx(
            ConfirmDeleteModal,
            {
              show: completeModal,
              onClose: () => setCompleteModal(false),
              onConfirm: confirmComplete,
              title: "Terminer l'inventaire",
              message: `Terminer l'inventaire "${inventory.inventory_number}" ? Les différences seront appliquées au stock.`,
              confirmText: "Terminer",
              processing
            }
          )
        ] })
      ]
    }
  );
}
export {
  InventoryShow as default
};
