import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { H as Head_default } from "../ssr.js";
import { useState, useEffect } from "react";
import { W as WelcomeHeader, a as WelcomeFooter } from "./WelcomeFooter-GrwIbVm2.js";
import { ArrowLeft, Tag, User, Calendar } from "lucide-react";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
import "framer-motion";
function SeoHead({
  title,
  description,
  ogImage = "https://batixpro.com/og-image.jpg",
  ogLocale = "fr_FR",
  canonical,
  noIndex = false,
  ogType = "website",
  publishedAt,
  author
}) {
  const fullTitle = `${title} | BATIX PRO`;
  return /* @__PURE__ */ jsxs(Head_default, { children: [
    /* @__PURE__ */ jsx("title", { children: fullTitle }),
    /* @__PURE__ */ jsx("meta", { name: "description", content: description }),
    noIndex && /* @__PURE__ */ jsx("meta", { name: "robots", content: "noindex,nofollow" }),
    canonical && /* @__PURE__ */ jsx("link", { rel: "canonical", href: canonical }),
    /* @__PURE__ */ jsx("meta", { property: "og:title", content: fullTitle }),
    /* @__PURE__ */ jsx("meta", { property: "og:description", content: description }),
    /* @__PURE__ */ jsx("meta", { property: "og:image", content: ogImage }),
    /* @__PURE__ */ jsx("meta", { property: "og:type", content: ogType }),
    /* @__PURE__ */ jsx("meta", { property: "og:locale", content: ogLocale }),
    /* @__PURE__ */ jsx("meta", { property: "og:site_name", content: "BATIX PRO" }),
    canonical && /* @__PURE__ */ jsx("meta", { property: "og:url", content: canonical }),
    ogType === "article" && publishedAt && /* @__PURE__ */ jsx("meta", { property: "article:published_time", content: publishedAt }),
    ogType === "article" && author && /* @__PURE__ */ jsx("meta", { property: "article:author", content: author }),
    /* @__PURE__ */ jsx("meta", { name: "twitter:card", content: "summary_large_image" }),
    /* @__PURE__ */ jsx("meta", { name: "twitter:title", content: fullTitle }),
    /* @__PURE__ */ jsx("meta", { name: "twitter:description", content: description }),
    /* @__PURE__ */ jsx("meta", { name: "twitter:image", content: ogImage })
  ] });
}
function BlogShow({ auth, post }) {
  const [locale, setLocale] = useState("fr");
  const [scrolled] = useState(false);
  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("landing_locale") : null;
    if (saved === "en") setLocale("en");
  }, []);
  const getDashboardUrl = () => {
    if (!auth.user) return route("register");
    if (auth.user.role === "admin_platforme") return route("platform.dashboard");
    return route("register");
  };
  const postTitle = locale === "en" && post.title_en ? post.title_en : post.title_fr;
  const postContent = locale === "en" && post.content_en ? post.content_en : post.content_fr;
  const postExcerpt = locale === "en" && post.excerpt_en ? post.excerpt_en : post.excerpt_fr ?? postTitle;
  const canonicalUrl = `https://batixpro.com/blog/${post.slug}`;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      SeoHead,
      {
        title: postTitle,
        description: postExcerpt,
        ogImage: post.cover_image ? `https://batixpro.com/storage/${post.cover_image}` : void 0,
        ogLocale: locale === "fr" ? "fr_FR" : "en_US",
        canonical: canonicalUrl,
        ogType: "article",
        publishedAt: post.published_at ?? void 0,
        author: post.author_name
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-[#efe7db]", children: [
      /* @__PURE__ */ jsx(
        WelcomeHeader,
        {
          locale,
          setLocale,
          scrolled,
          getDashboardUrl,
          isAuthenticated: !!auth.user
        }
      ),
      /* @__PURE__ */ jsxs("main", { className: "mx-auto max-w-3xl px-6 py-20 lg:px-8", children: [
        /* @__PURE__ */ jsxs(
          "a",
          {
            href: "/#blog",
            className: "mb-8 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-900",
            children: [
              /* @__PURE__ */ jsx(ArrowLeft, { className: "size-4" }),
              locale === "fr" ? "Retour au blog" : "Back to blog"
            ]
          }
        ),
        post.cover_image && /* @__PURE__ */ jsx(
          "img",
          {
            src: `/storage/${post.cover_image}`,
            alt: postTitle,
            className: "mb-8 w-full rounded-2xl object-cover shadow",
            style: { maxHeight: "420px" }
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "mb-4 flex flex-wrap items-center gap-4 text-sm text-slate-500", children: [
          post.category && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700", children: [
            /* @__PURE__ */ jsx(Tag, { className: "size-3" }),
            post.category
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(User, { className: "size-4" }),
            post.author_name
          ] }),
          post.published_at && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(Calendar, { className: "size-4" }),
            new Date(post.published_at).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
              year: "numeric",
              month: "long",
              day: "numeric"
            })
          ] })
        ] }),
        /* @__PURE__ */ jsx("h1", { className: "mb-6 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl", children: postTitle }),
        /* @__PURE__ */ jsx(
          "article",
          {
            className: "prose prose-slate max-w-none prose-headings:font-bold prose-a:text-amber-700 prose-img:rounded-xl",
            dangerouslySetInnerHTML: { __html: postContent }
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "mt-14 border-t border-[#d8cfbe] pt-8", children: /* @__PURE__ */ jsxs(
          "a",
          {
            href: "/#blog",
            className: "inline-flex items-center gap-2 rounded-xl bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-amber-400",
            children: [
              /* @__PURE__ */ jsx(ArrowLeft, { className: "size-4" }),
              locale === "fr" ? "Tous les articles" : "All articles"
            ]
          }
        ) })
      ] }),
      /* @__PURE__ */ jsx(WelcomeFooter, { footerText: locale === "fr" ? "Tous droits réservés." : "All rights reserved.", nav: { demo: "Démo", features: locale === "fr" ? "Fonctionnalités" : "Features", pricing: locale === "fr" ? "Tarifs" : "Pricing", faq: "FAQ", contact: "Contact" } })
    ] })
  ] });
}
export {
  BlogShow as default
};
