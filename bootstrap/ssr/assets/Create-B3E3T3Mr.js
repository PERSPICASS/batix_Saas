import { jsxs, jsx } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { u as useForm, H as Head_default, L as Link_default } from "../ssr.js";
import { ArrowLeft, Save } from "lucide-react";
import { R as RichEditor } from "./RichEditor-Crg2zwHV.js";
import "react";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
import "@tiptap/react";
import "@tiptap/starter-kit";
import "@tiptap/extension-placeholder";
import "@tiptap/extension-link";
function BlogCreate() {
  const { data, setData, post, processing, errors } = useForm({
    title_fr: "",
    title_en: "",
    excerpt_fr: "",
    excerpt_en: "",
    content_fr: "",
    content_en: "",
    author_name: "BATIX PRO",
    category: "",
    is_published: false,
    cover_image: null
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    post(route("platform.blog.store"), {
      forceFormData: true
    });
  };
  return /* @__PURE__ */ jsxs(Authenticated, { children: [
    /* @__PURE__ */ jsx(Head_default, { title: "Nouvel article — Blog" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsx(
          Link_default,
          {
            href: route("platform.blog.index"),
            className: "rounded-lg p-2 text-white/40 transition hover:bg-white/10 hover:text-white",
            children: /* @__PURE__ */ jsx(ArrowLeft, { className: "size-5" })
          }
        ),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-white", children: "Nouvel article" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-white/60", children: "Rédigez et publiez un article de blog" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("form", { onSubmit: handleSubmit, className: "space-y-6", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-3", children: [
        /* @__PURE__ */ jsx("div", { className: "space-y-5 lg:col-span-2", children: /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-sm font-semibold uppercase tracking-wider text-white/40", children: "Contenu" }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-5 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsx(Field, { label: "Titre (FR) *", error: errors.title_fr, children: /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: data.title_fr,
                onChange: (e) => setData("title_fr", e.target.value),
                placeholder: "Titre en français",
                className: inputClass(!!errors.title_fr)
              }
            ) }),
            /* @__PURE__ */ jsx(Field, { label: "Titre (EN)", error: errors.title_en, children: /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: data.title_en,
                onChange: (e) => setData("title_en", e.target.value),
                placeholder: "Title in English",
                className: inputClass(false)
              }
            ) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-5 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsx(Field, { label: "Extrait (FR)", error: errors.excerpt_fr, children: /* @__PURE__ */ jsx(
              "textarea",
              {
                rows: 3,
                value: data.excerpt_fr,
                onChange: (e) => setData("excerpt_fr", e.target.value),
                placeholder: "Résumé court en français...",
                className: inputClass(false)
              }
            ) }),
            /* @__PURE__ */ jsx(Field, { label: "Extrait (EN)", error: errors.excerpt_en, children: /* @__PURE__ */ jsx(
              "textarea",
              {
                rows: 3,
                value: data.excerpt_en,
                onChange: (e) => setData("excerpt_en", e.target.value),
                placeholder: "Short summary in English...",
                className: inputClass(false)
              }
            ) })
          ] }),
          /* @__PURE__ */ jsx(Field, { label: "Contenu (FR) *", error: errors.content_fr, children: /* @__PURE__ */ jsx(
            RichEditor,
            {
              value: data.content_fr,
              onChange: (v) => setData("content_fr", v),
              placeholder: "Contenu de l'article en français...",
              rows: 14
            }
          ) }),
          /* @__PURE__ */ jsx(Field, { label: "Contenu (EN)", error: errors.content_en, children: /* @__PURE__ */ jsx(
            RichEditor,
            {
              value: data.content_en,
              onChange: (v) => setData("content_en", v),
              placeholder: "Article content in English...",
              rows: 14
            }
          ) })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-sm font-semibold uppercase tracking-wider text-white/40", children: "Paramètres" }),
            /* @__PURE__ */ jsx(Field, { label: "Auteur", error: errors.author_name, children: /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: data.author_name,
                onChange: (e) => setData("author_name", e.target.value),
                className: inputClass(false)
              }
            ) }),
            /* @__PURE__ */ jsx(Field, { label: "Catégorie", error: errors.category, children: /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: data.category,
                onChange: (e) => setData("category", e.target.value),
                placeholder: "ex. Conseils, Actualités...",
                className: inputClass(false)
              }
            ) }),
            /* @__PURE__ */ jsx(Field, { label: "Image de couverture", error: errors.cover_image, children: /* @__PURE__ */ jsx(
              "input",
              {
                type: "file",
                accept: "image/*",
                onChange: (e) => setData("cover_image", e.target.files?.[0] ?? null),
                className: "block w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-400 file:px-3 file:py-1 file:text-xs file:font-medium file:text-slate-900"
              }
            ) }),
            /* @__PURE__ */ jsxs("label", { className: "flex cursor-pointer items-center gap-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "checkbox",
                    checked: data.is_published,
                    onChange: (e) => setData("is_published", e.target.checked),
                    className: "sr-only"
                  }
                ),
                /* @__PURE__ */ jsx("div", { className: `h-5 w-9 rounded-full transition ${data.is_published ? "bg-emerald-500" : "bg-white/20"}`, children: /* @__PURE__ */ jsx("div", { className: `absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform ${data.is_published ? "translate-x-4" : "translate-x-0.5"}` }) })
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-sm text-white/70", children: "Publier immédiatement" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "submit",
              disabled: processing,
              className: "flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-amber-300 disabled:opacity-50",
              children: [
                /* @__PURE__ */ jsx(Save, { className: "size-4" }),
                processing ? "Enregistrement..." : "Créer l'article"
              ]
            }
          )
        ] })
      ] }) })
    ] })
  ] });
}
function Field({ label, error, children }) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
    /* @__PURE__ */ jsx("label", { className: "block text-xs font-medium text-white/60", children: label }),
    children,
    error && /* @__PURE__ */ jsx("p", { className: "text-xs text-red-400", children: error })
  ] });
}
function inputClass(hasError) {
  return `block w-full rounded-xl border ${hasError ? "border-red-500/60" : "border-white/10"} bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/30 transition`;
}
export {
  BlogCreate as default
};
