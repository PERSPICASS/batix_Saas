import { jsxs, jsx } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { T as Table, b as TableBadge, c as TableActions, d as TableActionButton } from "./Table-Cvz7wd2g.js";
import { H as Head_default, L as Link_default, r as router3 } from "../ssr.js";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { C as Currency } from "./Currency-BX_NSrIs.js";
import { u as useRoute } from "./route-C2Ac8FMA.js";
import "react";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
function CustomersIndex({ customers }) {
  const route = useRoute();
  const handleDelete = (customer) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le client "${customer.name}" ?`)) {
      router3.delete(route("customers.destroy", { customer: customer.id }));
    }
  };
  return /* @__PURE__ */ jsxs(Authenticated, { header: /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-white", children: "Clients" }), children: [
    /* @__PURE__ */ jsx(Head_default, { title: "Clients" }),
    /* @__PURE__ */ jsxs("section", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-300", children: [
          customers.data.length,
          " client",
          customers.data.length > 1 ? "s" : ""
        ] }),
        /* @__PURE__ */ jsxs(
          Link_default,
          {
            href: route("customers.create"),
            className: "inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200",
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "size-4" }),
              " Nouveau client"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx(
        Table,
        {
          data: customers.data,
          columns: [
            { key: "name", label: "Nom" },
            { key: "email", label: "Email" },
            { key: "phone", label: "Téléphone" },
            {
              key: "total_purchases",
              label: "Total achats",
              align: "right",
              render: (customer) => /* @__PURE__ */ jsx(Currency, { amount: parseFloat(customer.total_purchases) })
            },
            {
              key: "is_active",
              label: "Statut",
              align: "center",
              render: (customer) => /* @__PURE__ */ jsx(TableBadge, { variant: customer.is_active ? "success" : "danger", children: customer.is_active ? "Actif" : "Inactif" })
            },
            {
              key: "shop",
              label: "Boutique",
              render: (customer) => customer.shop.name
            },
            {
              key: "actions",
              label: "Actions",
              align: "right",
              render: (customer) => /* @__PURE__ */ jsxs(TableActions, { children: [
                /* @__PURE__ */ jsxs(
                  Link_default,
                  {
                    href: route("customers.edit", { customer: customer.id }),
                    className: "inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/10",
                    children: [
                      /* @__PURE__ */ jsx(Pencil, { className: "size-3.5" }),
                      " Modifier"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(TableActionButton, { variant: "danger", onClick: () => handleDelete(customer), children: [
                  /* @__PURE__ */ jsx(Trash2, { className: "size-3.5" }),
                  " Supprimer"
                ] })
              ] })
            }
          ],
          emptyMessage: "Aucun client trouvé"
        }
      ),
      customers.links && /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center gap-1", children: customers.links.map((link, index) => /* @__PURE__ */ jsx(
        Link_default,
        {
          href: link.url || "#",
          className: `rounded-lg px-3 py-2 text-sm ${link.active ? "bg-amber-300 text-slate-950 font-semibold" : "border border-white/15 text-slate-200 hover:bg-white/10"} ${!link.url ? "opacity-50 cursor-not-allowed" : ""}`,
          dangerouslySetInnerHTML: { __html: link.label }
        },
        index
      )) })
    ] })
  ] });
}
export {
  CustomersIndex as default
};
