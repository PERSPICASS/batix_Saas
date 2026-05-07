import { jsxs, jsx } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { H as Head_default, L as Link_default, r as router3 } from "../ssr.js";
import { Plus, Search, Warehouse, Package, AlertTriangle, Eye, Pencil } from "lucide-react";
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
function Index({ depots, filters, canCreateDepot = true, remainingDepots = -1 }) {
  const buildRoute = useRoute();
  const [search, setSearch] = useState(filters.search || "");
  const [deleteId, setDeleteId] = useState(null);
  const handleSearch = (e) => {
    e.preventDefault();
    router3.get(buildRoute("depots.index"), { search }, { preserveState: true, replace: true });
  };
  const handleDelete = () => {
    if (!deleteId) return;
    router3.delete(buildRoute("depots.destroy", { depot: deleteId }), {
      onSuccess: () => setDeleteId(null)
    });
  };
  return /* @__PURE__ */ jsxs(Authenticated, { header: /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: "Dépôts" }), children: [
    /* @__PURE__ */ jsx(Head_default, { title: "Dépôts" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-slate-900 dark:text-white", children: "Dépôts" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Gérez vos dépôts et approvisionnez vos boutiques" })
        ] }),
        canCreateDepot ? /* @__PURE__ */ jsxs(
          Link_default,
          {
            href: buildRoute("depots.create"),
            className: "inline-flex items-center gap-2 rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200",
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "size-4" }),
              "Nouveau dépôt"
            ]
          }
        ) : /* @__PURE__ */ jsxs("div", { className: "group relative", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              disabled: true,
              className: "inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-400 opacity-60 dark:bg-slate-700 dark:text-slate-500",
              children: [
                /* @__PURE__ */ jsx(Plus, { className: "size-4" }),
                "Nouveau dépôt"
              ]
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100", children: remainingDepots === 0 ? "Votre offre ne permet pas de créer des dépôts." : "Limite de dépôts atteinte. Passez à un plan supérieur." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSearch, className: "flex gap-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative flex-1 max-w-sm", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: search,
              onChange: (e) => setSearch(e.target.value),
              placeholder: "Rechercher un dépôt...",
              className: "w-full rounded-xl border border-slate-300 bg-white pl-9 pr-4 py-2 text-sm dark:border-white/10 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
            }
          )
        ] }),
        /* @__PURE__ */ jsx("button", { type: "submit", className: "rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600", children: "Rechercher" })
      ] }),
      depots.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-16 dark:border-white/10", children: [
        /* @__PURE__ */ jsx(Warehouse, { className: "size-12 text-slate-300 dark:text-slate-600" }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm font-medium text-slate-500 dark:text-slate-400", children: "Aucun dépôt" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 dark:text-slate-500", children: "Créez votre premier dépôt pour commencer" }),
        /* @__PURE__ */ jsxs(
          Link_default,
          {
            href: buildRoute("depots.create"),
            className: "mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200",
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "size-4" }),
              "Créer un dépôt"
            ]
          }
        )
      ] }) : /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: depots.map((depot) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-slate-900",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: "flex size-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-300/10", children: /* @__PURE__ */ jsx(Warehouse, { className: "size-5 text-amber-600 dark:text-amber-300" }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h3", { className: "font-semibold text-slate-900 dark:text-white", children: depot.name }),
                  depot.city && /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: depot.city })
                ] })
              ] }),
              /* @__PURE__ */ jsx("span", { className: `rounded-full px-2 py-0.5 text-xs font-medium ${depot.is_active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`, children: depot.is_active ? "Actif" : "Inactif" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-4 grid grid-cols-2 gap-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-slate-50 p-3 dark:bg-slate-800", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400", children: [
                  /* @__PURE__ */ jsx(Package, { className: "size-3.5" }),
                  "Références"
                ] }),
                /* @__PURE__ */ jsx("p", { className: "mt-1 text-lg font-bold text-slate-900 dark:text-white", children: depot.depot_products_count })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-slate-50 p-3 dark:bg-slate-800", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400", children: [
                  /* @__PURE__ */ jsx(AlertTriangle, { className: "size-3.5" }),
                  "Unités en stock"
                ] }),
                /* @__PURE__ */ jsx("p", { className: "mt-1 text-lg font-bold text-slate-900 dark:text-white", children: depot.total_stock })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-4 flex gap-2", children: [
              /* @__PURE__ */ jsxs(
                Link_default,
                {
                  href: buildRoute("depots.show", { depot: depot.id }),
                  className: "flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-200",
                  children: [
                    /* @__PURE__ */ jsx(Eye, { className: "size-3.5" }),
                    "Voir"
                  ]
                }
              ),
              /* @__PURE__ */ jsx(
                Link_default,
                {
                  href: buildRoute("depots.edit", { depot: depot.id }),
                  className: "flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5",
                  children: /* @__PURE__ */ jsx(Pencil, { className: "size-3.5" })
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setDeleteId(depot.id),
                  className: "flex items-center justify-center rounded-lg border border-rose-200 px-3 py-1.5 text-xs text-rose-500 hover:bg-rose-50 dark:border-rose-400/20 dark:text-rose-400 dark:hover:bg-rose-400/10",
                  children: [
                    /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Supprimer" }),
                    /* @__PURE__ */ jsx("svg", { className: "size-3.5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" }) })
                  ]
                }
              )
            ] })
          ]
        },
        depot.id
      )) })
    ] }),
    /* @__PURE__ */ jsx(
      ConfirmDeleteModal,
      {
        show: !!deleteId,
        onClose: () => setDeleteId(null),
        onConfirm: handleDelete,
        title: "Supprimer le dépôt",
        message: "Êtes-vous sûr de vouloir supprimer ce dépôt ? Tout le stock associé sera perdu."
      }
    )
  ] });
}
export {
  Index as default
};
