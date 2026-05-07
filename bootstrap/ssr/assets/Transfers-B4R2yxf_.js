import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { u as useForm, H as Head_default, L as Link_default } from "../ssr.js";
import { u as useRoute } from "./route-C2Ac8FMA.js";
import { ArrowUpRight, Plus, Warehouse, X } from "lucide-react";
import { useState } from "react";
import { P as ProductImage } from "./ProductImage-5zmeiiH5.js";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
const statusLabel = {
  pending: "En attente",
  completed: "Complété",
  cancelled: "Annulé"
};
const statusClass = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400",
  cancelled: "bg-rose-100 text-rose-600 dark:bg-rose-400/10 dark:text-rose-400"
};
function Transfers({ depot, transfers, shops, depotProducts }) {
  const buildRoute = useRoute();
  const [showForm, setShowForm] = useState(false);
  const form = useForm({
    shop_id: "",
    notes: "",
    items: [{ product_id: "", quantity: "1" }]
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    form.post(buildRoute("depots.transfer", { depot: depot.id }), {
      onSuccess: () => {
        setShowForm(false);
        form.reset();
      }
    });
  };
  return /* @__PURE__ */ jsxs(Authenticated, { header: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
    /* @__PURE__ */ jsx(Link_default, { href: buildRoute("depots.index"), className: "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200", children: "Dépôts" }),
    /* @__PURE__ */ jsx("span", { className: "text-slate-300", children: "/" }),
    /* @__PURE__ */ jsx(Link_default, { href: buildRoute("depots.show", { depot: depot.id }), className: "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200", children: depot.name }),
    /* @__PURE__ */ jsx("span", { className: "text-slate-300", children: "/" }),
    /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "Transferts" })
  ] }), children: [
    /* @__PURE__ */ jsx(Head_default, { title: `Transferts — ${depot.name}` }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "flex size-11 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-300/10", children: /* @__PURE__ */ jsx(ArrowUpRight, { className: "size-5 text-amber-600 dark:text-amber-300" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h1", { className: "text-xl font-bold text-slate-900 dark:text-white", children: [
              "Transferts — ",
              depot.name
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: [
              transfers.total,
              " transfert(s) au total"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setShowForm(true),
            className: "inline-flex items-center gap-2 rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200",
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "size-4" }),
              "Nouveau transfert"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900", children: transfers.data.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center py-16", children: [
        /* @__PURE__ */ jsx(Warehouse, { className: "size-10 text-slate-300 dark:text-slate-600" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-slate-500 dark:text-slate-400", children: "Aucun transfert enregistré" }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setShowForm(true),
            className: "mt-3 inline-flex items-center gap-1.5 text-sm text-amber-500 hover:text-amber-400",
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "size-3.5" }),
              "Créer un transfert"
            ]
          }
        )
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-slate-100 bg-slate-50 dark:border-white/5 dark:bg-white/[0.02]", children: [
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500", children: "Référence" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500", children: "Produit" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500", children: "Boutique" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500", children: "Qté" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500", children: "Statut" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500", children: "Par" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500", children: "Date" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-white/5", children: transfers.data.map((t) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50/50 dark:hover:bg-white/[0.02]", children: [
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400", children: t.reference }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
              /* @__PURE__ */ jsx(
                ProductImage,
                {
                  src: t.product_image,
                  name: t.product_name,
                  thumbnailClass: "size-8"
                }
              ),
              /* @__PURE__ */ jsx("span", { className: "font-medium text-slate-900 dark:text-white", children: t.product_name })
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-slate-700 dark:text-slate-300", children: t.shop_name }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-right font-semibold text-slate-900 dark:text-white", children: t.quantity }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx("span", { className: `rounded-full px-2.5 py-1 text-xs font-medium ${statusClass[t.status] ?? ""}`, children: statusLabel[t.status] ?? t.status }) }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-slate-500 dark:text-slate-400", children: t.user_name }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap", children: t.transferred_at })
          ] }, t.id)) })
        ] }) }),
        transfers.last_page > 1 && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-white/5", children: [
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: [
            "Page ",
            transfers.current_page,
            " / ",
            transfers.last_page
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex gap-1", children: transfers.links.map((link, i) => link.url ? /* @__PURE__ */ jsx(
            Link_default,
            {
              href: link.url,
              className: `rounded-lg px-3 py-1.5 text-sm ${link.active ? "bg-amber-300 font-semibold text-slate-950" : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5"}`,
              dangerouslySetInnerHTML: { __html: link.label }
            },
            i
          ) : /* @__PURE__ */ jsx(
            "span",
            {
              className: "rounded-lg px-3 py-1.5 text-sm text-slate-300 dark:text-slate-600",
              dangerouslySetInnerHTML: { __html: link.label }
            },
            i
          )) })
        ] })
      ] }) })
    ] }),
    showForm && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: "Nouveau transfert" }),
        /* @__PURE__ */ jsx("button", { onClick: () => setShowForm(false), className: "rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200", children: /* @__PURE__ */ jsx(X, { className: "size-5" }) })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Boutique destination *" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: form.data.shop_id,
              onChange: (e) => form.setData("shop_id", e.target.value),
              className: "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none",
              required: true,
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "-- Sélectionner une boutique --" }),
                shops.map((s) => /* @__PURE__ */ jsx("option", { value: s.id, children: s.name }, s.id))
              ]
            }
          ),
          form.errors.shop_id && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-rose-500", children: form.errors.shop_id })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-slate-700 dark:text-slate-300", children: "Produits *" }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => form.setData("items", [...form.data.items ?? [], { product_id: "", quantity: "1" }]),
                className: "inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-500 dark:text-amber-400",
                children: [
                  /* @__PURE__ */ jsx(Plus, { className: "size-3.5" }),
                  "Ajouter un produit"
                ]
              }
            )
          ] }),
          (form.data.items ?? []).map((item, index) => {
            const depotProd = depotProducts.find((p) => String(p.product_id) === item.product_id);
            return /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-800/50", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-2", children: [
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    value: item.product_id,
                    onChange: (e) => {
                      const newItems = [...form.data.items ?? []];
                      newItems[index] = { ...newItems[index], product_id: e.target.value };
                      form.setData("items", newItems);
                    },
                    className: "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none",
                    required: true,
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "", children: "-- Produit --" }),
                      depotProducts.map((p) => /* @__PURE__ */ jsxs("option", { value: p.product_id, disabled: p.quantity <= 0, children: [
                        p.product_name,
                        " (stock: ",
                        p.quantity,
                        ")"
                      ] }, p.product_id))
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "number",
                      min: "1",
                      max: depotProd?.quantity ?? void 0,
                      value: item.quantity,
                      onChange: (e) => {
                        const newItems = [...form.data.items ?? []];
                        newItems[index] = { ...newItems[index], quantity: e.target.value };
                        form.setData("items", newItems);
                      },
                      className: "w-24 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none",
                      placeholder: "Qté",
                      required: true
                    }
                  ),
                  depotProd && /* @__PURE__ */ jsxs("span", { className: "text-xs text-slate-500 dark:text-slate-400", children: [
                    "/ ",
                    depotProd.quantity,
                    " disponible",
                    depotProd.quantity > 1 ? "s" : ""
                  ] })
                ] }),
                form.errors[`items.${index}.quantity`] && /* @__PURE__ */ jsx("p", { className: "text-xs text-rose-500", children: form.errors[`items.${index}.quantity`] })
              ] }),
              (form.data.items ?? []).length > 1 && /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    const newItems = (form.data.items ?? []).filter((_, i) => i !== index);
                    form.setData("items", newItems);
                  },
                  className: "mt-1 rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-400/10",
                  children: /* @__PURE__ */ jsx(X, { className: "size-4" })
                }
              )
            ] }, index);
          })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Notes" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              value: form.data.notes,
              onChange: (e) => form.setData("notes", e.target.value),
              rows: 2,
              className: "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none",
              placeholder: "Optionnel..."
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-3 pt-2", children: [
          /* @__PURE__ */ jsx("button", { type: "submit", disabled: form.processing, className: "flex-1 rounded-xl bg-amber-300 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50", children: form.processing ? "Transfert..." : `Transférer ${(form.data.items ?? []).length > 1 ? `(${(form.data.items ?? []).length} produits)` : ""}` }),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setShowForm(false), className: "flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-medium text-slate-700 dark:border-white/10 dark:text-slate-300", children: "Annuler" })
        ] })
      ] })
    ] }) })
  ] });
}
export {
  Transfers as default
};
