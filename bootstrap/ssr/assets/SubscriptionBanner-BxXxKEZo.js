import { jsx, jsxs } from "react/jsx-runtime";
import { a as usePage } from "../ssr.js";
import { AlertCircle, Check, X } from "lucide-react";
function SubscriptionBanner({ type, className = "" }) {
  const { subscription } = usePage().props;
  if (!subscription || !subscription.has_subscription) {
    return /* @__PURE__ */ jsx("div", { className: `rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 ${className}`, children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
      /* @__PURE__ */ jsx(AlertCircle, { className: "size-5 text-rose-400" }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-semibold text-rose-200", children: "Aucun abonnement actif" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-rose-300", children: "Vous devez avoir un abonnement actif pour créer des boutiques et des utilisateurs." })
      ] })
    ] }) });
  }
  const renderShopsLimit = () => {
    if (subscription.unlimited_shops) {
      return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-emerald-400", children: [
        /* @__PURE__ */ jsx(Check, { className: "size-4" }),
        /* @__PURE__ */ jsx("span", { children: "Boutiques illimitées" })
      ] });
    }
    const isNearLimit = subscription.remaining_shops <= 1 && subscription.remaining_shops > 0;
    const isAtLimit = subscription.remaining_shops === 0;
    return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm", children: [
      isAtLimit ? /* @__PURE__ */ jsx(X, { className: "size-4 text-rose-400" }) : /* @__PURE__ */ jsx(Check, { className: "size-4 text-emerald-400" }),
      /* @__PURE__ */ jsxs("span", { className: isAtLimit ? "text-rose-300" : isNearLimit ? "text-amber-300" : "text-slate-300", children: [
        subscription.current_shops,
        " / ",
        subscription.max_shops,
        " boutiques utilisées",
        subscription.remaining_shops > 0 && ` (${subscription.remaining_shops} restante${subscription.remaining_shops > 1 ? "s" : ""})`
      ] })
    ] });
  };
  const renderUsersLimit = () => {
    if (subscription.unlimited_users) {
      return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-emerald-400", children: [
        /* @__PURE__ */ jsx(Check, { className: "size-4" }),
        /* @__PURE__ */ jsx("span", { children: "Utilisateurs illimités" })
      ] });
    }
    const isNearLimit = subscription.remaining_users <= 2 && subscription.remaining_users > 0;
    const isAtLimit = subscription.remaining_users === 0;
    return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm", children: [
      isAtLimit ? /* @__PURE__ */ jsx(X, { className: "size-4 text-rose-400" }) : /* @__PURE__ */ jsx(Check, { className: "size-4 text-emerald-400" }),
      /* @__PURE__ */ jsxs("span", { className: isAtLimit ? "text-rose-300" : isNearLimit ? "text-amber-300" : "text-slate-300", children: [
        subscription.current_users,
        " / ",
        subscription.max_users,
        " utilisateurs",
        subscription.remaining_users > 0 && ` (${subscription.remaining_users} restant${subscription.remaining_users > 1 ? "s" : ""})`
      ] })
    ] });
  };
  const showWarning = type === "shops" && !subscription.can_create_shop || type === "users" && !subscription.can_create_user;
  if (!showWarning && type) {
    return null;
  }
  return /* @__PURE__ */ jsx("div", { className: `rounded-xl border border-white/10 bg-white/5 p-4 ${className}`, children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
    /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-amber-500/20 p-2", children: /* @__PURE__ */ jsx(AlertCircle, { className: "size-4 text-amber-300" }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("h3", { className: "font-semibold text-white", children: [
          "Plan ",
          subscription.plan_name
        ] }),
        /* @__PURE__ */ jsx("span", { className: `rounded-full px-2 py-0.5 text-xs font-medium ${subscription.status === "active" ? "bg-emerald-500/20 text-emerald-300" : subscription.status === "trial" ? "bg-blue-500/20 text-blue-300" : "bg-slate-500/20 text-slate-300"}`, children: subscription.status === "active" ? "Actif" : subscription.status === "trial" ? "Essai" : subscription.status })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-3 space-y-2", children: [
        (!type || type === "shops") && renderShopsLimit(),
        (!type || type === "users") && renderUsersLimit()
      ] }),
      showWarning && /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-amber-300", children: type === "shops" ? "Limite de boutiques atteinte. Veuillez mettre à niveau votre abonnement." : "Limite d'utilisateurs atteinte. Veuillez mettre à niveau votre abonnement." })
    ] })
  ] }) });
}
function useSubscriptionLimits() {
  const { subscription } = usePage().props;
  return subscription;
}
export {
  SubscriptionBanner as S,
  useSubscriptionLimits as u
};
