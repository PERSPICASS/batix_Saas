import { jsxs, jsx } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { H as Head_default } from "../ssr.js";
import { Construction, ArrowRight } from "lucide-react";
import "react";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
function Placeholder({
  title,
  description
}) {
  return /* @__PURE__ */ jsxs(
    Authenticated,
    {
      header: /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-white", children: title }),
      children: [
        /* @__PURE__ */ jsx(Head_default, { title }),
        /* @__PURE__ */ jsxs("section", { className: "rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl", children: [
          /* @__PURE__ */ jsx("div", { className: "inline-flex rounded-xl bg-amber-300/15 p-3 text-amber-200", children: /* @__PURE__ */ jsx(Construction, { className: "size-6" }) }),
          /* @__PURE__ */ jsx("h2", { className: "mt-4 text-2xl font-bold text-white", children: title }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 max-w-2xl text-slate-300", children: description }),
          /* @__PURE__ */ jsx("div", { className: "mt-6 rounded-xl border border-dashed border-white/20 bg-slate-900/50 p-5 text-sm text-slate-300", children: "Page placeholder prete a remplir: ajoute ici tes tableaux, formulaires, actions metier et API." }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              className: "mt-6 inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10",
              children: [
                "Ajouter les composants metier",
                /* @__PURE__ */ jsx(ArrowRight, { className: "size-4" })
              ]
            }
          )
        ] })
      ]
    }
  );
}
export {
  Placeholder as default
};
