import { jsxs, jsx } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { u as useForm, H as Head_default, L as Link_default } from "../ssr.js";
import { Store, Phone, MapPin, FileText } from "lucide-react";
import { u as useRoute } from "./route-C2Ac8FMA.js";
import "react";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
function Edit({ shop }) {
  const route = useRoute();
  const { data, setData, put, processing, errors } = useForm({
    name: shop.name,
    description: shop.description || "",
    address: shop.address || "",
    city: shop.city || "",
    postal_code: shop.postal_code || "",
    phone: shop.phone || "",
    email: shop.email || "",
    tax_id: shop.tax_id || "",
    is_active: shop.is_active
  });
  const submit = (e) => {
    e.preventDefault();
    put(route("shops.update", { shop: shop.id }));
  };
  return /* @__PURE__ */ jsxs(Authenticated, { header: /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-white", children: "Modifier la boutique" }), children: [
    /* @__PURE__ */ jsx(Head_default, { title: "Modifier la boutique" }),
    /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-4xl", children: /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Store, { className: "size-5 text-amber-300" }),
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-white", children: "Informations générales" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "name", className: "block text-sm font-medium text-slate-200", children: "Nom de la boutique *" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                id: "name",
                value: data.name,
                onChange: (e) => setData("name", e.target.value),
                className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
                autoFocus: true,
                required: true
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
                className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
              }
            ),
            errors.description && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.description })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-6 border-t border-white/10 pt-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Phone, { className: "size-5 text-green-400" }),
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-white", children: "Contact" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "phone", className: "block text-sm font-medium text-slate-200", children: "Téléphone" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "tel",
                id: "phone",
                value: data.phone,
                onChange: (e) => setData("phone", e.target.value),
                className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
              }
            ),
            errors.phone && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.phone })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-slate-200", children: "Email" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "email",
                id: "email",
                value: data.email,
                onChange: (e) => setData("email", e.target.value),
                className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
              }
            ),
            errors.email && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.email })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-6 border-t border-white/10 pt-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(MapPin, { className: "size-5 text-purple-400" }),
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-white", children: "Localisation" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "address", className: "block text-sm font-medium text-slate-200", children: "Adresse complète" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                id: "address",
                value: data.address,
                onChange: (e) => setData("address", e.target.value),
                rows: 2,
                className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
              }
            ),
            errors.address && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.address })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "city", className: "block text-sm font-medium text-slate-200", children: "Ville" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  id: "city",
                  value: data.city,
                  onChange: (e) => setData("city", e.target.value),
                  className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                }
              ),
              errors.city && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.city })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "postal_code", className: "block text-sm font-medium text-slate-200", children: "Code postal" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  id: "postal_code",
                  value: data.postal_code,
                  onChange: (e) => setData("postal_code", e.target.value),
                  className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                }
              ),
              errors.postal_code && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.postal_code })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-6 border-t border-white/10 pt-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(FileText, { className: "size-5 text-blue-400" }),
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-white", children: "Informations complémentaires" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 gap-4", children: /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "tax_id", className: "block text-sm font-medium text-slate-200", children: "ICE / N° Fiscal" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              id: "tax_id",
              value: data.tax_id,
              onChange: (e) => setData("tax_id", e.target.value),
              className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
            }
          ),
          errors.tax_id && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.tax_id })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "checkbox",
              id: "is_active",
              checked: data.is_active,
              onChange: (e) => setData("is_active", e.target.checked),
              className: "size-4 rounded border-white/15 bg-slate-900/70 text-amber-300 focus:ring-amber-300 focus:ring-offset-slate-950"
            }
          ),
          /* @__PURE__ */ jsx("label", { htmlFor: "is_active", className: "text-sm font-medium text-slate-200", children: "Boutique active" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-3 border-t border-white/10 pt-4", children: [
        /* @__PURE__ */ jsx(
          Link_default,
          {
            href: route("shops.index"),
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
            children: processing ? "Mise à jour..." : "Enregistrer"
          }
        )
      ] })
    ] }) })
  ] });
}
export {
  Edit as default
};
