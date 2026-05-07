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
function SubcategoriesEdit({ subcategory, categories }) {
  const route = useRoute();
  const { data, setData, put, processing, errors } = useForm({
    category_id: subcategory.category_id,
    name: subcategory.name,
    description: subcategory.description || ""
  });
  const submit = (e) => {
    e.preventDefault();
    put(route("subcategories.update", { sous_category: subcategory.id }));
  };
  return /* @__PURE__ */ jsxs(Authenticated, { header: /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-white", children: "Modifier sous-catégorie" }), children: [
    /* @__PURE__ */ jsx(Head_default, { title: "Modifier sous-catégorie" }),
    /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-2xl", children: /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "category_id", className: "block text-sm font-medium text-slate-200", children: "Catégorie parente *" }),
        /* @__PURE__ */ jsxs(
          "select",
          {
            id: "category_id",
            value: data.category_id,
            onChange: (e) => setData("category_id", Number(e.target.value)),
            className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
            children: [
              /* @__PURE__ */ jsx("option", { value: "", children: "Sélectionner une catégorie" }),
              categories.map((category) => /* @__PURE__ */ jsx("option", { value: category.id, children: category.name }, category.id))
            ]
          }
        ),
        errors.category_id && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.category_id })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "name", className: "block text-sm font-medium text-slate-200", children: "Nom de la sous-catégorie *" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            id: "name",
            value: data.name,
            onChange: (e) => setData("name", e.target.value),
            className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
            placeholder: "Ex: Tournevis"
          }
        ),
        errors.name && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.name })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "description", className: "block text-sm font-medium text-slate-200", children: "Description" }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            id: "description",
            value: data.description,
            onChange: (e) => setData("description", e.target.value),
            rows: 3,
            className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
            placeholder: "Description de la sous-catégorie"
          }
        ),
        errors.description && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.description })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-3 border-t border-white/10 pt-4", children: [
        /* @__PURE__ */ jsx(
          Link_default,
          {
            href: route("subcategories.index"),
            className: "rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5",
            children: "Annuler"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            disabled: processing,
            className: "rounded-lg bg-amber-300 px-6 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-200 disabled:opacity-50",
            children: processing ? "Enregistrement..." : "Enregistrer"
          }
        )
      ] })
    ] }) })
  ] });
}
export {
  SubcategoriesEdit as default
};
