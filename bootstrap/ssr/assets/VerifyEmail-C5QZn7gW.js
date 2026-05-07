import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { A as AuthSplitLayout } from "./AuthSplitLayout-C5tXzJtk.js";
import { P as PrimaryButton } from "./PrimaryButton-DgVfVBwo.js";
import { H as Head_default } from "../ssr.js";
import { useState, useRef, useEffect } from "react";
import { ShieldCheck, RefreshCw, MailCheck } from "lucide-react";
import { u as useRoute } from "./route-C2Ac8FMA.js";
import axios from "axios";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
function VerifyEmail({ email, canResend }) {
  const route = useRoute();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef([]);
  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }
    const timer = window.setTimeout(() => setResendCooldown((prev) => prev - 1), 1e3);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);
  const handleCodeChange = (index, value) => {
    const numericValue = value.replace(/[^0-9]/g, "");
    if (numericValue.length > 1) {
      return;
    }
    const newCode = [...code];
    newCode[index] = numericValue;
    setCode(newCode);
    setVerificationError("");
    if (numericValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (index === 5 && numericValue && newCode.every((digit) => digit !== "")) {
      handleVerify(newCode.join(""));
    }
  };
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    if (pastedData.length === 6) {
      const newCode = pastedData.split("");
      setCode(newCode);
      setVerificationError("");
      inputRefs.current[5]?.focus();
      handleVerify(pastedData);
    }
  };
  const handleVerify = async (verificationCode) => {
    setIsVerifying(true);
    setVerificationError("");
    try {
      const { data } = await axios.post(route("verification.code.verify"), {
        code: verificationCode
      });
      if (data.redirect) {
        window.location.href = data.redirect;
      } else if (data.step === 3) {
        window.location.href = route("shop.create.initial");
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Code invalide. Veuillez reessayer.";
      setVerificationError(message);
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };
  const submit = (e) => {
    e.preventDefault();
    const verificationCode = code.join("");
    if (verificationCode.length === 6) {
      handleVerify(verificationCode);
    }
  };
  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) {
      return;
    }
    setResendSuccess(false);
    setVerificationError("");
    setResendCooldown(60);
    setIsResending(true);
    try {
      await axios.post(route("verification.code.resend"));
      setResendSuccess(true);
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      window.setTimeout(() => setResendSuccess(false), 5e3);
    } catch {
      setVerificationError("Impossible de renvoyer le code. Veuillez reessayer.");
      setResendCooldown(0);
    } finally {
      setIsResending(false);
    }
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Head_default, { title: "Verification email" }),
    /* @__PURE__ */ jsx(
      AuthSplitLayout,
      {
        title: "Verifiez votre email",
        description: `Un code a 6 chiffres a ete envoye a ${email}.`,
        icon: /* @__PURE__ */ jsx(MailCheck, { className: "size-5" }),
        stepper: /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "flex size-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-semibold text-white", children: "✓" }),
          /* @__PURE__ */ jsx("div", { className: "h-1 w-10 rounded-full bg-emerald-400" }),
          /* @__PURE__ */ jsx("div", { className: "flex size-7 items-center justify-center rounded-full bg-amber-500 text-xs font-semibold text-white", children: "2" }),
          /* @__PURE__ */ jsx("div", { className: "h-1 w-10 rounded-full bg-[#d5c9b2]" }),
          /* @__PURE__ */ jsx("div", { className: "flex size-7 items-center justify-center rounded-full bg-[#d5c9b2] text-xs font-semibold text-slate-700", children: "3" })
        ] }),
        sideStepLabel: "Etape 2 sur 3",
        sideTitle: "Validez votre acces en toute securite.",
        sideDescription: "Confirmez votre email pour activer votre espace et continuer la configuration.",
        children: /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-3", children: [
          /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm font-medium text-slate-700", children: [
            /* @__PURE__ */ jsx(ShieldCheck, { className: "size-4 text-amber-700" }),
            "Entrez le code a 6 chiffres"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex gap-2", children: code.map((digit, index) => /* @__PURE__ */ jsx(
            "input",
            {
              ref: (el) => {
                inputRefs.current[index] = el;
              },
              type: "text",
              inputMode: "numeric",
              maxLength: 1,
              value: digit,
              onChange: (e) => handleCodeChange(index, e.target.value),
              onKeyDown: (e) => handleKeyDown(index, e),
              onPaste: index === 0 ? handlePaste : void 0,
              disabled: isVerifying,
              className: `h-12 w-full rounded-lg border text-center text-xl font-semibold transition-all ${verificationError ? "border-red-300 bg-red-50 text-red-700" : digit ? "border-amber-300 bg-amber-50 text-amber-800" : "border-[#cfc3ac] bg-white text-slate-800"} focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200`,
              autoFocus: index === 0
            },
            index
          )) }),
          verificationError && /* @__PURE__ */ jsx("p", { className: "rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700", children: verificationError }),
          resendSuccess && /* @__PURE__ */ jsx("p", { className: "rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700", children: "Un nouveau code a ete envoye." }),
          /* @__PURE__ */ jsx(
            PrimaryButton,
            {
              type: "submit",
              disabled: code.join("").length !== 6 || isVerifying,
              className: "w-full justify-center bg-slate-900 py-2.5 text-sm normal-case tracking-normal hover:bg-slate-800",
              children: isVerifying ? "Verification..." : "Verifier"
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "text-center", children: canResend && resendCooldown === 0 ? /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: handleResend,
              disabled: isResending,
              className: "inline-flex items-center gap-2 text-sm text-slate-700 underline underline-offset-4 transition hover:text-slate-900",
              children: [
                /* @__PURE__ */ jsx(RefreshCw, { className: `size-4 ${isResending ? "animate-spin" : ""}` }),
                "Renvoyer le code"
              ]
            }
          ) : resendCooldown > 0 ? /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-600", children: [
            "Nouveau code dans ",
            /* @__PURE__ */ jsxs("span", { className: "font-semibold text-amber-700", children: [
              resendCooldown,
              "s"
            ] })
          ] }) : /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-600", children: "Consultez votre boite de reception" }) })
        ] })
      }
    )
  ] });
}
export {
  VerifyEmail as default
};
