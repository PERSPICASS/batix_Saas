import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { A as AuthSplitLayout } from "./AuthSplitLayout-C5tXzJtk.js";
import { I as InputError } from "./InputError-DiSBWiye.js";
import { I as InputLabel, T as TextInput } from "./TextInput-FO9W64oM.js";
import { P as PrimaryButton } from "./PrimaryButton-DgVfVBwo.js";
import { u as useForm, H as Head_default, L as Link_default } from "../ssr.js";
import { useState } from "react";
import { EyeOff, Eye, Lock } from "lucide-react";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
function Checkbox({
  className = "",
  ...props
}) {
  return /* @__PURE__ */ jsx(
    "input",
    {
      ...props,
      type: "checkbox",
      className: "rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500 " + className
    }
  );
}
function Login({
  status,
  canResetPassword
}) {
  const [showPassword, setShowPassword] = useState(false);
  const { data, setData, post, processing, errors, reset } = useForm({
    email: "",
    password: "",
    remember: false
  });
  const submit = (e) => {
    e.preventDefault();
    post(route("login"), {
      onFinish: () => reset("password")
    });
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Head_default, { title: "Connexion" }),
    /* @__PURE__ */ jsxs(
      AuthSplitLayout,
      {
        title: "Ravi de vous revoir",
        description: "Connectez-vous pour reprendre vos ventes, vos stocks et vos operations la ou vous les avez laisses.",
        icon: /* @__PURE__ */ jsx(Lock, { className: "size-5" }),
        topLink: { href: "/", label: "Retour a l'accueil" },
        sideStepLabel: "Acces securise",
        sideTitle: "Retrouvez votre espace en un instant.",
        sideDescription: "Vos donnees restent synchronisees et securisees, pour que vous puissiez continuer sans interruption.",
        children: [
          status && /* @__PURE__ */ jsx("div", { className: "mb-3 rounded-lg border border-emerald-300/60 bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-800", children: status }),
          /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-3", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(InputLabel, { htmlFor: "email", value: "Email", className: "text-slate-700" }),
              /* @__PURE__ */ jsx(
                TextInput,
                {
                  id: "email",
                  type: "email",
                  name: "email",
                  value: data.email,
                  className: "mt-1 block w-full border border-[#cfc3ac] bg-white text-slate-900 placeholder-slate-400",
                  autoComplete: "username",
                  isFocused: true,
                  onChange: (e) => setData("email", e.target.value)
                }
              ),
              /* @__PURE__ */ jsx(InputError, { message: errors.email, className: "mt-2" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(InputLabel, { htmlFor: "password", value: "Mot de passe", className: "text-slate-700" }),
              /* @__PURE__ */ jsxs("div", { className: "relative mt-1", children: [
                /* @__PURE__ */ jsx(
                  TextInput,
                  {
                    id: "password",
                    type: showPassword ? "text" : "password",
                    name: "password",
                    value: data.password,
                    className: "block w-full border border-[#cfc3ac] bg-white pr-10 text-slate-900 placeholder-slate-400",
                    autoComplete: "current-password",
                    onChange: (e) => setData("password", e.target.value)
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setShowPassword(!showPassword),
                    className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 focus:outline-none",
                    children: showPassword ? /* @__PURE__ */ jsx(EyeOff, { className: "size-5" }) : /* @__PURE__ */ jsx(Eye, { className: "size-5" })
                  }
                )
              ] }),
              /* @__PURE__ */ jsx(InputError, { message: errors.password, className: "mt-2" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pt-1", children: [
              /* @__PURE__ */ jsxs("label", { className: "inline-flex items-center", children: [
                /* @__PURE__ */ jsx(
                  Checkbox,
                  {
                    name: "remember",
                    checked: data.remember,
                    className: "border-[#cfc3ac] bg-white text-amber-600 focus:ring-amber-300",
                    onChange: (e) => setData("remember", e.target.checked)
                  }
                ),
                /* @__PURE__ */ jsx("span", { className: "ms-2 text-sm text-slate-700", children: "Se souvenir de moi" })
              ] }),
              canResetPassword && /* @__PURE__ */ jsx(
                Link_default,
                {
                  href: route("password.request"),
                  className: "text-sm text-slate-600 underline underline-offset-4 transition hover:text-slate-900",
                  children: "Mot de passe oublie ?"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2 pt-1", children: [
              /* @__PURE__ */ jsx(PrimaryButton, { className: "w-full justify-center bg-slate-900 py-2.5 text-sm normal-case tracking-normal hover:bg-slate-800", disabled: processing, children: "Se connecter" }),
              /* @__PURE__ */ jsx("div", { className: "text-center", children: /* @__PURE__ */ jsx(Link_default, { href: route("register"), className: "text-xs text-slate-600 underline underline-offset-4 transition hover:text-slate-900 sm:text-sm", children: "Nouveau ici ? Creer un compte" }) })
            ] })
          ] })
        ]
      }
    )
  ] });
}
export {
  Login as default
};
