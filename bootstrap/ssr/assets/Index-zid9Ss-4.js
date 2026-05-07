import { jsxs, jsx } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { u as useForm, H as Head_default } from "../ssr.js";
import { Settings, Globe, Mail, Phone, CreditCard, Loader2, Save } from "lucide-react";
import "react";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
function PlatformSettings({ settings }) {
  const { data, setData, patch, processing, errors, recentlySuccessful } = useForm({
    general: { ...settings.general },
    payment: { ...settings.payment }
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    patch("/platform-admin/settings");
  };
  return /* @__PURE__ */ jsxs(
    Authenticated,
    {
      header: /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-white", children: "Paramètres de la plateforme" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-300", children: "Configuration générale et numéros de paiement" })
      ] }),
      children: [
        /* @__PURE__ */ jsx(Head_default, { title: "Paramètres Plateforme" }),
        /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "mx-auto max-w-3xl space-y-8", children: [
          recentlySuccessful && /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300", children: "✓ Paramètres enregistrés avec succès." }),
          /* @__PURE__ */ jsxs("section", { className: "rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5", children: [
            /* @__PURE__ */ jsxs("h2", { className: "flex items-center gap-2 text-base font-semibold text-white", children: [
              /* @__PURE__ */ jsx(Settings, { className: "size-5 text-amber-200" }),
              "Informations générales"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-300", children: "Nom de la plateforme" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: data.general.platform_name,
                    onChange: (e) => setData("general", { ...data.general, platform_name: e.target.value }),
                    className: "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-300/50 focus:outline-none focus:ring-1 focus:ring-amber-300/50",
                    placeholder: "Batix SaaS"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-300", children: /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx(Globe, { className: "size-3.5" }),
                  " URL du site"
                ] }) }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "url",
                    value: data.general.website_url,
                    onChange: (e) => setData("general", { ...data.general, website_url: e.target.value }),
                    className: "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-300/50 focus:outline-none focus:ring-1 focus:ring-amber-300/50",
                    placeholder: "https://batixpro.com"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-300", children: /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx(Mail, { className: "size-3.5" }),
                  " Email support"
                ] }) }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "email",
                    value: data.general.support_email,
                    onChange: (e) => setData("general", { ...data.general, support_email: e.target.value }),
                    className: "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-300/50 focus:outline-none focus:ring-1 focus:ring-amber-300/50",
                    placeholder: "support@batixpro.com"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-300", children: /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx(Phone, { className: "size-3.5" }),
                  " Téléphone support"
                ] }) }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "tel",
                    value: data.general.support_phone,
                    onChange: (e) => setData("general", { ...data.general, support_phone: e.target.value }),
                    className: "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-300/50 focus:outline-none focus:ring-1 focus:ring-amber-300/50",
                    placeholder: "+221 77 000 00 00"
                  }
                )
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("section", { className: "rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("h2", { className: "flex items-center gap-2 text-base font-semibold text-white", children: [
                /* @__PURE__ */ jsx(CreditCard, { className: "size-5 text-amber-200" }),
                "Numéros de paiement"
              ] }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-slate-400", children: "Ces numéros sont affichés sur la page de paiement lors de la souscription à un plan." })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2", children: [
              { key: "wave", label: "Wave", icon: "🌊", placeholder: "+221 77 000 00 00" },
              { key: "orange_money", label: "Orange Money", icon: "🟠", placeholder: "+221 77 000 00 01" },
              { key: "mtn_money", label: "MTN Money", icon: "🟡", placeholder: "+225 07 00 00 00 00" },
              { key: "moov_money", label: "Moov Money", icon: "🔵", placeholder: "+226 70 00 00 00" },
              { key: "virement", label: "Virement bancaire", icon: "🏦", placeholder: "IBAN / RIB" },
              { key: "carte", label: "Carte bancaire", icon: "💳", placeholder: "Lien ou info carte" }
            ].map(({ key, label, icon, placeholder }) => /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium text-slate-300", children: [
                icon,
                " ",
                label
              ] }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: data.payment[key],
                  onChange: (e) => setData("payment", { ...data.payment, [key]: e.target.value }),
                  className: "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-300/50 focus:outline-none focus:ring-1 focus:ring-amber-300/50",
                  placeholder
                }
              )
            ] }, key)) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxs(
            "button",
            {
              type: "submit",
              disabled: processing,
              className: "inline-flex items-center gap-2 rounded-xl bg-amber-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-amber-200 disabled:opacity-50",
              children: [
                processing ? /* @__PURE__ */ jsx(Loader2, { className: "size-4 animate-spin" }) : /* @__PURE__ */ jsx(Save, { className: "size-4" }),
                "Enregistrer les paramètres"
              ]
            }
          ) })
        ] })
      ]
    }
  );
}
export {
  PlatformSettings as default
};
