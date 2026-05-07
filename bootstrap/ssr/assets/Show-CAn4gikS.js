import { jsxs, jsx } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { H as Head_default, L as Link_default } from "../ssr.js";
import { ArrowLeft, Building2, Mail, Phone, MapPin, Globe, FileText, Package, Pencil } from "lucide-react";
import { C as Currency } from "./Currency-BX_NSrIs.js";
import { P as ProductImage } from "./ProductImage-5zmeiiH5.js";
import { u as useRoute } from "./route-C2Ac8FMA.js";
import "react";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
function SuppliersShow({ supplier }) {
  const route = useRoute();
  return /* @__PURE__ */ jsxs(
    Authenticated,
    {
      header: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-white", children: "Détails du fournisseur" }),
        /* @__PURE__ */ jsxs(
          Link_default,
          {
            href: route("suppliers.edit", { supplier: supplier.id }),
            className: "inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200",
            children: [
              /* @__PURE__ */ jsx(Pencil, { className: "size-4" }),
              " Modifier"
            ]
          }
        )
      ] }),
      children: [
        /* @__PURE__ */ jsx(Head_default, { title: `Fournisseur - ${supplier.name}` }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxs(
            Link_default,
            {
              href: route("suppliers.index"),
              className: "inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white",
              children: [
                /* @__PURE__ */ jsx(ArrowLeft, { className: "size-4" }),
                "Retour à la liste"
              ]
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-6 lg:grid-cols-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-6 lg:col-span-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6", children: [
                /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-center justify-between", children: [
                  /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-white", children: "Informations générales" }),
                  supplier.is_active ? /* @__PURE__ */ jsx("span", { className: "rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400", children: "Actif" }) : /* @__PURE__ */ jsx("span", { className: "rounded-full bg-red-500/20 px-3 py-1 text-xs font-medium text-red-400", children: "Inactif" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
                    /* @__PURE__ */ jsx(Building2, { className: "mt-1 size-5 text-amber-300" }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: "Nom du contact" }),
                      /* @__PURE__ */ jsx("p", { className: "font-medium text-slate-200", children: supplier.name }),
                      supplier.company_name && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-300", children: supplier.company_name })
                    ] })
                  ] }),
                  supplier.email && /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
                    /* @__PURE__ */ jsx(Mail, { className: "mt-1 size-5 text-blue-400" }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: "Email" }),
                      /* @__PURE__ */ jsx(
                        "a",
                        {
                          href: `mailto:${supplier.email}`,
                          className: "font-medium text-blue-300 hover:underline",
                          children: supplier.email
                        }
                      )
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
                    /* @__PURE__ */ jsx(Phone, { className: "mt-1 size-5 text-green-400" }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: "Téléphone" }),
                      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                        supplier.phone && /* @__PURE__ */ jsxs("p", { className: "font-medium text-slate-200", children: [
                          "Fixe: ",
                          supplier.phone
                        ] }),
                        supplier.mobile && /* @__PURE__ */ jsxs("p", { className: "font-medium text-slate-200", children: [
                          "Mobile: ",
                          supplier.mobile
                        ] }),
                        !supplier.phone && !supplier.mobile && /* @__PURE__ */ jsx("p", { className: "text-slate-500", children: "Non renseigné" })
                      ] })
                    ] })
                  ] }),
                  (supplier.address || supplier.city) && /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
                    /* @__PURE__ */ jsx(MapPin, { className: "mt-1 size-5 text-purple-400" }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: "Adresse" }),
                      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                        supplier.address && /* @__PURE__ */ jsx("p", { className: "text-slate-200", children: supplier.address }),
                        /* @__PURE__ */ jsxs("p", { className: "text-slate-200", children: [
                          supplier.city && `${supplier.city}`,
                          supplier.postal_code && ` ${supplier.postal_code}`
                        ] }),
                        /* @__PURE__ */ jsx("p", { className: "text-slate-300", children: supplier.country })
                      ] })
                    ] })
                  ] }),
                  supplier.website && /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
                    /* @__PURE__ */ jsx(Globe, { className: "mt-1 size-5 text-cyan-400" }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: "Site web" }),
                      /* @__PURE__ */ jsx(
                        "a",
                        {
                          href: supplier.website,
                          target: "_blank",
                          rel: "noopener noreferrer",
                          className: "font-medium text-cyan-300 hover:underline",
                          children: supplier.website
                        }
                      )
                    ] })
                  ] })
                ] })
              ] }),
              supplier.notes && /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6", children: [
                /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(FileText, { className: "size-5 text-amber-300" }),
                  /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-white", children: "Notes" })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "whitespace-pre-line text-slate-300", children: supplier.notes })
              ] }),
              supplier.products && supplier.products.length > 0 && /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6", children: [
                /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(Package, { className: "size-5 text-amber-300" }),
                  /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-white", children: [
                    "Produits (",
                    supplier.products.length,
                    ")"
                  ] })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "space-y-2", children: supplier.products.map((product) => /* @__PURE__ */ jsxs(
                  "div",
                  {
                    className: "flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3",
                    children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                        /* @__PURE__ */ jsx(ProductImage, { src: product.image, name: product.name, thumbnailClass: "size-10" }),
                        /* @__PURE__ */ jsxs("div", { children: [
                          /* @__PURE__ */ jsx("p", { className: "font-medium text-slate-200", children: product.name }),
                          /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-400", children: [
                            "SKU: ",
                            product.sku
                          ] })
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "text-right shrink-0 ml-3", children: [
                        /* @__PURE__ */ jsx("p", { className: "font-semibold text-amber-300", children: /* @__PURE__ */ jsx(Currency, { amount: product.price }) }),
                        /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-400", children: [
                          "Stock: ",
                          product.stock
                        ] })
                      ] })
                    ]
                  },
                  product.id
                )) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6", children: [
                /* @__PURE__ */ jsx("h3", { className: "mb-4 text-sm font-semibold text-white", children: "Informations fiscales" }),
                /* @__PURE__ */ jsx("div", { className: "space-y-3", children: /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "ICE / N° Fiscal" }),
                  /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm font-medium text-slate-200", children: supplier.tax_id || "Non renseigné" })
                ] }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6", children: [
                /* @__PURE__ */ jsx("h3", { className: "mb-4 text-sm font-semibold text-white", children: "Statistiques" }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "Produits fournis" }),
                    /* @__PURE__ */ jsx("p", { className: "mt-1 text-2xl font-bold text-amber-300", children: supplier.products?.length || 0 })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "Membre depuis" }),
                    /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm font-medium text-slate-200", children: new Date(supplier.created_at).toLocaleDateString("fr-FR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    }) })
                  ] })
                ] })
              ] })
            ] })
          ] })
        ] })
      ]
    }
  );
}
export {
  SuppliersShow as default
};
