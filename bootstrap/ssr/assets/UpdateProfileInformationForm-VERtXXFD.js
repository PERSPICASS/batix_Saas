import { jsxs, jsx } from "react/jsx-runtime";
import { Transition } from "@headlessui/react";
import { a as usePage, u as useForm, L as Link_default } from "../ssr.js";
import { User, Mail, CheckCircle } from "lucide-react";
import "@inertiajs/core";
import "react";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
function UpdateProfileInformation({
  mustVerifyEmail,
  status,
  className = ""
}) {
  const user = usePage().props.auth.user;
  const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
    name: user.name,
    email: user.email
  });
  const submit = (e) => {
    e.preventDefault();
    patch(route("profile.update"));
  };
  return /* @__PURE__ */ jsxs("section", { className, children: [
    /* @__PURE__ */ jsxs("header", { className: "mb-6", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-white flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(User, { className: "h-5 w-5 text-amber-300" }),
        "Informations du Profil"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-slate-300", children: "Mettez à jour les informations de votre compte et votre adresse email." })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "mt-6 space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "name", className: "block text-sm font-medium text-slate-200", children: "Nom complet" }),
        /* @__PURE__ */ jsxs("div", { className: "relative mt-1", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: /* @__PURE__ */ jsx(User, { className: "h-5 w-5 text-slate-400" }) }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "name",
              type: "text",
              className: "block w-full pl-10 rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
              value: data.name,
              onChange: (e) => setData("name", e.target.value),
              required: true,
              autoFocus: true,
              autoComplete: "name"
            }
          )
        ] }),
        errors.name && /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-red-400", children: errors.name })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-slate-200", children: "Adresse Email" }),
        /* @__PURE__ */ jsxs("div", { className: "relative mt-1", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: /* @__PURE__ */ jsx(Mail, { className: "h-5 w-5 text-slate-400" }) }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "email",
              type: "email",
              className: "block w-full pl-10 rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
              value: data.email,
              onChange: (e) => setData("email", e.target.value),
              required: true,
              autoComplete: "username"
            }
          )
        ] }),
        errors.email && /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-red-400", children: errors.email })
      ] }),
      mustVerifyEmail && user.email_verified_at === null && /* @__PURE__ */ jsxs("div", { className: "bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-yellow-200", children: [
          "Votre adresse email n'est pas vérifiée.",
          /* @__PURE__ */ jsx(
            Link_default,
            {
              href: route("verification.send"),
              method: "post",
              as: "button",
              className: "ml-2 rounded-md text-sm text-yellow-300 underline hover:text-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 font-medium",
              children: "Cliquez ici pour renvoyer l'email de vérification."
            }
          )
        ] }),
        status === "verification-link-sent" && /* @__PURE__ */ jsxs("div", { className: "mt-2 flex items-center gap-2 text-sm font-medium text-green-400", children: [
          /* @__PURE__ */ jsx(CheckCircle, { className: "h-4 w-4" }),
          "Un nouveau lien de vérification a été envoyé à votre adresse email."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            disabled: processing,
            className: "rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50",
            children: "Enregistrer"
          }
        ),
        /* @__PURE__ */ jsx(
          Transition,
          {
            show: recentlySuccessful,
            enter: "transition ease-in-out",
            enterFrom: "opacity-0",
            leave: "transition ease-in-out",
            leaveTo: "opacity-0",
            children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-green-400 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(CheckCircle, { className: "h-4 w-4" }),
              "Enregistré avec succès."
            ] })
          }
        )
      ] })
    ] })
  ] });
}
export {
  UpdateProfileInformation as default
};
