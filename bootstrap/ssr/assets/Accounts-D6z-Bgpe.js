import { jsxs, jsx } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { H as Head_default, L as Link_default, r as router3 } from "../ssr.js";
import { Search, Store, Package, Power } from "lucide-react";
import { T as Table, b as TableBadge, c as TableActions } from "./Table-Cvz7wd2g.js";
import { useState } from "react";
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
function PlatformAdminAccounts({ accounts, filters }) {
  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const [confirmToggle, setConfirmToggle] = useState(null);
  const handleSearch = (e) => {
    e.preventDefault();
    router3.get(
      route("platform.accounts"),
      { search: searchTerm, status: filters.status },
      { preserveState: true }
    );
  };
  const handleStatusFilter = (status) => {
    router3.get(
      route("platform.accounts"),
      { search: filters.search, status },
      { preserveState: true }
    );
  };
  const toggleAccountStatus = (accountId) => {
    router3.post(
      route("platform.accounts.toggle", accountId),
      {},
      {
        preserveScroll: true,
        onSuccess: () => setConfirmToggle(null)
      }
    );
  };
  const columns = [
    {
      key: "name",
      label: "Compte",
      render: (account) => /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "font-medium text-white", children: account.name }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: account.email }),
        /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-slate-500", children: [
          "Code: ",
          account.code_user
        ] })
      ] })
    },
    {
      key: "shops_count",
      label: "Boutiques",
      render: (account) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-amber-300", children: [
        /* @__PURE__ */ jsx(Store, { className: "size-4" }),
        /* @__PURE__ */ jsx("span", { className: "font-semibold", children: account.shops_count })
      ] })
    },
    {
      key: "products_count",
      label: "Produits",
      render: (account) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-blue-300", children: [
        /* @__PURE__ */ jsx(Package, { className: "size-4" }),
        /* @__PURE__ */ jsx("span", { className: "font-semibold", children: account.products_count })
      ] })
    },
    {
      key: "status",
      label: "Statut",
      render: (account) => /* @__PURE__ */ jsx(TableBadge, { variant: account.is_active ? "success" : "danger", children: account.is_active ? "Actif" : "Inactif" })
    },
    {
      key: "created_at",
      label: "Créé le",
      render: (account) => /* @__PURE__ */ jsx("span", { className: "text-sm text-slate-400", children: account.created_at })
    },
    {
      key: "actions",
      label: "Actions",
      render: (account) => /* @__PURE__ */ jsx(TableActions, { children: /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => setConfirmToggle(account.id),
          className: `rounded-lg p-2 transition ${account.is_active ? "text-red-300 hover:bg-red-500/10" : "text-emerald-300 hover:bg-emerald-500/10"}`,
          title: account.is_active ? "Désactiver" : "Activer",
          children: /* @__PURE__ */ jsx(Power, { className: "size-4" })
        }
      ) })
    }
  ];
  return /* @__PURE__ */ jsxs(
    Authenticated,
    {
      header: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-white", children: "Gestion des comptes" }),
        /* @__PURE__ */ jsx(
          Link_default,
          {
            href: route("platform.dashboard"),
            className: "text-sm text-amber-300 hover:text-amber-200",
            children: "← Retour au dashboard"
          }
        )
      ] }),
      children: [
        /* @__PURE__ */ jsx(Head_default, { title: "Comptes - Admin Plateforme" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [
            /* @__PURE__ */ jsx("form", { onSubmit: handleSearch, className: "flex-1", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: searchTerm,
                  onChange: (e) => setSearchTerm(e.target.value),
                  placeholder: "Rechercher par nom, email ou code...",
                  className: "w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-300/20"
                }
              )
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => handleStatusFilter(""),
                  className: `rounded-lg px-3 py-2 text-sm transition ${!filters.status ? "bg-amber-300 text-slate-950" : "border border-white/10 text-slate-300 hover:bg-white/5"}`,
                  children: "Tous"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => handleStatusFilter("active"),
                  className: `rounded-lg px-3 py-2 text-sm transition ${filters.status === "active" ? "bg-amber-300 text-slate-950" : "border border-white/10 text-slate-300 hover:bg-white/5"}`,
                  children: "Actifs"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => handleStatusFilter("inactive"),
                  className: `rounded-lg px-3 py-2 text-sm transition ${filters.status === "inactive" ? "bg-amber-300 text-slate-950" : "border border-white/10 text-slate-300 hover:bg-white/5"}`,
                  children: "Inactifs"
                }
              )
            ] })
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-4 sm:grid-cols-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-white/10 bg-white/5 p-4", children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: "Total comptes" }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 text-2xl font-bold text-white", children: accounts.total })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-white/10 bg-white/5 p-4", children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: "Sur cette page" }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 text-2xl font-bold text-white", children: accounts.data.length })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-white/10 bg-white/5 p-4", children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: "Page actuelle" }),
              /* @__PURE__ */ jsxs("p", { className: "mt-1 text-2xl font-bold text-white", children: [
                accounts.current_page,
                " / ",
                accounts.last_page
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            Table,
            {
              columns,
              data: accounts.data,
              emptyMessage: "Aucun compte trouvé."
            }
          )
        ] }),
        confirmToggle && /* @__PURE__ */ jsx(
          ConfirmDeleteModal,
          {
            show: true,
            onClose: () => setConfirmToggle(null),
            onConfirm: () => toggleAccountStatus(confirmToggle),
            title: "Changer le statut du compte",
            message: "Êtes-vous sûr de vouloir changer le statut de ce compte ? Cela affectera l'accès à toutes ses boutiques."
          }
        )
      ]
    }
  );
}
export {
  PlatformAdminAccounts as default
};
