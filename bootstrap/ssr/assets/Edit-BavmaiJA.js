import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { u as useForm, H as Head_default, L as Link_default } from "../ssr.js";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { AlertCircle, Plus, X, ArrowLeft } from "lucide-react";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
function Edit({ plan, activeSubscriptionsCount }) {
  console.log("Plan received:", plan);
  console.log("Active subscriptions count:", activeSubscriptionsCount);
  const { data, setData, put, processing, errors } = useForm({
    name: plan.name || "",
    slug: plan.slug || "",
    description: plan.description || "",
    price: String(plan.price || 0),
    max_shops: String(plan.max_shops ?? 0),
    max_users: String(plan.max_users ?? 0),
    max_products: String(plan.max_products ?? -1),
    max_depots: String(plan.max_depots ?? -1),
    features: plan.features || [],
    is_active: plan.is_active ?? true
  });
  const [featureInput, setFeatureInput] = useState("");
  const handleSubmit = (e) => {
    e.preventDefault();
    put(route("platform.subscriptions.update", plan.id));
  };
  const addFeature = () => {
    if (featureInput.trim()) {
      setData("features", [...data.features, featureInput.trim()]);
      setFeatureInput("");
    }
  };
  const removeFeature = (index) => {
    setData("features", data.features.filter((_, i) => i !== index));
  };
  return /* @__PURE__ */ jsxs(
    Authenticated,
    {
      header: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsx(
          Link_default,
          {
            href: route("platform.subscriptions.index"),
            className: "rounded-lg border border-white/15 p-2 text-slate-200 hover:bg-white/10 transition",
            children: /* @__PURE__ */ jsx(ArrowLeft, { className: "w-5 h-5" })
          }
        ),
        /* @__PURE__ */ jsxs("h1", { className: "text-xl font-semibold text-white", children: [
          "Modifier: ",
          plan.name
        ] })
      ] }),
      children: [
        /* @__PURE__ */ jsx(Head_default, { title: `Modifier le Plan: ${plan.name}` }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          activeSubscriptionsCount > 0 && /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
            /* @__PURE__ */ jsx(AlertCircle, { className: "w-5 h-5 text-yellow-400 mt-0.5 shrink-0" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "text-sm font-medium text-yellow-400", children: "Attention" }),
              /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-yellow-300/90", children: [
                "Ce plan a ",
                activeSubscriptionsCount,
                " abonnement(s) actif(s). Les modifications importantes (prix, limites) peuvent affecter les clients existants."
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
              /* @__PURE__ */ jsxs("label", { className: "block space-y-1 text-sm text-slate-200", children: [
                /* @__PURE__ */ jsx("span", { children: "Nom du Plan *" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: data.name,
                    onChange: (e) => setData("name", e.target.value),
                    className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2",
                    required: true
                  }
                ),
                errors.name && /* @__PURE__ */ jsx("span", { className: "text-xs text-red-400", children: errors.name })
              ] }),
              /* @__PURE__ */ jsxs("label", { className: "block space-y-1 text-sm text-slate-200", children: [
                /* @__PURE__ */ jsx("span", { children: "Slug *" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: data.slug,
                    onChange: (e) => setData("slug", e.target.value),
                    className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2",
                    required: true
                  }
                ),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "Identifiant unique (ex: starter, growth, scale)" }),
                errors.slug && /* @__PURE__ */ jsx("span", { className: "text-xs text-red-400", children: errors.slug })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "block space-y-1 text-sm text-slate-200", children: [
              /* @__PURE__ */ jsx("span", { children: "Description" }),
              /* @__PURE__ */ jsx(
                "textarea",
                {
                  value: data.description,
                  onChange: (e) => setData("description", e.target.value),
                  rows: 3,
                  className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                }
              ),
              errors.description && /* @__PURE__ */ jsx("span", { className: "text-xs text-red-400", children: errors.description })
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "block space-y-1 text-sm text-slate-200", children: [
              /* @__PURE__ */ jsx("span", { children: "Prix (XAF/mois) *" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  step: "0.01",
                  value: data.price,
                  onChange: (e) => setData("price", e.target.value),
                  className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2",
                  required: true
                }
              ),
              errors.price && /* @__PURE__ */ jsx("span", { className: "text-xs text-red-400", children: errors.price })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
              /* @__PURE__ */ jsxs("label", { className: "block space-y-1 text-sm text-slate-200", children: [
                /* @__PURE__ */ jsx("span", { children: "Max boutiques *" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    value: data.max_shops,
                    onChange: (e) => setData("max_shops", e.target.value),
                    className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2",
                    required: true
                  }
                ),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "-1 pour illimité" }),
                errors.max_shops && /* @__PURE__ */ jsx("span", { className: "text-xs text-red-400", children: errors.max_shops })
              ] }),
              /* @__PURE__ */ jsxs("label", { className: "block space-y-1 text-sm text-slate-200", children: [
                /* @__PURE__ */ jsx("span", { children: "Max utilisateurs *" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    value: data.max_users,
                    onChange: (e) => setData("max_users", e.target.value),
                    className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2",
                    required: true
                  }
                ),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "-1 pour illimité" }),
                errors.max_users && /* @__PURE__ */ jsx("span", { className: "text-xs text-red-400", children: errors.max_users })
              ] }),
              /* @__PURE__ */ jsxs("label", { className: "block space-y-1 text-sm text-slate-200", children: [
                /* @__PURE__ */ jsx("span", { children: "Max produits *" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    value: data.max_products,
                    onChange: (e) => setData("max_products", e.target.value),
                    className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2",
                    required: true
                  }
                ),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "-1 pour illimité" }),
                errors.max_products && /* @__PURE__ */ jsx("span", { className: "text-xs text-red-400", children: errors.max_products })
              ] }),
              /* @__PURE__ */ jsxs("label", { className: "block space-y-1 text-sm text-slate-200", children: [
                /* @__PURE__ */ jsx("span", { children: "Max dépôts *" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    value: data.max_depots,
                    onChange: (e) => setData("max_depots", e.target.value),
                    className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2",
                    required: true
                  }
                ),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "-1 pour illimité, 0 pour aucun" }),
                errors.max_depots && /* @__PURE__ */ jsx("span", { className: "text-xs text-red-400", children: errors.max_depots })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "block space-y-2 text-sm text-slate-200", children: [
              /* @__PURE__ */ jsx("span", { children: "Fonctionnalités" }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: featureInput,
                    onChange: (e) => setFeatureInput(e.target.value),
                    placeholder: "Ajouter une fonctionnalité...",
                    className: "flex-1 rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2",
                    onKeyPress: (e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addFeature();
                      }
                    }
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: addFeature,
                    className: "rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-500 transition",
                    children: /* @__PURE__ */ jsx(Plus, { className: "w-5 h-5" })
                  }
                )
              ] }),
              errors.features && /* @__PURE__ */ jsx("span", { className: "text-xs text-red-400", children: errors.features }),
              data.features.length > 0 && /* @__PURE__ */ jsx("div", { className: "space-y-2 mt-3", children: data.features.map((feature, index) => /* @__PURE__ */ jsxs(
                "div",
                {
                  className: "flex items-center justify-between rounded-lg border border-white/10 bg-slate-900/50 px-4 py-2",
                  children: [
                    /* @__PURE__ */ jsx("span", { className: "text-slate-200", children: feature }),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => removeFeature(index),
                        className: "text-red-400 hover:text-red-300 transition",
                        children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" })
                      }
                    )
                  ]
                },
                index
              )) })
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm text-slate-200", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "checkbox",
                  checked: data.is_active,
                  onChange: (e) => setData("is_active", e.target.checked),
                  className: "rounded border border-white/15 bg-slate-900/70"
                }
              ),
              /* @__PURE__ */ jsx("span", { children: "Plan actif (visible pour les clients)" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2 pt-4", children: [
              /* @__PURE__ */ jsx(
                Link_default,
                {
                  href: route("platform.subscriptions.index"),
                  className: "rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/10 transition",
                  children: "Annuler"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "submit",
                  disabled: processing,
                  className: "rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50 transition",
                  children: processing ? "Mise à jour..." : "Mettre à Jour"
                }
              )
            ] })
          ] })
        ] })
      ]
    }
  );
}
export {
  Edit as default
};
