import { jsxs, jsx } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { a as usePage, H as Head_default } from "../ssr.js";
import { User, CheckCircle, XCircle, Shield, Store } from "lucide-react";
import DeleteUserForm from "./DeleteUserForm-BlYTjScK.js";
import UpdatePasswordForm from "./UpdatePasswordForm-DLDZ9MAi.js";
import UpdateProfileInformation from "./UpdateProfileInformationForm-VERtXXFD.js";
import "react";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
import "./Modal-BeSeEOS3.js";
import "@headlessui/react";
function Edit({
  mustVerifyEmail,
  status
}) {
  const { auth } = usePage().props;
  const user = auth.user;
  const getRoleBadgeColor = (role) => {
    const colors = {
      super_admin: "bg-purple-100 text-purple-800",
      admin: "bg-blue-100 text-blue-800",
      manager: "bg-green-100 text-green-800",
      cashier: "bg-yellow-100 text-yellow-800",
      staff: "bg-gray-100 text-gray-800"
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };
  const getRoleLabel = (role) => {
    const labels = {
      super_admin: "Super Administrateur",
      admin: "Administrateur",
      manager: "Gérant",
      cashier: "Caissier",
      staff: "Personnel"
    };
    return labels[role] || role;
  };
  const getModuleLabel = (module) => {
    const labels = {
      products: "Produits",
      customers: "Clients",
      invoices: "Factures",
      sales: "Ventes",
      stocks: "Stocks",
      inventory: "Inventaires",
      reports: "Rapports"
    };
    return labels[module] || module;
  };
  return /* @__PURE__ */ jsxs(
    Authenticated,
    {
      header: /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold leading-tight text-white", children: "Mon Profil" }),
      children: [
        /* @__PURE__ */ jsx(Head_default, { title: "Profil" }),
        /* @__PURE__ */ jsx("div", { className: "py-12", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8", children: [
          /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 shadow-lg overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "p-8", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-6", children: [
            /* @__PURE__ */ jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsx("div", { className: "h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg", children: /* @__PURE__ */ jsx(User, { className: "h-12 w-12 text-white" }) }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
                /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold text-white", children: user.name }),
                user.is_active ? /* @__PURE__ */ jsx(CheckCircle, { className: "h-6 w-6 text-green-500" }) : /* @__PURE__ */ jsx(XCircle, { className: "h-6 w-6 text-red-500" })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-slate-300 mb-4", children: user.email }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-3", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20", children: [
                  /* @__PURE__ */ jsx(Shield, { className: "h-5 w-5 text-amber-300" }),
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-slate-200", children: "Rôle:" }),
                  /* @__PURE__ */ jsx("span", { className: `px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(user.role)}`, children: getRoleLabel(user.role) })
                ] }),
                user.shop && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20", children: [
                  /* @__PURE__ */ jsx(Store, { className: "h-5 w-5 text-amber-300" }),
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-slate-200", children: "Boutique:" }),
                  /* @__PURE__ */ jsx("span", { className: "text-sm text-white font-semibold", children: user.shop.name })
                ] })
              ] }),
              user.shop && (user.shop.address || user.shop.city || user.shop.phone) && /* @__PURE__ */ jsx("div", { className: "mt-4 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-lg border border-white/20", children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-300", children: [
                user.shop.address && /* @__PURE__ */ jsx("span", { children: user.shop.address }),
                user.shop.city && /* @__PURE__ */ jsx("span", { className: "ml-2", children: user.shop.city }),
                user.shop.phone && /* @__PURE__ */ jsxs("span", { className: "ml-4", children: [
                  "📞 ",
                  user.shop.phone
                ] })
              ] }) })
            ] })
          ] }) }) }),
          user.permissions && user.permissions.length > 0 && /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 shadow-lg overflow-hidden", children: [
            /* @__PURE__ */ jsxs("div", { className: "px-8 py-6 border-b border-white/10", children: [
              /* @__PURE__ */ jsxs("h3", { className: "text-lg font-semibold text-white flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Shield, { className: "h-5 w-5 text-amber-300" }),
                "Mes Permissions"
              ] }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-300", children: "Modules et actions auxquels vous avez accès" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "p-8", children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: user.permissions.map((permission) => /* @__PURE__ */ jsxs(
              "div",
              {
                className: "bg-white/5 rounded-lg p-4 border border-white/10 hover:border-amber-300/50 transition-colors",
                children: [
                  /* @__PURE__ */ jsx("h4", { className: "font-semibold text-white mb-3", children: getModuleLabel(permission.module) }),
                  /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
                    permission.can_view && /* @__PURE__ */ jsx("span", { className: "px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium", children: "Voir" }),
                    permission.can_create && /* @__PURE__ */ jsx("span", { className: "px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium", children: "Créer" }),
                    permission.can_edit && /* @__PURE__ */ jsx("span", { className: "px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium", children: "Modifier" }),
                    permission.can_delete && /* @__PURE__ */ jsx("span", { className: "px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium", children: "Supprimer" })
                  ] })
                ]
              },
              permission.id
            )) }) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-white/10 bg-white/5 shadow-lg", children: /* @__PURE__ */ jsx("div", { className: "p-8", children: /* @__PURE__ */ jsx(
            UpdateProfileInformation,
            {
              mustVerifyEmail,
              status,
              className: "max-w-xl"
            }
          ) }) }),
          /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-white/10 bg-white/5 shadow-lg", children: /* @__PURE__ */ jsx("div", { className: "p-8", children: /* @__PURE__ */ jsx(UpdatePasswordForm, { className: "max-w-xl" }) }) }),
          /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-white/10 bg-white/5 shadow-lg", children: /* @__PURE__ */ jsx("div", { className: "p-8", children: /* @__PURE__ */ jsx(DeleteUserForm, { className: "max-w-xl" }) }) })
        ] }) })
      ]
    }
  );
}
export {
  Edit as default
};
