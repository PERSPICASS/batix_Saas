import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { A as AuthSplitLayout } from "./AuthSplitLayout-C5tXzJtk.js";
import { I as InputError } from "./InputError-DiSBWiye.js";
import { I as InputLabel, T as TextInput } from "./TextInput-FO9W64oM.js";
import { P as PrimaryButton } from "./PrimaryButton-DgVfVBwo.js";
import { u as useForm, H as Head_default } from "../ssr.js";
import { Store, MapPin, Phone } from "lucide-react";
import "react";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
function CreateShop() {
  const { data, setData, post, processing, errors } = useForm({
    name: "",
    address: "",
    city: "",
    postal_code: "",
    phone: ""
  });
  const submit = (e) => {
    e.preventDefault();
    post(route("shop.store.initial"));
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Head_default, { title: "Creer votre boutique" }),
    /* @__PURE__ */ jsx(
      AuthSplitLayout,
      {
        title: "Etape 3/3 : Creez votre boutique",
        description: "Renseignez les informations de votre premiere boutique pour commencer a utiliser Batix.",
        icon: /* @__PURE__ */ jsx(Store, { className: "size-5" }),
        stepper: /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "flex size-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-semibold text-white", children: "✓" }),
          /* @__PURE__ */ jsx("div", { className: "h-1 w-10 rounded-full bg-emerald-400" }),
          /* @__PURE__ */ jsx("div", { className: "flex size-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-semibold text-white", children: "✓" }),
          /* @__PURE__ */ jsx("div", { className: "h-1 w-10 rounded-full bg-amber-400" }),
          /* @__PURE__ */ jsx("div", { className: "flex size-7 items-center justify-center rounded-full bg-amber-500 text-xs font-semibold text-white", children: "3" })
        ] }),
        sideStepLabel: "Etape 3 sur 3",
        sideTitle: "Votre boutique prend forme.",
        sideDescription: "Encore quelques informations et vous pourrez demarrer vos operations en conditions reelles.",
        afterContent: /* @__PURE__ */ jsxs("p", { className: "text-center text-xs text-slate-500", children: [
          "En creant votre boutique, vous beneficiez automatiquement de",
          " ",
          /* @__PURE__ */ jsx("span", { className: "font-semibold text-amber-700", children: "14 jours d'essai gratuit" }),
          "."
        ] }),
        children: /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(InputLabel, { htmlFor: "name", value: "Nom de la boutique *", className: "text-slate-700" }),
            /* @__PURE__ */ jsxs("div", { className: "relative mt-1", children: [
              /* @__PURE__ */ jsx(Store, { className: "absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" }),
              /* @__PURE__ */ jsx(
                TextInput,
                {
                  id: "name",
                  type: "text",
                  name: "name",
                  value: data.name,
                  className: "mt-1 block w-full border border-[#cfc3ac] bg-white pl-10 text-slate-900 placeholder-slate-400",
                  autoComplete: "organization",
                  isFocused: true,
                  onChange: (e) => setData("name", e.target.value),
                  required: true,
                  placeholder: "Ex: Quincaillerie Centrale"
                }
              )
            ] }),
            /* @__PURE__ */ jsx(InputError, { message: errors.name, className: "mt-2" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(InputLabel, { htmlFor: "address", value: "Adresse (optionnel)", className: "text-slate-700" }),
            /* @__PURE__ */ jsxs("div", { className: "relative mt-1", children: [
              /* @__PURE__ */ jsx(MapPin, { className: "absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" }),
              /* @__PURE__ */ jsx(
                TextInput,
                {
                  id: "address",
                  type: "text",
                  name: "address",
                  value: data.address,
                  className: "mt-1 block w-full border border-[#cfc3ac] bg-white pl-10 text-slate-900 placeholder-slate-400",
                  autoComplete: "street-address",
                  onChange: (e) => setData("address", e.target.value),
                  placeholder: "123 Rue principale"
                }
              )
            ] }),
            /* @__PURE__ */ jsx(InputError, { message: errors.address, className: "mt-2" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(InputLabel, { htmlFor: "city", value: "Ville (optionnel)", className: "text-slate-700" }),
              /* @__PURE__ */ jsx(
                TextInput,
                {
                  id: "city",
                  type: "text",
                  name: "city",
                  value: data.city,
                  className: "mt-1 block w-full border border-[#cfc3ac] bg-white text-slate-900 placeholder-slate-400",
                  autoComplete: "address-level2",
                  onChange: (e) => setData("city", e.target.value),
                  placeholder: "Casablanca"
                }
              ),
              /* @__PURE__ */ jsx(InputError, { message: errors.city, className: "mt-2" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(InputLabel, { htmlFor: "postal_code", value: "Code postal (optionnel)", className: "text-slate-700" }),
              /* @__PURE__ */ jsx(
                TextInput,
                {
                  id: "postal_code",
                  type: "text",
                  name: "postal_code",
                  value: data.postal_code,
                  className: "mt-1 block w-full border border-[#cfc3ac] bg-white text-slate-900 placeholder-slate-400",
                  autoComplete: "postal-code",
                  onChange: (e) => setData("postal_code", e.target.value),
                  placeholder: "20000"
                }
              ),
              /* @__PURE__ */ jsx(InputError, { message: errors.postal_code, className: "mt-2" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(InputLabel, { htmlFor: "phone", value: "Telephone (optionnel)", className: "text-slate-700" }),
            /* @__PURE__ */ jsxs("div", { className: "relative mt-1", children: [
              /* @__PURE__ */ jsx(Phone, { className: "absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" }),
              /* @__PURE__ */ jsx(
                TextInput,
                {
                  id: "phone",
                  type: "tel",
                  name: "phone",
                  value: data.phone,
                  className: "mt-1 block w-full border border-[#cfc3ac] bg-white pl-10 text-slate-900 placeholder-slate-400",
                  autoComplete: "tel",
                  onChange: (e) => setData("phone", e.target.value),
                  placeholder: "+212 6 12 34 56 78"
                }
              )
            ] }),
            /* @__PURE__ */ jsx(InputError, { message: errors.phone, className: "mt-2" })
          ] }),
          /* @__PURE__ */ jsx(PrimaryButton, { className: "w-full justify-center bg-slate-900 py-2.5 text-sm normal-case tracking-normal hover:bg-slate-800", disabled: processing, children: processing ? "Creation en cours..." : "Creer ma boutique" })
        ] })
      }
    )
  ] });
}
export {
  CreateShop as default
};
