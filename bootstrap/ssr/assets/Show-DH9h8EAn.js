import { jsxs, jsx } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { C as Currency } from "./Currency-BX_NSrIs.js";
import { H as Head_default, L as Link_default } from "../ssr.js";
import { ArrowLeft, Printer, Pencil } from "lucide-react";
import { u as useRoute } from "./route-C2Ac8FMA.js";
import "react";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
const statusLabels = {
  draft: "Brouillon",
  sent: "Envoyée",
  paid: "Payée",
  overdue: "En retard",
  cancelled: "Annulée"
};
const paymentLabels = {
  cash: "Espèces",
  card: "Carte bancaire",
  transfer: "Virement",
  check: "Chèque",
  mobile: "Mobile"
};
function InvoicesShow({ invoice }) {
  const route = useRoute();
  const handlePrint = () => window.print();
  return /* @__PURE__ */ jsxs(
    Authenticated,
    {
      header: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-xl font-semibold text-white", children: [
          "Facture ",
          invoice.invoice_number
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "print:hidden flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: handlePrint,
              className: "inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/10",
              children: [
                /* @__PURE__ */ jsx(Printer, { className: "size-4" }),
                " Imprimer"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Link_default,
            {
              href: route("invoices.edit", { invoice: invoice.id }),
              className: "inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/10",
              children: [
                /* @__PURE__ */ jsx(Pencil, { className: "size-4" }),
                " Modifier"
              ]
            }
          )
        ] })
      ] }),
      children: [
        /* @__PURE__ */ jsx(Head_default, { title: `Facture ${invoice.invoice_number}` }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs(
            Link_default,
            {
              href: route("invoices.index"),
              className: "print:hidden inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white",
              children: [
                /* @__PURE__ */ jsx(ArrowLeft, { className: "size-4" }),
                " Retour aux factures"
              ]
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "invoice-print rounded-2xl border border-white/10 bg-white/5 p-6 print:rounded-none print:border-0 print:bg-white print:px-2 print:py-0", children: [
            /* @__PURE__ */ jsx("div", { className: "mb-6 rounded-xl border border-white/10 bg-gradient-to-r from-slate-900/70 to-slate-800/40 p-5 print:border print:bg-transparent", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                invoice.shop.logo && /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: `/storage/${invoice.shop.logo}`,
                    alt: invoice.shop.name,
                    className: "h-16 w-auto object-contain print:h-12"
                  }
                ),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-[0.2em] text-amber-300", children: "Facture" }),
                  /* @__PURE__ */ jsx("h2", { className: "mt-1 text-2xl font-bold text-white", children: invoice.invoice_number })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "Émise par" }),
                /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-white", children: invoice.shop.name })
              ] })
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "mb-6 grid gap-3 md:grid-cols-2 print:grid-cols-2 print:gap-x-8 print:gap-y-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-white/10 bg-slate-900/40 p-3 print:border print:bg-transparent", children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-wide text-slate-400", children: "Client" }),
                /* @__PURE__ */ jsx("p", { className: "mt-1 font-medium text-white", children: invoice.customer.name })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-white/10 bg-slate-900/40 p-3 text-right print:border print:bg-transparent", children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-wide text-slate-400", children: "Boutique" }),
                /* @__PURE__ */ jsx("p", { className: "mt-1 font-medium text-white", children: invoice.shop.name })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-white/10 bg-slate-900/40 p-3 print:border print:bg-transparent", children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-wide text-slate-400", children: "Date facture" }),
                /* @__PURE__ */ jsx("p", { className: "mt-1 text-white", children: new Date(invoice.invoice_date).toLocaleDateString("fr-FR") })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-white/10 bg-slate-900/40 p-3 text-right print:border print:bg-transparent", children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-wide text-slate-400", children: "Échéance" }),
                /* @__PURE__ */ jsx("p", { className: "mt-1 text-white", children: invoice.due_date ? new Date(invoice.due_date).toLocaleDateString("fr-FR") : "-" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-white/10 bg-slate-900/40 p-3 print:border print:bg-transparent", children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-wide text-slate-400", children: "Statut" }),
                /* @__PURE__ */ jsx("p", { className: "mt-1 text-white", children: statusLabels[invoice.status] || invoice.status })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-white/10 bg-slate-900/40 p-3 text-right print:border print:bg-transparent", children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-wide text-slate-400", children: "Mode de paiement" }),
                /* @__PURE__ */ jsx("p", { className: "mt-1 text-white", children: invoice.payment_method ? paymentLabels[invoice.payment_method] || invoice.payment_method : "Non défini" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "overflow-x-auto rounded-xl border border-white/10 print:overflow-visible print:border", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm print:table-fixed", children: [
              /* @__PURE__ */ jsx("thead", { className: "border-b border-white/10 bg-slate-900/50 text-slate-300 print:bg-transparent", children: /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("th", { className: "py-2.5 pl-4 text-left", children: "Produit" }),
                /* @__PURE__ */ jsx("th", { className: "py-2.5 text-center", children: "Qté" }),
                /* @__PURE__ */ jsx("th", { className: "py-2.5 text-right", children: "Prix U." }),
                /* @__PURE__ */ jsx("th", { className: "py-2.5 pr-4 text-right", children: "Total" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { children: invoice.items.map((item) => /* @__PURE__ */ jsxs("tr", { className: "border-b border-white/5", children: [
                /* @__PURE__ */ jsx("td", { className: "py-2.5 pl-4", children: item.product?.parent ? /* @__PURE__ */ jsxs("span", { className: "text-white", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: item.product.parent.name }),
                  /* @__PURE__ */ jsx("span", { className: "mx-1 text-slate-500", children: "›" }),
                  /* @__PURE__ */ jsx("span", { children: item.product.name })
                ] }) : /* @__PURE__ */ jsx("span", { className: "text-white", children: item.product_name }) }),
                /* @__PURE__ */ jsx("td", { className: "py-2.5 text-center text-slate-300", children: item.quantity }),
                /* @__PURE__ */ jsx("td", { className: "py-2.5 text-right text-slate-300", children: /* @__PURE__ */ jsx(Currency, { amount: Number(item.unit_price) }) }),
                /* @__PURE__ */ jsx("td", { className: "py-2.5 pr-4 text-right font-semibold text-white", children: /* @__PURE__ */ jsx(Currency, { amount: Number(item.total) }) })
              ] }, item.id)) })
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 ml-auto w-full max-w-sm rounded-xl border border-white/10 bg-slate-900/40 p-4 text-sm print:max-w-[320px] print:border print:bg-transparent", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-slate-300", children: [
                /* @__PURE__ */ jsx("span", { children: "Sous-total" }),
                /* @__PURE__ */ jsx("span", { children: /* @__PURE__ */ jsx(Currency, { amount: Number(invoice.subtotal) }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "mt-2 flex justify-between text-slate-300", children: [
                /* @__PURE__ */ jsx("span", { children: "TVA" }),
                /* @__PURE__ */ jsx("span", { children: /* @__PURE__ */ jsx(Currency, { amount: Number(invoice.tax_amount) }) })
              ] }),
              Number(invoice.discount_amount) > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-2 flex justify-between text-red-300", children: [
                /* @__PURE__ */ jsx("span", { children: "Remise" }),
                /* @__PURE__ */ jsxs("span", { children: [
                  "-",
                  /* @__PURE__ */ jsx(Currency, { amount: Number(invoice.discount_amount) })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "mt-3 flex justify-between border-t border-white/10 pt-3 text-lg font-semibold text-white", children: [
                /* @__PURE__ */ jsx("span", { children: "Total TTC" }),
                /* @__PURE__ */ jsx("span", { children: /* @__PURE__ */ jsx(Currency, { amount: Number(invoice.total) }) })
              ] })
            ] }),
            invoice.notes && /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-xl border border-white/10 bg-slate-900/40 p-4 print:border print:bg-transparent", children: [
              /* @__PURE__ */ jsx("p", { className: "mb-1 text-sm text-slate-400", children: "Notes" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-white", children: invoice.notes })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("style", { children: `
                @media print {
                    @page { margin: 12mm; }
                    body { background: #fff !important; }
                    .invoice-print {
                        max-width: 190mm;
                        margin: 0 auto;
                    }
                    .invoice-print, .invoice-print * {
                        color: #000 !important;
                        border-color: #ddd !important;
                        background: transparent !important;
                    }
                    .invoice-print table th,
                    .invoice-print table td {
                        padding-top: 6px !important;
                        padding-bottom: 6px !important;
                        vertical-align: top !important;
                    }
                    .invoice-print p,
                    .invoice-print span,
                    .invoice-print td,
                    .invoice-print th {
                        line-height: 1.35 !important;
                    }
                }
            ` })
      ]
    }
  );
}
export {
  InvoicesShow as default
};
