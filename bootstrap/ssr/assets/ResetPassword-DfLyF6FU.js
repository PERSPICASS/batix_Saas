import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { A as AuthSplitLayout } from "./AuthSplitLayout-C5tXzJtk.js";
import { I as InputError } from "./InputError-DiSBWiye.js";
import { I as InputLabel, T as TextInput } from "./TextInput-FO9W64oM.js";
import { P as PrimaryButton } from "./PrimaryButton-DgVfVBwo.js";
import { u as useForm, H as Head_default, L as Link_default } from "../ssr.js";
import { useState } from "react";
import { EyeOff, Eye, KeyRound } from "lucide-react";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
function ResetPassword({
  token,
  email
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const { data, setData, post, processing, errors, reset } = useForm({
    token,
    email,
    password: "",
    password_confirmation: ""
  });
  const submit = (e) => {
    e.preventDefault();
    post(route("password.store"), {
      onFinish: () => reset("password", "password_confirmation")
    });
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Head_default, { title: "Nouveau mot de passe" }),
    /* @__PURE__ */ jsx(
      AuthSplitLayout,
      {
        title: "Choisissez un nouveau mot de passe",
        description: "Saisissez votre nouveau mot de passe pour securiser a nouveau votre compte Batix.",
        icon: /* @__PURE__ */ jsx(KeyRound, { className: "size-5" }),
        sideStepLabel: "Securite",
        sideTitle: "Un compte protege, une equipe tranquille.",
        sideDescription: "Renforcez la securite de votre espace en quelques secondes.",
        children: /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-3", children: [
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
                onChange: (e) => setData("email", e.target.value)
              }
            ),
            /* @__PURE__ */ jsx(InputError, { message: errors.email, className: "mt-2" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(InputLabel, { htmlFor: "password", value: "Nouveau mot de passe", className: "text-slate-700" }),
            /* @__PURE__ */ jsxs("div", { className: "relative mt-1", children: [
              /* @__PURE__ */ jsx(
                TextInput,
                {
                  id: "password",
                  type: showPassword ? "text" : "password",
                  name: "password",
                  value: data.password,
                  className: "block w-full border border-[#cfc3ac] bg-white pr-10 text-slate-900 placeholder-slate-400",
                  autoComplete: "new-password",
                  isFocused: true,
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
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(InputLabel, { htmlFor: "password_confirmation", value: "Confirmer le mot de passe", className: "text-slate-700" }),
            /* @__PURE__ */ jsxs("div", { className: "relative mt-1", children: [
              /* @__PURE__ */ jsx(
                TextInput,
                {
                  id: "password_confirmation",
                  type: showPasswordConfirmation ? "text" : "password",
                  name: "password_confirmation",
                  value: data.password_confirmation,
                  className: "block w-full border border-[#cfc3ac] bg-white pr-10 text-slate-900 placeholder-slate-400",
                  autoComplete: "new-password",
                  onChange: (e) => setData("password_confirmation", e.target.value)
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setShowPasswordConfirmation(!showPasswordConfirmation),
                  className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 focus:outline-none",
                  children: showPasswordConfirmation ? /* @__PURE__ */ jsx(EyeOff, { className: "size-5" }) : /* @__PURE__ */ jsx(Eye, { className: "size-5" })
                }
              )
            ] }),
            /* @__PURE__ */ jsx(InputError, { message: errors.password_confirmation, className: "mt-2" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2 pt-1", children: [
            /* @__PURE__ */ jsx(PrimaryButton, { className: "w-full justify-center bg-slate-900 py-2.5 text-sm normal-case tracking-normal hover:bg-slate-800", disabled: processing, children: "Reinitialiser le mot de passe" }),
            /* @__PURE__ */ jsx("div", { className: "text-center", children: /* @__PURE__ */ jsx(Link_default, { href: route("login"), className: "text-xs text-slate-600 underline underline-offset-4 transition hover:text-slate-900 sm:text-sm", children: "Retour a la connexion" }) })
          ] })
        ] })
      }
    )
  ] });
}
export {
  ResetPassword as default
};
