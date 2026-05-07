import { jsxs, jsx } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { a as usePage, u as useForm, H as Head_default } from "../ssr.js";
import { useState } from "react";
import { u as useRoute } from "./route-C2Ac8FMA.js";
import { AlertCircle, Info, Store, Image, X, Upload, Phone, MapPin, DollarSign, Percent, FileText, Hash, Save } from "lucide-react";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
function Settings({ shop, currencies, error }) {
  const route = useRoute();
  const { auth } = usePage().props;
  const isSuperAdmin = auth.user?.role === "super_admin";
  const [logoPreview, setLogoPreview] = useState(
    shop?.logo ? `/storage/${shop.logo}` : null
  );
  const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
    name: shop?.name || "",
    description: shop?.description || "",
    address: shop?.address || "",
    city: shop?.city || "",
    postal_code: shop?.postal_code || "",
    phone: shop?.phone || "",
    email: shop?.email || "",
    website: shop?.website || "",
    logo: null,
    tax_id: shop?.tax_id || "",
    currency: shop?.currency || "USD",
    default_tax_rate: shop?.default_tax_rate || "",
    invoice_prefix: shop?.invoice_prefix || "",
    invoice_footer: shop?.invoice_footer || "",
    _method: "PATCH"
  });
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setData("logo", file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const removeLogo = () => {
    setData("logo", null);
    setLogoPreview(null);
  };
  const submit = (e) => {
    e.preventDefault();
    post(route("settings.update"), {
      forceFormData: true
    });
  };
  if (error || !shop) {
    return /* @__PURE__ */ jsxs(Authenticated, { header: /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-white", children: "Paramètres" }), children: [
      /* @__PURE__ */ jsx(Head_default, { title: "Paramètres" }),
      /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-4xl", children: /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-red-500/20 bg-red-900/10 p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(AlertCircle, { className: "h-6 w-6 text-red-400" }),
        /* @__PURE__ */ jsx("p", { className: "text-red-200", children: error || "Aucune boutique associée" })
      ] }) }) })
    ] });
  }
  return /* @__PURE__ */ jsxs(Authenticated, { header: /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-white", children: "Paramètres de la Boutique" }), children: [
    /* @__PURE__ */ jsx(Head_default, { title: "Paramètres" }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl", children: [
      isSuperAdmin && /* @__PURE__ */ jsx("div", { className: "mb-6 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-blue-500/20 p-2", children: /* @__PURE__ */ jsx(Info, { className: "size-5 text-blue-300" }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-semibold text-blue-200", children: "Configuration globale du compte" }),
          /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-blue-300", children: [
            "En tant que super administrateur, les modifications que vous apportez ici seront appliquées à ",
            /* @__PURE__ */ jsx("strong", { children: "toutes vos boutiques" }),
            ". Cela inclut la devise, les taux de taxe, les préfixes de facture, etc."
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Store, { className: "size-5 text-amber-300" }),
            /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-white", children: "Informations générales" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
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
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-200 mb-2", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Image, { className: "size-4" }),
                "Logo (pour factures et tickets)"
              ] }) }),
              logoPreview ? /* @__PURE__ */ jsxs("div", { className: "relative inline-block", children: [
                /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: logoPreview,
                    alt: "Logo preview",
                    className: "h-32 w-auto rounded-lg border-2 border-white/15 bg-white p-2"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: removeLogo,
                    className: "absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600",
                    children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
                  }
                )
              ] }) : /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center w-full", children: /* @__PURE__ */ jsxs(
                "label",
                {
                  htmlFor: "logo-upload",
                  className: "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/15 rounded-lg cursor-pointer bg-slate-900/50 hover:bg-slate-900/70",
                  children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center pt-5 pb-6", children: [
                      /* @__PURE__ */ jsx(Upload, { className: "w-8 h-8 mb-2 text-slate-400" }),
                      /* @__PURE__ */ jsx("p", { className: "mb-1 text-sm text-slate-300", children: /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "Cliquez pour uploader" }) }),
                      /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "PNG, JPG, GIF ou SVG (max. 2MB)" })
                    ] }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        id: "logo-upload",
                        type: "file",
                        className: "hidden",
                        accept: "image/*",
                        onChange: handleLogoChange
                      }
                    )
                  ]
                }
              ) }),
              errors.logo && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.logo }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-slate-400", children: "Le logo sera affiché sur vos factures et tickets de vente" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Phone, { className: "size-5 text-amber-300" }),
            /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-white", children: "Coordonnées" })
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
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "website", className: "block text-sm font-medium text-slate-200", children: "Site web" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "url",
                  id: "website",
                  value: data.website,
                  onChange: (e) => setData("website", e.target.value),
                  placeholder: "https://example.com",
                  className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                }
              ),
              errors.website && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.website })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(MapPin, { className: "size-5 text-amber-300" }),
            /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-white", children: "Adresse" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "address", className: "block text-sm font-medium text-slate-200", children: "Adresse" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  id: "address",
                  value: data.address,
                  onChange: (e) => setData("address", e.target.value),
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
        /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(DollarSign, { className: "size-5 text-amber-300" }),
            /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-white", children: "Fiscalité et devise" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "tax_id", className: "block text-sm font-medium text-slate-200", children: "Numéro fiscal (ICE/NIF)" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  id: "tax_id",
                  value: data.tax_id,
                  onChange: (e) => setData("tax_id", e.target.value),
                  placeholder: "Ex: 002345678000023",
                  className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                }
              ),
              errors.tax_id && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.tax_id })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "currency", className: "block text-sm font-medium text-slate-200", children: "Devise *" }),
              /* @__PURE__ */ jsx(
                "select",
                {
                  id: "currency",
                  value: data.currency,
                  onChange: (e) => setData("currency", e.target.value),
                  className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
                  required: true,
                  children: currencies.map((currency) => /* @__PURE__ */ jsxs("option", { value: currency.code, children: [
                    currency.code,
                    " - ",
                    currency.name,
                    " (",
                    currency.symbol,
                    ")"
                  ] }, currency.code))
                }
              ),
              errors.currency && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.currency })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "default_tax_rate", className: "block text-sm font-medium text-slate-200", children: "Taux de TVA par défaut (%)" }),
              /* @__PURE__ */ jsxs("div", { className: "relative mt-1", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    id: "default_tax_rate",
                    value: data.default_tax_rate,
                    onChange: (e) => setData("default_tax_rate", e.target.value),
                    step: "0.01",
                    min: "0",
                    max: "100",
                    placeholder: "Ex: 20.00",
                    className: "block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 pr-10 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                  }
                ),
                /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3", children: /* @__PURE__ */ jsx(Percent, { className: "h-5 w-5 text-slate-400" }) })
              ] }),
              errors.default_tax_rate && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.default_tax_rate })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(FileText, { className: "size-5 text-amber-300" }),
            /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-white", children: "Configuration des factures" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "invoice_prefix", className: "block text-sm font-medium text-slate-200", children: "Préfixe des factures" }),
              /* @__PURE__ */ jsxs("div", { className: "relative mt-1", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    id: "invoice_prefix",
                    value: data.invoice_prefix,
                    onChange: (e) => setData("invoice_prefix", e.target.value),
                    placeholder: "Ex: INV, FAC",
                    maxLength: 10,
                    className: "block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 pl-10 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                  }
                ),
                /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3", children: /* @__PURE__ */ jsx(Hash, { className: "h-5 w-5 text-slate-400" }) })
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-slate-400", children: [
                "Les factures seront numérotées: ",
                data.invoice_prefix || "INV",
                "-0001, ",
                data.invoice_prefix || "INV",
                "-0002, etc."
              ] }),
              errors.invoice_prefix && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.invoice_prefix })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "invoice_footer", className: "block text-sm font-medium text-slate-200", children: "Pied de page des factures" }),
              /* @__PURE__ */ jsx(
                "textarea",
                {
                  id: "invoice_footer",
                  value: data.invoice_footer,
                  onChange: (e) => setData("invoice_footer", e.target.value),
                  rows: 3,
                  placeholder: "Ex: Merci de votre confiance. Conditions de paiement: 30 jours",
                  className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                }
              ),
              errors.invoice_footer && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.invoice_footer })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-6", children: [
          /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: recentlySuccessful && /* @__PURE__ */ jsx("span", { className: "text-sm text-green-400", children: "✓ Paramètres enregistrés" }) }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "submit",
              disabled: processing,
              className: "flex items-center gap-2 rounded-lg bg-amber-300 px-6 py-2.5 text-sm font-semibold text-slate-900 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50",
              children: [
                /* @__PURE__ */ jsx(Save, { className: "h-4 w-4" }),
                processing ? "Enregistrement..." : "Enregistrer les paramètres"
              ]
            }
          )
        ] })
      ] })
    ] })
  ] });
}
export {
  Settings as default
};
