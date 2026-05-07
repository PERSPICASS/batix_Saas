import { jsxs, jsx } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { a as usePage, u as useForm, H as Head_default, L as Link_default } from "../ssr.js";
import { u as useRoute } from "./route-C2Ac8FMA.js";
import { Check } from "lucide-react";
import "react";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
function SuppliersCreate({ shops }) {
  const route = useRoute();
  const { props } = usePage();
  const activeShop = props.activeShop;
  const { data, setData, post, processing, errors } = useForm({
    shop_ids: activeShop ? [activeShop.id] : shops.length > 0 ? [shops[0].id] : [],
    name: "",
    company_name: "",
    email: "",
    phone: "",
    mobile: "",
    address: "",
    city: "",
    postal_code: "",
    country: "Maroc",
    tax_id: "",
    website: "",
    notes: "",
    is_active: true
  });
  const toggleShop = (shopId) => {
    const currentShops = data.shop_ids;
    if (currentShops.includes(shopId)) {
      if (currentShops.length > 1) {
        setData("shop_ids", currentShops.filter((id) => id !== shopId));
      }
    } else {
      setData("shop_ids", [...currentShops, shopId]);
    }
  };
  const submit = (e) => {
    e.preventDefault();
    post(route("suppliers.store"));
  };
  return /* @__PURE__ */ jsxs(Authenticated, { header: /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-white", children: "Nouveau fournisseur" }), children: [
    /* @__PURE__ */ jsx(Head_default, { title: "Nouveau fournisseur" }),
    /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-4xl", children: /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-white", children: "Informations générales" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-200", children: "Boutiques *" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-slate-400", children: "Sélectionnez une ou plusieurs boutiques pour ce fournisseur" }),
          /* @__PURE__ */ jsx("div", { className: "mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3", children: shops.map((shop) => /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => toggleShop(shop.id),
              className: `flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${data.shop_ids.includes(shop.id) ? "border-amber-300 bg-amber-300/20 text-amber-300" : "border-white/15 bg-slate-900/50 text-slate-400 hover:border-white/30"}`,
              children: [
                /* @__PURE__ */ jsx("div", { className: `flex h-4 w-4 items-center justify-center rounded border ${data.shop_ids.includes(shop.id) ? "border-amber-300 bg-amber-300" : "border-white/30"}`, children: data.shop_ids.includes(shop.id) && /* @__PURE__ */ jsx(Check, { className: "h-3 w-3 text-slate-900" }) }),
                shop.name
              ]
            },
            shop.id
          )) }),
          errors.shop_ids && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.shop_ids })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "name", className: "block text-sm font-medium text-slate-200", children: "Nom du contact *" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                id: "name",
                value: data.name,
                onChange: (e) => setData("name", e.target.value),
                className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
                placeholder: "Ex: Ahmed Benali",
                autoFocus: true
              }
            ),
            errors.name && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.name })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "company_name", className: "block text-sm font-medium text-slate-200", children: "Raison sociale" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                id: "company_name",
                value: data.company_name,
                onChange: (e) => setData("company_name", e.target.value),
                className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
                placeholder: "Ex: ProTools SARL"
              }
            ),
            errors.company_name && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.company_name })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-slate-200", children: "Email" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "email",
                id: "email",
                value: data.email,
                onChange: (e) => setData("email", e.target.value),
                className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
                placeholder: "email@example.com"
              }
            ),
            errors.email && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.email })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "phone", className: "block text-sm font-medium text-slate-200", children: "Téléphone fixe" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                id: "phone",
                value: data.phone,
                onChange: (e) => setData("phone", e.target.value),
                className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
                placeholder: "05 22 00 00 00"
              }
            ),
            errors.phone && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.phone })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "mobile", className: "block text-sm font-medium text-slate-200", children: "Mobile" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                id: "mobile",
                value: data.mobile,
                onChange: (e) => setData("mobile", e.target.value),
                className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
                placeholder: "06 00 00 00 00"
              }
            ),
            errors.mobile && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.mobile })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-6 border-t border-white/10 pt-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-white", children: "Adresse" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "address", className: "block text-sm font-medium text-slate-200", children: "Adresse complète" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              id: "address",
              value: data.address,
              onChange: (e) => setData("address", e.target.value),
              rows: 3,
              className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
              placeholder: "Rue, numéro, quartier..."
            }
          ),
          errors.address && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.address })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "city", className: "block text-sm font-medium text-slate-200", children: "Ville" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                id: "city",
                value: data.city,
                onChange: (e) => setData("city", e.target.value),
                className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
                placeholder: "Ex: Casablanca"
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
                className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
                placeholder: "20000"
              }
            ),
            errors.postal_code && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.postal_code })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "country", className: "block text-sm font-medium text-slate-200", children: "Pays" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                id: "country",
                value: data.country,
                onChange: (e) => setData("country", e.target.value),
                className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
              }
            ),
            errors.country && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.country })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-6 border-t border-white/10 pt-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-white", children: "Autres informations" }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "tax_id", className: "block text-sm font-medium text-slate-200", children: "ICE / N° Fiscal" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                id: "tax_id",
                value: data.tax_id,
                onChange: (e) => setData("tax_id", e.target.value),
                className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
                placeholder: "000000000000000"
              }
            ),
            errors.tax_id && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.tax_id })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "website", className: "block text-sm font-medium text-slate-200", children: "Site web" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "url",
                id: "website",
                value: data.website,
                onChange: (e) => setData("website", e.target.value),
                className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
                placeholder: "https://..."
              }
            ),
            errors.website && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.website })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "notes", className: "block text-sm font-medium text-slate-200", children: "Notes" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              id: "notes",
              value: data.notes,
              onChange: (e) => setData("notes", e.target.value),
              rows: 3,
              className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
              placeholder: "Informations complémentaires..."
            }
          ),
          errors.notes && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.notes })
        ] }),
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
          /* @__PURE__ */ jsx("label", { htmlFor: "is_active", className: "text-sm font-medium text-slate-200", children: "Fournisseur actif" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-3 border-t border-white/10 pt-4", children: [
        /* @__PURE__ */ jsx(
          Link_default,
          {
            href: route("suppliers.index"),
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
            children: processing ? "Création..." : "Créer le fournisseur"
          }
        )
      ] })
    ] }) })
  ] });
}
export {
  SuppliersCreate as default
};
