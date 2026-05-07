import { jsxs, jsx } from "react/jsx-runtime";
import { M as Modal } from "./Modal-BeSeEOS3.js";
import { u as useForm } from "../ssr.js";
import { useState, useRef } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import "@headlessui/react";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
function DeleteUserForm({
  className = ""
}) {
  const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
  const passwordInput = useRef(null);
  const {
    data,
    setData,
    delete: destroy,
    processing,
    reset,
    errors,
    clearErrors
  } = useForm({
    password: ""
  });
  const confirmUserDeletion = () => {
    setConfirmingUserDeletion(true);
  };
  const deleteUser = (e) => {
    e.preventDefault();
    destroy(route("profile.destroy"), {
      preserveScroll: true,
      onSuccess: () => closeModal(),
      onError: () => passwordInput.current?.focus(),
      onFinish: () => reset()
    });
  };
  const closeModal = () => {
    setConfirmingUserDeletion(false);
    clearErrors();
    reset();
  };
  return /* @__PURE__ */ jsxs("section", { className: `space-y-6 ${className}`, children: [
    /* @__PURE__ */ jsxs("header", { className: "mb-6", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-red-400 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Trash2, { className: "h-5 w-5" }),
        "Supprimer le Compte"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-slate-300", children: "Une fois votre compte supprimé, toutes ses ressources et données seront définitivement supprimées. Avant de supprimer votre compte, veuillez télécharger toutes les données ou informations que vous souhaitez conserver." })
    ] }),
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: confirmUserDeletion,
        className: "rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900",
        children: "Supprimer le Compte"
      }
    ),
    /* @__PURE__ */ jsx(Modal, { show: confirmingUserDeletion, onClose: closeModal, children: /* @__PURE__ */ jsxs("form", { onSubmit: deleteUser, className: "p-6 bg-slate-900 rounded-lg", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
        /* @__PURE__ */ jsx("div", { className: "flex-shrink-0 w-12 h-12 bg-red-900/30 rounded-full flex items-center justify-center border border-red-500/30", children: /* @__PURE__ */ jsx(AlertTriangle, { className: "h-6 w-6 text-red-400" }) }),
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-white", children: "Êtes-vous sûr de vouloir supprimer votre compte ?" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6", children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-red-200", children: [
        "⚠️ ",
        /* @__PURE__ */ jsx("strong", { children: "Cette action est irréversible." }),
        " Une fois votre compte supprimé, toutes ses ressources et données seront définitivement supprimées. Veuillez entrer votre mot de passe pour confirmer que vous souhaitez supprimer définitivement votre compte."
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6", children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "password", className: "sr-only", children: "Mot de passe" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            id: "password",
            type: "password",
            name: "password",
            ref: passwordInput,
            value: data.password,
            onChange: (e) => setData("password", e.target.value),
            className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
            autoFocus: true,
            placeholder: "Entrez votre mot de passe"
          }
        ),
        errors.password && /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-red-400", children: errors.password })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 flex justify-end gap-3", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: closeModal,
            className: "rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-slate-900",
            children: "Annuler"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            disabled: processing,
            className: "rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50",
            children: "Supprimer le Compte"
          }
        )
      ] })
    ] }) })
  ] });
}
export {
  DeleteUserForm as default
};
