import { jsxs, jsx } from "react/jsx-runtime";
import { H as Head_default, L as Link_default } from "../ssr.js";
import { ArrowLeft, Check, ArrowRight } from "lucide-react";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import "@inertiajs/core";
import "react";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
function Index({ plans, auth }) {
  const currentPlanSlug = auth.user && "subscription" in auth ? auth.subscription?.plan_slug : null;
  const getPlanBadge = (planSlug) => {
    const badges = {
      free: "GRATUIT",
      starter: "DÉMARRAGE",
      growth: "CROISSANCE",
      scale: "ENTREPRISE"
    };
    return badges[planSlug] || "PLAN";
  };
  const getPlanFeatures = (plan) => {
    const ul = "Illimité";
    const shopsLabel = plan.has_unlimited_shops ? `${ul} boutiques` : `${plan.max_shops} boutique${plan.max_shops > 1 ? "s" : ""}`;
    const usersLabel = plan.has_unlimited_users ? `${ul} utilisateurs` : `${plan.max_users} utilisateur${plan.max_users > 1 ? "s" : ""}`;
    const productsLabel = plan.has_unlimited_products ? `${ul} produits` : `${plan.max_products} produit${plan.max_products > 1 ? "s" : ""}`;
    const depotsLabel = plan.max_depots === 0 ? "Sans dépôt" : plan.has_unlimited_depots ? `${ul} dépôts` : `${plan.max_depots} dépôt${plan.max_depots > 1 ? "s" : ""}`;
    return [
      shopsLabel,
      usersLabel,
      productsLabel,
      depotsLabel,
      "Ventes & caisse",
      "Gestion des achats",
      "Rapports & statistiques"
    ];
  };
  const isCurrentPlan = (planSlug) => {
    return currentPlanSlug === planSlug;
  };
  const isHighlighted = (planSlug) => {
    return planSlug === "growth";
  };
  return /* @__PURE__ */ jsxs(
    Authenticated,
    {
      header: /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-white", children: "Choisir un Plan" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-300", children: "Sélectionnez le plan qui correspond le mieux à vos besoins" })
      ] }),
      children: [
        /* @__PURE__ */ jsx(Head_default, { title: "Choisir un Plan" }),
        /* @__PURE__ */ jsxs("section", { className: "space-y-8", children: [
          /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxs(
            Link_default,
            {
              href: "/dashboard",
              className: "inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white transition",
              children: [
                /* @__PURE__ */ jsx(ArrowLeft, { className: "size-4" }),
                "Retour au dashboard"
              ]
            }
          ) }),
          /* @__PURE__ */ jsx("div", { className: "grid gap-4 lg:grid-cols-3", children: plans.map((plan) => {
            const features = getPlanFeatures(plan);
            const isCurrent = isCurrentPlan(plan.slug);
            const highlighted = isHighlighted(plan.slug);
            return /* @__PURE__ */ jsxs(
              "article",
              {
                className: `rounded-2xl border p-6 transition hover:-translate-y-1 ${highlighted ? "border-amber-300 bg-amber-300/10" : "border-white/10 bg-white/5"}`,
                children: [
                  /* @__PURE__ */ jsxs("p", { className: "text-sm font-semibold text-amber-200", children: [
                    getPlanBadge(plan.slug),
                    isCurrent && " • ACTUEL"
                  ] }),
                  /* @__PURE__ */ jsx("h3", { className: "mt-2 text-2xl font-bold text-white", children: plan.name }),
                  /* @__PURE__ */ jsx("div", { className: "mt-3 space-y-1", children: /* @__PURE__ */ jsx("p", { className: "text-3xl font-bold text-white", children: plan.price_eur }) }),
                  /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs text-slate-400", children: "par mois" }),
                  /* @__PURE__ */ jsx("ul", { className: "mt-5 space-y-3 text-sm text-slate-200", children: features.map((feature, index) => /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(Check, { className: "size-4 text-emerald-300 flex-shrink-0" }),
                    feature
                  ] }, index)) }),
                  /* @__PURE__ */ jsx("div", { className: "mt-6", children: isCurrent ? /* @__PURE__ */ jsx(
                    "button",
                    {
                      disabled: true,
                      className: "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-400 cursor-not-allowed",
                      children: "Plan actuel"
                    }
                  ) : /* @__PURE__ */ jsxs(
                    "a",
                    {
                      href: `/plans/${plan.id}/checkout`,
                      className: "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200",
                      children: [
                        plan.slug === "free" ? "Commencer" : "Choisir ce plan",
                        /* @__PURE__ */ jsx(ArrowRight, { className: "size-4" })
                      ]
                    }
                  ) })
                ]
              },
              plan.id
            );
          }) }),
          /* @__PURE__ */ jsxs("section", { className: "rounded-3xl border border-white/10 bg-gradient-to-r from-amber-300/20 via-orange-300/15 to-cyan-300/20 p-8 text-center backdrop-blur-xl", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-white", children: "Besoin d'aide pour choisir ?" }),
            /* @__PURE__ */ jsx("p", { className: "mx-auto mt-3 max-w-2xl text-slate-200", children: "Contactez notre équipe commerciale pour discuter de vos besoins spécifiques et obtenir des conseils personnalisés." }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-wrap items-center justify-center gap-4", children: [
              /* @__PURE__ */ jsxs(
                "a",
                {
                  href: "mailto:support@batixpro.com",
                  className: "inline-flex items-center gap-2 rounded-xl bg-amber-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-amber-200",
                  children: [
                    "Contacter le support",
                    /* @__PURE__ */ jsx(ArrowRight, { className: "size-4" })
                  ]
                }
              ),
              /* @__PURE__ */ jsx(
                Link_default,
                {
                  href: "/#faq",
                  className: "inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10",
                  children: "Voir la FAQ"
                }
              )
            ] })
          ] })
        ] })
      ]
    }
  );
}
export {
  Index as default
};
