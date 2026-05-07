import { jsx, jsxs, Fragment as Fragment$1 } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { H as Head_default, L as Link_default, r as router3 } from "../ssr.js";
import { AlertTriangle, X, Plus, Mail, Store, Shield, Pencil, Trash2 } from "lucide-react";
import { T as Table, b as TableBadge, c as TableActions, d as TableActionButton } from "./Table-Cvz7wd2g.js";
import { Fragment, useState } from "react";
import { Transition, Dialog } from "@headlessui/react";
import { u as useRoute } from "./route-C2Ac8FMA.js";
import { u as useSubscriptionLimits, S as SubscriptionBanner } from "./SubscriptionBanner-BxXxKEZo.js";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
function ConfirmDialog({
  show,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  type = "danger",
  isProcessing = false
}) {
  const getIconColor = () => {
    switch (type) {
      case "danger":
        return "bg-red-900/30 border-red-500/30";
      case "warning":
        return "bg-yellow-900/30 border-yellow-500/30";
      case "info":
        return "bg-blue-900/30 border-blue-500/30";
    }
  };
  const getIconTextColor = () => {
    switch (type) {
      case "danger":
        return "text-red-400";
      case "warning":
        return "text-yellow-400";
      case "info":
        return "text-blue-400";
    }
  };
  const getAlertBgColor = () => {
    switch (type) {
      case "danger":
        return "bg-red-900/20 border-red-500/30";
      case "warning":
        return "bg-yellow-900/20 border-yellow-500/30";
      case "info":
        return "bg-blue-900/20 border-blue-500/30";
    }
  };
  const getAlertTextColor = () => {
    switch (type) {
      case "danger":
        return "text-red-200";
      case "warning":
        return "text-yellow-200";
      case "info":
        return "text-blue-200";
    }
  };
  const getConfirmButtonColor = () => {
    switch (type) {
      case "danger":
        return "bg-red-600 hover:bg-red-700 focus:ring-red-500";
      case "warning":
        return "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500";
      case "info":
        return "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500";
    }
  };
  return /* @__PURE__ */ jsx(Transition, { appear: true, show, as: Fragment, children: /* @__PURE__ */ jsxs(Dialog, { as: "div", className: "relative z-50", onClose, children: [
    /* @__PURE__ */ jsx(
      Transition.Child,
      {
        as: Fragment,
        enter: "ease-out duration-300",
        enterFrom: "opacity-0",
        enterTo: "opacity-100",
        leave: "ease-in duration-200",
        leaveFrom: "opacity-100",
        leaveTo: "opacity-0",
        children: /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/75 backdrop-blur-sm" })
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "fixed inset-0 overflow-y-auto", children: /* @__PURE__ */ jsx("div", { className: "flex min-h-full items-center justify-center p-4", children: /* @__PURE__ */ jsx(
      Transition.Child,
      {
        as: Fragment,
        enter: "ease-out duration-300",
        enterFrom: "opacity-0 scale-95",
        enterTo: "opacity-100 scale-100",
        leave: "ease-in duration-200",
        leaveFrom: "opacity-100 scale-100",
        leaveTo: "opacity-0 scale-95",
        children: /* @__PURE__ */ jsxs(Dialog.Panel, { className: "w-full max-w-md transform overflow-hidden rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl transition-all", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between mb-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: `flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border ${getIconColor()}`, children: /* @__PURE__ */ jsx(AlertTriangle, { className: `h-6 w-6 ${getIconTextColor()}` }) }),
              /* @__PURE__ */ jsx(Dialog.Title, { as: "h3", className: "text-lg font-semibold text-white", children: title })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: onClose,
                className: "text-slate-400 hover:text-white transition-colors",
                children: /* @__PURE__ */ jsx(X, { className: "h-5 w-5" })
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: `rounded-lg border p-4 mb-6 ${getAlertBgColor()}`, children: /* @__PURE__ */ jsx("p", { className: `text-sm ${getAlertTextColor()}`, children: message }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-3 justify-end", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: onClose,
                disabled: isProcessing,
                className: "rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50",
                children: cancelText
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: onConfirm,
                disabled: isProcessing,
                className: `rounded-lg px-4 py-2 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 ${getConfirmButtonColor()}`,
                children: isProcessing ? "En cours..." : confirmText
              }
            )
          ] })
        ] })
      }
    ) }) })
  ] }) });
}
const roleLabels = {
  super_admin: "Super Admin",
  admin_platforme: "Admin Plateforme",
  admin: "Administrateur",
  manager: "Gestionnaire",
  cashier: "Caissier",
  staff: "Personnel"
};
const roleColors = {
  super_admin: "danger",
  admin_platforme: "danger",
  admin: "info",
  manager: "info",
  cashier: "warning",
  staff: "success"
};
function UsersIndex({ users }) {
  const route = useRoute();
  const subscription = useSubscriptionLimits();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };
  const handleConfirmDelete = () => {
    if (userToDelete) {
      setIsDeleting(true);
      router3.delete(route("users.destroy", { user: userToDelete.id }), {
        onFinish: () => {
          setIsDeleting(false);
          setShowDeleteDialog(false);
          setUserToDelete(null);
        }
      });
    }
  };
  const columns = [
    {
      key: "name",
      label: "Nom",
      render: (user) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("div", { className: "flex h-8 w-8 items-center justify-center rounded-full bg-amber-300/20 text-sm font-semibold text-amber-300", children: user.name.charAt(0).toUpperCase() }),
        /* @__PURE__ */ jsx("span", { className: "font-medium", children: user.name })
      ] })
    },
    {
      key: "email",
      label: "Email",
      render: (user) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-slate-300", children: [
        /* @__PURE__ */ jsx(Mail, { className: "size-4" }),
        user.email
      ] })
    },
    {
      key: "shop",
      label: "Boutique",
      render: (user) => /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 text-slate-300", children: user.shop ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
        /* @__PURE__ */ jsx(Store, { className: "size-4" }),
        user.shop.name
      ] }) : /* @__PURE__ */ jsx("span", { className: "text-slate-500", children: "-" }) })
    },
    {
      key: "role",
      label: "Rôle",
      align: "center",
      render: (user) => /* @__PURE__ */ jsxs(TableBadge, { variant: roleColors[user.role] || "info", children: [
        /* @__PURE__ */ jsx(Shield, { className: "size-3" }),
        roleLabels[user.role] || user.role
      ] })
    },
    {
      key: "status",
      label: "Statut",
      align: "center",
      render: (user) => /* @__PURE__ */ jsx(TableBadge, { variant: user.is_active ? "success" : "danger", children: user.is_active ? "Actif" : "Inactif" })
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (user) => /* @__PURE__ */ jsxs(TableActions, { children: [
        /* @__PURE__ */ jsxs(
          Link_default,
          {
            href: route("users.edit", { user: user.id }),
            className: "inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/10",
            children: [
              /* @__PURE__ */ jsx(Pencil, { className: "size-3.5" }),
              " Modifier"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(TableActionButton, { variant: "danger", onClick: () => handleDeleteClick(user), children: [
          /* @__PURE__ */ jsx(Trash2, { className: "size-3.5" }),
          " Supprimer"
        ] })
      ] })
    }
  ];
  return /* @__PURE__ */ jsxs(Authenticated, { header: /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-white", children: "Utilisateurs" }), children: [
    /* @__PURE__ */ jsx(Head_default, { title: "Utilisateurs" }),
    /* @__PURE__ */ jsxs("section", { className: "space-y-6", children: [
      subscription && /* @__PURE__ */ jsx(SubscriptionBanner, { type: "users" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-300", children: "Gérez les comptes utilisateurs et leurs permissions" }),
        /* @__PURE__ */ jsxs(
          Link_default,
          {
            href: route("users.create"),
            className: `inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${subscription?.can_create_user ? "bg-amber-300 text-slate-950 hover:bg-amber-200" : "bg-slate-700 text-slate-400 cursor-not-allowed opacity-60"}`,
            onClick: (e) => {
              if (!subscription?.can_create_user) {
                e.preventDefault();
              }
            },
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "size-4" }),
              " Nouvel utilisateur"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx(Table, { columns, data: users.data, emptyMessage: "Aucun utilisateur trouvé" }),
      users.links && /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center gap-1", children: users.links.map((link, index) => /* @__PURE__ */ jsx(
        Link_default,
        {
          href: link.url || "#",
          className: `rounded-lg px-3 py-2 text-sm ${link.active ? "bg-amber-300 text-slate-950 font-semibold" : "border border-white/15 text-slate-200 hover:bg-white/10"} ${!link.url ? "opacity-50 cursor-not-allowed" : ""}`,
          dangerouslySetInnerHTML: { __html: link.label }
        },
        index
      )) })
    ] }),
    /* @__PURE__ */ jsx(
      ConfirmDialog,
      {
        show: showDeleteDialog,
        onClose: () => setShowDeleteDialog(false),
        onConfirm: handleConfirmDelete,
        title: "Supprimer l'utilisateur",
        message: `Êtes-vous sûr de vouloir supprimer l'utilisateur "${userToDelete?.name}" ? Cette action est irréversible.`,
        confirmText: "Supprimer",
        cancelText: "Annuler",
        type: "danger",
        isProcessing: isDeleting
      }
    )
  ] });
}
export {
  UsersIndex as default
};
