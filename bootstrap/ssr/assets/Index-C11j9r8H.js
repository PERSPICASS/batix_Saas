import { jsxs, jsx } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { H as Head_default, r as router3 } from "../ssr.js";
import { Search, Filter, History, Activity, User, Clock } from "lucide-react";
import { useState } from "react";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
function Index({ activities, filters, filterOptions }) {
  const [search, setSearch] = useState(filters.search || "");
  const [showFilters, setShowFilters] = useState(false);
  const handleSearch = () => {
    router3.get(route("activity-logs.index"), {
      ...filters,
      search
    }, {
      preserveState: true,
      preserveScroll: true
    });
  };
  const handleFilter = (key, value) => {
    router3.get(route("activity-logs.index"), {
      ...filters,
      [key]: value
    }, {
      preserveState: true,
      preserveScroll: true
    });
  };
  const clearFilters = () => {
    router3.get(route("activity-logs.index"), {}, {
      preserveState: true,
      preserveScroll: true
    });
    setSearch("");
  };
  const getActionColor = (action) => {
    const colors = {
      "created": "text-green-400 bg-green-400/10",
      "updated": "text-blue-400 bg-blue-400/10",
      "deleted": "text-red-400 bg-red-400/10",
      "viewed": "text-slate-400 bg-slate-400/10",
      "login": "text-emerald-400 bg-emerald-400/10",
      "logout": "text-orange-400 bg-orange-400/10",
      "lock": "text-amber-400 bg-amber-400/10",
      "unlock": "text-green-400 bg-green-400/10"
    };
    return colors[action] || "text-slate-400 bg-slate-400/10";
  };
  return /* @__PURE__ */ jsxs(
    Authenticated,
    {
      header: /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10", children: /* @__PURE__ */ jsx(History, { className: "size-5 text-blue-400" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-white", children: "Historique des Activités" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: "Suivez toutes les actions effectuées dans vos boutiques" })
        ] })
      ] }) }),
      children: [
        /* @__PURE__ */ jsx(Head_default, { title: "Historique" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-white/10 bg-slate-900/50 p-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [
              /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
                /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    placeholder: "Rechercher par description, utilisateur...",
                    value: search,
                    onChange: (e) => setSearch(e.target.value),
                    onKeyPress: (e) => e.key === "Enter" && handleSearch(),
                    className: "w-full rounded-lg border border-white/10 bg-slate-800/50 py-2 pl-10 pr-4 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => setShowFilters(!showFilters),
                    className: "flex items-center gap-2 rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-sm text-white hover:bg-slate-800 transition",
                    children: [
                      /* @__PURE__ */ jsx(Filter, { className: "size-4" }),
                      /* @__PURE__ */ jsx("span", { children: "Filtres" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: handleSearch,
                    className: "flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition",
                    children: [
                      /* @__PURE__ */ jsx(Search, { className: "size-4" }),
                      /* @__PURE__ */ jsx("span", { children: "Rechercher" })
                    ]
                  }
                )
              ] })
            ] }),
            showFilters && /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-4 sm:grid-cols-3 border-t border-white/10 pt-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-300 mb-2", children: "Utilisateur" }),
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    value: filters.user_id || "",
                    onChange: (e) => handleFilter("user_id", e.target.value),
                    className: "w-full rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "", children: "Tous les utilisateurs" }),
                      filterOptions.users.map((user) => /* @__PURE__ */ jsxs("option", { value: user.id, children: [
                        user.name,
                        " (",
                        user.email,
                        ")"
                      ] }, user.id))
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-300 mb-2", children: "Action" }),
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    value: filters.action || "",
                    onChange: (e) => handleFilter("action", e.target.value),
                    className: "w-full rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "", children: "Toutes les actions" }),
                      filterOptions.actions.map((action) => /* @__PURE__ */ jsx("option", { value: action.value, children: action.label }, action.value))
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-300 mb-2", children: "Type" }),
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    value: filters.subject_type || "",
                    onChange: (e) => handleFilter("subject_type", e.target.value),
                    className: "w-full rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "", children: "Tous les types" }),
                      filterOptions.subjectTypes.map((type) => /* @__PURE__ */ jsx("option", { value: type.value, children: type.label }, type.value))
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsx("div", { className: "sm:col-span-3 flex justify-end", children: /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: clearFilters,
                  className: "text-sm text-slate-400 hover:text-white transition",
                  children: "Réinitialiser les filtres"
                }
              ) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-white/10 bg-slate-900/50", children: [
            activities.data.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-16 px-6", children: [
              /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/50 mb-4", children: /* @__PURE__ */ jsx(History, { className: "size-8 text-slate-400" }) }),
              /* @__PURE__ */ jsx("p", { className: "text-lg font-medium text-slate-300 mb-2", children: "Aucune activité trouvée" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: "Aucune activité ne correspond à vos critères de recherche" })
            ] }) : /* @__PURE__ */ jsx("div", { className: "divide-y divide-white/10", children: activities.data.map((activity) => /* @__PURE__ */ jsx("div", { className: "p-4 hover:bg-white/5 transition", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center w-10 h-10 rounded-lg bg-slate-800/50 shrink-0", children: /* @__PURE__ */ jsx(Activity, { className: "size-5 text-blue-400" }) }),
              /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4 mb-2", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
                    /* @__PURE__ */ jsx("span", { className: `inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getActionColor(activity.action)}`, children: activity.action_label }),
                    activity.subject_label && /* @__PURE__ */ jsxs("span", { className: "text-sm text-slate-400", children: [
                      "· ",
                      activity.subject_label
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-500 whitespace-nowrap", children: activity.created_at_human })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-300 mb-2", children: activity.description }),
                activity.changes_summary && /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mb-2", children: activity.changes_summary }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 text-xs text-slate-500", children: [
                  /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
                    /* @__PURE__ */ jsx(User, { className: "size-3" }),
                    activity.user.name
                  ] }),
                  /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
                    /* @__PURE__ */ jsx(Clock, { className: "size-3" }),
                    activity.created_at
                  ] }),
                  activity.ip_address && /* @__PURE__ */ jsxs("span", { children: [
                    "IP: ",
                    activity.ip_address
                  ] })
                ] })
              ] })
            ] }) }, activity.id)) }),
            activities.links.length > 3 && /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center gap-2 border-t border-white/10 p-4", children: activities.links.map((link, index) => /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => link.url && router3.visit(link.url),
                disabled: !link.url,
                className: `px-3 py-1 rounded text-sm transition ${link.active ? "bg-blue-500 text-white" : link.url ? "text-slate-400 hover:bg-slate-800" : "text-slate-600 cursor-not-allowed"}`,
                dangerouslySetInnerHTML: { __html: link.label }
              },
              index
            )) })
          ] })
        ] })
      ]
    }
  );
}
export {
  Index as default
};
