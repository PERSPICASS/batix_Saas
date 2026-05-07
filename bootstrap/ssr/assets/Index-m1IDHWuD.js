import { jsxs, jsx } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { H as Head_default, L as Link_default, r as router3 } from "../ssr.js";
import { Plus, Store, Building2, MapPin, Phone, Mail, Eye, Pencil, Trash2 } from "lucide-react";
import { u as useRoute } from "./route-C2Ac8FMA.js";
import { useState } from "react";
import { C as ConfirmDeleteModal } from "./ConfirmDeleteModal-GTROztIR.js";
import { u as useSubscriptionLimits, S as SubscriptionBanner } from "./SubscriptionBanner-BxXxKEZo.js";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
import "./Modal-BeSeEOS3.js";
import "@headlessui/react";
function Index({ shops }) {
  const route = useRoute();
  const subscription = useSubscriptionLimits();
  const [deleteModal, setDeleteModal] = useState({ show: false, shop: null });
  const [deleting, setDeleting] = useState(false);
  const handleDelete = (shop) => {
    setDeleteModal({ show: true, shop });
  };
  const confirmDelete = () => {
    if (!deleteModal.shop) return;
    setDeleting(true);
    router3.delete(route("shops.destroy", { shop: deleteModal.shop.id }), {
      onSuccess: () => {
        setDeleteModal({ show: false, shop: null });
        setDeleting(false);
      },
      onError: () => setDeleting(false)
    });
  };
  return /* @__PURE__ */ jsxs(Authenticated, { header: /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-white", children: "Mes Boutiques" }), children: [
    /* @__PURE__ */ jsx(Head_default, { title: "Mes Boutiques" }),
    /* @__PURE__ */ jsxs("section", { className: "space-y-6", children: [
      subscription && /* @__PURE__ */ jsx(SubscriptionBanner, { type: "shops" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-300", children: "Gérez vos boutiques et points de vente" }),
        /* @__PURE__ */ jsxs(
          Link_default,
          {
            href: route("shops.create"),
            className: `inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${subscription?.can_create_shop ? "bg-amber-300 text-slate-950 hover:bg-amber-200" : "bg-slate-700 text-slate-400 cursor-not-allowed opacity-60"}`,
            onClick: (e) => {
              if (!subscription?.can_create_shop) {
                e.preventDefault();
              }
            },
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "size-4" }),
              " Nouvelle boutique"
            ]
          }
        )
      ] }),
      shops.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-12 text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-amber-300/20", children: /* @__PURE__ */ jsx(Store, { className: "size-8 text-amber-300" }) }),
        /* @__PURE__ */ jsx("h3", { className: "mb-2 text-lg font-semibold text-white", children: "Aucune boutique" }),
        /* @__PURE__ */ jsx("p", { className: "mb-6 text-sm text-slate-400", children: "Commencez par créer votre première boutique pour gérer vos produits et ventes." }),
        /* @__PURE__ */ jsxs(
          Link_default,
          {
            href: route("shops.create"),
            className: `inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold ${subscription?.can_create_shop ? "bg-amber-300 text-slate-950 hover:bg-amber-200" : "bg-slate-700 text-slate-400 cursor-not-allowed opacity-60"}`,
            onClick: (e) => {
              if (!subscription?.can_create_shop) {
                e.preventDefault();
              }
            },
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "size-4" }),
              " Créer ma première boutique"
            ]
          }
        )
      ] }) : /* @__PURE__ */ jsx("div", { className: "grid gap-6 sm:grid-cols-2 lg:grid-cols-3", children: shops.map((shop) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-all hover:border-amber-300/30 hover:bg-white/10",
          children: [
            /* @__PURE__ */ jsx("div", { className: "absolute right-4 top-4", children: shop.is_active ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2.5 py-1 text-xs font-medium text-green-400", children: [
              /* @__PURE__ */ jsx("span", { className: "size-1.5 rounded-full bg-green-400" }),
              "Active"
            ] }) : /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2.5 py-1 text-xs font-medium text-red-400", children: [
              /* @__PURE__ */ jsx("span", { className: "size-1.5 rounded-full bg-red-400" }),
              "Inactive"
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
              /* @__PURE__ */ jsx("div", { className: "mb-4", children: /* @__PURE__ */ jsxs("div", { className: "mb-3 flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: "flex size-12 items-center justify-center rounded-lg bg-amber-300/20", children: /* @__PURE__ */ jsx(Building2, { className: "size-6 text-amber-300" }) }),
                /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-white", children: shop.name }),
                  shop.description && /* @__PURE__ */ jsx("p", { className: "mt-1 line-clamp-1 text-xs text-slate-400", children: shop.description })
                ] })
              ] }) }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2 border-t border-white/10 pt-4", children: [
                shop.address && /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 text-sm text-slate-300", children: [
                  /* @__PURE__ */ jsx(MapPin, { className: "mt-0.5 size-4 flex-shrink-0 text-purple-400" }),
                  /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                    /* @__PURE__ */ jsxs("p", { className: "line-clamp-2", children: [
                      shop.address,
                      shop.city && `, ${shop.city}`,
                      shop.postal_code && ` ${shop.postal_code}`
                    ] }),
                    /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: shop.country })
                  ] })
                ] }),
                shop.phone && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-slate-300", children: [
                  /* @__PURE__ */ jsx(Phone, { className: "size-4 text-green-400" }),
                  /* @__PURE__ */ jsx("span", { children: shop.phone })
                ] }),
                shop.email && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-slate-300", children: [
                  /* @__PURE__ */ jsx(Mail, { className: "size-4 text-blue-400" }),
                  /* @__PURE__ */ jsx("span", { className: "truncate", children: shop.email })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 border-t border-white/10 pt-3", children: [
                  shop.tax_id && /* @__PURE__ */ jsxs("div", { className: "text-xs", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "ICE: " }),
                    /* @__PURE__ */ jsxs("span", { className: "font-mono text-slate-300", children: [
                      shop.tax_id.slice(0, 8),
                      "..."
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "text-xs", children: /* @__PURE__ */ jsx("span", { className: "inline-flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 font-medium text-slate-300", children: shop.currency }) })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center gap-2 border-t border-white/10 pt-4", children: [
                /* @__PURE__ */ jsx(
                  Link_default,
                  {
                    href: route("shops.show", { shop: shop.id }),
                    className: "flex-1 rounded-lg border border-white/15 py-2 text-center text-xs font-medium text-slate-200 transition-colors hover:bg-white/10",
                    children: /* @__PURE__ */ jsx(Eye, { className: "mx-auto size-4" })
                  }
                ),
                /* @__PURE__ */ jsx(
                  Link_default,
                  {
                    href: route("shops.edit", { shop: shop.id }),
                    className: "flex-1 rounded-lg border border-white/15 py-2 text-center text-xs font-medium text-slate-200 transition-colors hover:bg-white/10",
                    children: /* @__PURE__ */ jsx(Pencil, { className: "mx-auto size-4" })
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => handleDelete(shop),
                    className: "flex-1 rounded-lg border border-rose-300/30 py-2 text-center text-xs font-medium text-rose-200 transition-colors hover:bg-rose-300/10",
                    children: /* @__PURE__ */ jsx(Trash2, { className: "mx-auto size-4" })
                  }
                )
              ] })
            ] })
          ]
        },
        shop.id
      )) }),
      /* @__PURE__ */ jsx(
        ConfirmDeleteModal,
        {
          show: deleteModal.show,
          onClose: () => setDeleteModal({ show: false, shop: null }),
          onConfirm: confirmDelete,
          message: `Êtes-vous sûr de vouloir supprimer la boutique "${deleteModal.shop?.name}" ?`,
          processing: deleting
        }
      )
    ] })
  ] });
}
export {
  Index as default
};
