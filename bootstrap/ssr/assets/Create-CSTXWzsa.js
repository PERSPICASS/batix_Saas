import { jsxs, jsx } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { a as usePage, u as useForm, H as Head_default, L as Link_default } from "../ssr.js";
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
function CategoriesCreate({ shops }) {
  const route = useRoute();
  const { props } = usePage();
  const activeShop = props.activeShop;
  const { data, setData, post, processing, errors } = useForm({
    shop_id: activeShop?.id || shops[0]?.id || "",
    name: "",
    description: "",
    color: "#3b82f6",
    icon: "",
    order: 0
  });
  const onSubmit = (e) => {
    e.preventDefault();
    post(route("categories.store"));
  };
  return /* @__PURE__ */ jsxs(Authenticated, { header: /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-white", children: "Nouvelle catégorie" }), children: [
    /* @__PURE__ */ jsx(Head_default, { title: "Nouvelle categorie" }),
    /* @__PURE__ */ jsxs("form", { onSubmit, className: "space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6", children: [
      /* @__PURE__ */ jsxs("label", { className: "block space-y-1 text-sm text-slate-200", children: [
        /* @__PURE__ */ jsx("span", { children: "Boutique *" }),
        /* @__PURE__ */ jsx(
          "select",
          {
            value: data.shop_id,
            disabled: true,
            className: "w-full rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2 text-slate-400 cursor-not-allowed",
            children: shops.map((shop) => /* @__PURE__ */ jsx("option", { value: shop.id, children: shop.name }, shop.id))
          }
        ),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "Boutique sélectionnée via le switcher" }),
        errors.shop_id && /* @__PURE__ */ jsx("span", { className: "text-xs text-red-400", children: errors.shop_id })
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
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs("label", { className: "block space-y-1 text-sm text-slate-200", children: [
          /* @__PURE__ */ jsx("span", { children: "Couleur" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "color",
              value: data.color,
              onChange: (e) => setData("color", e.target.value),
              className: "h-10 w-full rounded-lg border border-white/15 bg-slate-900/70"
            }
          ),
          errors.color && /* @__PURE__ */ jsx("span", { className: "text-xs text-red-400", children: errors.color })
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
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2", children: [
        /* @__PURE__ */ jsx(Link_default, { href: route("categories.index"), className: "rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/10", children: "Annuler" }),
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
  CategoriesCreate as default
};
