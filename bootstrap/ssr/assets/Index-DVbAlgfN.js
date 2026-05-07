import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { H as Head_default, L as Link_default, r as router3 } from "../ssr.js";
import { Plus, ToggleRight, ToggleLeft, ExternalLink, Pencil, Trash2 } from "lucide-react";
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
function BlogAdminIndex({ posts }) {
  const [deleteId, setDeleteId] = useState(null);
  const handleDelete = () => {
    if (!deleteId) return;
    router3.delete(route("platform.blog.destroy", deleteId), {
      onFinish: () => setDeleteId(null)
    });
  };
  const handleToggle = (id) => {
    router3.post(route("platform.blog.toggle", id));
  };
  return /* @__PURE__ */ jsxs(Authenticated, { children: [
    /* @__PURE__ */ jsx(Head_default, { title: "Blog — Gestion des articles" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-white", children: "Blog" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-white/60", children: "Gestion des articles publiés sur le site" })
        ] }),
        /* @__PURE__ */ jsxs(
          Link_default,
          {
            href: route("platform.blog.create"),
            className: "flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-amber-300",
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "size-4" }),
              "Nouvel article"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-2xl border border-white/10 bg-white/5", children: posts.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "py-16 text-center text-white/40", children: [
        "Aucun article. ",
        /* @__PURE__ */ jsx(Link_default, { href: route("platform.blog.create"), className: "text-amber-400 underline", children: "Créer le premier" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm text-white", children: [
        /* @__PURE__ */ jsx("thead", { className: "border-b border-white/10 text-white/60", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left", children: "Article" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left", children: "Catégorie" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left", children: "Auteur" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-center", children: "Statut" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-white/10", children: posts.map((post) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-white/5 transition", children: [
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            post.cover_image ? /* @__PURE__ */ jsx(
              "img",
              {
                src: `/storage/${post.cover_image}`,
                alt: "",
                className: "size-10 rounded-lg object-cover flex-shrink-0"
              }
            ) : /* @__PURE__ */ jsx("div", { className: "flex size-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-400/20 text-xl", children: "🔧" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "font-medium leading-tight", children: post.title_fr }),
              post.title_en && /* @__PURE__ */ jsx("p", { className: "text-xs text-white/40 mt-0.5", children: post.title_en }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-white/30 mt-0.5", children: post.created_at })
            ] })
          ] }) }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-white/60", children: post.category ?? "—" }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-white/60", children: post.author_name }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-center", children: /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleToggle(post.id),
              title: post.is_published ? "Dépublier" : "Publier",
              className: "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition",
              style: {
                background: post.is_published ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.08)",
                color: post.is_published ? "#34d399" : "#9ca3af"
              },
              children: post.is_published ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(ToggleRight, { className: "size-3.5" }),
                " Publié"
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(ToggleLeft, { className: "size-3.5" }),
                " Brouillon"
              ] })
            }
          ) }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-1", children: [
            /* @__PURE__ */ jsx(
              "a",
              {
                href: route("blog.show", post.slug),
                target: "_blank",
                rel: "noopener noreferrer",
                title: "Voir sur le site",
                className: "rounded-lg p-2 text-white/40 transition hover:bg-white/10 hover:text-white",
                children: /* @__PURE__ */ jsx(ExternalLink, { className: "size-4" })
              }
            ),
            /* @__PURE__ */ jsx(
              Link_default,
              {
                href: route("platform.blog.edit", post.id),
                title: "Modifier",
                className: "rounded-lg p-2 text-white/40 transition hover:bg-white/10 hover:text-amber-400",
                children: /* @__PURE__ */ jsx(Pencil, { className: "size-4" })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setDeleteId(post.id),
                title: "Supprimer",
                className: "rounded-lg p-2 text-white/40 transition hover:bg-white/10 hover:text-red-400",
                children: /* @__PURE__ */ jsx(Trash2, { className: "size-4" })
              }
            )
          ] }) })
        ] }, post.id)) })
      ] }) }) })
    ] }),
    /* @__PURE__ */ jsx(
      ConfirmDeleteModal,
      {
        show: !!deleteId,
        onClose: () => setDeleteId(null),
        onConfirm: handleDelete,
        title: "Supprimer l'article",
        message: "Cette action est irréversible. L'article sera définitivement supprimé."
      }
    )
  ] });
}
export {
  BlogAdminIndex as default
};
