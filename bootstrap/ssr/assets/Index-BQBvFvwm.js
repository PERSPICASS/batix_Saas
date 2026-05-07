import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { H as Head_default, L as Link_default, r as router3 } from "../ssr.js";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { T as Table, b as TableBadge, c as TableActions, d as TableActionButton } from "./Table-Cvz7wd2g.js";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { C as ConfirmDeleteModal } from "./ConfirmDeleteModal-GTROztIR.js";
import { C as Currency } from "./Currency-BX_NSrIs.js";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
import "./Modal-BeSeEOS3.js";
import "@headlessui/react";
function Index({ plans }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);
  const togglePlanStatus = (plan) => {
    router3.post(route("platform.subscriptions.toggle", plan.id), {}, {
      preserveScroll: true
    });
  };
  const confirmDelete = (plan) => {
    if (plan.subscriptions_count > 0) {
      alert("Impossible de supprimer un plan avec des abonnements actifs.");
      return;
    }
    setPlanToDelete(plan);
    setShowDeleteModal(true);
  };
  const handleDelete = () => {
    if (planToDelete) {
      router3.delete(route("platform.subscriptions.destroy", planToDelete.id), {
        preserveScroll: true,
        onSuccess: () => {
          setShowDeleteModal(false);
          setPlanToDelete(null);
        }
      });
    }
  };
  return /* @__PURE__ */ jsxs(
    Authenticated,
    {
      header: /* @__PURE__ */ jsx("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4", children: /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-white", children: "Plans d'Abonnement" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400 mt-1", children: "Gérer les plans et leurs fonctionnalités" })
      ] }) }),
      children: [
        /* @__PURE__ */ jsx(Head_default, { title: "Plans d'Abonnement" }),
        /* @__PURE__ */ jsxs("section", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-300", children: [
              plans.total,
              " plan",
              plans.total > 1 ? "s" : ""
            ] }),
            /* @__PURE__ */ jsxs(
              Link_default,
              {
                href: route("platform.subscriptions.create"),
                className: "inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200",
                children: [
                  /* @__PURE__ */ jsx(Plus, { className: "size-4" }),
                  " Nouveau plan"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsx(
            Table,
            {
              data: plans.data,
              columns: [
                {
                  key: "name",
                  label: "Plan",
                  render: (plan) => /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
                    /* @__PURE__ */ jsx("span", { className: "font-medium text-white", children: plan.name }),
                    plan.description && /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400 mt-0.5", children: plan.description })
                  ] })
                },
                {
                  key: "price",
                  label: "Prix",
                  align: "right",
                  render: (plan) => /* @__PURE__ */ jsx(Currency, { amount: plan.price, className: "font-semibold text-emerald-400" })
                },
                {
                  key: "limits",
                  label: "Limites",
                  render: (plan) => /* @__PURE__ */ jsxs("div", { className: "flex flex-col text-sm", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-slate-300", children: plan.shop_limit_text }),
                    /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400", children: plan.max_users === -1 ? "Utilisateurs illimités" : `${plan.max_users} utilisateurs` })
                  ] })
                },
                {
                  key: "subscriptions_count",
                  label: "Abonnements",
                  align: "center",
                  render: (plan) => /* @__PURE__ */ jsx("span", { className: "text-slate-300", children: plan.subscriptions_count })
                },
                {
                  key: "is_active",
                  label: "Statut",
                  align: "center",
                  render: (plan) => /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => togglePlanStatus(plan),
                      className: "inline-block",
                      children: /* @__PURE__ */ jsx(TableBadge, { variant: plan.is_active ? "success" : "danger", children: plan.is_active ? "Actif" : "Inactif" })
                    }
                  )
                },
                {
                  key: "actions",
                  label: "Actions",
                  align: "right",
                  render: (plan) => /* @__PURE__ */ jsxs(TableActions, { children: [
                    /* @__PURE__ */ jsxs(
                      Link_default,
                      {
                        href: route("platform.subscriptions.edit", plan.id),
                        className: "inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/10",
                        children: [
                          /* @__PURE__ */ jsx(Pencil, { className: "size-3.5" }),
                          " Modifier"
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxs(
                      TableActionButton,
                      {
                        variant: "danger",
                        onClick: () => confirmDelete(plan),
                        children: [
                          /* @__PURE__ */ jsx(Trash2, { className: "size-3.5" }),
                          " Supprimer"
                        ]
                      }
                    )
                  ] })
                }
              ],
              emptyMessage: "Aucun plan d'abonnement trouvé"
            }
          ),
          plans.links && /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center gap-1", children: plans.links.map((link, index) => /* @__PURE__ */ jsx(
            Link_default,
            {
              href: link.url || "#",
              preserveState: true,
              className: `rounded-lg px-3 py-2 text-sm ${link.active ? "bg-amber-300 text-slate-950 font-semibold" : "border border-white/15 text-slate-200 hover:bg-white/10"} ${!link.url ? "opacity-50 cursor-not-allowed" : ""}`,
              dangerouslySetInnerHTML: { __html: link.label }
            },
            index
          )) })
        ] }),
        /* @__PURE__ */ jsx(
          ConfirmDeleteModal,
          {
            show: showDeleteModal,
            title: "Supprimer le plan",
            message: `Êtes-vous sûr de vouloir supprimer le plan "${planToDelete?.name}" ? Cette action est irréversible.`,
            onConfirm: handleDelete,
            onClose: () => {
              setShowDeleteModal(false);
              setPlanToDelete(null);
            }
          }
        )
      ]
    }
  );
}
export {
  Index as default
};
