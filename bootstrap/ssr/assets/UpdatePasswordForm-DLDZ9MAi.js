import { jsxs, jsx } from "react/jsx-runtime";
import { Transition } from "@headlessui/react";
import { u as useForm } from "../ssr.js";
import { useRef } from "react";
import { Lock, CheckCircle } from "lucide-react";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
function UpdatePasswordForm({
  className = ""
}) {
  const passwordInput = useRef(null);
  const currentPasswordInput = useRef(null);
  const {
    data,
    setData,
    errors,
    put,
    reset,
    processing,
    recentlySuccessful
  } = useForm({
    current_password: "",
    password: "",
    password_confirmation: ""
  });
  const updatePassword = (e) => {
    e.preventDefault();
    put(route("password.update"), {
      preserveScroll: true,
      onSuccess: () => reset(),
      onError: (errors2) => {
        if (errors2.password) {
          reset("password", "password_confirmation");
          passwordInput.current?.focus();
        }
        if (errors2.current_password) {
          reset("current_password");
          currentPasswordInput.current?.focus();
        }
      }
    });
  };
  return /* @__PURE__ */ jsxs("section", { className, children: [
    /* @__PURE__ */ jsxs("header", { className: "mb-6", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-white flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Lock, { className: "h-5 w-5 text-amber-300" }),
        "Changer le Mot de Passe"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-slate-300", children: "Assurez-vous que votre compte utilise un mot de passe long et aléatoire pour rester sécurisé." })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: updatePassword, className: "mt-6 space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "current_password", className: "block text-sm font-medium text-slate-200", children: "Mot de passe actuel" }),
        /* @__PURE__ */ jsxs("div", { className: "relative mt-1", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: /* @__PURE__ */ jsx(Lock, { className: "h-5 w-5 text-slate-400" }) }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "current_password",
              ref: currentPasswordInput,
              type: "password",
              className: "block w-full pl-10 rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
              value: data.current_password,
              onChange: (e) => setData("current_password", e.target.value),
              autoComplete: "current-password"
            }
          )
        ] }),
        errors.current_password && /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-red-400", children: errors.current_password })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-slate-200", children: "Nouveau mot de passe" }),
        /* @__PURE__ */ jsxs("div", { className: "relative mt-1", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: /* @__PURE__ */ jsx(Lock, { className: "h-5 w-5 text-slate-400" }) }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "password",
              ref: passwordInput,
              type: "password",
              className: "block w-full pl-10 rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
              value: data.password,
              onChange: (e) => setData("password", e.target.value),
              autoComplete: "new-password"
            }
          )
        ] }),
        errors.password && /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-red-400", children: errors.password })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "password_confirmation", className: "block text-sm font-medium text-slate-200", children: "Confirmer le mot de passe" }),
        /* @__PURE__ */ jsxs("div", { className: "relative mt-1", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: /* @__PURE__ */ jsx(Lock, { className: "h-5 w-5 text-slate-400" }) }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "password_confirmation",
              type: "password",
              className: "block w-full pl-10 rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
              value: data.password_confirmation,
              onChange: (e) => setData("password_confirmation", e.target.value),
              autoComplete: "new-password"
            }
          )
        ] }),
        errors.password_confirmation && /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-red-400", children: errors.password_confirmation })
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
              "Mot de passe mis à jour."
            ] })
          }
        )
      ] })
    ] })
  ] });
}
export {
  UpdatePasswordForm as default
};
