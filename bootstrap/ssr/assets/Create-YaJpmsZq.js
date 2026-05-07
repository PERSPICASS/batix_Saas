import { jsxs, jsx } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { u as useForm, H as Head_default, L as Link_default } from "../ssr.js";
import { u as useRoute } from "./route-C2Ac8FMA.js";
import "react";
import "lucide-react";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
function SubcategoriesCreate({ categories }) {
  const route = useRoute();
  const { data, setData, post, processing, errors } = useForm({
    category_id: categories[0]?.id || "",
    name: "",
    description: "",
    order: 0
  });
  const onSubmit = (e) => {
    e.preventDefault();
    post(route("subcategories.store"));
  };
  return /* @__PURE__ */ jsxs(Authenticated, { header: /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-white", children: "Nouvelle sous-catégorie" }), children: [
    /* @__PURE__ */ jsx(Head_default, { title: "Nouvelle sous categorie" }),
    /* @__PURE__ */ jsxs("form", { onSubmit, className: "space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6", children: [
      /* @__PURE__ */ jsxs("label", { className: "block space-y-1 text-sm text-slate-200", children: [
        /* @__PURE__ */ jsx("span", { children: "Catégorie parente *" }),
        /* @__PURE__ */ jsxs(
          "select",
          {
            value: data.category_id,
            onChange: (e) => setData("category_id", e.target.value),
            className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2",
            required: true,
            children: [
              /* @__PURE__ */ jsx("option", { value: "", children: "Sélectionnez une catégorie" }),
              categories.map((category) => /* @__PURE__ */ jsxs("option", { value: category.id, children: [
                category.name,
                " (",
                category.shop.name,
                ")"
              ] }, category.id))
            ]
          }
        ),
        errors.category_id && /* @__PURE__ */ jsx("span", { className: "text-xs text-red-400", children: errors.category_id })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "block space-y-1 text-sm text-slate-200", children: [
        /* @__PURE__ */ jsx("span", { children: "Nom *" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            value: data.name,
            onChange: (e) => setData("name", e.target.value),
            className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2",
            required: true
          }
        ),
        errors.name && /* @__PURE__ */ jsx("span", { className: "text-xs text-red-400", children: errors.name })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "block space-y-1 text-sm text-slate-200", children: [
        /* @__PURE__ */ jsx("span", { children: "Description" }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            value: data.description,
            onChange: (e) => setData("description", e.target.value),
            className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2",
            rows: 4
          }
        ),
        errors.description && /* @__PURE__ */ jsx("span", { className: "text-xs text-red-400", children: errors.description })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "block space-y-1 text-sm text-slate-200", children: [
        /* @__PURE__ */ jsx("span", { children: "Ordre d'affichage" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "number",
            value: data.order,
            onChange: (e) => setData("order", parseInt(e.target.value)),
            className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
          }
        ),
        errors.order && /* @__PURE__ */ jsx("span", { className: "text-xs text-red-400", children: errors.order })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2", children: [
        /* @__PURE__ */ jsx(Link_default, { href: route("subcategories.index"), className: "rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/10", children: "Annuler" }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            disabled: processing,
            className: "rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50",
            children: processing ? "Enregistrement..." : "Enregistrer"
          }
        )
      ] })
    ] })
  ] });
}
export {
  SubcategoriesCreate as default
};
