import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { A as AuthSplitLayout } from "./AuthSplitLayout-C5tXzJtk.js";
import { I as InputError } from "./InputError-DiSBWiye.js";
import { I as InputLabel, T as TextInput } from "./TextInput-FO9W64oM.js";
import { P as PrimaryButton } from "./PrimaryButton-DgVfVBwo.js";
import { H as Head_default, L as Link_default } from "../ssr.js";
import axios from "axios";
import { useState, useRef, useEffect } from "react";
import { EyeOff, Eye, User, ShieldCheck, MailCheck, Store } from "lucide-react";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
function Register({ initialStep = 1, initialEmail = "" }) {
  const [step, setStep] = useState(initialStep);
  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [step1Processing, setStep1Processing] = useState(false);
  const [step1Errors, setStep1Errors] = useState({});
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [otpProcessing, setOtpProcessing] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [devOtpCode, setDevOtpCode] = useState(null);
  const otpRefs = useRef([]);
  const [shopName, setShopName] = useState("");
  const [shopCity, setShopCity] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [step3Processing, setStep3Processing] = useState(false);
  const [step3Errors, setStep3Errors] = useState({});
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = window.setTimeout(() => setResendCooldown((v) => v - 1), 1e3);
    return () => window.clearTimeout(t);
  }, [resendCooldown]);
  const handleStep1 = async (e) => {
    e.preventDefault();
    setStep1Processing(true);
    setStep1Errors({});
    try {
      await axios.post(route("register"), { name, email, password, password_confirmation: passwordConfirmation });
      setStep(2);
    } catch (error) {
      if (error?.response?.status === 422) {
        setStep1Errors(error.response.data.errors ?? {});
      }
    } finally {
      setStep1Processing(false);
    }
  };
  const handleOtpChange = (index, value) => {
    const v = value.replace(/[^0-9]/g, "");
    if (v.length > 1) return;
    const next = [...otp];
    next[index] = v;
    setOtp(next);
    setOtpError("");
    if (v && index < 5) otpRefs.current[index + 1]?.focus();
    if (index === 5 && v && next.every((d) => d !== "")) handleVerifyOtp(next.join(""));
  };
  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const next = pasted.split("");
      setOtp(next);
      setOtpError("");
      otpRefs.current[5]?.focus();
      handleVerifyOtp(pasted);
    }
  };
  const handleVerifyOtp = async (code) => {
    setOtpProcessing(true);
    setOtpError("");
    try {
      const { data } = await axios.post(route("verification.code.verify"), { code });
      if (data.step === 3) {
        setStep(3);
      } else if (data.redirect) {
        window.location.href = data.redirect;
      }
    } catch (error) {
      setOtpError(error?.response?.data?.message || "Code invalide. Veuillez reessayer.");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setOtpProcessing(false);
    }
  };
  const handleOtpSubmit = (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length === 6) handleVerifyOtp(code);
  };
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResendCooldown(60);
    setResendSuccess(false);
    setDevOtpCode(null);
    try {
      const { data } = await axios.post(route("verification.code.resend"));
      setResendSuccess(true);
      if (data.code) setDevOtpCode(data.code);
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
      window.setTimeout(() => setResendSuccess(false), 5e3);
    } catch {
      setOtpError("Impossible de renvoyer le code. Veuillez reessayer.");
      setResendCooldown(0);
    }
  };
  const handleStep3 = async (e) => {
    e.preventDefault();
    setStep3Processing(true);
    setStep3Errors({});
    try {
      const { data } = await axios.post(route("shop.store.initial"), {
        name: shopName,
        city: shopCity,
        phone: shopPhone,
        address: shopAddress
      });
      if (data.redirect) window.location.href = data.redirect;
    } catch (error) {
      if (error?.response?.status === 422) {
        setStep3Errors(error.response.data.errors ?? {});
      }
    } finally {
      setStep3Processing(false);
    }
  };
  const stepper = /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center gap-2", children: [
    /* @__PURE__ */ jsx("div", { className: `flex size-7 items-center justify-center rounded-full text-xs font-semibold ${step > 1 ? "bg-emerald-500 text-white" : step === 1 ? "bg-amber-500 text-white" : "bg-[#d5c9b2] text-slate-700"}`, children: step > 1 ? "✓" : "1" }),
    /* @__PURE__ */ jsx("div", { className: `h-1 w-10 rounded-full ${step > 1 ? "bg-emerald-400" : "bg-[#d5c9b2]"}` }),
    /* @__PURE__ */ jsx("div", { className: `flex size-7 items-center justify-center rounded-full text-xs font-semibold ${step > 2 ? "bg-emerald-500 text-white" : step === 2 ? "bg-amber-500 text-white" : "bg-[#d5c9b2] text-slate-700"}`, children: step > 2 ? "✓" : "2" }),
    /* @__PURE__ */ jsx("div", { className: `h-1 w-10 rounded-full ${step > 2 ? "bg-emerald-400" : "bg-[#d5c9b2]"}` }),
    /* @__PURE__ */ jsx("div", { className: `flex size-7 items-center justify-center rounded-full text-xs font-semibold ${step === 3 ? "bg-amber-500 text-white" : "bg-[#d5c9b2] text-slate-700"}`, children: "3" })
  ] });
  if (step === 1) {
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Head_default, { title: "Inscription" }),
      /* @__PURE__ */ jsx(
        AuthSplitLayout,
        {
          title: "Commencons par votre compte",
          description: "Entrez vos informations pour activer votre essai gratuit de 14 jours.",
          icon: /* @__PURE__ */ jsx(User, { className: "size-5" }),
          stepper,
          sideStepLabel: "Etape 1 sur 3",
          sideTitle: "Un bon demarrage change tout le reste.",
          sideDescription: "Creez votre compte maintenant, puis verifiez votre email et configurez votre boutique.",
          children: /* @__PURE__ */ jsxs("form", { onSubmit: handleStep1, className: "space-y-3", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(InputLabel, { htmlFor: "name", value: "Nom complet", className: "text-slate-700" }),
              /* @__PURE__ */ jsx(TextInput, { id: "name", value: name, className: "mt-1 block w-full border border-[#cfc3ac] bg-white text-slate-900 placeholder-slate-400", autoComplete: "name", isFocused: true, onChange: (e) => setName(e.target.value), required: true, placeholder: "Jean Dupont" }),
              /* @__PURE__ */ jsx(InputError, { message: step1Errors.name, className: "mt-2" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(InputLabel, { htmlFor: "email", value: "Email", className: "text-slate-700" }),
              /* @__PURE__ */ jsx(TextInput, { id: "email", type: "email", value: email, className: "mt-1 block w-full border border-[#cfc3ac] bg-white text-slate-900 placeholder-slate-400", autoComplete: "username", onChange: (e) => setEmail(e.target.value), required: true, placeholder: "jean@exemple.com" }),
              /* @__PURE__ */ jsx(InputError, { message: step1Errors.email, className: "mt-2" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(InputLabel, { htmlFor: "password", value: "Mot de passe", className: "text-slate-700" }),
              /* @__PURE__ */ jsxs("div", { className: "relative mt-1", children: [
                /* @__PURE__ */ jsx(TextInput, { id: "password", type: showPassword ? "text" : "password", value: password, className: "block w-full border border-[#cfc3ac] bg-white pr-10 text-slate-900 placeholder-slate-400", autoComplete: "new-password", onChange: (e) => setPassword(e.target.value), required: true, placeholder: "••••••••" }),
                /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700", children: showPassword ? /* @__PURE__ */ jsx(EyeOff, { className: "size-5" }) : /* @__PURE__ */ jsx(Eye, { className: "size-5" }) })
              ] }),
              /* @__PURE__ */ jsx(InputError, { message: step1Errors.password, className: "mt-2" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(InputLabel, { htmlFor: "password_confirmation", value: "Confirmer le mot de passe", className: "text-slate-700" }),
              /* @__PURE__ */ jsxs("div", { className: "relative mt-1", children: [
                /* @__PURE__ */ jsx(TextInput, { id: "password_confirmation", type: showPasswordConfirmation ? "text" : "password", value: passwordConfirmation, className: "block w-full border border-[#cfc3ac] bg-white pr-10 text-slate-900 placeholder-slate-400", autoComplete: "new-password", onChange: (e) => setPasswordConfirmation(e.target.value), required: true, placeholder: "••••••••" }),
                /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setShowPasswordConfirmation(!showPasswordConfirmation), className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700", children: showPasswordConfirmation ? /* @__PURE__ */ jsx(EyeOff, { className: "size-5" }) : /* @__PURE__ */ jsx(Eye, { className: "size-5" }) })
              ] }),
              /* @__PURE__ */ jsx(InputError, { message: step1Errors.password_confirmation, className: "mt-2" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2 pt-1", children: [
              /* @__PURE__ */ jsx(PrimaryButton, { className: "w-full justify-center bg-slate-900 py-2.5 text-sm normal-case tracking-normal hover:bg-slate-800", disabled: step1Processing, children: step1Processing ? "Création en cours..." : "Continuer" }),
              /* @__PURE__ */ jsx("div", { className: "text-center", children: /* @__PURE__ */ jsx(Link_default, { href: route("login"), className: "text-xs text-slate-600 underline underline-offset-4 transition hover:text-slate-900 sm:text-sm", children: "Deja inscrit ? Se connecter" }) })
            ] })
          ] })
        }
      )
    ] });
  }
  if (step === 2) {
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Head_default, { title: "Verification email" }),
      /* @__PURE__ */ jsx(
        AuthSplitLayout,
        {
          title: "Verifiez votre email",
          description: `Un code a 6 chiffres a ete envoye a ${email}.`,
          icon: /* @__PURE__ */ jsx(MailCheck, { className: "size-5" }),
          stepper,
          sideStepLabel: "Etape 2 sur 3",
          sideTitle: "Validez votre acces en toute securite.",
          sideDescription: "Confirmez votre email pour activer votre espace et continuer la configuration.",
          children: /* @__PURE__ */ jsxs("form", { onSubmit: handleOtpSubmit, className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm font-medium text-slate-700", children: [
              /* @__PURE__ */ jsx(ShieldCheck, { className: "size-4 text-amber-700" }),
              "Entrez le code a 6 chiffres"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex gap-2", children: otp.map((digit, index) => /* @__PURE__ */ jsx(
              "input",
              {
                ref: (el) => {
                  otpRefs.current[index] = el;
                },
                type: "text",
                inputMode: "numeric",
                maxLength: 1,
                value: digit,
                onChange: (e) => handleOtpChange(index, e.target.value),
                onKeyDown: (e) => handleOtpKeyDown(index, e),
                onPaste: index === 0 ? handleOtpPaste : void 0,
                disabled: otpProcessing,
                autoFocus: index === 0,
                className: `h-12 w-full rounded-lg border text-center text-xl font-semibold transition-all focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 ${otpError ? "border-red-300 bg-red-50 text-red-700" : digit ? "border-amber-300 bg-amber-50 text-amber-800" : "border-[#cfc3ac] bg-white text-slate-800"}`
              },
              index
            )) }),
            otpError && /* @__PURE__ */ jsx("p", { className: "text-sm text-red-600", children: otpError }),
            /* @__PURE__ */ jsx(PrimaryButton, { type: "submit", className: "w-full justify-center bg-slate-900 py-2.5 text-sm normal-case tracking-normal hover:bg-slate-800", disabled: otpProcessing || otp.join("").length < 6, children: otpProcessing ? "Verification..." : "Verifier le code" }),
            /* @__PURE__ */ jsx("div", { className: "text-center", children: /* @__PURE__ */ jsx("button", { type: "button", onClick: handleResend, disabled: resendCooldown > 0, className: "text-xs text-slate-600 underline underline-offset-4 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50", children: resendCooldown > 0 ? `Renvoyer dans ${resendCooldown}s` : "Renvoyer le code" }) }),
            resendSuccess && /* @__PURE__ */ jsx("p", { className: "text-center text-xs text-emerald-600", children: "Nouveau code envoye avec succes." }),
            devOtpCode && /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-center text-sm font-mono font-bold text-amber-800", children: [
              "[DEV] Code : ",
              devOtpCode
            ] })
          ] })
        }
      )
    ] });
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Head_default, { title: "Votre boutique" }),
    /* @__PURE__ */ jsx(
      AuthSplitLayout,
      {
        title: "Creez votre premiere boutique",
        description: "Donnez un nom a votre boutique pour finaliser votre inscription.",
        icon: /* @__PURE__ */ jsx(Store, { className: "size-5" }),
        stepper,
        sideStepLabel: "Etape 3 sur 3",
        sideTitle: "Votre espace est presque pret.",
        sideDescription: "Ajoutez les informations de base de votre boutique. Vous pourrez tout completer plus tard.",
        children: /* @__PURE__ */ jsxs("form", { onSubmit: handleStep3, className: "space-y-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(InputLabel, { htmlFor: "shop_name", value: "Nom de la boutique", className: "text-slate-700" }),
            /* @__PURE__ */ jsx(TextInput, { id: "shop_name", value: shopName, className: "mt-1 block w-full border border-[#cfc3ac] bg-white text-slate-900 placeholder-slate-400", isFocused: true, onChange: (e) => setShopName(e.target.value), required: true, placeholder: "Ma Quincaillerie" }),
            /* @__PURE__ */ jsx(InputError, { message: step3Errors.name, className: "mt-2" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(InputLabel, { htmlFor: "shop_city", value: "Ville", className: "text-slate-700" }),
              /* @__PURE__ */ jsx(TextInput, { id: "shop_city", value: shopCity, className: "mt-1 block w-full border border-[#cfc3ac] bg-white text-slate-900 placeholder-slate-400", onChange: (e) => setShopCity(e.target.value), placeholder: "Abidjan" }),
              /* @__PURE__ */ jsx(InputError, { message: step3Errors.city, className: "mt-2" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(InputLabel, { htmlFor: "shop_phone", value: "Telephone", className: "text-slate-700" }),
              /* @__PURE__ */ jsx(TextInput, { id: "shop_phone", value: shopPhone, className: "mt-1 block w-full border border-[#cfc3ac] bg-white text-slate-900 placeholder-slate-400", onChange: (e) => setShopPhone(e.target.value), placeholder: "+225 07 00 00 00" }),
              /* @__PURE__ */ jsx(InputError, { message: step3Errors.phone, className: "mt-2" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(InputLabel, { htmlFor: "shop_address", value: "Adresse (optionnel)", className: "text-slate-700" }),
            /* @__PURE__ */ jsx(TextInput, { id: "shop_address", value: shopAddress, className: "mt-1 block w-full border border-[#cfc3ac] bg-white text-slate-900 placeholder-slate-400", onChange: (e) => setShopAddress(e.target.value), placeholder: "Rue des Palmiers, Cocody" }),
            /* @__PURE__ */ jsx(InputError, { message: step3Errors.address, className: "mt-2" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "pt-1", children: /* @__PURE__ */ jsx(PrimaryButton, { className: "w-full justify-center bg-slate-900 py-2.5 text-sm normal-case tracking-normal hover:bg-slate-800", disabled: step3Processing, children: step3Processing ? "Création en cours..." : "Lancer mon espace" }) })
        ] })
      }
    )
  ] });
}
export {
  Register as default
};
