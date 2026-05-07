import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { L as Link_default, a as usePage, H as Head_default } from "../ssr.js";
import { useState, useRef, useEffect, useMemo } from "react";
import { s as stagger, f as fadeUp, h as heroSlides, b as featuresByLocale, c as faqsByLocale, t as trustMarksByLocale, d as copy, e as fallbackPlansByLocale, W as WelcomeHeader, a as WelcomeFooter } from "./WelcomeFooter-GrwIbVm2.js";
import { motion, AnimatePresence } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { Tag, User, Calendar, ArrowRight, Mail, MessageCircle, CheckCircle2, Send, Clock, ChevronDown, PlayCircle, CircleHelp, Sparkles, Check, Star, ShieldCheck } from "lucide-react";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
function BlogSection({ locale, posts = [] }) {
  const safePosts = posts ?? [];
  const getTitle = (post) => locale === "en" && post.title_en ? post.title_en : post.title_fr;
  const getExcerpt = (post) => locale === "en" && post.excerpt_en ? post.excerpt_en : post.excerpt_fr;
  return /* @__PURE__ */ jsx(
    motion.section,
    {
      id: "blog",
      className: "w-full scroll-mt-24 bg-[#efe7db] py-16 md:py-20",
      initial: "hidden",
      whileInView: "show",
      viewport: { once: false, amount: 0.05 },
      variants: stagger,
      children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-6 lg:px-8", children: [
        /* @__PURE__ */ jsxs(motion.div, { className: "mb-10", variants: fadeUp, children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.22em] text-amber-700", children: locale === "fr" ? "Ressources" : "Resources" }),
          /* @__PURE__ */ jsx("h2", { className: "mt-2 text-3xl font-bold text-slate-900 sm:text-4xl", children: locale === "fr" ? "Blog & Conseils" : "Blog & Tips" }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 max-w-2xl text-base text-slate-600", children: locale === "fr" ? "Conseils pratiques, actualités et guides pour mieux gérer votre quincaillerie au quotidien." : "Practical tips, news and guides to better manage your hardware store day to day." })
        ] }),
        safePosts.length === 0 ? /* @__PURE__ */ jsx(
          motion.div,
          {
            variants: fadeUp,
            className: "rounded-2xl border border-dashed border-[#c8bfaf] bg-white/40 py-16 text-center text-slate-500",
            children: /* @__PURE__ */ jsx("p", { className: "text-base", children: locale === "fr" ? "Bientôt disponible — nos premiers articles arrivent." : "Coming soon — our first articles are on the way." })
          }
        ) : /* @__PURE__ */ jsx(
          motion.div,
          {
            className: "grid gap-6 sm:grid-cols-2 lg:grid-cols-3",
            variants: stagger,
            children: safePosts.map((post) => /* @__PURE__ */ jsx(motion.div, { variants: fadeUp, children: /* @__PURE__ */ jsxs(
              Link_default,
              {
                href: route("blog.show", post.slug),
                className: "group flex h-full flex-col overflow-hidden rounded-2xl border border-[#d8cfbe] bg-white/80 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
                children: [
                  post.cover_image ? /* @__PURE__ */ jsx(
                    "img",
                    {
                      src: `/storage/${post.cover_image}`,
                      alt: getTitle(post),
                      className: "h-44 w-full object-cover"
                    }
                  ) : /* @__PURE__ */ jsx("div", { className: "flex h-44 items-center justify-center bg-amber-100 text-4xl", children: "🔧" }),
                  /* @__PURE__ */ jsxs("div", { className: "flex flex-1 flex-col gap-3 p-5", children: [
                    post.category && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-xs font-medium text-amber-700", children: [
                      /* @__PURE__ */ jsx(Tag, { className: "size-3" }),
                      post.category
                    ] }),
                    /* @__PURE__ */ jsx("h3", { className: "text-base font-semibold leading-snug text-slate-900 transition group-hover:text-amber-700", children: getTitle(post) }),
                    getExcerpt(post) && /* @__PURE__ */ jsx("p", { className: "line-clamp-2 text-sm text-slate-600", children: getExcerpt(post) }),
                    /* @__PURE__ */ jsxs("div", { className: "mt-auto flex items-center justify-between pt-3 text-xs text-slate-400", children: [
                      /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
                        /* @__PURE__ */ jsx(User, { className: "size-3" }),
                        post.author_name
                      ] }),
                      post.published_at && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
                        /* @__PURE__ */ jsx(Calendar, { className: "size-3" }),
                        new Date(post.published_at).toLocaleDateString(
                          locale === "fr" ? "fr-FR" : "en-US",
                          { year: "numeric", month: "short", day: "numeric" }
                        )
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-sm font-medium text-amber-700", children: [
                      locale === "fr" ? "Lire l'article" : "Read more",
                      /* @__PURE__ */ jsx(ArrowRight, { className: "size-4 transition-transform group-hover:translate-x-1" })
                    ] })
                  ] })
                ]
              }
            ) }, post.id))
          }
        )
      ] })
    }
  );
}
const contactBackground = "/build/assets/smiling-worker-holding-mallet-in-hardware-store-ai-2026-01-06-18-15-56-utc-p5TPLvoq.jpg";
function ContactSection({ locale, t, getDashboardUrl }) {
  const f = t.contact.form;
  const pageProps = usePage().props;
  const csrfToken = pageProps.csrf_token ?? document.querySelector('meta[name="csrf-token"]')?.content ?? "";
  const whatsappNumber = pageProps.whatsapp_number ?? "+2250565759428";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const honeypotRef = useRef(null);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setErrorMsg("");
    setFieldErrors({});
    try {
      const res = await fetch("/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": csrfToken,
          Accept: "application/json"
        },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
          honeypot: honeypotRef.current?.value ?? ""
        })
      });
      const data = await res.json();
      if (res.status === 422 && data?.errors) {
        const flat = {};
        for (const [field, msgs] of Object.entries(data.errors)) {
          flat[field] = msgs[0];
        }
        setFieldErrors(flat);
        setStatus("idle");
        return;
      }
      if (!res.ok) throw new Error(data?.message ?? f.errorText);
      setStatus("success");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : f.errorText);
    }
  };
  return /* @__PURE__ */ jsxs("section", { id: "contact", className: "w-full scroll-mt-24 bg-[#f5efe4]", children: [
    /* @__PURE__ */ jsx(
      motion.div,
      {
        className: "mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24",
        initial: "hidden",
        whileInView: "show",
        viewport: { once: false, amount: 0.08 },
        variants: stagger,
        children: /* @__PURE__ */ jsxs("div", { className: "overflow-hidden rounded-3xl shadow-2xl lg:grid lg:grid-cols-5", children: [
          /* @__PURE__ */ jsxs(
            motion.div,
            {
              variants: fadeUp,
              className: "flex flex-col justify-between bg-slate-900 px-8 py-12 lg:col-span-2 lg:px-10 lg:py-14",
              children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { className: "inline-block rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-amber-400", children: "Contact" }),
                  /* @__PURE__ */ jsxs("h2", { className: "mt-5 text-3xl font-extrabold leading-tight text-white lg:text-4xl", children: [
                    f.heading.split("?")[0],
                    "?",
                    /* @__PURE__ */ jsx("br", {}),
                    f.heading.split("?")[1]?.trim()
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "mt-3 text-base text-slate-400", children: f.subheading }),
                  /* @__PURE__ */ jsx("div", { className: "mt-5 h-px w-12 rounded-full bg-amber-400" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mt-12 flex flex-col gap-4", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-widest text-slate-500", children: f.contactInfo }),
                  /* @__PURE__ */ jsxs(
                    "a",
                    {
                      href: "mailto:contact@batixpro.com",
                      className: "group inline-flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-slate-200 transition hover:border-amber-400/40 hover:bg-amber-400/10 hover:text-white",
                      children: [
                        /* @__PURE__ */ jsx("span", { className: "inline-flex shrink-0 rounded-xl bg-amber-400/15 p-2.5 text-amber-400 transition group-hover:bg-amber-400/25", children: /* @__PURE__ */ jsx(Mail, { className: "size-4" }) }),
                        "contact@batixpro.com"
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxs(
                    "a",
                    {
                      href: `https://wa.me/${whatsappNumber.replace(/\D/g, "")}`,
                      target: "_blank",
                      rel: "noopener noreferrer",
                      className: "group inline-flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-slate-200 transition hover:border-green-400/40 hover:bg-green-400/10 hover:text-white",
                      children: [
                        /* @__PURE__ */ jsx("span", { className: "inline-flex shrink-0 rounded-xl bg-green-400/15 p-2.5 text-green-400 transition group-hover:bg-green-400/25", children: /* @__PURE__ */ jsx(MessageCircle, { className: "size-4" }) }),
                        "WhatsApp"
                      ]
                    }
                  )
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            motion.div,
            {
              variants: fadeUp,
              className: "bg-white px-8 py-12 lg:col-span-3 lg:px-12 lg:py-14",
              children: status === "success" ? /* @__PURE__ */ jsxs("div", { className: "flex h-full flex-col items-center justify-center gap-5 py-10 text-center", children: [
                /* @__PURE__ */ jsx("div", { className: "flex size-20 items-center justify-center rounded-full bg-emerald-50", children: /* @__PURE__ */ jsx(CheckCircle2, { className: "size-10 text-emerald-500" }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h3", { className: "text-2xl font-extrabold text-slate-900", children: f.successTitle }),
                  /* @__PURE__ */ jsx("p", { className: "mt-2 text-slate-500", children: f.successText })
                ] }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => setStatus("idle"),
                    className: "mt-2 rounded-xl border border-[#ddd0bb] px-6 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-amber-400 hover:text-amber-700",
                    children: locale === "fr" ? "Envoyer un autre message" : "Send another message"
                  }
                )
              ] }) : /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, noValidate: true, className: "flex flex-col gap-6", children: [
                /* @__PURE__ */ jsx("input", { ref: honeypotRef, type: "text", name: "honeypot", tabIndex: -1, "aria-hidden": "true", className: "hidden", autoComplete: "off" }),
                /* @__PURE__ */ jsxs("div", { className: "grid gap-5 sm:grid-cols-2", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsxs("label", { className: "mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500", children: [
                      f.name,
                      " ",
                      /* @__PURE__ */ jsx("span", { className: "text-amber-500", children: "*" })
                    ] }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "text",
                        value: name,
                        onChange: (e) => {
                          setName(e.target.value);
                          setFieldErrors((p) => ({ ...p, name: "" }));
                        },
                        required: true,
                        minLength: 2,
                        className: `w-full rounded-xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-amber-400/20 ${fieldErrors.name ? "border-red-400 bg-red-50 focus:border-red-400" : "border-[#ddd0bb] bg-[#fdf9f4] focus:border-amber-400"}`,
                        placeholder: "Jean Dupont"
                      }
                    ),
                    fieldErrors.name && /* @__PURE__ */ jsxs("p", { className: "mt-1.5 flex items-center gap-1 text-xs text-red-500", children: [
                      /* @__PURE__ */ jsx("span", { children: "⚠" }),
                      fieldErrors.name
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsxs("label", { className: "mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500", children: [
                      f.email,
                      " ",
                      /* @__PURE__ */ jsx("span", { className: "text-amber-500", children: "*" })
                    ] }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "email",
                        value: email,
                        onChange: (e) => {
                          setEmail(e.target.value);
                          setFieldErrors((p) => ({ ...p, email: "" }));
                        },
                        required: true,
                        className: `w-full rounded-xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-amber-400/20 ${fieldErrors.email ? "border-red-400 bg-red-50 focus:border-red-400" : "border-[#ddd0bb] bg-[#fdf9f4] focus:border-amber-400"}`,
                        placeholder: "jean@exemple.com"
                      }
                    ),
                    fieldErrors.email && /* @__PURE__ */ jsxs("p", { className: "mt-1.5 flex items-center gap-1 text-xs text-red-500", children: [
                      /* @__PURE__ */ jsx("span", { children: "⚠" }),
                      fieldErrors.email
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsxs("label", { className: "mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500", children: [
                    f.subject,
                    " ",
                    /* @__PURE__ */ jsx("span", { className: "text-amber-500", children: "*" })
                  ] }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      value: subject,
                      onChange: (e) => {
                        setSubject(e.target.value);
                        setFieldErrors((p) => ({ ...p, subject: "" }));
                      },
                      required: true,
                      minLength: 3,
                      className: `w-full rounded-xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-amber-400/20 ${fieldErrors.subject ? "border-red-400 bg-red-50 focus:border-red-400" : "border-[#ddd0bb] bg-[#fdf9f4] focus:border-amber-400"}`,
                      placeholder: f.subjectPlaceholder
                    }
                  ),
                  fieldErrors.subject && /* @__PURE__ */ jsxs("p", { className: "mt-1.5 flex items-center gap-1 text-xs text-red-500", children: [
                    /* @__PURE__ */ jsx("span", { children: "⚠" }),
                    fieldErrors.subject
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsxs("label", { className: "mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500", children: [
                    "Message ",
                    /* @__PURE__ */ jsx("span", { className: "text-amber-500", children: "*" })
                  ] }),
                  /* @__PURE__ */ jsx(
                    "textarea",
                    {
                      value: message,
                      onChange: (e) => {
                        setMessage(e.target.value);
                        setFieldErrors((p) => ({ ...p, message: "" }));
                      },
                      required: true,
                      minLength: 10,
                      rows: 5,
                      className: `w-full resize-none rounded-xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-amber-400/20 ${fieldErrors.message ? "border-red-400 bg-red-50 focus:border-red-400" : "border-[#ddd0bb] bg-[#fdf9f4] focus:border-amber-400"}`,
                      placeholder: f.messagePlaceholder
                    }
                  ),
                  fieldErrors.message && /* @__PURE__ */ jsxs("p", { className: "mt-1.5 flex items-center gap-1 text-xs text-red-500", children: [
                    /* @__PURE__ */ jsx("span", { children: "⚠" }),
                    fieldErrors.message
                  ] })
                ] }),
                status === "error" && /* @__PURE__ */ jsxs("p", { className: "rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600", children: [
                  "⚠ ",
                  errorMsg || f.errorText
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-4 pt-1", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: locale === "fr" ? "Réponse sous 24h garantie" : "Reply within 24h guaranteed" }),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "submit",
                      disabled: status === "sending",
                      className: "inline-flex shrink-0 items-center gap-2 rounded-xl bg-amber-400 px-7 py-3.5 font-bold text-slate-900 shadow-md transition hover:bg-amber-300 hover:shadow-lg active:scale-95 disabled:opacity-60",
                      children: status === "sending" ? /* @__PURE__ */ jsxs(Fragment, { children: [
                        /* @__PURE__ */ jsxs("svg", { className: "size-4 animate-spin", viewBox: "0 0 24 24", fill: "none", children: [
                          /* @__PURE__ */ jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
                          /* @__PURE__ */ jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8v8z" })
                        ] }),
                        f.sending
                      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                        /* @__PURE__ */ jsx(Send, { className: "size-4" }),
                        f.submit
                      ] })
                    }
                  )
                ] })
              ] })
            }
          )
        ] })
      }
    ),
    /* @__PURE__ */ jsx(
      motion.div,
      {
        className: "w-full bg-cover bg-center py-10 md:py-14",
        style: { backgroundImage: `linear-gradient(120deg, rgba(15, 23, 42, 0.76), rgba(51, 65, 85, 0.58)), url(${contactBackground})` },
        initial: { opacity: 0, y: 30 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 0.6 },
        children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-7xl px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "rounded-3xl bg-black/20 p-10 text-center shadow-xl backdrop-blur-[2px]", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-3xl font-extrabold text-white sm:text-4xl", children: t.contact.title }),
          /* @__PURE__ */ jsx("p", { className: "mx-auto mt-3 max-w-2xl text-slate-100", children: t.contact.description }),
          /* @__PURE__ */ jsxs(
            "a",
            {
              href: getDashboardUrl(),
              className: "mt-8 inline-flex items-center gap-2 rounded-xl bg-amber-300 px-7 py-4 font-bold text-slate-900 shadow-md transition hover:bg-amber-200 hover:shadow-lg",
              children: [
                t.contact.cta,
                /* @__PURE__ */ jsx(ArrowRight, { className: "size-4" })
              ]
            }
          )
        ] }) })
      }
    )
  ] });
}
function DemoSection({ locale, t, getDashboardUrl }) {
  const [openId, setOpenId] = useState(t.videoFaqs[0]?.id ?? null);
  const toggle = (id) => {
    setOpenId((current) => current === id ? null : id);
  };
  return /* @__PURE__ */ jsx(
    motion.section,
    {
      id: "demo",
      className: "w-full scroll-mt-24 bg-white py-10 md:py-14",
      initial: "hidden",
      whileInView: "show",
      viewport: { once: true, amount: 0.15 },
      variants: stagger,
      children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-6 lg:px-8", children: [
        /* @__PURE__ */ jsxs(motion.div, { className: "mb-8", variants: fadeUp, children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.22em] text-amber-700", children: locale === "fr" ? "Tutoriels video" : "Video tutorials" }),
          /* @__PURE__ */ jsx("h2", { className: "mt-2 text-3xl font-extrabold text-slate-900", children: t.demo.sectionTitle }),
          /* @__PURE__ */ jsx("div", { className: "mt-3 h-1 w-12 rounded-full bg-amber-400" }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 max-w-xl text-slate-600", children: t.demo.sectionSubtitle })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-4 lg:grid-cols-12", children: [
          /* @__PURE__ */ jsxs(motion.div, { className: "space-y-2 lg:col-span-5", variants: fadeUp, children: [
            t.videoFaqs.map((item, index) => {
              const isOpen = openId === item.id;
              return /* @__PURE__ */ jsxs(
                "div",
                {
                  className: `overflow-hidden rounded-2xl border transition-all duration-200 ${isOpen ? "border-slate-900 bg-slate-900 shadow-lg" : "border-[#d6c9b2] bg-[#fbf7ef] hover:border-amber-300"}`,
                  children: [
                    /* @__PURE__ */ jsxs(
                      "button",
                      {
                        type: "button",
                        onClick: () => toggle(item.id),
                        className: "flex w-full items-center gap-3 px-5 py-4 text-left",
                        children: [
                          /* @__PURE__ */ jsx("span", { className: `flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${isOpen ? "bg-amber-300 text-slate-900" : "bg-slate-100 text-slate-600"}`, children: index + 1 }),
                          /* @__PURE__ */ jsxs("span", { className: "flex-1", children: [
                            /* @__PURE__ */ jsx("span", { className: `block text-sm font-semibold leading-snug ${isOpen ? "text-white" : "text-slate-800"}`, children: item.question }),
                            /* @__PURE__ */ jsxs("span", { className: `mt-1 flex items-center gap-1 text-xs ${isOpen ? "text-amber-300" : "text-slate-400"}`, children: [
                              /* @__PURE__ */ jsx(Clock, { className: "size-3" }),
                              item.duration
                            ] })
                          ] }),
                          /* @__PURE__ */ jsx(ChevronDown, { className: `size-4 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 text-amber-300" : "text-slate-400"}` })
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsx(AnimatePresence, { initial: false, children: isOpen && /* @__PURE__ */ jsx(
                      motion.div,
                      {
                        initial: { height: 0, opacity: 0 },
                        animate: { height: "auto", opacity: 1 },
                        exit: { height: 0, opacity: 0 },
                        transition: { duration: 0.25 },
                        className: "lg:hidden",
                        children: /* @__PURE__ */ jsx("div", { className: "mx-4 mb-4 overflow-hidden rounded-xl", children: /* @__PURE__ */ jsx("div", { className: "aspect-video", children: /* @__PURE__ */ jsx(
                          "iframe",
                          {
                            className: "h-full w-full",
                            src: `${item.url}?autoplay=1&mute=1`,
                            title: item.question,
                            loading: "lazy",
                            allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
                            allowFullScreen: true
                          }
                        ) }) })
                      },
                      "mobile-video"
                    ) })
                  ]
                },
                item.id
              );
            }),
            /* @__PURE__ */ jsx("div", { className: "pt-3", children: /* @__PURE__ */ jsxs(
              Link_default,
              {
                href: getDashboardUrl(),
                className: "inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 font-bold text-slate-900 shadow-sm transition hover:bg-amber-300",
                children: [
                  t.demo.cta,
                  /* @__PURE__ */ jsx(ArrowRight, { className: "size-4" })
                ]
              }
            ) })
          ] }),
          /* @__PURE__ */ jsx(motion.div, { className: "hidden lg:col-span-7 lg:block", variants: fadeUp, children: /* @__PURE__ */ jsx("div", { className: "sticky top-28 overflow-hidden rounded-3xl border border-[#d6c9b2] bg-slate-900 shadow-2xl", children: openId ? (() => {
            const active = t.videoFaqs.find((v) => v.id === openId);
            if (!active) return null;
            return /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 border-b border-white/10 px-5 py-3", children: [
                /* @__PURE__ */ jsx(PlayCircle, { className: "size-4 shrink-0 text-amber-300" }),
                /* @__PURE__ */ jsx("p", { className: "truncate text-sm font-medium text-white", children: active.question }),
                /* @__PURE__ */ jsxs("span", { className: "ml-auto flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-xs text-amber-200", children: [
                  /* @__PURE__ */ jsx(Clock, { className: "size-3" }),
                  active.duration
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "aspect-video", children: /* @__PURE__ */ jsx(
                "iframe",
                {
                  className: "h-full w-full",
                  src: `${active.url}?autoplay=1&mute=1`,
                  title: active.question,
                  loading: "lazy",
                  allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
                  allowFullScreen: true
                },
                active.id
              ) })
            ] });
          })() : /* @__PURE__ */ jsx("div", { className: "flex aspect-video items-center justify-center", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: locale === "fr" ? "Selectionnez une video" : "Select a video" }) }) }) })
        ] })
      ] })
    }
  );
}
function FaqSection({ locale, faqTitle, faqs }) {
  return /* @__PURE__ */ jsx(
    motion.section,
    {
      id: "faq",
      className: "w-full scroll-mt-24 bg-slate-900 py-10 md:py-14",
      initial: "hidden",
      whileInView: "show",
      viewport: { once: false, amount: 0.1 },
      variants: stagger,
      children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-7xl px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "rounded-3xl border border-slate-700 bg-slate-800 p-6 shadow-sm lg:p-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-2 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(CircleHelp, { className: "size-5 text-amber-400" }),
          /* @__PURE__ */ jsx("h2", { className: "text-3xl font-extrabold text-white", children: faqTitle })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mb-8 h-1 w-12 rounded-full bg-amber-400" }),
        /* @__PURE__ */ jsx("div", { className: "grid gap-3 md:grid-cols-2", children: faqs.map((faq) => /* @__PURE__ */ jsxs(motion.article, { className: "rounded-2xl border border-slate-700 bg-slate-900/60 p-5 shadow-sm", variants: fadeUp, children: [
          /* @__PURE__ */ jsx("h3", { className: "font-bold text-white", children: faq.question }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm leading-relaxed text-slate-400", children: faq.answer })
        ] }, faq.question)) })
      ] }) })
    },
    `faq-${locale}`
  );
}
function FeaturesSection({ locale, featuresTitle, features }) {
  const [main, second, ...rest] = features;
  const secondary = rest.slice(0, 6);
  const compact = rest.slice(6);
  return /* @__PURE__ */ jsx(
    motion.section,
    {
      id: "features",
      className: "w-full scroll-mt-24 bg-[#f5efe4] py-12 md:py-16",
      initial: "hidden",
      whileInView: "show",
      viewport: { once: false, amount: 0.05 },
      variants: stagger,
      children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-6 lg:px-8", children: [
        /* @__PURE__ */ jsxs(motion.div, { className: "mb-10", variants: fadeUp, children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.22em] text-amber-700", children: locale === "fr" ? "Fonctionnalités" : "Features" }),
          /* @__PURE__ */ jsx("h2", { className: "mt-2 text-3xl font-extrabold text-slate-900", children: featuresTitle }),
          /* @__PURE__ */ jsx("div", { className: "mt-3 h-1 w-12 rounded-full bg-amber-400" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-4 lg:grid-cols-12 lg:gap-5", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 lg:col-span-4", children: [
            main && /* @__PURE__ */ jsxs(
              motion.div,
              {
                variants: fadeUp,
                className: "flex flex-col rounded-3xl bg-slate-900 p-8 text-white shadow-xl",
                children: [
                  /* @__PURE__ */ jsx("div", { className: "mb-6 inline-flex w-fit rounded-2xl bg-amber-400/15 p-4 text-amber-400", children: /* @__PURE__ */ jsx(main.icon, { className: "size-6" }) }),
                  /* @__PURE__ */ jsx("h3", { className: "text-xl font-extrabold leading-snug", children: main.title }),
                  /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm leading-relaxed text-slate-300", children: main.description }),
                  /* @__PURE__ */ jsx("div", { className: "mt-6 h-px w-full bg-white/10" }),
                  /* @__PURE__ */ jsx("p", { className: "mt-3 text-xs font-semibold uppercase tracking-widest text-amber-400", children: locale === "fr" ? "Fonctionnalité clé" : "Key feature" })
                ]
              }
            ),
            second && /* @__PURE__ */ jsxs(
              motion.div,
              {
                variants: fadeUp,
                className: "flex flex-col rounded-3xl bg-amber-400 p-8 text-slate-900 shadow-xl",
                children: [
                  /* @__PURE__ */ jsx("div", { className: "mb-6 inline-flex w-fit rounded-2xl bg-slate-900/10 p-4 text-slate-900", children: /* @__PURE__ */ jsx(second.icon, { className: "size-6" }) }),
                  /* @__PURE__ */ jsx("h3", { className: "text-xl font-extrabold leading-snug", children: second.title }),
                  /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm leading-relaxed text-slate-700", children: second.description }),
                  /* @__PURE__ */ jsx("div", { className: "mt-6 h-px w-full bg-slate-900/10" }),
                  /* @__PURE__ */ jsx("p", { className: "mt-3 text-xs font-semibold uppercase tracking-widest text-slate-700", children: locale === "fr" ? "Fonctionnalité clé" : "Key feature" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:col-span-8 lg:auto-rows-fr", children: secondary.map((feature) => /* @__PURE__ */ jsxs(
            motion.div,
            {
              variants: fadeUp,
              className: "flex h-full flex-col gap-3 rounded-3xl border border-[#ddd0bb] bg-white p-6 shadow-sm transition hover:shadow-md",
              children: [
                /* @__PURE__ */ jsx("div", { className: "inline-flex w-fit rounded-xl bg-amber-100 p-3 text-amber-700", children: /* @__PURE__ */ jsx(feature.icon, { className: "size-5" }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h3", { className: "font-extrabold text-slate-900", children: feature.title }),
                  /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm leading-relaxed text-slate-500", children: feature.description })
                ] })
              ]
            },
            feature.title
          )) }),
          compact.length > 0 && /* @__PURE__ */ jsx(
            motion.div,
            {
              variants: fadeUp,
              className: "grid gap-3 sm:grid-cols-2 lg:col-span-12 lg:grid-cols-3",
              children: compact.map((feature) => /* @__PURE__ */ jsxs(
                "div",
                {
                  className: "flex items-start gap-4 rounded-2xl border border-[#ddd0bb] bg-[#fdf9f4] px-5 py-4 shadow-sm",
                  children: [
                    /* @__PURE__ */ jsx("div", { className: "mt-0.5 inline-flex shrink-0 rounded-lg bg-amber-100 p-2 text-amber-700", children: /* @__PURE__ */ jsx(feature.icon, { className: "size-4" }) }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-900", children: feature.title }),
                      /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs leading-relaxed text-slate-500", children: feature.description })
                    ] })
                  ]
                },
                feature.title
              ))
            }
          )
        ] })
      ] })
    },
    `features-${locale}`
  );
}
function HeroSection({
  locale,
  t,
  heroHeadline,
  heroDescription,
  activeHeroSlide,
  getDashboardUrl,
  setActiveHeroSlide
}) {
  const hasHeroSlides = heroSlides.length > 0;
  return /* @__PURE__ */ jsx(motion.section, { className: "w-full py-10 md:py-16", initial: "hidden", animate: "show", variants: stagger, children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-7xl px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "grid items-center gap-12 lg:grid-cols-2", children: [
    /* @__PURE__ */ jsxs(motion.div, { variants: fadeUp, transition: { duration: 0.6 }, children: [
      /* @__PURE__ */ jsxs("p", { className: "mb-6 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-800", children: [
        /* @__PURE__ */ jsx(Sparkles, { className: "size-3.5" }),
        t.hero.badge
      ] }),
      /* @__PURE__ */ jsx(
        motion.h1,
        {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.35 },
          className: "max-w-2xl text-4xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem]",
          children: heroHeadline
        },
        `${locale}-${heroSlides[activeHeroSlide]?.src ?? "default"}-title`
      ),
      /* @__PURE__ */ jsx("div", { className: "mt-4 h-1 w-16 rounded-full bg-amber-400" }),
      /* @__PURE__ */ jsx(
        motion.p,
        {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.35, delay: 0.05 },
          className: "mt-5 max-w-xl text-lg leading-relaxed text-slate-600",
          children: heroDescription
        },
        `${locale}-${heroSlides[activeHeroSlide]?.src ?? "default"}-desc`
      ),
      /* @__PURE__ */ jsxs("div", { className: "mt-8 flex flex-wrap items-center gap-3", children: [
        /* @__PURE__ */ jsxs(
          Link_default,
          {
            href: getDashboardUrl(),
            className: "inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3.5 font-bold text-slate-900 shadow-md transition hover:bg-amber-300 hover:shadow-lg",
            children: [
              t.hero.primary,
              /* @__PURE__ */ jsx(ArrowRight, { className: "size-4" })
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "a",
          {
            href: "#demo",
            className: "inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-6 py-3.5 font-semibold text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50",
            children: [
              /* @__PURE__ */ jsx(PlayCircle, { className: "size-4 text-amber-600" }),
              t.hero.secondary
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 text-xs text-slate-500", children: t.hero.helper }),
      /* @__PURE__ */ jsx("ul", { className: "mt-8 space-y-2.5", children: t.quickPoints.map((point) => /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2.5 text-sm text-slate-700", children: [
        /* @__PURE__ */ jsx("span", { className: "flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600", children: /* @__PURE__ */ jsx(Check, { className: "size-3" }) }),
        point
      ] }, point)) })
    ] }),
    /* @__PURE__ */ jsxs(motion.div, { className: "space-y-4", variants: fadeUp, transition: { duration: 0.6, delay: 0.15 }, children: [
      /* @__PURE__ */ jsx("div", { className: "relative overflow-hidden rounded-3xl border border-[#e0d5c5] bg-[#f4ede2] shadow-2xl ring-1 ring-black/5", children: /* @__PURE__ */ jsxs("div", { className: "relative aspect-[5/4]", children: [
        hasHeroSlides ? heroSlides.map((slide, index) => /* @__PURE__ */ jsx(
          "img",
          {
            src: slide.src,
            alt: slide.alt,
            className: `absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${index === activeHeroSlide ? "opacity-100" : "opacity-0"}`
          },
          slide.src
        )) : /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-slate-900/90 px-6 text-center text-slate-200", children: "Ajoute des images dans resources/images/heroes pour activer le slider." }),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-900/15 to-transparent" }),
        /* @__PURE__ */ jsx("div", { className: "absolute bottom-5 left-5 right-5", children: /* @__PURE__ */ jsx(
          motion.p,
          {
            initial: { opacity: 0, y: 6 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.4 },
            className: "text-sm font-semibold leading-snug text-white drop-shadow",
            children: heroHeadline
          },
          `caption-${activeHeroSlide}`
        ) }),
        /* @__PURE__ */ jsx("div", { className: "absolute right-4 top-4", children: /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white shadow", children: [
          /* @__PURE__ */ jsx("span", { className: "size-1.5 rounded-full bg-white" }),
          "LIVE"
        ] }) })
      ] }) }),
      hasHeroSlides && heroSlides.length > 1 && /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center gap-2", children: heroSlides.map((slide, index) => /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => setActiveHeroSlide(index),
          className: `h-2 rounded-full transition-all ${index === activeHeroSlide ? "w-8 bg-slate-900" : "w-2 bg-slate-300 hover:bg-slate-500"}`,
          "aria-label": `Slide ${index + 1}`
        },
        `${slide.src}-dot`
      )) }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-3", children: t.stats.map((stat) => /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-[#e0d5c5] bg-white px-4 py-3 text-center shadow-sm", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xl font-extrabold text-slate-900", children: stat.value }),
        /* @__PURE__ */ jsx("p", { className: "mt-0.5 text-xs text-slate-500", children: stat.label })
      ] }, stat.label)) })
    ] })
  ] }) }) });
}
function PricingSection({ pricingTitle, pricingFallback, planCta, pricingLabel, plans, hasDynamicPlans, getDashboardUrl }) {
  return /* @__PURE__ */ jsx(
    motion.section,
    {
      id: "pricing",
      className: "w-full scroll-mt-24 bg-slate-900 py-14 md:py-20",
      initial: "hidden",
      whileInView: "show",
      viewport: { once: false, amount: 0.1 },
      variants: stagger,
      children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-6 lg:px-8", children: [
        /* @__PURE__ */ jsxs(motion.div, { className: "mb-10", variants: fadeUp, children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.22em] text-amber-400", children: pricingLabel }),
          /* @__PURE__ */ jsx("h2", { className: "mt-2 text-3xl font-extrabold text-white", children: pricingTitle }),
          /* @__PURE__ */ jsx("div", { className: "mt-3 h-1 w-12 rounded-full bg-amber-400" }),
          !hasDynamicPlans && /* @__PURE__ */ jsx("p", { className: "mt-4 inline-block rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-300", children: pricingFallback })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid gap-6 md:grid-cols-2 xl:grid-cols-3", children: plans.map((plan) => /* @__PURE__ */ jsxs(
          motion.article,
          {
            className: `relative rounded-2xl border p-6 transition ${plan.highlighted ? "border-amber-400 bg-amber-400 text-slate-900 shadow-[0_0_40px_-4px_rgba(251,191,36,0.45)] ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900" : "border-slate-700 bg-slate-800 text-white shadow-sm hover:border-slate-500"}`,
            variants: fadeUp,
            whileHover: { y: -4 },
            children: [
              plan.highlighted && /* @__PURE__ */ jsx("div", { className: "absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap", children: /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wide text-amber-400 ring-1 ring-amber-400/50", children: [
                /* @__PURE__ */ jsx(Star, { className: "size-3 fill-amber-400" }),
                " Populaire"
              ] }) }),
              /* @__PURE__ */ jsx("p", { className: `text-sm font-semibold ${plan.highlighted ? "text-slate-700" : "text-amber-400"}`, children: plan.badge }),
              /* @__PURE__ */ jsx("h3", { className: "mt-2 text-2xl font-bold", children: plan.name }),
              /* @__PURE__ */ jsxs("div", { className: `mt-4 rounded-2xl px-5 py-4 ${plan.highlighted ? "bg-slate-900/10" : "bg-white/5"}`, children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-end gap-1", children: [
                  /* @__PURE__ */ jsx("span", { className: `text-5xl font-black tracking-tight leading-none ${plan.highlighted ? "text-slate-900" : "text-white"}`, children: plan.price_eur.replace(/[^0-9]/g, "") }),
                  /* @__PURE__ */ jsx("span", { className: `mb-1 text-xl font-bold ${plan.highlighted ? "text-slate-700" : "text-amber-400"}`, children: plan.price_eur.replace(/[0-9\s]/g, "").trim() || "EUR" })
                ] }),
                /* @__PURE__ */ jsx("p", { className: `mt-0.5 text-xs font-medium ${plan.highlighted ? "text-slate-600" : "text-slate-400"}`, children: plan.subtitle })
              ] }),
              /* @__PURE__ */ jsx("ul", { className: `mt-5 space-y-3 text-sm ${plan.highlighted ? "text-slate-800" : "text-slate-200"}`, children: plan.points.map((point) => /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Check, { className: `size-4 shrink-0 ${plan.highlighted ? "text-slate-900" : "text-emerald-400"}` }),
                point
              ] }, point)) }),
              /* @__PURE__ */ jsxs(
                Link_default,
                {
                  href: getDashboardUrl(),
                  className: `mt-6 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${plan.highlighted ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-amber-400 text-slate-900 hover:bg-amber-300"}`,
                  children: [
                    planCta,
                    /* @__PURE__ */ jsx(ArrowRight, { className: "size-4" })
                  ]
                }
              )
            ]
          },
          plan.name
        )) })
      ] })
    }
  );
}
const bgImage = "/build/assets/bg-CXGuFS_s.jpg";
function DynamicIcon({ name, className }) {
  const Icon = LucideIcons[name];
  if (!Icon) return null;
  return /* @__PURE__ */ jsx(Icon, { className });
}
function TestimonialsSection({ locale, promises, trustReasons }) {
  const sectionLabel = locale === "fr" ? "Pourquoi nous faire confiance" : "Why trust us";
  return /* @__PURE__ */ jsxs(
    motion.section,
    {
      className: "relative w-full overflow-hidden py-12 md:py-16",
      initial: "hidden",
      whileInView: "show",
      viewport: { once: false, amount: 0.1 },
      variants: stagger,
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "absolute inset-0 bg-cover bg-center bg-no-repeat",
            style: { backgroundImage: `url(${bgImage})` }
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-slate-900/80" }),
        /* @__PURE__ */ jsxs("div", { className: "relative mx-auto max-w-7xl px-6 lg:px-8", children: [
          /* @__PURE__ */ jsxs(motion.div, { className: "mb-10", variants: fadeUp, children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.22em] text-amber-400", children: sectionLabel }),
            /* @__PURE__ */ jsx("div", { className: "mt-2 h-1 w-12 rounded-full bg-amber-400" })
          ] }),
          /* @__PURE__ */ jsx(motion.div, { className: "mb-8 grid gap-4 sm:grid-cols-3", variants: fadeUp, children: promises.map((p) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: "flex items-center gap-4 rounded-2xl border border-slate-700 bg-slate-800 px-5 py-5 shadow-md",
              children: [
                /* @__PURE__ */ jsx("span", { className: "flex size-11 shrink-0 items-center justify-center rounded-full bg-amber-400/10 text-amber-400", children: /* @__PURE__ */ jsx(DynamicIcon, { name: p.icon, className: "size-5" }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-2xl font-extrabold text-white", children: p.value }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: p.label })
                ] })
              ]
            },
            p.label
          )) }),
          /* @__PURE__ */ jsx(motion.div, { className: "grid gap-3 sm:grid-cols-2", variants: stagger, children: trustReasons.map((reason) => /* @__PURE__ */ jsxs(
            motion.div,
            {
              variants: fadeUp,
              className: "flex items-start gap-3 rounded-xl border border-slate-700 bg-slate-800/60 px-5 py-4",
              children: [
                /* @__PURE__ */ jsx(ShieldCheck, { className: "mt-0.5 size-4 shrink-0 text-emerald-400" }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-300", children: reason })
              ]
            },
            reason
          )) })
        ] })
      ]
    }
  );
}
function Welcome({ auth, subscriptionPlans, appUrl, latestPosts = [] }) {
  const [locale, setLocale] = useState("fr");
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    const saved = window.localStorage.getItem("landing_locale");
    if (saved === "fr" || saved === "en") setLocale(saved);
  }, []);
  useEffect(() => {
    window.localStorage.setItem("landing_locale", locale);
  }, [locale]);
  const getDashboardUrl = () => {
    if (!auth.user) return route("register");
    if (auth.user.role === "admin_platforme") return route("platform.dashboard");
    if (auth.code_user) return route("dashboard", { code_user: auth.code_user });
    return route("register");
  };
  const t = copy[locale];
  const features = useMemo(() => featuresByLocale[locale], [locale]);
  const faqs = useMemo(() => faqsByLocale[locale], [locale]);
  useMemo(() => trustMarksByLocale[locale], [locale]);
  const hasHeroSlides = heroSlides.length > 0;
  const activeHeroCaption = hasHeroSlides ? heroSlides[activeHeroSlide]?.caption?.[locale] : null;
  const heroHeadline = activeHeroCaption?.title ?? t.hero.title;
  const heroDescription = activeHeroCaption?.description ?? t.hero.description;
  const filteredSubscriptionPlans = useMemo(() => {
    return subscriptionPlans.filter((plan) => {
      const identity = `${plan.slug ?? ""} ${plan.name ?? ""}`.toLowerCase().trim();
      const looksFree = identity === "free" || identity.includes("free") || identity.includes("gratuit");
      const isZeroPrice = Number(plan.price) === 0;
      return !looksFree && !isZeroPrice;
    });
  }, [subscriptionPlans]);
  const hasDynamicPlans = filteredSubscriptionPlans.length > 0;
  const plans = useMemo(() => {
    if (filteredSubscriptionPlans.length === 0) return fallbackPlansByLocale[locale];
    const middle = Math.floor(filteredSubscriptionPlans.length / 2);
    return filteredSubscriptionPlans.map((plan, index) => {
      const isFr = locale === "fr";
      const unlimited = isFr ? "Illimite" : "Unlimited";
      const subtitle = isFr ? "par mois" : "per month";
      const rawEur = plan.price_eur?.trim() || plan.formatted_price?.trim();
      const badge = isFr ? plan.shop_limit_text : plan.has_unlimited_shops ? "Unlimited stores" : `Up to ${plan.max_shops} store${plan.max_shops > 1 ? "s" : ""}`;
      const shopsLabel = plan.has_unlimited_shops ? isFr ? `${unlimited} boutiques` : `${unlimited} stores` : isFr ? `${plan.max_shops} boutique${plan.max_shops > 1 ? "s" : ""}` : `${plan.max_shops} store${plan.max_shops > 1 ? "s" : ""}`;
      const usersLabel = plan.has_unlimited_users ? isFr ? `${unlimited} utilisateurs` : `${unlimited} users` : isFr ? `${plan.max_users} utilisateurs` : `${plan.max_users} users`;
      const productsLabel = plan.has_unlimited_products ? isFr ? `${unlimited} produits` : `${unlimited} products` : isFr ? `${plan.max_products} produits` : `${plan.max_products} products`;
      const depotsLabel = plan.max_depots === 0 ? isFr ? "Sans depot" : "No depot" : plan.has_unlimited_depots ? isFr ? `${unlimited} depots` : `${unlimited} depots` : isFr ? `${plan.max_depots} depot${plan.max_depots > 1 ? "s" : ""}` : `${plan.max_depots} depot${plan.max_depots > 1 ? "s" : ""}`;
      const baseFeatures = isFr ? ["Ventes et caisse", "Gestion des achats", "Rapports et statistiques"] : ["Sales and POS", "Purchase management", "Reports and analytics"];
      const extraFeatures = Array.isArray(plan.features) ? plan.features.filter((f) => f && f.trim().length > 0).slice(0, 2) : [];
      return {
        name: plan.name,
        price_eur: rawEur || `${plan.price} EUR`,
        subtitle,
        badge,
        points: [shopsLabel, usersLabel, productsLabel, depotsLabel, ...baseFeatures, ...extraFeatures],
        highlighted: index === middle
      };
    });
  }, [filteredSubscriptionPlans, locale]);
  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveHeroSlide((current) => (current + 1) % heroSlides.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, []);
  const canonicalUrl = appUrl || "https://batixpro.com";
  const ogImage = `${canonicalUrl}${t.seo.ogImage}`;
  const ogLocale = locale === "fr" ? "fr_FR" : "en_US";
  const ogLocaleAlt = locale === "fr" ? "en_US" : "fr_FR";
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${canonicalUrl}/#organization`,
        name: "BATIX PRO",
        url: canonicalUrl,
        logo: {
          "@type": "ImageObject",
          url: `${canonicalUrl}/favicon.svg`
        },
        sameAs: [],
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          availableLanguage: ["French", "English"]
        }
      },
      {
        "@type": "WebSite",
        "@id": `${canonicalUrl}/#website`,
        url: canonicalUrl,
        name: "BATIX PRO",
        description: t.seo.description,
        publisher: { "@id": `${canonicalUrl}/#organization` },
        inLanguage: locale === "fr" ? "fr-FR" : "en-US"
      },
      {
        "@type": "SoftwareApplication",
        name: "BATIX PRO",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "EUR",
          lowPrice: "0",
          offerCount: "4"
        },
        description: t.seo.description,
        url: canonicalUrl
      }
    ]
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(Head_default, { children: [
      /* @__PURE__ */ jsx("title", { children: t.title }),
      /* @__PURE__ */ jsx("meta", { name: "description", content: t.seo.description }),
      /* @__PURE__ */ jsx("meta", { name: "keywords", content: t.seo.keywords }),
      /* @__PURE__ */ jsx("meta", { name: "robots", content: "index, follow" }),
      /* @__PURE__ */ jsx("link", { rel: "canonical", href: canonicalUrl }),
      /* @__PURE__ */ jsx("link", { rel: "alternate", hrefLang: "fr", href: canonicalUrl }),
      /* @__PURE__ */ jsx("link", { rel: "alternate", hrefLang: "en", href: canonicalUrl }),
      /* @__PURE__ */ jsx("link", { rel: "alternate", hrefLang: "x-default", href: canonicalUrl }),
      /* @__PURE__ */ jsx("meta", { property: "og:type", content: "website" }),
      /* @__PURE__ */ jsx("meta", { property: "og:url", content: canonicalUrl }),
      /* @__PURE__ */ jsx("meta", { property: "og:title", content: t.title }),
      /* @__PURE__ */ jsx("meta", { property: "og:description", content: t.seo.description }),
      /* @__PURE__ */ jsx("meta", { property: "og:image", content: ogImage }),
      /* @__PURE__ */ jsx("meta", { property: "og:image:width", content: "1200" }),
      /* @__PURE__ */ jsx("meta", { property: "og:image:height", content: "630" }),
      /* @__PURE__ */ jsx("meta", { property: "og:site_name", content: "BATIX PRO" }),
      /* @__PURE__ */ jsx("meta", { property: "og:locale", content: ogLocale }),
      /* @__PURE__ */ jsx("meta", { property: "og:locale:alternate", content: ogLocaleAlt }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:card", content: "summary_large_image" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:title", content: t.title }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:description", content: t.seo.description }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:image", content: ogImage }),
      /* @__PURE__ */ jsx("script", { type: "application/ld+json", children: JSON.stringify(jsonLd) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative min-h-screen overflow-x-clip bg-[#f9f5ef] text-slate-900 selection:bg-amber-300 selection:text-slate-900", children: [
      /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute inset-0 -z-10", children: /* @__PURE__ */ jsx("div", { className: "h-full w-full bg-gradient-to-br from-[#fdf8f0] via-[#f9f5ef] to-[#f2ebe0]" }) }),
      /* @__PURE__ */ jsxs("div", { className: "w-full", children: [
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
        /* @__PURE__ */ jsxs("main", { className: "pt-10", children: [
          /* @__PURE__ */ jsx(
            HeroSection,
            {
              locale,
              t,
              heroHeadline,
              heroDescription,
              activeHeroSlide,
              getDashboardUrl,
              setActiveHeroSlide
            }
          ),
          /* @__PURE__ */ jsx(
            FeaturesSection,
            {
              locale,
              featuresTitle: t.featuresTitle,
              features
            }
          ),
          /* @__PURE__ */ jsx(
            DemoSection,
            {
              locale,
              t: { demo: t.demo, videoFaqs: t.videoFaqs },
              getDashboardUrl
            }
          ),
          /* @__PURE__ */ jsx(
            TestimonialsSection,
            {
              locale,
              promises: t.promises,
              trustReasons: t.trustReasons
            }
          ),
          /* @__PURE__ */ jsx(
            PricingSection,
            {
              pricingTitle: t.pricingTitle,
              pricingLabel: t.pricingLabel,
              pricingFallback: t.pricingFallback,
              planCta: t.planCta,
              plans,
              hasDynamicPlans,
              getDashboardUrl
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "bg-slate-900 px-6 lg:px-8", children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-7xl", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-amber-400/60" }),
            /* @__PURE__ */ jsx("span", { className: "shrink-0 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-amber-400", children: "FAQ" }),
            /* @__PURE__ */ jsx("div", { className: "h-px flex-1 bg-gradient-to-l from-transparent via-slate-700 to-amber-400/60" })
          ] }) }) }),
          /* @__PURE__ */ jsx(
            FaqSection,
            {
              locale,
              faqTitle: t.faqTitle,
              faqs
            }
          ),
          /* @__PURE__ */ jsx(
            BlogSection,
            {
              locale,
              posts: latestPosts
            }
          ),
          /* @__PURE__ */ jsx(
            ContactSection,
            {
              locale,
              t: { contact: t.contact },
              getDashboardUrl
            }
          )
        ] }),
        /* @__PURE__ */ jsx(
          WelcomeFooter,
          {
            footerText: t.footerText,
            nav: t.nav
          }
        )
      ] })
    ] })
  ] });
}
export {
  Welcome as default
};
