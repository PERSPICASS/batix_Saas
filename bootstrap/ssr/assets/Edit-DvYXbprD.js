import { jsxs, jsx } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { u as useForm, H as Head_default, L as Link_default } from "../ssr.js";
import { useState } from "react";
import { Shield, Check } from "lucide-react";
import { u as useRoute } from "./route-C2Ac8FMA.js";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
const MODULES = [
  { key: "shops", label: "Boutiques" },
  { key: "products", label: "Produits" },
  { key: "categories", label: "Catégories & Sous-catégories" },
  { key: "stocks", label: "Stocks" },
  { key: "inventory", label: "Inventaires" },
  { key: "sales", label: "Ventes" },
  { key: "purchases", label: "Achats" },
  { key: "expenses", label: "Dépenses" },
  { key: "suppliers", label: "Fournisseurs" },
  { key: "customers", label: "Clients" },
  { key: "invoices", label: "Factures" },
  { key: "users", label: "Utilisateurs" },
  { key: "reports", label: "Rapports" }
];
const ROLES = [
  { value: "staff", label: "Personnel" },
  { value: "cashier", label: "Caissier" },
  { value: "manager", label: "Gestionnaire" },
  { value: "admin", label: "Administrateur" },
  { value: "super_admin", label: "Super Admin" },
  { value: "admin_platforme", label: "Admin Plateforme" }
];
function UsersEdit({ user, shops }) {
  const route = useRoute();
  const { data, setData, put, processing, errors } = useForm({
    name: user.name,
    email: user.email,
    password: "",
    password_confirmation: "",
    shop_id: user.shop_id?.toString() || "",
    role: user.role,
    is_active: user.is_active,
    permissions: user.permissions.map((p) => ({
      module: p.module,
      can_view: p.can_view,
      can_create: p.can_create,
      can_edit: p.can_edit,
      can_delete: p.can_delete
    }))
  });
  const [selectedModules, setSelectedModules] = useState(
    user.permissions.map((p) => p.module)
  );
  const toggleModule = (moduleKey) => {
    const isSelected = selectedModules.includes(moduleKey);
    const newSelected = isSelected ? selectedModules.filter((m) => m !== moduleKey) : [...selectedModules, moduleKey];
    setSelectedModules(newSelected);
    const newPermissions = isSelected ? data.permissions.filter((p) => p.module !== moduleKey) : [
      ...data.permissions,
      {
        module: moduleKey,
        can_view: true,
        can_create: false,
        can_edit: false,
        can_delete: false
      }
    ];
    setData("permissions", newPermissions);
  };
  const updatePermission = (moduleKey, action, value) => {
    const newPermissions = data.permissions.map(
      (p) => p.module === moduleKey ? { ...p, [action]: value } : p
    );
    setData("permissions", newPermissions);
  };
  const getPermission = (moduleKey) => {
    return data.permissions.find((p) => p.module === moduleKey);
  };
  const submit = (e) => {
    e.preventDefault();
    put(route("users.update", { user: user.id }));
  };
  return /* @__PURE__ */ jsxs(Authenticated, { header: /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-white", children: "Modifier utilisateur" }), children: [
    /* @__PURE__ */ jsx(Head_default, { title: "Modifier utilisateur" }),
    /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-4xl", children: /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-white", children: "Informations générales" }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "name", className: "block text-sm font-medium text-slate-200", children: "Nom complet *" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                id: "name",
                value: data.name,
                onChange: (e) => setData("name", e.target.value),
                className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
                autoFocus: true
              }
            ),
            errors.name && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.name })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-slate-200", children: "Adresse email *" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "email",
                id: "email",
                value: data.email,
                onChange: (e) => setData("email", e.target.value),
                className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
              }
            ),
            errors.email && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.email })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-blue-500/30 bg-blue-500/10 p-4", children: [
          /* @__PURE__ */ jsx("p", { className: "mb-3 text-sm font-medium text-blue-300", children: "Modifier le mot de passe (optionnel)" }),
          /* @__PURE__ */ jsx("p", { className: "mb-4 text-xs text-slate-400", children: "Laissez vide si vous ne souhaitez pas changer le mot de passe" }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-slate-200", children: "Nouveau mot de passe" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "password",
                  id: "password",
                  value: data.password,
                  onChange: (e) => setData("password", e.target.value),
                  className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
                  placeholder: "Minimum 8 caractères"
                }
              ),
              errors.password && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.password })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(
                "label",
                {
                  htmlFor: "password_confirmation",
                  className: "block text-sm font-medium text-slate-200",
                  children: "Confirmer le nouveau mot de passe"
                }
              ),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "password",
                  id: "password_confirmation",
                  value: data.password_confirmation,
                  onChange: (e) => setData("password_confirmation", e.target.value),
                  className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
                  placeholder: "Confirmer le mot de passe"
                }
              ),
              errors.password_confirmation && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.password_confirmation })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-6 border-t border-white/10 pt-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-white", children: "Affectation" }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "shop_id", className: "block text-sm font-medium text-slate-200", children: "Boutique" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                id: "shop_id",
                value: data.shop_id,
                onChange: (e) => setData("shop_id", e.target.value),
                className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "", children: "-- Aucune boutique --" }),
                  shops.map((shop) => /* @__PURE__ */ jsx("option", { value: shop.id, children: shop.name }, shop.id))
                ]
              }
            ),
            errors.shop_id && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.shop_id })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "role", className: "block text-sm font-medium text-slate-200", children: "Rôle *" }),
            /* @__PURE__ */ jsx(
              "select",
              {
                id: "role",
                value: data.role,
                onChange: (e) => setData("role", e.target.value),
                className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
                children: ROLES.map((role) => /* @__PURE__ */ jsx("option", { value: role.value, children: role.label }, role.value))
              }
            ),
            errors.role && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.role })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "checkbox",
              id: "is_active",
              checked: data.is_active,
              onChange: (e) => setData("is_active", e.target.checked),
              className: "size-4 rounded border-white/15 bg-slate-900/70 text-amber-300 focus:ring-amber-300 focus:ring-offset-slate-950"
            }
          ),
          /* @__PURE__ */ jsx("label", { htmlFor: "is_active", className: "text-sm font-medium text-slate-200", children: "Utilisateur actif" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4 border-t border-white/10 pt-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Shield, { className: "size-5 text-amber-300" }),
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-white", children: "Permissions des modules" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "space-y-3", children: MODULES.map((module) => {
          const isSelected = selectedModules.includes(module.key);
          const permission = getPermission(module.key);
          return /* @__PURE__ */ jsx("div", { className: "rounded-lg border border-white/10 bg-white/5 p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => toggleModule(module.key),
                className: "flex items-center gap-3",
                children: [
                  /* @__PURE__ */ jsx(
                    "div",
                    {
                      className: `flex size-5 items-center justify-center rounded border ${isSelected ? "border-amber-300 bg-amber-300" : "border-white/15 bg-slate-900/70"}`,
                      children: isSelected && /* @__PURE__ */ jsx(Check, { className: "size-3 text-slate-950" })
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { className: "font-medium text-slate-200", children: module.label })
                ]
              }
            ),
            isSelected && permission && /* @__PURE__ */ jsx("div", { className: "flex items-center gap-4", children: ["can_view", "can_create", "can_edit", "can_delete"].map(
              (action) => /* @__PURE__ */ jsxs(
                "label",
                {
                  className: "flex items-center gap-2 text-sm text-slate-300",
                  children: [
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "checkbox",
                        checked: permission[action],
                        onChange: (e) => updatePermission(
                          module.key,
                          action,
                          e.target.checked
                        ),
                        className: "size-4 rounded border-white/15 bg-slate-900/70 text-amber-300 focus:ring-amber-300 focus:ring-offset-slate-950"
                      }
                    ),
                    action === "can_view" && "Voir",
                    action === "can_create" && "Créer",
                    action === "can_edit" && "Modifier",
                    action === "can_delete" && "Supprimer"
                  ]
                },
                action
              )
            ) })
          ] }) }, module.key);
        }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-3 border-t border-white/10 pt-4", children: [
        /* @__PURE__ */ jsx(
          Link_default,
          {
            href: route("users.index"),
            className: "rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5",
            children: "Annuler"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            disabled: processing,
            className: "rounded-lg bg-amber-300 px-6 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-200 disabled:opacity-50",
            children: processing ? "Mise à jour..." : "Enregistrer"
          }
        )
      ] })
    ] }) })
  ] });
}
export {
  UsersEdit as default
};
