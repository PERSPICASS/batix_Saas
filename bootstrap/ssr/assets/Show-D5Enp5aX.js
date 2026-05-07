import { jsxs, jsx } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { H as Head_default, L as Link_default } from "../ssr.js";
import { Calendar, User, Package, FileText, MapPin, ArrowLeft } from "lucide-react";
import { u as useRoute } from "./route-C2Ac8FMA.js";
import { P as ProductImage } from "./ProductImage-5zmeiiH5.js";
import "react";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
function StocksShow({ movement }) {
  const route = useRoute();
  const getTypeBadge = (type) => {
    const types = {
      in: { label: "Entrée", bg: "bg-green-500/20", text: "text-green-300" },
      out: { label: "Sortie", bg: "bg-red-500/20", text: "text-red-300" },
      transfer: { label: "Transfert", bg: "bg-blue-500/20", text: "text-blue-300" },
      adjustment: { label: "Ajustement", bg: "bg-amber-500/20", text: "text-amber-300" },
      sale: { label: "Vente", bg: "bg-purple-500/20", text: "text-purple-300" },
      return: { label: "Retour", bg: "bg-cyan-500/20", text: "text-cyan-300" }
    };
    const typeInfo = types[type] || types.adjustment;
    return /* @__PURE__ */ jsx("span", { className: `inline-flex rounded-full px-3 py-1 text-sm font-medium ${typeInfo.bg} ${typeInfo.text}`, children: typeInfo.label });
  };
  return /* @__PURE__ */ jsxs(
    Authenticated,
    {
      header: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(
          Link_default,
          {
            href: route("stocks.index"),
            className: "rounded-lg border border-white/15 p-2 text-slate-200 hover:bg-white/5",
            children: /* @__PURE__ */ jsx(ArrowLeft, { className: "size-5" })
          }
        ),
        /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-white", children: "Détails du mouvement" })
      ] }),
      children: [
        /* @__PURE__ */ jsx(Head_default, { title: "Détails du mouvement" }),
        /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-gradient-to-br from-amber-300/10 via-orange-300/5 to-transparent p-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: "Mouvement de stock" }),
                /* @__PURE__ */ jsxs("h2", { className: "mt-1 text-2xl font-bold text-white", children: [
                  "#",
                  movement.id
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { children: getTypeBadge(movement.type) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 grid gap-4 md:grid-cols-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: "rounded-lg border border-white/15 bg-slate-900/70 p-2", children: /* @__PURE__ */ jsx(Calendar, { className: "size-5 text-amber-300" }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "Date du mouvement" }),
                  /* @__PURE__ */ jsx("p", { className: "font-medium text-slate-200", children: new Date(movement.movement_date).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  }) })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: "rounded-lg border border-white/15 bg-slate-900/70 p-2", children: /* @__PURE__ */ jsx(User, { className: "size-5 text-amber-300" }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "Créé par" }),
                  /* @__PURE__ */ jsx("p", { className: "font-medium text-slate-200", children: movement.user.name })
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6", children: [
            /* @__PURE__ */ jsxs("h3", { className: "mb-4 flex items-center gap-2 text-lg font-semibold text-white", children: [
              /* @__PURE__ */ jsx(Package, { className: "size-5 text-amber-300" }),
              "Produit"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-4", children: [
              /* @__PURE__ */ jsx(ProductImage, { src: movement.product.image, name: movement.product.name, thumbnailClass: "size-16" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-semibold text-white text-lg", children: movement.product.name }),
                movement.product.sku && /* @__PURE__ */ jsxs("p", { className: "text-sm font-mono text-slate-400", children: [
                  "SKU : ",
                  movement.product.sku
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6", children: [
            /* @__PURE__ */ jsxs("h3", { className: "mb-4 flex items-center gap-2 text-lg font-semibold text-white", children: [
              /* @__PURE__ */ jsx(FileText, { className: "size-5 text-amber-300" }),
              "Détails du mouvement"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Boutique" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(MapPin, { className: "size-4 text-slate-400" }),
                  /* @__PURE__ */ jsx("span", { className: "font-medium text-slate-200", children: movement.shop.name })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between border-t border-white/10 pt-4", children: [
                /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Quantité" }),
                /* @__PURE__ */ jsxs(
                  "span",
                  {
                    className: `text-xl font-bold ${movement.quantity > 0 ? "text-green-400" : "text-red-400"}`,
                    children: [
                      movement.quantity > 0 ? "+" : "",
                      movement.quantity
                    ]
                  }
                )
              ] }),
              movement.unit_cost && /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Coût unitaire" }),
                /* @__PURE__ */ jsxs("span", { className: "font-medium text-slate-200", children: [
                  parseFloat(movement.unit_cost).toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }),
                  " ",
                  "DH"
                ] })
              ] }),
              movement.unit_cost && /* @__PURE__ */ jsxs("div", { className: "flex justify-between border-t border-white/10 pt-4", children: [
                /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Valeur totale" }),
                /* @__PURE__ */ jsxs("span", { className: "text-lg font-bold text-amber-300", children: [
                  (Math.abs(movement.quantity) * parseFloat(movement.unit_cost)).toLocaleString(
                    "fr-FR",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    }
                  ),
                  " ",
                  "DH"
                ] })
              ] }),
              movement.notes && /* @__PURE__ */ jsxs("div", { className: "border-t border-white/10 pt-4", children: [
                /* @__PURE__ */ jsx("p", { className: "mb-2 text-sm text-slate-400", children: "Notes" }),
                /* @__PURE__ */ jsx("p", { className: "rounded-lg border border-white/10 bg-slate-900/50 p-3 text-sm text-slate-200", children: movement.notes })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "border-t border-white/10 pt-4", children: /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-500", children: [
                "Créé le",
                " ",
                new Date(movement.created_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })
              ] }) })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(
            Link_default,
            {
              href: route("stocks.index"),
              className: "rounded-lg border border-white/15 px-6 py-2 text-sm font-medium text-slate-200 hover:bg-white/5",
              children: "Retour à la liste"
            }
          ) })
        ] })
      ]
    }
  );
}
export {
  StocksShow as default
};
