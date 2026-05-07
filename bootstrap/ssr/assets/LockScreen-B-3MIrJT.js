import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { A as AuthSplitLayout } from "./AuthSplitLayout-C5tXzJtk.js";
import { P as PrimaryButton } from "./PrimaryButton-DgVfVBwo.js";
import { useState, useEffect } from "react";
import { u as useForm, H as Head_default, r as router3 } from "../ssr.js";
import { User, EyeOff, Eye, Lock } from "lucide-react";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
function LockScreen({ user }) {
  const [showPassword, setShowPassword] = useState(false);
  const { data, setData, post, processing, errors, reset } = useForm({
    password: ""
  });
  useEffect(() => {
    document.getElementById("password")?.focus();
    return () => reset("password");
  }, []);
  const submit = (e) => {
    e.preventDefault();
    post(route("lock-screen.unlock"));
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Head_default, { title: "Ecran verrouille" }),
    /* @__PURE__ */ jsxs(
      AuthSplitLayout,
      {
        title: "Session verrouillee",
        description: "Entrez votre mot de passe pour reprendre exactement la ou vous vous etiez arrete.",
        icon: /* @__PURE__ */ jsx(Lock, { className: "size-5" }),
        sideStepLabel: "Session securisee",
        sideTitle: "Vos donnees restent protegees.",
        sideDescription: "Deverrouillez votre session pour continuer vos operations sans perdre votre progression.",
        children: [
          /* @__PURE__ */ jsx("div", { className: "mb-4 rounded-2xl border border-[#d8cfbe] bg-[#f5efe4] p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            user.avatar ? /* @__PURE__ */ jsx("img", { src: user.avatar, alt: user.name, className: "size-12 rounded-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex size-12 items-center justify-center rounded-full bg-amber-200 text-amber-800", children: /* @__PURE__ */ jsx(User, { className: "size-6" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-slate-900", children: user.name }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-600", children: user.email })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-3", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "password", className: "text-sm font-medium text-slate-700", children: "Mot de passe" }),
              /* @__PURE__ */ jsxs("div", { className: "relative mt-1", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    id: "password",
                    type: showPassword ? "text" : "password",
                    name: "password",
                    value: data.password,
                    className: `block w-full rounded-md border px-3 py-2 pr-10 text-slate-900 placeholder-slate-400 ${errors.password ? "border-red-300 bg-red-50" : "border-[#cfc3ac] bg-white"}`,
                    placeholder: "Entrez votre mot de passe",
                    onChange: (e) => setData("password", e.target.value),
                    autoComplete: "current-password",
                    disabled: processing
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setShowPassword(!showPassword),
                    className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700",
                    tabIndex: -1,
                    children: showPassword ? /* @__PURE__ */ jsx(EyeOff, { className: "size-5" }) : /* @__PURE__ */ jsx(Eye, { className: "size-5" })
                  }
                )
              ] }),
              errors.password && /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-red-600", children: errors.password })
            ] }),
            /* @__PURE__ */ jsx(
              PrimaryButton,
              {
                type: "submit",
                disabled: processing || !data.password,
                className: "w-full justify-center bg-slate-900 py-2.5 text-sm normal-case tracking-normal hover:bg-slate-800",
                children: processing ? "Deverrouillage..." : "Deverrouiller"
              }
            ),
            /* @__PURE__ */ jsx("div", { className: "text-center", children: /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => router3.post(route("logout")),
                className: "text-xs text-slate-600 underline underline-offset-4 transition hover:text-slate-900 sm:text-sm",
                children: "Se connecter avec un autre compte"
              }
            ) })
          ] })
        ]
      }
    )
  ] });
}
export {
  LockScreen as default
};
