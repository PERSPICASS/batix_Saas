import { jsx, jsxs } from "react/jsx-runtime";
import { M as Modal } from "./Modal-BeSeEOS3.js";
import { AlertTriangle } from "lucide-react";
function ConfirmDeleteModal({
  show,
  onClose,
  onConfirm,
  title = "Confirmer la suppression",
  message,
  confirmText = "Supprimer",
  cancelText = "Annuler",
  processing = false
}) {
  return /* @__PURE__ */ jsx(Modal, { show, onClose, maxWidth: "md", children: /* @__PURE__ */ jsxs("div", { className: "bg-slate-900 p-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: "flex size-12 shrink-0 items-center justify-center rounded-full bg-red-500/20", children: /* @__PURE__ */ jsx(AlertTriangle, { className: "size-6 text-red-400" }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-white", children: title }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-slate-300", children: message })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 flex justify-end gap-3", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: onClose,
          disabled: processing,
          className: "rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50",
          children: cancelText
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: onConfirm,
          disabled: processing,
          className: "rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50",
          children: processing ? "Suppression..." : confirmText
        }
      )
    ] })
  ] }) });
}
export {
  ConfirmDeleteModal as C
};
