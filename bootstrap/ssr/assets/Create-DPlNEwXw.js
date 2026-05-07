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
function CustomersCreate({ shops }) {
  const route = useRoute();
  const { props } = usePage();
  const activeShop = props.activeShop;
  const { data, setData, post, processing, errors } = useForm({
    shop_id: activeShop?.id.toString() || shops[0]?.id.toString() || "",
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    is_active: true
  });
  const onSubmit = (e) => {
    e.preventDefault();
    post(route("customers.store"));
  };
  return /* @__PURE__ */ jsxs(Authenticated, { header: /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-white", children: "Nouveau client" }), children: [
    /* @__PURE__ */ jsx(Head_default, { title: "Nouveau client" }),
    /* @__PURE__ */ jsxs("form", { onSubmit, className: "space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("label", { className: "block space-y-1 text-sm text-slate-200 md:col-span-2", children: [
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
              className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
            }
          ),
          errors.name && /* @__PURE__ */ jsx("span", { className: "text-xs text-red-400", children: errors.name })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "block space-y-1 text-sm text-slate-200", children: [
          /* @__PURE__ */ jsx("span", { children: "Email" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "email",
              value: data.email,
              onChange: (e) => setData("email", e.target.value),
              className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
            }
          ),
          errors.email && /* @__PURE__ */ jsx("span", { className: "text-xs text-red-400", children: errors.email })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "block space-y-1 text-sm text-slate-200", children: [
          /* @__PURE__ */ jsx("span", { children: "Téléphone" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              value: data.phone,
              onChange: (e) => setData("phone", e.target.value),
              className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
            }
          ),
          errors.phone && /* @__PURE__ */ jsx("span", { className: "text-xs text-red-400", children: errors.phone })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "block space-y-1 text-sm text-slate-200 md:col-span-2", children: [
          /* @__PURE__ */ jsx("span", { children: "Adresse" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              value: data.address,
              onChange: (e) => setData("address", e.target.value),
              className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
            }
          ),
          errors.address && /* @__PURE__ */ jsx("span", { className: "text-xs text-red-400", children: errors.address })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "block space-y-1 text-sm text-slate-200 md:col-span-2", children: [
          /* @__PURE__ */ jsx("span", { children: "Notes" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              value: data.notes,
              onChange: (e) => setData("notes", e.target.value),
              rows: 3,
              className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
            }
          ),
          errors.notes && /* @__PURE__ */ jsx("span", { className: "text-xs text-red-400", children: errors.notes })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm text-slate-200 md:col-span-2", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "checkbox",
              checked: data.is_active,
              onChange: (e) => setData("is_active", e.target.checked),
              className: "rounded border border-white/15 bg-slate-900/70"
            }
          ),
          /* @__PURE__ */ jsx("span", { children: "Client actif" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2", children: [
        /* @__PURE__ */ jsx(
          Link_default,
          {
            href: route("customers.index"),
            className: "rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/10",
            children: "Annuler"
          }
        ),
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
  CustomersCreate as default
};
