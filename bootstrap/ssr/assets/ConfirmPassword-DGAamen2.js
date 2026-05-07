import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { A as AuthSplitLayout } from "./AuthSplitLayout-C5tXzJtk.js";
import { I as InputError } from "./InputError-DiSBWiye.js";
import { I as InputLabel, T as TextInput } from "./TextInput-FO9W64oM.js";
import { P as PrimaryButton } from "./PrimaryButton-DgVfVBwo.js";
import { u as useForm, H as Head_default } from "../ssr.js";
import { ShieldCheck } from "lucide-react";
import "react";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
function ConfirmPassword() {
  const { data, setData, post, processing, errors, reset } = useForm({
    password: ""
  });
  const submit = (e) => {
    e.preventDefault();
    post(route("password.confirm"), {
      onFinish: () => reset("password")
    });
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Head_default, { title: "Confirmation" }),
    /* @__PURE__ */ jsx(
      AuthSplitLayout,
      {
        title: "Confirmez votre identite",
        description: "Cette zone est protegee. Entrez votre mot de passe pour continuer en toute securite.",
        icon: /* @__PURE__ */ jsx(ShieldCheck, { className: "size-5" }),
        sideStepLabel: "Verification",
        sideTitle: "Un dernier controle avant d'avancer.",
        sideDescription: "Cette verification protege vos operations sensibles et vos donnees metier.",
        children: /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(InputLabel, { htmlFor: "password", value: "Mot de passe", className: "text-slate-700" }),
            /* @__PURE__ */ jsx(
              TextInput,
              {
                id: "password",
                type: "password",
                name: "password",
                value: data.password,
                className: "mt-1 block w-full border border-[#cfc3ac] bg-white text-slate-900 placeholder-slate-400",
                isFocused: true,
                onChange: (e) => setData("password", e.target.value)
              }
            ),
            /* @__PURE__ */ jsx(InputError, { message: errors.password, className: "mt-2" })
          ] }),
          /* @__PURE__ */ jsx(PrimaryButton, { className: "w-full justify-center bg-slate-900 py-2.5 text-sm normal-case tracking-normal hover:bg-slate-800", disabled: processing, children: "Confirmer" })
        ] })
      }
    )
  ] });
}
export {
  ConfirmPassword as default
};
