import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { H as Head_default, L as Link_default, r as router3 } from "../ssr.js";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { T as Table, b as TableBadge, c as TableActions, d as TableActionButton } from "./Table-Cvz7wd2g.js";
import { Search, Edit, CheckCircle, RotateCw, XCircle } from "lucide-react";
import { C as Currency } from "./Currency-BX_NSrIs.js";
import { C as ConfirmDeleteModal } from "./ConfirmDeleteModal-GTROztIR.js";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
import "./Modal-BeSeEOS3.js";
import "@headlessui/react";
function Index({ subscriptions, plans, filters }) {
  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showEditDatesModal, setShowEditDatesModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [renewMonths, setRenewMonths] = useState(1);
  const [editDates, setEditDates] = useState({
    started_at: "",
    expires_at: ""
  });
  const handleSearch = (e) => {
    e.preventDefault();
    router3.get(
      route("platform.active-subscriptions"),
      { search: searchTerm, status: filters.status, plan_id: filters.plan_id },
      { preserveState: true }
    );
  };
  const handleStatusFilter = (status) => {
    router3.get(
      route("platform.active-subscriptions"),
      { search: filters.search, status: status || void 0, plan_id: filters.plan_id },
      { preserveState: true }
    );
  };
  const handlePlanFilter = (planId) => {
    router3.get(
      route("platform.active-subscriptions"),
      { search: filters.search, status: filters.status, plan_id: planId || void 0 },
      { preserveState: true }
    );
  };
  const confirmCancel = (subscription) => {
    setSelectedSubscription(subscription);
    setShowCancelModal(true);
  };
  const handleCancel = () => {
    if (selectedSubscription) {
      router3.post(
        route("platform.active-subscriptions.cancel", selectedSubscription.id),
        {},
        {
          preserveScroll: true,
          onSuccess: () => {
            setShowCancelModal(false);
            setSelectedSubscription(null);
          }
        }
      );
    }
  };
  const confirmRenew = (subscription) => {
    setSelectedSubscription(subscription);
    setRenewMonths(1);
    setShowRenewModal(true);
  };
  const handleRenew = () => {
    if (selectedSubscription) {
      router3.post(
        route("platform.active-subscriptions.renew", selectedSubscription.id),
        { months: renewMonths },
        {
          preserveScroll: true,
          onSuccess: () => {
            setShowRenewModal(false);
            setSelectedSubscription(null);
          }
        }
      );
    }
  };
  const confirmEditDates = (subscription) => {
    setSelectedSubscription(subscription);
    setEditDates({
      started_at: subscription.started_at.split("T")[0],
      expires_at: subscription.expires_at ? subscription.expires_at.split("T")[0] : ""
    });
    setShowEditDatesModal(true);
  };
  const handleEditDates = () => {
    if (selectedSubscription) {
      router3.post(
        route("platform.active-subscriptions.update-dates", selectedSubscription.id),
        editDates,
        {
          preserveScroll: true,
          onSuccess: () => {
            setShowEditDatesModal(false);
            setSelectedSubscription(null);
          }
        }
      );
    }
  };
  const confirmActivate = (subscription) => {
    setSelectedSubscription(subscription);
    setShowActivateModal(true);
  };
  const handleActivate = () => {
    if (selectedSubscription) {
      router3.post(
        route("platform.active-subscriptions.activate", selectedSubscription.id),
        {},
        {
          preserveScroll: true,
          onSuccess: () => {
            setShowActivateModal(false);
            setSelectedSubscription(null);
          }
        }
      );
    }
  };
  const getStatusVariant = (status) => {
    switch (status) {
      case "active":
        return "success";
      case "trial":
      case "pending":
        return "warning";
      case "cancelled":
      case "expired":
        return "danger";
      default:
        return "default";
    }
  };
  const getStatusLabel = (status) => {
    const labels = {
      active: "Actif",
      trial: "Essai",
      pending: "En attente",
      cancelled: "Annulé",
      expired: "Expiré"
    };
    return labels[status] || status;
  };
  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };
  return /* @__PURE__ */ jsxs(
    Authenticated,
    {
      header: /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-white", children: "Abonnements Actifs" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400 mt-1", children: "Gérer tous les abonnements des comptes" })
      ] }),
      children: [
        /* @__PURE__ */ jsx(Head_default, { title: "Abonnements Actifs" }),
        /* @__PURE__ */ jsxs("section", { className: "space-y-4", children: [
          /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-4", children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSearch, className: "flex flex-col md:flex-row gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex-1 relative", children: [
              /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: searchTerm,
                  onChange: (e) => setSearchTerm(e.target.value),
                  placeholder: "Rechercher par nom ou email...",
                  className: "pl-10 w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-slate-200"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: filters.status || "",
                onChange: (e) => handleStatusFilter(e.target.value),
                className: "rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-slate-200",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "", children: "Tous les statuts" }),
                  /* @__PURE__ */ jsx("option", { value: "active", children: "Actif" }),
                  /* @__PURE__ */ jsx("option", { value: "trial", children: "Essai" }),
                  /* @__PURE__ */ jsx("option", { value: "pending", children: "En attente" }),
                  /* @__PURE__ */ jsx("option", { value: "cancelled", children: "Annulé" }),
                  /* @__PURE__ */ jsx("option", { value: "expired", children: "Expiré" })
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: filters.plan_id || "",
                onChange: (e) => handlePlanFilter(e.target.value),
                className: "rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-slate-200",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "", children: "Tous les plans" }),
                  plans.map((plan) => /* @__PURE__ */ jsx("option", { value: plan.id, children: plan.name }, plan.id))
                ]
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "submit",
                className: "rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200",
                children: "Rechercher"
              }
            )
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-300", children: [
            subscriptions.total,
            " abonnement",
            subscriptions.total > 1 ? "s" : ""
          ] }) }),
          /* @__PURE__ */ jsx(
            Table,
            {
              data: subscriptions.data,
              columns: [
                {
                  key: "user",
                  label: "Compte",
                  render: (subscription) => /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
                    /* @__PURE__ */ jsx("span", { className: "font-medium text-white", children: subscription.user.name }),
                    /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400", children: subscription.user.email }),
                    /* @__PURE__ */ jsxs("span", { className: "text-xs text-slate-500", children: [
                      "Code: ",
                      subscription.user.code_user
                    ] })
                  ] })
                },
                {
                  key: "plan",
                  label: "Plan",
                  render: (subscription) => /* @__PURE__ */ jsx("span", { className: "text-slate-300", children: subscription.plan.name })
                },
                {
                  key: "amount",
                  label: "Montant",
                  align: "right",
                  render: (subscription) => /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-end", children: [
                    /* @__PURE__ */ jsx(Currency, { amount: subscription.amount, className: "font-semibold text-emerald-400" }),
                    /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400", children: subscription.billing_cycle })
                  ] })
                },
                {
                  key: "dates",
                  label: "Dates",
                  render: (subscription) => /* @__PURE__ */ jsxs("div", { className: "flex flex-col text-xs", children: [
                    /* @__PURE__ */ jsxs("span", { className: "text-slate-300", children: [
                      "Début: ",
                      formatDate(subscription.started_at)
                    ] }),
                    subscription.expires_at && /* @__PURE__ */ jsxs("span", { className: "text-slate-400", children: [
                      "Expire: ",
                      formatDate(subscription.expires_at)
                    ] }),
                    subscription.cancelled_at && /* @__PURE__ */ jsxs("span", { className: "text-red-400", children: [
                      "Annulé: ",
                      formatDate(subscription.cancelled_at)
                    ] })
                  ] })
                },
                {
                  key: "status",
                  label: "Statut",
                  align: "center",
                  render: (subscription) => /* @__PURE__ */ jsx(TableBadge, { variant: getStatusVariant(subscription.status), children: getStatusLabel(subscription.status) })
                },
                {
                  key: "actions",
                  label: "Actions",
                  align: "right",
                  render: (subscription) => /* @__PURE__ */ jsxs(TableActions, { children: [
                    /* @__PURE__ */ jsxs(
                      "button",
                      {
                        onClick: () => confirmEditDates(subscription),
                        className: "inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/10",
                        children: [
                          /* @__PURE__ */ jsx(Edit, { className: "size-3.5" }),
                          " Dates"
                        ]
                      }
                    ),
                    subscription.status === "pending" && /* @__PURE__ */ jsxs(
                      TableActionButton,
                      {
                        variant: "success",
                        onClick: () => confirmActivate(subscription),
                        children: [
                          /* @__PURE__ */ jsx(CheckCircle, { className: "size-3.5" }),
                          " Activer"
                        ]
                      }
                    ),
                    subscription.status === "active" && /* @__PURE__ */ jsxs(Fragment, { children: [
                      /* @__PURE__ */ jsxs(
                        "button",
                        {
                          onClick: () => confirmRenew(subscription),
                          className: "inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/10",
                          children: [
                            /* @__PURE__ */ jsx(RotateCw, { className: "size-3.5" }),
                            " Renouveler"
                          ]
                        }
                      ),
                      /* @__PURE__ */ jsxs(
                        TableActionButton,
                        {
                          variant: "danger",
                          onClick: () => confirmCancel(subscription),
                          children: [
                            /* @__PURE__ */ jsx(XCircle, { className: "size-3.5" }),
                            " Annuler"
                          ]
                        }
                      )
                    ] }),
                    subscription.status === "expired" && /* @__PURE__ */ jsxs(
                      "button",
                      {
                        onClick: () => confirmRenew(subscription),
                        className: "inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/10",
                        children: [
                          /* @__PURE__ */ jsx(RotateCw, { className: "size-3.5" }),
                          " Réactiver"
                        ]
                      }
                    )
                  ] })
                }
              ],
              emptyMessage: "Aucun abonnement trouvé"
            }
          ),
          subscriptions.links && /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center gap-1", children: subscriptions.links.map((link, index) => /* @__PURE__ */ jsx(
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
            show: showCancelModal,
            title: "Annuler l'abonnement",
            message: `Êtes-vous sûr de vouloir annuler l'abonnement de "${selectedSubscription?.user.name}" au plan "${selectedSubscription?.plan.name}" ?`,
            onConfirm: handleCancel,
            onClose: () => {
              setShowCancelModal(false);
              setSelectedSubscription(null);
            }
          }
        ),
        /* @__PURE__ */ jsx(
          ConfirmDeleteModal,
          {
            show: showActivateModal,
            title: "Activer l'abonnement",
            message: `Confirmer l'activation de l'abonnement de "${selectedSubscription?.user.name}" au plan "${selectedSubscription?.plan.name}" ?`,
            onConfirm: handleActivate,
            onClose: () => {
              setShowActivateModal(false);
              setSelectedSubscription(null);
            }
          }
        ),
        showRenewModal && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "Renouveler l'abonnement" }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-400 mb-4", children: [
            "Compte: ",
            selectedSubscription?.user.name,
            /* @__PURE__ */ jsx("br", {}),
            "Plan: ",
            selectedSubscription?.plan.name
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "block space-y-1 text-sm text-slate-200 mb-4", children: [
            /* @__PURE__ */ jsx("span", { children: "Nombre de mois" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                min: "1",
                max: "12",
                value: renewMonths,
                onChange: (e) => setRenewMonths(parseInt(e.target.value)),
                className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  setShowRenewModal(false);
                  setSelectedSubscription(null);
                },
                className: "rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/10",
                children: "Annuler"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: handleRenew,
                className: "rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200",
                children: "Renouveler"
              }
            )
          ] })
        ] }) }),
        showEditDatesModal && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "Modifier les dates d'abonnement" }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-400 mb-4", children: [
            "Compte: ",
            selectedSubscription?.user.name,
            /* @__PURE__ */ jsx("br", {}),
            "Plan: ",
            selectedSubscription?.plan.name
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4 mb-4", children: [
            /* @__PURE__ */ jsxs("label", { className: "block space-y-1 text-sm text-slate-200", children: [
              /* @__PURE__ */ jsx("span", { children: "Date de début" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "date",
                  value: editDates.started_at,
                  onChange: (e) => setEditDates({ ...editDates, started_at: e.target.value }),
                  className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "block space-y-1 text-sm text-slate-200", children: [
              /* @__PURE__ */ jsx("span", { children: "Date d'expiration" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "date",
                  value: editDates.expires_at,
                  onChange: (e) => setEditDates({ ...editDates, expires_at: e.target.value }),
                  className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200"
                }
              ),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "Laisser vide pour aucune expiration" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  setShowEditDatesModal(false);
                  setSelectedSubscription(null);
                },
                className: "rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/10",
                children: "Annuler"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: handleEditDates,
                className: "rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200",
                children: "Enregistrer"
              }
            )
          ] })
        ] }) })
      ]
    }
  );
}
export {
  Index as default
};
