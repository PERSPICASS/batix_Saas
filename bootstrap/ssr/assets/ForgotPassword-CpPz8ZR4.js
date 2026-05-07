import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { A as AuthSplitLayout } from "./AuthSplitLayout-C5tXzJtk.js";
import { I as InputError } from "./InputError-DiSBWiye.js";
import { I as InputLabel, T as TextInput } from "./TextInput-FO9W64oM.js";
import { P as PrimaryButton } from "./PrimaryButton-DgVfVBwo.js";
import { u as useForm, H as Head_default, L as Link_default } from "../ssr.js";
import { Mail } from "lucide-react";
import "react";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
function ForgotPassword({ status }) {
  const { data, setData, post, processing, errors } = useForm({
    email: ""
  });
  const submit = (e) => {
    e.preventDefault();
    post(route("password.email"));
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Head_default, { title: "Mot de passe oublie" }),
    /* @__PURE__ */ jsxs(
      AuthSplitLayout,
      {
        title: "Recuperez votre acces",
        description: "Renseignez votre email et nous vous envoyons un lien de reinitialisation en quelques secondes.",
        icon: /* @__PURE__ */ jsx(Mail, { className: "size-5" }),
        topLink: { href: "/", label: "Retour a l'accueil" },
        sideStepLabel: "Recuperation",
        sideTitle: "Une etape simple pour repartir rapidement.",
        sideDescription: "Gardez l'acces a votre compte meme en cas d'oubli de mot de passe.",
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
                  isFocused: true,
                  onChange: (e) => setData("email", e.target.value),
                  placeholder: "jean@exemple.com"
                }
              ),
              /* @__PURE__ */ jsx(InputError, { message: errors.email, className: "mt-2" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2 pt-1", children: [
              /* @__PURE__ */ jsx(PrimaryButton, { className: "w-full justify-center bg-slate-900 py-2.5 text-sm normal-case tracking-normal hover:bg-slate-800", disabled: processing, children: "Envoyer le lien" }),
              /* @__PURE__ */ jsx("div", { className: "text-center", children: /* @__PURE__ */ jsx(Link_default, { href: route("login"), className: "text-xs text-slate-600 underline underline-offset-4 transition hover:text-slate-900 sm:text-sm", children: "Retour a la connexion" }) })
            ] })
          ] })
        ]
      }
    )
  ] });
}
export {
  ForgotPassword as default
};
