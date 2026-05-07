import { jsxs, jsx } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { u as useForm, H as Head_default, L as Link_default, r as router3 } from "../ssr.js";
import { ArrowLeft, CreditCard, CheckCircle, Trash2, Printer } from "lucide-react";
import { C as Currency } from "./Currency-BX_NSrIs.js";
import { u as useRoute } from "./route-C2Ac8FMA.js";
import { useState } from "react";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
const paymentMethodLabels = {
  cash: "Espèces",
  card: "Carte",
  transfer: "Virement",
  check: "Chèque",
  mobile: "Mobile",
  multiple: "Multiple",
  credit: "Crédit"
};
const statusLabels = {
  completed: "Terminée",
  pending: "En attente",
  cancelled: "Annulée",
  returned: "Retournée"
};
function SalesShow({ sale, auth }) {
  const route = useRoute();
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const isAdmin = auth.user?.role === "super_admin" || auth.user?.role === "manager";
  const canCancel = sale.status !== "cancelled" && auth.user?.role !== "cashier" && auth.user?.role !== "caisse" && (isAdmin || sale.status === "completed");
  const handleCancelSale = () => {
    setCancelling(true);
    router3.delete(route("sales.destroy", { sale: sale.id }), {
      onSuccess: () => {
        setShowCancelModal(false);
        setCancelling(false);
      },
      onError: () => setCancelling(false)
    });
  };
  const creditForm = useForm({
    payment_amount: sale.remaining_amount,
    payment_method: "cash",
    notes: ""
  });
  const handlePrint = () => {
    window.print();
  };
  const handlePayCredit = (e) => {
    e.preventDefault();
    creditForm.post(route("sales.pay-credit", { sale: sale.id }), {
      onSuccess: () => setShowCreditModal(false)
    });
  };
  return /* @__PURE__ */ jsxs(
    Authenticated,
    {
      header: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-xl font-semibold text-white", children: [
          "Ticket ",
          sale.ticket_number
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          canCancel && /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setShowCancelModal(true),
              className: "inline-flex items-center gap-2 rounded-lg border border-rose-400/40 bg-rose-400/10 px-4 py-2 text-sm font-medium text-rose-300 hover:bg-rose-400/20",
              children: [
                /* @__PURE__ */ jsx(Trash2, { className: "size-4" }),
                " Annuler la vente"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: handlePrint,
              className: "inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/10",
              children: [
                /* @__PURE__ */ jsx(Printer, { className: "size-4" }),
                " Imprimer"
              ]
            }
          )
        ] })
      ] }),
      children: [
        /* @__PURE__ */ jsx(Head_default, { title: `Ticket ${sale.ticket_number}` }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs(
            Link_default,
            {
              href: route("sales.index"),
              className: "inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white",
              children: [
                /* @__PURE__ */ jsx(ArrowLeft, { className: "size-4" }),
                " Retour aux ventes"
              ]
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-8", children: [
            /* @__PURE__ */ jsxs("div", { className: "mb-8 text-center", children: [
              sale.shop.logo && /* @__PURE__ */ jsx("div", { className: "mb-4 flex justify-center", children: /* @__PURE__ */ jsx(
                "img",
                {
                  src: `/storage/${sale.shop.logo}`,
                  alt: sale.shop.name,
                  className: "h-20 w-auto object-contain print:h-16"
                }
              ) }),
              /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-white", children: sale.shop.name }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: sale.shop.address }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: sale.shop.phone })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mb-6 space-y-2 border-y border-white/10 py-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
                /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "N° Ticket:" }),
                /* @__PURE__ */ jsx("span", { className: "font-mono font-semibold text-white", children: sale.ticket_number })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
                /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Date:" }),
                /* @__PURE__ */ jsx("span", { className: "text-white", children: new Date(sale.sale_date).toLocaleString("fr-FR") })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
                /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Vendeur:" }),
                /* @__PURE__ */ jsx("span", { className: "text-white", children: sale.user.name })
              ] }),
              sale.customer && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
                /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Client:" }),
                /* @__PURE__ */ jsx("span", { className: "text-white", children: sale.customer.name })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
                /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Statut:" }),
                /* @__PURE__ */ jsx(
                  "span",
                  {
                    className: `font-semibold ${sale.status === "completed" ? "text-green-400" : sale.status === "cancelled" ? "text-red-400" : "text-slate-300"}`,
                    children: statusLabels[sale.status] || sale.status
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
              /* @__PURE__ */ jsx("thead", { className: "border-b border-white/10", children: /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("th", { className: "pb-2 text-left text-slate-400", children: "Article" }),
                /* @__PURE__ */ jsx("th", { className: "pb-2 text-center text-slate-400", children: "Qté" }),
                /* @__PURE__ */ jsx("th", { className: "pb-2 text-right text-slate-400", children: "P.U." }),
                /* @__PURE__ */ jsx("th", { className: "pb-2 text-right text-slate-400", children: "Total" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { children: sale.items.map((item) => /* @__PURE__ */ jsxs("tr", { className: "border-b border-white/5", children: [
                /* @__PURE__ */ jsx("td", { className: "py-2", children: item.product?.parent ? /* @__PURE__ */ jsxs("span", { className: "text-white", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: item.product.parent.name }),
                  /* @__PURE__ */ jsx("span", { className: "mx-1 text-slate-500", children: "›" }),
                  /* @__PURE__ */ jsx("span", { children: item.product.name })
                ] }) : /* @__PURE__ */ jsx("span", { className: "text-white", children: item.product_name }) }),
                /* @__PURE__ */ jsx("td", { className: "py-2 text-center text-slate-300", children: item.quantity }),
                /* @__PURE__ */ jsx("td", { className: "py-2 text-right text-slate-300", children: /* @__PURE__ */ jsx(Currency, { amount: parseFloat(item.unit_price) }) }),
                /* @__PURE__ */ jsx("td", { className: "py-2 text-right font-semibold text-white", children: /* @__PURE__ */ jsx(Currency, { amount: parseFloat(item.total) }) })
              ] }, item.id)) })
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2 border-t border-white/10 pt-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
                /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Sous-total:" }),
                /* @__PURE__ */ jsx("span", { className: "text-white", children: /* @__PURE__ */ jsx(Currency, { amount: parseFloat(sale.subtotal) }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
                /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "TVA:" }),
                /* @__PURE__ */ jsx("span", { className: "text-white", children: /* @__PURE__ */ jsx(Currency, { amount: parseFloat(sale.tax_amount) }) })
              ] }),
              parseFloat(sale.discount_amount) > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
                /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Remise:" }),
                /* @__PURE__ */ jsxs("span", { className: "text-red-400", children: [
                  "-",
                  /* @__PURE__ */ jsx(Currency, { amount: parseFloat(sale.discount_amount) })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between border-t border-white/10 pt-2 text-lg font-bold", children: [
                /* @__PURE__ */ jsx("span", { className: "text-white", children: "TOTAL:" }),
                /* @__PURE__ */ jsx("span", { className: "text-amber-300", children: /* @__PURE__ */ jsx(Currency, { amount: parseFloat(sale.total) }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 space-y-2 border-t border-white/10 pt-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
                /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Mode de paiement:" }),
                /* @__PURE__ */ jsx("span", { className: "text-white", children: paymentMethodLabels[sale.payment_method] || sale.payment_method })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
                /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Montant payé:" }),
                /* @__PURE__ */ jsx("span", { className: "text-white", children: /* @__PURE__ */ jsx(Currency, { amount: parseFloat(sale.amount_paid) }) })
              ] }),
              parseFloat(sale.change_amount) > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
                /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Monnaie rendue:" }),
                /* @__PURE__ */ jsx("span", { className: "font-semibold text-emerald-400", children: /* @__PURE__ */ jsx(Currency, { amount: parseFloat(sale.change_amount) }) })
              ] }),
              parseFloat(sale.remaining_amount) > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm font-semibold border-t border-white/10 pt-2", children: [
                /* @__PURE__ */ jsx("span", { className: "text-rose-400", children: "Reste à payer:" }),
                /* @__PURE__ */ jsx("span", { className: "text-rose-400", children: /* @__PURE__ */ jsx(Currency, { amount: parseFloat(sale.remaining_amount) }) })
              ] }),
              sale.credit_due_date && parseFloat(sale.remaining_amount) > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
                /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Échéance:" }),
                /* @__PURE__ */ jsx("span", { className: "text-amber-300", children: new Date(sale.credit_due_date).toLocaleDateString("fr-FR") })
              ] })
            ] }),
            parseFloat(sale.remaining_amount) > 0 && /* @__PURE__ */ jsx("div", { className: "mt-6 rounded-xl border border-rose-400/30 bg-rose-500/10 p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(CreditCard, { className: "size-5 text-rose-400" }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-rose-300", children: "Vente à crédit" }),
                  /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400", children: [
                    "Reste : ",
                    /* @__PURE__ */ jsx(Currency, { amount: parseFloat(sale.remaining_amount) })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setShowCreditModal(true),
                  className: "inline-flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-400",
                  children: [
                    /* @__PURE__ */ jsx(CheckCircle, { className: "size-4" }),
                    "Encaisser le reste"
                  ]
                }
              )
            ] }) }),
            sale.notes && /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-lg bg-slate-900/50 p-4", children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: "Notes:" }),
              /* @__PURE__ */ jsx("p", { className: "text-white", children: sale.notes })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-8 text-center text-xs text-slate-500", children: [
              /* @__PURE__ */ jsx("p", { children: "Merci de votre visite" }),
              /* @__PURE__ */ jsx("p", { children: "À bientôt !" })
            ] })
          ] })
        ] }),
        showCreditModal && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-sm rounded-2xl bg-slate-900 border border-white/10 p-6 shadow-2xl", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(CreditCard, { className: "size-5 text-rose-400" }),
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-white", children: "Encaisser le reste" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mb-4 rounded-lg bg-white/5 p-3 text-center", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "Reste à payer" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-rose-400", children: /* @__PURE__ */ jsx(Currency, { amount: parseFloat(sale.remaining_amount) }) })
          ] }),
          /* @__PURE__ */ jsxs("form", { onSubmit: handlePayCredit, className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm text-slate-300", children: "Montant encaissé *" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  step: "0.01",
                  min: "0.01",
                  max: sale.remaining_amount,
                  value: creditForm.data.payment_amount,
                  onChange: (e) => creditForm.setData("payment_amount", e.target.value),
                  className: "w-full rounded-lg border border-white/15 bg-slate-800 px-3 py-2 text-white focus:border-amber-300 focus:outline-none",
                  required: true
                }
              ),
              creditForm.errors.payment_amount && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-red-400", children: creditForm.errors.payment_amount })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm text-slate-300", children: "Mode de paiement *" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: creditForm.data.payment_method,
                  onChange: (e) => creditForm.setData("payment_method", e.target.value),
                  className: "w-full rounded-lg border border-white/15 bg-slate-800 px-3 py-2 text-white focus:border-amber-300 focus:outline-none",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "cash", children: "Espèces" }),
                    /* @__PURE__ */ jsx("option", { value: "card", children: "Carte" }),
                    /* @__PURE__ */ jsx("option", { value: "transfer", children: "Virement" }),
                    /* @__PURE__ */ jsx("option", { value: "check", children: "Chèque" }),
                    /* @__PURE__ */ jsx("option", { value: "mobile", children: "Mobile" })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-3 pt-1", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "submit",
                  disabled: creditForm.processing,
                  className: "flex-1 rounded-xl bg-rose-500 py-2.5 text-sm font-semibold text-white hover:bg-rose-400 disabled:opacity-50",
                  children: creditForm.processing ? "Traitement..." : "Confirmer"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setShowCreditModal(false),
                  className: "flex-1 rounded-xl border border-white/15 py-2.5 text-sm text-slate-300 hover:bg-white/5",
                  children: "Annuler"
                }
              )
            ] })
          ] })
        ] }) }),
        showCancelModal && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-sm rounded-2xl bg-slate-900 p-6 shadow-xl border border-white/10", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "flex size-10 items-center justify-center rounded-full bg-rose-400/10", children: /* @__PURE__ */ jsx(Trash2, { className: "size-5 text-rose-400" }) }),
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-white", children: "Annuler la vente" })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "mb-2 text-sm text-slate-300", children: [
            "Voulez-vous vraiment annuler la vente ",
            /* @__PURE__ */ jsx("strong", { className: "text-white", children: sale.ticket_number }),
            " ?"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mb-6 text-xs text-slate-400", children: "Le stock des produits tracés sera automatiquement remis à jour. Cette action est irréversible." }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: handleCancelSale,
                disabled: cancelling,
                className: "flex-1 rounded-xl bg-rose-500 py-2.5 text-sm font-semibold text-white hover:bg-rose-400 disabled:opacity-50",
                children: cancelling ? "Annulation..." : "Confirmer"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setShowCancelModal(false),
                className: "flex-1 rounded-xl border border-white/15 py-2.5 text-sm text-slate-300 hover:bg-white/5",
                children: "Fermer"
              }
            )
          ] })
        ] }) })
      ]
    }
  );
}
export {
  SalesShow as default
};
