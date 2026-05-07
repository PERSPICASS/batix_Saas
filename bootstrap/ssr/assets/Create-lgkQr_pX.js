import { jsxs, jsx } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { u as useForm, H as Head_default } from "../ssr.js";
import { u as useRoute } from "./route-C2Ac8FMA.js";
import { I as InputLabel, T as TextInput } from "./TextInput-FO9W64oM.js";
import { I as InputError } from "./InputError-DiSBWiye.js";
import { Warehouse } from "lucide-react";
import "react";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
function Create() {
  const buildRoute = useRoute();
  const { data, setData, post, processing, errors } = useForm({
    name: "",
    address: "",
    city: "",
    phone: "",
    description: ""
  });
  const submit = (e) => {
    e.preventDefault();
    post(buildRoute("depots.store"));
  };
  return /* @__PURE__ */ jsxs(Authenticated, { header: /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: "Nouveau dépôt" }), children: [
    /* @__PURE__ */ jsx(Head_default, { title: "Nouveau dépôt" }),
    /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-2xl", children: /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "flex size-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-300/10", children: /* @__PURE__ */ jsx(Warehouse, { className: "size-5 text-amber-600 dark:text-amber-300" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "font-semibold text-slate-900 dark:text-white", children: "Informations du dépôt" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Renseignez les informations de votre nouveau dépôt" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(InputLabel, { htmlFor: "name", value: "Nom du dépôt *" }),
          /* @__PURE__ */ jsx(
            TextInput,
            {
              id: "name",
              value: data.name,
              onChange: (e) => setData("name", e.target.value),
              className: "mt-1 block w-full",
              placeholder: "Ex: Dépôt Central",
              required: true
            }
          ),
          /* @__PURE__ */ jsx(InputError, { message: errors.name, className: "mt-1" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(InputLabel, { htmlFor: "city", value: "Ville" }),
            /* @__PURE__ */ jsx(
              TextInput,
              {
                id: "city",
                value: data.city,
                onChange: (e) => setData("city", e.target.value),
                className: "mt-1 block w-full",
                placeholder: "Ex: Abidjan"
              }
            ),
            /* @__PURE__ */ jsx(InputError, { message: errors.city, className: "mt-1" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(InputLabel, { htmlFor: "phone", value: "Téléphone" }),
            /* @__PURE__ */ jsx(
              TextInput,
              {
                id: "phone",
                value: data.phone,
                onChange: (e) => setData("phone", e.target.value),
                className: "mt-1 block w-full",
                placeholder: "Ex: +225 0700000000"
              }
            ),
            /* @__PURE__ */ jsx(InputError, { message: errors.phone, className: "mt-1" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(InputLabel, { htmlFor: "address", value: "Adresse" }),
          /* @__PURE__ */ jsx(
            TextInput,
            {
              id: "address",
              value: data.address,
              onChange: (e) => setData("address", e.target.value),
              className: "mt-1 block w-full",
              placeholder: "Ex: Zone Industrielle de Yopougon"
            }
          ),
          /* @__PURE__ */ jsx(InputError, { message: errors.address, className: "mt-1" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(InputLabel, { htmlFor: "description", value: "Description" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              id: "description",
              value: data.description,
              onChange: (e) => setData("description", e.target.value),
              rows: 3,
              className: "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900 dark:text-white",
              placeholder: "Description du dépôt..."
            }
          ),
          /* @__PURE__ */ jsx(InputError, { message: errors.description, className: "mt-1" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-3 pt-2", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              disabled: processing,
              className: "inline-flex items-center gap-2 rounded-xl bg-amber-300 px-6 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:opacity-50",
              children: processing ? "Création..." : "Créer le dépôt"
            }
          ),
          /* @__PURE__ */ jsx(
            "a",
            {
              href: buildRoute("depots.index"),
              className: "rounded-xl border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5",
              children: "Annuler"
            }
          )
        ] })
      ] })
    ] }) })
  ] });
}
export {
  Create as default
};
