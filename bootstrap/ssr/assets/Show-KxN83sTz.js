import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { H as Head_default, L as Link_default, r as router3 } from "../ssr.js";
import { ArrowLeft, CheckCircle, Edit, Package, XCircle, Trash2, Building2, Calendar, DollarSign, FileText } from "lucide-react";
import { u as useRoute } from "./route-C2Ac8FMA.js";
import { useState } from "react";
import { M as Modal } from "./Modal-BeSeEOS3.js";
import { P as PrimaryButton } from "./PrimaryButton-DgVfVBwo.js";
import { I as InputLabel, T as TextInput } from "./TextInput-FO9W64oM.js";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
import "@headlessui/react";
function PurchasesShow({ code_user, purchase }) {
  const route = useRoute();
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [receivingQuantities, setReceivingQuantities] = useState(
    purchase.items.reduce((acc, item) => {
      acc[item.id] = item.quantity_ordered - item.quantity_received;
      return acc;
    }, {})
  );
  const [processing, setProcessing] = useState(false);
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  };
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: purchase.currency
    }).format(parseFloat(amount));
  };
  const getStatusBadge = () => {
    const statusConfig = {
      draft: { label: "Brouillon", color: "bg-slate-500/20 text-slate-300" },
      confirmed: { label: "Confirmé", color: "bg-blue-500/20 text-blue-300" },
      partial: { label: "Partiel", color: "bg-yellow-500/20 text-yellow-300" },
      received: { label: "Reçu", color: "bg-green-500/20 text-green-300" },
      cancelled: { label: "Annulé", color: "bg-red-500/20 text-red-300" }
    };
    const config = statusConfig[purchase.status];
    return /* @__PURE__ */ jsx("span", { className: `inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${config.color}`, children: config.label });
  };
  const handleConfirm = () => {
    setProcessing(true);
    router3.post(
      route("purchases.confirm", { code_user, purchase: purchase.id }),
      {},
      {
        onFinish: () => {
          setProcessing(false);
          setShowConfirmModal(false);
        }
      }
    );
  };
  const handleReceive = () => {
    setProcessing(true);
    const items = Object.entries(receivingQuantities).map(([id, quantity]) => ({
      id: parseInt(id),
      quantity
    }));
    router3.post(
      route("purchases.receive", { code_user, purchase: purchase.id }),
      { items },
      {
        onFinish: () => {
          setProcessing(false);
          setShowReceiveModal(false);
        }
      }
    );
  };
  const handleCancel = () => {
    setProcessing(true);
    router3.post(
      route("purchases.cancel", { code_user, purchase: purchase.id }),
      {},
      {
        onFinish: () => {
          setProcessing(false);
          setShowCancelModal(false);
        }
      }
    );
  };
  const handleDelete = () => {
    setProcessing(true);
    router3.delete(
      route("purchases.destroy", { code_user, purchase: purchase.id }),
      {
        onFinish: () => {
          setProcessing(false);
          setShowDeleteModal(false);
        }
      }
    );
  };
  const canReceive = purchase.status === "confirmed" || purchase.status === "partial";
  return /* @__PURE__ */ jsxs(Authenticated, { children: [
    /* @__PURE__ */ jsx(Head_default, { title: `Bon de commande ${purchase.reference}` }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsx(
            Link_default,
            {
              href: route("purchases.index", { code_user }),
              className: "rounded-lg p-2 transition hover:bg-white/5",
              children: /* @__PURE__ */ jsx(ArrowLeft, { className: "size-5 text-slate-400" })
            }
          ),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-white", children: purchase.reference }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-400", children: "Bon de commande fournisseur" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          getStatusBadge(),
          purchase.status === "draft" && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => setShowConfirmModal(true),
                className: "inline-flex items-center gap-2 rounded-lg bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/20",
                children: [
                  /* @__PURE__ */ jsx(CheckCircle, { className: "size-4" }),
                  "Confirmer"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              Link_default,
              {
                href: route("purchases.edit", { code_user, purchase: purchase.id }),
                className: "inline-flex items-center gap-2 rounded-lg bg-amber-300/10 px-4 py-2 text-sm font-semibold text-amber-300 transition hover:bg-amber-300/20",
                children: [
                  /* @__PURE__ */ jsx(Edit, { className: "size-4" }),
                  "Modifier"
                ]
              }
            )
          ] }),
          canReceive && /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setShowReceiveModal(true),
              className: "inline-flex items-center gap-2 rounded-lg bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-300 transition hover:bg-green-500/20",
              children: [
                /* @__PURE__ */ jsx(Package, { className: "size-4" }),
                "Réceptionner"
              ]
            }
          ),
          purchase.status !== "cancelled" && purchase.status !== "received" && /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setShowCancelModal(true),
              className: "inline-flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20",
              children: [
                /* @__PURE__ */ jsx(XCircle, { className: "size-4" }),
                "Annuler"
              ]
            }
          ),
          (purchase.status === "draft" || purchase.status === "cancelled") && /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setShowDeleteModal(true),
              className: "inline-flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20",
              children: [
                /* @__PURE__ */ jsx(Trash2, { className: "size-4" }),
                "Supprimer"
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-6 md:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-slate-800/50 p-6", children: [
          /* @__PURE__ */ jsxs("h2", { className: "mb-4 flex items-center gap-2 text-lg font-semibold text-white", children: [
            /* @__PURE__ */ jsx(Building2, { className: "size-5 text-amber-300" }),
            "Fournisseur"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-sm", children: [
            /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("span", { className: "font-semibold text-white", children: purchase.supplier.name }) }),
            purchase.supplier.company_name && /* @__PURE__ */ jsx("div", { className: "text-slate-400", children: purchase.supplier.company_name }),
            purchase.supplier.email && /* @__PURE__ */ jsxs("div", { className: "text-slate-300", children: [
              "📧 ",
              purchase.supplier.email
            ] }),
            purchase.supplier.phone && /* @__PURE__ */ jsxs("div", { className: "text-slate-300", children: [
              "📞 ",
              purchase.supplier.phone
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-slate-800/50 p-6", children: [
          /* @__PURE__ */ jsxs("h2", { className: "mb-4 flex items-center gap-2 text-lg font-semibold text-white", children: [
            /* @__PURE__ */ jsx(Calendar, { className: "size-5 text-amber-300" }),
            "Informations"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-3 text-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Date de commande:" }),
              /* @__PURE__ */ jsx("span", { className: "font-medium text-white", children: formatDate(purchase.order_date) })
            ] }),
            purchase.expected_date && /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Livraison prévue:" }),
              /* @__PURE__ */ jsx("span", { className: "font-medium text-white", children: formatDate(purchase.expected_date) })
            ] }),
            purchase.received_date && /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Date de réception:" }),
              /* @__PURE__ */ jsx("span", { className: "font-medium text-green-400", children: formatDate(purchase.received_date) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between border-t border-white/10 pt-3", children: [
              /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Créé par:" }),
              /* @__PURE__ */ jsx("span", { className: "font-medium text-white", children: purchase.user.name })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-slate-800/50 p-6", children: [
        /* @__PURE__ */ jsxs("h2", { className: "mb-4 flex items-center gap-2 text-lg font-semibold text-white", children: [
          /* @__PURE__ */ jsx(Package, { className: "size-5 text-amber-300" }),
          "Articles commandés"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsx("thead", { className: "border-b border-white/10 text-slate-300", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "pb-3 text-left font-medium", children: "Produit" }),
            /* @__PURE__ */ jsx("th", { className: "pb-3 text-center font-medium", children: "Commandé" }),
            /* @__PURE__ */ jsx("th", { className: "pb-3 text-center font-medium", children: "Reçu" }),
            /* @__PURE__ */ jsx("th", { className: "pb-3 text-right font-medium", children: "Prix unitaire" }),
            /* @__PURE__ */ jsx("th", { className: "pb-3 text-right font-medium", children: "Total" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-white/10", children: purchase.items.map((item) => /* @__PURE__ */ jsxs("tr", { className: "text-slate-200", children: [
            /* @__PURE__ */ jsx("td", { className: "py-3", children: /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("div", { className: "font-medium text-white", children: item.product_name }),
              item.product_sku && /* @__PURE__ */ jsxs("div", { className: "text-xs text-slate-400", children: [
                "SKU: ",
                item.product_sku
              ] })
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "py-3 text-center font-medium", children: item.quantity_ordered }),
            /* @__PURE__ */ jsx("td", { className: "py-3 text-center", children: /* @__PURE__ */ jsx(
              "span",
              {
                className: item.quantity_received >= item.quantity_ordered ? "text-green-400" : item.quantity_received > 0 ? "text-yellow-400" : "text-slate-400",
                children: item.quantity_received
              }
            ) }),
            /* @__PURE__ */ jsx("td", { className: "py-3 text-right", children: formatCurrency(item.unit_price) }),
            /* @__PURE__ */ jsx("td", { className: "py-3 text-right font-semibold text-white", children: formatCurrency(item.total) })
          ] }, item.id)) })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-slate-800/50 p-6", children: [
        /* @__PURE__ */ jsxs("h2", { className: "mb-4 flex items-center gap-2 text-lg font-semibold text-white", children: [
          /* @__PURE__ */ jsx(DollarSign, { className: "size-5 text-amber-300" }),
          "Récapitulatif financier"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
            /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Sous-total:" }),
            /* @__PURE__ */ jsx("span", { className: "font-medium text-white", children: formatCurrency(purchase.subtotal) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
            /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Remise totale:" }),
            /* @__PURE__ */ jsxs("span", { className: "font-medium text-white", children: [
              "-",
              formatCurrency(purchase.discount_amount)
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
            /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Taxes totales:" }),
            /* @__PURE__ */ jsx("span", { className: "font-medium text-white", children: formatCurrency(purchase.tax_amount) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
            /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Frais de port:" }),
            /* @__PURE__ */ jsx("span", { className: "font-medium text-white", children: formatCurrency(purchase.shipping_cost) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "border-t border-white/10 pt-3", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "text-lg font-semibold text-white", children: "Total:" }),
            /* @__PURE__ */ jsx("span", { className: "text-2xl font-bold text-amber-300", children: formatCurrency(purchase.total) })
          ] }) })
        ] })
      ] }),
      (purchase.notes || purchase.internal_notes) && /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-slate-800/50 p-6", children: [
        /* @__PURE__ */ jsxs("h2", { className: "mb-4 flex items-center gap-2 text-lg font-semibold text-white", children: [
          /* @__PURE__ */ jsx(FileText, { className: "size-5 text-amber-300" }),
          "Notes"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          purchase.notes && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "mb-2 text-sm font-medium text-slate-300", children: "Notes (visibles)" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: purchase.notes })
          ] }),
          purchase.internal_notes && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "mb-2 text-sm font-medium text-slate-300", children: "Notes internes" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: purchase.internal_notes })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Modal, { show: showConfirmModal, onClose: () => setShowConfirmModal(false), maxWidth: "lg", children: /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: "rounded-full bg-blue-500 p-3", children: /* @__PURE__ */ jsx(CheckCircle, { className: "size-7 text-blue-400" }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-slate-500", children: "Confirmer le bon de commande" }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-600", children: [
            "Vous êtes sur le point de confirmer le bon de commande ",
            /* @__PURE__ */ jsx("span", { className: "font-bold text-white", children: purchase.reference })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-lg border border-white/20 bg-slate-900 p-5", children: [
        /* @__PURE__ */ jsx("h3", { className: "mb-4 text-base font-bold text-white", children: "Récapitulatif" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-3 text-base", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "text-slate-300", children: "Fournisseur:" }),
            /* @__PURE__ */ jsx("span", { className: "font-semibold text-white", children: purchase.supplier.name })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "text-slate-300", children: "Nombre d'articles:" }),
            /* @__PURE__ */ jsx("span", { className: "font-semibold text-white", children: purchase.items.length })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "text-slate-300", children: "Quantité totale:" }),
            /* @__PURE__ */ jsxs("span", { className: "font-semibold text-white", children: [
              purchase.items.reduce((sum, item) => sum + item.quantity_ordered, 0),
              " unités"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between border-t border-white/20 pt-3 mt-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-slate-200 font-medium", children: "Montant total:" }),
            /* @__PURE__ */ jsx("span", { className: "text-xl font-bold text-amber-400", children: formatCurrency(purchase.total) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-4 rounded-lg border border-blue-400/40 bg-blue-500 p-4", children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-blue-200 leading-relaxed", children: [
        /* @__PURE__ */ jsx("span", { className: "text-base", children: "ℹ️" }),
        ' Cette action marquera la commande comme envoyée au fournisseur. Le statut passera à "Confirmé" et vous pourrez ensuite réceptionner la marchandise.'
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 flex justify-end gap-3", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setShowConfirmModal(false),
            disabled: processing,
            className: "rounded-lg border border-white/20 px-5 py-2.5 text-base font-semibold text-white transition hover:bg-white/10 disabled:opacity-50",
            children: "Annuler"
          }
        ),
        /* @__PURE__ */ jsx(PrimaryButton, { onClick: handleConfirm, disabled: processing, children: processing ? "Confirmation en cours..." : "Confirmer la commande" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Modal, { show: showReceiveModal, onClose: () => setShowReceiveModal(false), maxWidth: "2xl", children: /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
      /* @__PURE__ */ jsx("div", { className: "w-full mb-2", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-base text-slate-600", children: [
          "Bon de commande ",
          /* @__PURE__ */ jsx("span", { className: "font-bold text-gray-500", children: purchase.reference })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-base text-slate-600", children: [
          "Fournisseur: ",
          /* @__PURE__ */ jsx("span", { className: "font-bold text-gray-500", children: purchase.supplier.name })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: " grid grid-cols-3 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-blue-400/30 bg-blue-500/20 p-4", children: [
          /* @__PURE__ */ jsx("div", { className: "text-sm font-medium text-blue-600", children: "Total commandé" }),
          /* @__PURE__ */ jsx("div", { className: "mt-2 text-3xl font-bold text-blue-600", children: purchase.items.reduce((sum, item) => sum + item.quantity_ordered, 0) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-green-400/30 bg-green-500/20 p-4", children: [
          /* @__PURE__ */ jsx("div", { className: "text-sm font-medium text-green-600", children: "Déjà reçu" }),
          /* @__PURE__ */ jsx("div", { className: "mt-2 text-3xl font-bold text-green-600", children: purchase.items.reduce((sum, item) => sum + item.quantity_received, 0) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-amber-400/30 bg-amber-500/20 p-4", children: [
          /* @__PURE__ */ jsx("div", { className: "text-sm font-medium text-amber-600", children: "Restant" }),
          /* @__PURE__ */ jsx("div", { className: "mt-2 text-3xl font-bold text-amber-600", children: purchase.items.reduce((sum, item) => sum + (item.quantity_ordered - item.quantity_received), 0) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-base font-bold text-white", children: "Articles à réceptionner" }),
        purchase.items.map((item) => {
          const remaining = item.quantity_ordered - item.quantity_received;
          const percentReceived = Math.round(item.quantity_received / item.quantity_ordered * 100);
          return /* @__PURE__ */ jsx(
            "div",
            {
              className: "rounded-lg border border-white/20 bg-slate-900/90 p-4 transition hover:border-white/30",
              children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsx("div", { className: "text-base font-semibold text-white", children: item.product_name }),
                  item.product_sku && /* @__PURE__ */ jsxs("div", { className: "text-sm text-slate-300 mt-0.5", children: [
                    "SKU: ",
                    item.product_sku
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm text-slate-300", children: [
                      /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Progression" }),
                      /* @__PURE__ */ jsxs("span", { className: "font-bold", children: [
                        percentReceived,
                        "%"
                      ] })
                    ] }),
                    /* @__PURE__ */ jsx("div", { className: "mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-700", children: /* @__PURE__ */ jsx(
                      "div",
                      {
                        className: `h-full transition-all ${percentReceived === 100 ? "bg-green-500" : percentReceived > 0 ? "bg-yellow-500" : "bg-slate-600"}`,
                        style: { width: `${percentReceived}%` }
                      }
                    ) })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "mt-3 flex gap-5 text-sm", children: [
                    /* @__PURE__ */ jsxs("span", { className: "text-slate-300", children: [
                      "Commandé: ",
                      /* @__PURE__ */ jsx("span", { className: "font-bold text-white", children: item.quantity_ordered })
                    ] }),
                    /* @__PURE__ */ jsxs("span", { className: "text-slate-300", children: [
                      "Reçu: ",
                      /* @__PURE__ */ jsx("span", { className: "font-bold text-green-400", children: item.quantity_received })
                    ] }),
                    /* @__PURE__ */ jsxs("span", { className: "text-slate-300", children: [
                      "Restant: ",
                      /* @__PURE__ */ jsx("span", { className: "font-bold text-amber-400", children: remaining })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "w-32", children: [
                  /* @__PURE__ */ jsx(InputLabel, { value: "Quantité", className: "text-sm font-semibold text-white" }),
                  /* @__PURE__ */ jsx(
                    TextInput,
                    {
                      type: "number",
                      min: "0",
                      max: remaining,
                      value: receivingQuantities[item.id],
                      onChange: (e) => setReceivingQuantities({
                        ...receivingQuantities,
                        [item.id]: parseInt(e.target.value) || 0
                      }),
                      className: "mt-1 block w-full text-center text-base font-semibold text-white",
                      disabled: remaining === 0
                    }
                  ),
                  remaining === 0 && /* @__PURE__ */ jsx("div", { className: "mt-1.5 text-sm font-semibold text-green-400", children: "✓ Complet" })
                ] })
              ] })
            },
            item.id
          );
        })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-4 rounded-lg border border-green-400/40 bg-green-500/20 p-4", children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-green-500 leading-relaxed", children: [
        /* @__PURE__ */ jsx("span", { className: "text-base font-bold", children: "💡 Astuce:" }),
        " Vous pouvez réceptionner partiellement. Les articles reçus seront ajoutés au stock immédiatement. Le statut du bon de commande sera mis à jour automatiquement."
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 flex justify-end gap-3", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setShowReceiveModal(false),
            disabled: processing,
            className: "rounded-lg border border-white/20 px-5 py-2.5 text-base font-semibold text-white transition hover:bg-white/10 disabled:opacity-50",
            children: "Annuler"
          }
        ),
        /* @__PURE__ */ jsx(
          PrimaryButton,
          {
            onClick: handleReceive,
            disabled: processing || Object.values(receivingQuantities).every((q) => q === 0),
            children: processing ? "Réception en cours..." : "Valider la réception"
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Modal, { show: showCancelModal, onClose: () => setShowCancelModal(false), maxWidth: "lg", children: /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: "rounded-full bg-red-500/20 w-12 h-12 flex items-center justify-center", children: /* @__PURE__ */ jsx(XCircle, { className: "size-6 text-red-600" }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col ", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-slate-500", children: "Annuler le bon de commande" }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-400", children: [
            "Vous êtes sur le point d'annuler le bon de commande ",
            /* @__PURE__ */ jsx("span", { className: "font-semibold text-white", children: purchase.reference })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-lg bg-slate-900 p-4", children: [
        /* @__PURE__ */ jsx("h3", { className: "mb-3 text-sm font-semibold text-white", children: "Informations de la commande" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Fournisseur:" }),
            /* @__PURE__ */ jsx("span", { className: "font-medium text-white", children: purchase.supplier.name })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Date de commande:" }),
            /* @__PURE__ */ jsx("span", { className: "font-medium text-white", children: formatDate(purchase.order_date) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Montant:" }),
            /* @__PURE__ */ jsx("span", { className: "font-medium text-white", children: formatCurrency(purchase.total) })
          ] }),
          purchase.status === "partial" && /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Articles reçus:" }),
            /* @__PURE__ */ jsxs("span", { className: "font-medium text-yellow-400", children: [
              purchase.items.reduce((sum, item) => sum + item.quantity_received, 0),
              " / ",
              purchase.items.reduce((sum, item) => sum + item.quantity_ordered, 0)
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-4 rounded-lg border border-red-500 bg-red-500 p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "text-red-400", children: "⚠️" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-md font-semibold text-red-300", children: "Attention" }),
          /* @__PURE__ */ jsxs("ul", { className: "mt-2 space-y-1 text-sm text-red-200", children: [
            /* @__PURE__ */ jsxs("li", { children: [
              "• Cette action est ",
              /* @__PURE__ */ jsx("strong", { children: "irréversible" })
            ] }),
            /* @__PURE__ */ jsx("li", { children: "• Le bon de commande sera marqué comme annulé" }),
            purchase.status === "partial" && /* @__PURE__ */ jsx("li", { children: "• Les quantités déjà reçues resteront en stock" }),
            /* @__PURE__ */ jsx("li", { children: "• Vous ne pourrez plus réceptionner de marchandise" })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 flex justify-end gap-3", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setShowCancelModal(false),
            disabled: processing,
            className: "rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/5 disabled:opacity-50",
            children: "Non, garder la commande"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleCancel,
            disabled: processing,
            className: "rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50",
            children: processing ? "Annulation en cours..." : "Oui, annuler définitivement"
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Modal, { show: showDeleteModal, onClose: () => setShowDeleteModal(false), maxWidth: "lg", children: /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: "rounded-full bg-red-500/30 p-3", children: /* @__PURE__ */ jsx(Trash2, { className: "size-7 text-red-400" }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-slate-600", children: "Supprimer le bon de commande" }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-700", children: [
            "Vous êtes sur le point de supprimer définitivement le bon de commande ",
            /* @__PURE__ */ jsx("span", { className: "font-bold text-white", children: purchase.reference })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-lg border border-white/20 bg-slate-900 p-5", children: [
        /* @__PURE__ */ jsx("h3", { className: "mb-4 text-base font-bold text-white", children: "Informations" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-3 text-base", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "text-slate-300", children: "Fournisseur:" }),
            /* @__PURE__ */ jsx("span", { className: "font-semibold text-white", children: purchase.supplier.name })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "text-slate-300", children: "Date de commande:" }),
            /* @__PURE__ */ jsx("span", { className: "font-semibold text-white", children: formatDate(purchase.order_date) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "text-slate-300", children: "Statut:" }),
            /* @__PURE__ */ jsx("span", { className: "font-semibold text-white", children: purchase.status === "draft" ? "Brouillon" : "Annulé" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between border-t border-white/20 pt-3 mt-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-slate-200 font-medium", children: "Montant:" }),
            /* @__PURE__ */ jsx("span", { className: "text-xl font-bold text-amber-400", children: formatCurrency(purchase.total) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-4 rounded-lg border border-red-500 bg-red-500 p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "text-xl", children: "⚠️" }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-red-200", children: "Attention : Action irréversible" }),
          /* @__PURE__ */ jsxs("ul", { className: "mt-2 space-y-1.5 text-sm text-red-100", children: [
            /* @__PURE__ */ jsxs("li", { children: [
              "• Le bon de commande sera ",
              /* @__PURE__ */ jsx("strong", { children: "définitivement supprimé" })
            ] }),
            /* @__PURE__ */ jsx("li", { children: "• Tous les articles associés seront supprimés" }),
            /* @__PURE__ */ jsx("li", { children: "• Cette action ne peut pas être annulée" }),
            /* @__PURE__ */ jsx("li", { children: "• Aucun mouvement de stock ne sera créé" })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 flex justify-end gap-3", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setShowDeleteModal(false),
            disabled: processing,
            className: "rounded-lg border border-white/20 px-5 py-2.5 text-base font-semibold text-white transition hover:bg-white/10 disabled:opacity-50",
            children: "Annuler"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleDelete,
            disabled: processing,
            className: "rounded-lg bg-red-600 px-5 py-2.5 text-base font-semibold text-white transition hover:bg-red-700 disabled:opacity-50",
            children: processing ? "Suppression en cours..." : "Oui, supprimer définitivement"
          }
        )
      ] })
    ] }) })
  ] });
}
export {
  PurchasesShow as default
};
