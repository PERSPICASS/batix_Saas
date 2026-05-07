import { jsxs, jsx } from "react/jsx-runtime";
import { HardHat } from "lucide-react";
import { L as Link_default } from "../ssr.js";
function ApplicationLogo(props) {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
    /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-amber-300 p-2 text-slate-900", children: /* @__PURE__ */ jsx(HardHat, { className: "size-5" }) }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm font-bold tracking-wide text-slate-900", children: "BATIX PRO" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-600", children: "Gestion moderne des quincailleries" })
    ] })
  ] });
}
const defaultHeroImage = "/build/assets/bath-saloon-2026-03-19-23-10-32-utc-B2tWATrR.jpg";
function AuthSplitLayout({
  title,
  description,
  children,
  icon,
  stepper,
  topLink,
  afterContent,
  sideStepLabel = "Etape",
  sideTitle,
  sideDescription,
  sideImageSrc = defaultHeroImage
}) {
  return /* @__PURE__ */ jsx("div", { className: "h-dvh overflow-hidden bg-[#f5efe4] text-slate-900", children: /* @__PURE__ */ jsxs("div", { className: "grid h-full lg:grid-cols-2", children: [
    /* @__PURE__ */ jsx("section", { className: "flex h-full items-center justify-center px-4 py-3 sm:px-8 lg:px-10", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-lg flex flex-col", children: [
      /* @__PURE__ */ jsx(Link_default, { href: "/", className: "inline-flex items-center gap-3", children: /* @__PURE__ */ jsx(ApplicationLogo, { className: "h-12 w-12 fill-current text-amber-600" }) }),
      topLink && /* @__PURE__ */ jsx(
        Link_default,
        {
          href: topLink.href,
          className: "mt-2 inline-flex text-sm text-slate-600 underline underline-offset-4 transition hover:text-slate-900",
          children: topLink.label
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-3xl border border-[#d6c9b2] bg-[#fbf7ef] p-5 shadow-xl sm:p-6", children: [
        stepper,
        icon && /* @__PURE__ */ jsx("div", { className: "mb-2 flex size-11 items-center justify-center rounded-full bg-amber-100 text-amber-700", children: icon }),
        /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold text-slate-900 sm:text-2xl", children: title }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-600", children: description }),
        /* @__PURE__ */ jsx("div", { className: "mt-4", children }),
        afterContent && /* @__PURE__ */ jsx("div", { className: "mt-4", children: afterContent })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("section", { className: "relative hidden h-full overflow-hidden lg:-ml-4 lg:block  lg:shadow-[-28px_0_60px_-24px_rgba(15,23,42,0.55)]", children: [
      /* @__PURE__ */ jsx("img", { src: sideImageSrc, alt: "Auth visual", className: "absolute inset-0 h-full w-full object-cover" }),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/35 to-slate-900/15" }),
      /* @__PURE__ */ jsxs("div", { className: "absolute bottom-0 left-0 right-0 p-6 text-white sm:p-8", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.22em] text-amber-200", children: sideStepLabel }),
        /* @__PURE__ */ jsx("h2", { className: "mt-3 max-w-lg text-2xl font-bold leading-tight xl:text-3xl", children: sideTitle }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 max-w-lg text-sm text-slate-200", children: sideDescription })
      ] })
    ] })
  ] }) });
}
export {
  AuthSplitLayout as A
};
