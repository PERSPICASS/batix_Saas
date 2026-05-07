import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { u as useForm, H as Head_default, L as Link_default } from "../ssr.js";
import { ArrowLeft, Check, AlertTriangle, ShieldCheck, CreditCard, Smartphone, Loader2, Building2 } from "lucide-react";
import { useState } from "react";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
const logoWave = "/build/assets/logo-wave-R8q6RdUg.jpg";
const logoOrange = "/build/assets/logo_orange_money-BVynDAIL.png";
const logoMtn = "/build/assets/logo_mtn_money-DUoHMa3s.jpg";
const logoMoov = "/build/assets/logo_moov_money-zHa_GADp.png";
const PAYMENT_METHODS = [
  { id: "wave", label: "Wave", logo: logoWave },
  { id: "orange_money", label: "Orange Money", logo: logoOrange },
  { id: "mtn_money", label: "MTN Money", logo: logoMtn },
  { id: "moov_money", label: "Moov Money", logo: logoMoov }
  /* { id: 'virement',     label: 'Virement bancaire', icon: '🏦' },
  { id: 'carte',        label: 'Carte bancaire',   icon: '💳' }, */
];
function Checkout({ plan, currentPlan, paymentNumbers = {}, currency = "XOF" }) {
  const [billingCycle, setBillingCycle] = useState("monthly");
  const isLocalCurrency = ["XOF", "FCFA", "GNF", "MRU", "SLL"].includes(currency);
  const basePrice = isLocalCurrency ? Number(plan.price) : parseFloat(plan.price_eur?.replace(/[^0-9.]/g, "") || String(plan.price));
  const currencyLabel = isLocalCurrency ? currency : "€";
  const yearlyPrice = Math.round(basePrice * 12 * 0.85);
  const displayPrice = billingCycle === "yearly" ? yearlyPrice : basePrice;
  const saving = Math.round(basePrice * 12 - yearlyPrice);
  const formatPrice = (val) => isLocalCurrency ? val.toLocaleString("fr-FR") : val.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const { data, setData, post, processing, errors } = useForm({
    payment_method: "",
    billing_cycle: billingCycle,
    phone: "",
    transaction_ref: ""
  });
  const selectedMethod = PAYMENT_METHODS.find((m) => m.id === data.payment_method);
  const needsPhone = ["wave", "orange_money", "mtn_money", "moov_money"].includes(data.payment_method);
  const ul = "Illimité";
  const features = [
    plan.has_unlimited_shops ? `${ul} boutiques` : `${plan.max_shops} boutique${plan.max_shops > 1 ? "s" : ""}`,
    plan.has_unlimited_users ? `${ul} utilisateurs` : `${plan.max_users} utilisateur${plan.max_users > 1 ? "s" : ""}`,
    plan.has_unlimited_products ? `${ul} produits` : `${plan.max_products} produit${plan.max_products > 1 ? "s" : ""}`,
    plan.max_depots === 0 ? "Sans dépôt" : plan.has_unlimited_depots ? `${ul} dépôts` : `${plan.max_depots} dépôt${plan.max_depots > 1 ? "s" : ""}`,
    "Ventes & caisse",
    "Gestion des achats",
    "Rapports & statistiques"
  ];
  const handleSubmit = (e) => {
    e.preventDefault();
    setData("billing_cycle", billingCycle);
    post(`/plans/${plan.id}/process`);
  };
  if (plan.price === 0) {
    return /* @__PURE__ */ jsxs(Authenticated, { header: /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-white", children: "Activer le plan gratuit" }), children: [
      /* @__PURE__ */ jsx(Head_default, { title: "Plan gratuit" }),
      /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-md space-y-6", children: [
        /* @__PURE__ */ jsxs(Link_default, { href: "/plans", className: "inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition", children: [
          /* @__PURE__ */ jsx(ArrowLeft, { className: "size-4" }),
          " Retour aux plans"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-8 text-center space-y-4", children: [
          /* @__PURE__ */ jsx("div", { className: "mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/20", children: /* @__PURE__ */ jsx(Check, { className: "size-7 text-emerald-400" }) }),
          /* @__PURE__ */ jsxs("h2", { className: "text-xl font-bold text-white", children: [
            "Plan ",
            plan.name
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-400", children: "Aucun paiement requis. Activez votre plan immédiatement." }),
          /* @__PURE__ */ jsxs("form", { method: "POST", action: `/plans/${plan.id}/process`, children: [
            /* @__PURE__ */ jsx("input", { type: "hidden", name: "_token", value: document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") ?? "" }),
            /* @__PURE__ */ jsx("input", { type: "hidden", name: "payment_method", value: "wave" }),
            /* @__PURE__ */ jsx("input", { type: "hidden", name: "billing_cycle", value: "monthly" }),
            /* @__PURE__ */ jsx("button", { type: "submit", className: "w-full rounded-xl bg-amber-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-amber-200", children: "Activer gratuitement" })
          ] })
        ] })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs(Authenticated, { header: /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-white", children: "Paiement" }), children: [
    /* @__PURE__ */ jsx(Head_default, { title: `Paiement — ${plan.name}` }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-5xl space-y-6", children: [
      /* @__PURE__ */ jsxs(Link_default, { href: "/plans", className: "inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "size-4" }),
        " Retour aux plans"
      ] }),
      currentPlan && currentPlan.slug !== plan.slug && /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 rounded-xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm text-amber-200", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { className: "mt-0.5 size-4 shrink-0" }),
        /* @__PURE__ */ jsxs("span", { children: [
          "Vous passez du plan ",
          /* @__PURE__ */ jsx("strong", { children: currentPlan.name }),
          " au plan ",
          /* @__PURE__ */ jsx("strong", { children: plan.name }),
          ". Votre abonnement actuel sera remplacé après confirmation du paiement."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-5", children: [
        /* @__PURE__ */ jsxs("aside", { className: "lg:col-span-2 space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-widest text-amber-200", children: "Plan sélectionné" }),
              /* @__PURE__ */ jsx("h3", { className: "mt-1 text-2xl font-bold text-white", children: plan.name }),
              plan.description && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-400", children: plan.description })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-slate-400 uppercase tracking-wide", children: "Cycle de facturation" }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => {
                      setBillingCycle("monthly");
                      setData("billing_cycle", "monthly");
                    },
                    className: `flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition ${billingCycle === "monthly" ? "border-amber-300 bg-amber-300/10 text-amber-200" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"}`,
                    children: "Mensuel"
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => {
                      setBillingCycle("yearly");
                      setData("billing_cycle", "yearly");
                    },
                    className: `flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition ${billingCycle === "yearly" ? "border-amber-300 bg-amber-300/10 text-amber-200" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"}`,
                    children: [
                      "Annuel ",
                      /* @__PURE__ */ jsx("span", { className: "text-xs text-emerald-400", children: "−15%" })
                    ]
                  }
                )
              ] }),
              billingCycle === "yearly" && /* @__PURE__ */ jsxs("p", { className: "text-xs text-emerald-400", children: [
                "Économie de ",
                formatPrice(saving),
                " ",
                currencyLabel,
                "/an"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-white/10 bg-white/5 p-4 space-y-1", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxs("span", { className: "text-sm text-slate-400", children: [
                  "Montant ",
                  billingCycle === "yearly" ? "(annuel)" : "(mensuel)"
                ] }),
                /* @__PURE__ */ jsxs("span", { className: "text-lg font-bold text-white", children: [
                  formatPrice(displayPrice),
                  " ",
                  currencyLabel
                ] })
              ] }),
              billingCycle === "yearly" && /* @__PURE__ */ jsxs("p", { className: "text-xs text-right text-slate-500 line-through", children: [
                formatPrice(basePrice * 12),
                " ",
                currencyLabel
              ] })
            ] }),
            /* @__PURE__ */ jsx("ul", { className: "space-y-2 text-sm text-slate-300", children: features.map((f) => /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Check, { className: "size-4 shrink-0 text-emerald-400" }),
              f
            ] }, f)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-400", children: [
            /* @__PURE__ */ jsx(ShieldCheck, { className: "size-4 text-emerald-400 shrink-0" }),
            "Paiement sécurisé. Votre abonnement est activé après vérification manuelle dans quelques secondes."
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "lg:col-span-3", children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6", children: [
          /* @__PURE__ */ jsxs("h3", { className: "text-lg font-semibold text-white flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(CreditCard, { className: "size-5 text-amber-200" }),
            "Mode de paiement"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-3 sm:grid-cols-4", children: PAYMENT_METHODS.map((method) => /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => setData("payment_method", method.id),
              className: `flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-medium transition ${data.payment_method === method.id ? "border-amber-300 bg-amber-300/10 text-amber-200" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"}`,
              children: [
                /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: method.logo,
                    alt: method.label,
                    className: "h-8 w-auto object-contain"
                  }
                ),
                method.label
              ]
            },
            method.id
          )) }),
          errors.payment_method && /* @__PURE__ */ jsx("p", { className: "text-xs text-red-400", children: errors.payment_method }),
          selectedMethod && /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-blue-400/20 bg-blue-400/10 p-4 text-sm text-blue-200 space-y-2", children: [
            /* @__PURE__ */ jsxs("p", { className: "font-semibold flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Smartphone, { className: "size-4" }),
              "Instructions de paiement"
            ] }),
            paymentNumbers[selectedMethod.id] ? /* @__PURE__ */ jsxs("p", { children: [
              needsPhone ? "Envoyez au" : "Coordonnées",
              " :",
              " ",
              /* @__PURE__ */ jsx("strong", { className: "text-white", children: paymentNumbers[selectedMethod.id] })
            ] }) : /* @__PURE__ */ jsx("p", { className: "text-amber-200", children: "Contactez le support pour obtenir les coordonnées de paiement." }),
            /* @__PURE__ */ jsxs("p", { children: [
              "Montant : ",
              /* @__PURE__ */ jsxs("strong", { className: "text-white", children: [
                formatPrice(displayPrice),
                " ",
                currencyLabel
              ] })
            ] }),
            /* @__PURE__ */ jsxs("p", { children: [
              "Référence à indiquer : ",
              /* @__PURE__ */ jsxs("strong", { className: "text-white", children: [
                "BTX-",
                plan.id,
                "-",
                Date.now().toString().slice(-6)
              ] })
            ] })
          ] }),
          needsPhone && /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium text-slate-300", children: [
              "Numéro de téléphone utilisé ",
              /* @__PURE__ */ jsx("span", { className: "text-red-400", children: "*" })
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "tel",
                value: data.phone,
                onChange: (e) => setData("phone", e.target.value),
                placeholder: "ex: +221 77 000 00 00",
                className: "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-300/50 focus:outline-none focus:ring-1 focus:ring-amber-300/50"
              }
            ),
            errors.phone && /* @__PURE__ */ jsx("p", { className: "text-xs text-red-400", children: errors.phone })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium text-slate-300", children: [
              "Référence / ID de transaction",
              /* @__PURE__ */ jsx("span", { className: "ml-1 text-xs text-slate-500", children: "(facultatif mais recommandé)" })
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: data.transaction_ref,
                onChange: (e) => setData("transaction_ref", e.target.value),
                placeholder: "ex: TXN-123456789",
                className: "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-300/50 focus:outline-none focus:ring-1 focus:ring-amber-300/50"
              }
            ),
            errors.transaction_ref && /* @__PURE__ */ jsx("p", { className: "text-xs text-red-400", children: errors.transaction_ref })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              disabled: processing || !data.payment_method,
              className: "w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50",
              children: processing ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Loader2, { className: "size-4 animate-spin" }),
                " Traitement…"
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Building2, { className: "size-4" }),
                "Confirmer — ",
                formatPrice(displayPrice),
                " ",
                currencyLabel
              ] })
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "text-center text-xs text-slate-500", children: "En confirmant, vous acceptez nos conditions d'utilisation. L'abonnement sera activé après vérification dans quelques secondes." })
        ] }) })
      ] })
    ] })
  ] });
}
export {
  Checkout as default
};
