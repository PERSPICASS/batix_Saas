import { jsxs, jsx } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { H as Head_default, L as Link_default } from "../ssr.js";
import { CheckCircle2, Clock, Mail, ArrowRight } from "lucide-react";
import "react";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
function Confirmation({ planName, message }) {
  return /* @__PURE__ */ jsxs(Authenticated, { header: /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-white", children: "Confirmation" }), children: [
    /* @__PURE__ */ jsx(Head_default, { title: "Paiement soumis" }),
    /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-lg", children: /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-10 text-center space-y-6", children: [
      /* @__PURE__ */ jsx("div", { className: "mx-auto flex size-16 items-center justify-center rounded-full bg-amber-300/20", children: /* @__PURE__ */ jsx(CheckCircle2, { className: "size-9 text-amber-300" }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-white", children: "Demande enregistrée !" }),
        /* @__PURE__ */ jsxs("p", { className: "mt-2 text-slate-400", children: [
          "Votre demande d'abonnement au plan ",
          /* @__PURE__ */ jsx("strong", { className: "text-white", children: planName }),
          " a bien été reçue."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-white/10 bg-white/5 p-5 text-left space-y-4", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-widest text-amber-200", children: "Prochaines étapes" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-300/20 text-xs font-bold text-amber-300", children: "1" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-white", children: "Effectuez le paiement" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "Envoyez le montant via le mode de paiement choisi avec la référence indiquée." })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-300/20 text-xs font-bold text-amber-300", children: "2" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-white", children: "Vérification sous 24h" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "Notre équipe vérifie votre paiement et active votre abonnement." })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-xs font-bold text-emerald-400", children: "3" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-white", children: "Abonnement activé" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "Vous recevrez une confirmation et aurez accès à toutes les fonctionnalités du plan." })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2 text-sm text-slate-400", children: [
        /* @__PURE__ */ jsx(Clock, { className: "size-4 text-amber-200" }),
        "Activation sous 24h ouvrées"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2 text-sm text-slate-400", children: [
        /* @__PURE__ */ jsx(Mail, { className: "size-4 text-slate-500" }),
        "Une question ? ",
        /* @__PURE__ */ jsx("a", { href: "mailto:support@batixpro.com", className: "text-amber-200 hover:underline", children: "support@batixpro.com" })
      ] }),
      /* @__PURE__ */ jsxs(
        Link_default,
        {
          href: "/dashboard",
          className: "inline-flex items-center gap-2 rounded-xl bg-amber-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-amber-200",
          children: [
            "Retour au dashboard",
            /* @__PURE__ */ jsx(ArrowRight, { className: "size-4" })
          ]
        }
      )
    ] }) })
  ] });
}
export {
  Confirmation as default
};
