import { jsxs, jsx } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { u as useForm, H as Head_default, L as Link_default } from "../ssr.js";
import { useState, useMemo } from "react";
import { FilePenLine, Plus, Trash2, Calculator } from "lucide-react";
import { u as useRoute } from "./route-C2Ac8FMA.js";
import { u as useShopSettings, C as Currency } from "./Currency-BX_NSrIs.js";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
function InvoicesEdit({ invoice, customers, shops, products }) {
  const route = useRoute();
  const { currencySymbol } = useShopSettings();
  const [items, setItems] = useState(
    invoice.items.map((item) => ({
      id: item.id,
      product_id: item.product_id || "",
      product_name: item.product_name,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_rate: item.tax_rate
    }))
  );
  const { data, setData, put, processing, errors } = useForm({
    shop_id: invoice.shop_id,
    customer_id: invoice.customer_id,
    invoice_date: invoice.invoice_date,
    due_date: invoice.due_date,
    status: invoice.status,
    payment_method: invoice.payment_method || "",
    discount_amount: invoice.discount_amount || 0,
    notes: invoice.notes || "",
    items
  });
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unit_price) || 0;
      return sum + qty * price;
    }, 0);
  }, [items]);
  const totalTax = useMemo(() => {
    return items.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unit_price) || 0;
      const taxRate = Number(item.tax_rate) || 0;
      return sum + qty * price * taxRate / 100;
    }, 0);
  }, [items]);
  const discountAmount = Math.max(Number(data.discount_amount) || 0, 0);
  const total = Math.max(subtotal + totalTax - discountAmount, 0);
  const addItem = () => {
    const newItem = {
      product_id: "",
      product_name: "",
      description: "",
      quantity: 1,
      unit_price: 0,
      tax_rate: 20
    };
    setItems((prev) => [...prev, newItem]);
  };
  const removeItem = (index) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((_, i) => i !== index));
    }
  };
  const updateItem = (index, field, value) => {
    setItems(
      (prev) => prev.map((item, i) => {
        if (i === index) {
          const updated = { ...item, [field]: value };
          if (field === "product_id" && value) {
            const product = products.find((p) => p.id === Number(value));
            if (product) {
              updated.product_name = product.name;
              updated.unit_price = product.sale_price;
            }
          }
          return updated;
        }
        return item;
      })
    );
  };
  const submit = (e) => {
    e.preventDefault();
    data.items = items;
    put(route("invoices.update", { invoice: invoice.id }));
  };
  return /* @__PURE__ */ jsxs(
    Authenticated,
    {
      header: /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-white", children: "Modifier facture" }),
      children: [
        /* @__PURE__ */ jsx(Head_default, { title: "Modifier facture" }),
        /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "grid gap-4 xl:grid-cols-3", children: [
          /* @__PURE__ */ jsxs("section", { className: "space-y-4 xl:col-span-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-5", children: [
              /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center justify-between", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-white", children: [
                  /* @__PURE__ */ jsx(FilePenLine, { className: "size-5 text-amber-200" }),
                  /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Informations facture" })
                ] }),
                /* @__PURE__ */ jsx("span", { className: "rounded-full border border-white/15 bg-slate-900/70 px-2.5 py-1 text-xs text-amber-300 font-medium", children: invoice.invoice_number })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { htmlFor: "shop_id", className: "block text-sm font-medium text-slate-200", children: "Boutique *" }),
                  /* @__PURE__ */ jsxs(
                    "select",
                    {
                      id: "shop_id",
                      value: data.shop_id,
                      onChange: (e) => setData("shop_id", Number(e.target.value)),
                      className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
                      children: [
                        /* @__PURE__ */ jsx("option", { value: "", children: "Sélectionner une boutique" }),
                        shops.map((shop) => /* @__PURE__ */ jsx("option", { value: shop.id, children: shop.name }, shop.id))
                      ]
                    }
                  ),
                  errors.shop_id && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.shop_id })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { htmlFor: "customer_id", className: "block text-sm font-medium text-slate-200", children: "Client *" }),
                  /* @__PURE__ */ jsxs(
                    "select",
                    {
                      id: "customer_id",
                      value: data.customer_id,
                      onChange: (e) => setData("customer_id", Number(e.target.value)),
                      className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
                      children: [
                        /* @__PURE__ */ jsx("option", { value: "", children: "Sélectionner un client" }),
                        customers.map((customer) => /* @__PURE__ */ jsx("option", { value: customer.id, children: customer.name }, customer.id))
                      ]
                    }
                  ),
                  errors.customer_id && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.customer_id })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { htmlFor: "status", className: "block text-sm font-medium text-slate-200", children: "Statut *" }),
                  /* @__PURE__ */ jsxs(
                    "select",
                    {
                      id: "status",
                      value: data.status,
                      onChange: (e) => setData("status", e.target.value),
                      className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
                      children: [
                        /* @__PURE__ */ jsx("option", { value: "draft", children: "Brouillon" }),
                        /* @__PURE__ */ jsx("option", { value: "sent", children: "Envoyée" }),
                        /* @__PURE__ */ jsx("option", { value: "paid", children: "Payée" }),
                        /* @__PURE__ */ jsx("option", { value: "overdue", children: "En retard" }),
                        /* @__PURE__ */ jsx("option", { value: "cancelled", children: "Annulée" })
                      ]
                    }
                  ),
                  errors.status && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.status })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { htmlFor: "payment_method", className: "block text-sm font-medium text-slate-200", children: "Mode de paiement" }),
                  /* @__PURE__ */ jsxs(
                    "select",
                    {
                      id: "payment_method",
                      value: data.payment_method,
                      onChange: (e) => setData("payment_method", e.target.value),
                      className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
                      children: [
                        /* @__PURE__ */ jsx("option", { value: "", children: "Non payée" }),
                        /* @__PURE__ */ jsx("option", { value: "cash", children: "Espèces" }),
                        /* @__PURE__ */ jsx("option", { value: "card", children: "Carte bancaire" }),
                        /* @__PURE__ */ jsx("option", { value: "check", children: "Chèque" }),
                        /* @__PURE__ */ jsx("option", { value: "transfer", children: "Virement" })
                      ]
                    }
                  ),
                  errors.payment_method && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.payment_method })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { htmlFor: "invoice_date", className: "block text-sm font-medium text-slate-200", children: "Date de facture *" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "date",
                      id: "invoice_date",
                      value: data.invoice_date,
                      onChange: (e) => setData("invoice_date", e.target.value),
                      className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                    }
                  ),
                  errors.invoice_date && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.invoice_date })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { htmlFor: "due_date", className: "block text-sm font-medium text-slate-200", children: "Date d'échéance *" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "date",
                      id: "due_date",
                      value: data.due_date,
                      onChange: (e) => setData("due_date", e.target.value),
                      className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                    }
                  ),
                  errors.due_date && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.due_date })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { htmlFor: "discount_amount", className: "block text-sm font-medium text-slate-200", children: "Remise facture" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "number",
                      id: "discount_amount",
                      min: "0",
                      step: "0.01",
                      value: data.discount_amount,
                      onChange: (e) => setData("discount_amount", Math.max(Number(e.target.value) || 0, 0)),
                      className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                    }
                  ),
                  errors.discount_amount && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.discount_amount })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-5", children: [
              /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center justify-between", children: [
                /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-white", children: "Lignes de facture" }),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: addItem,
                    className: "inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-white/10",
                    children: [
                      /* @__PURE__ */ jsx(Plus, { className: "size-3.5" }),
                      "Ajouter ligne"
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsx("div", { className: "space-y-3", children: items.map((item, index) => /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-white/10 bg-slate-900/60 p-3 space-y-3", children: [
                /* @__PURE__ */ jsxs("div", { className: "grid gap-2 md:grid-cols-12", children: [
                  /* @__PURE__ */ jsxs("div", { className: "md:col-span-5 space-y-1", children: [
                    /* @__PURE__ */ jsxs("label", { className: "text-xs text-slate-300", children: [
                      "Produit #",
                      index + 1
                    ] }),
                    /* @__PURE__ */ jsxs(
                      "select",
                      {
                        value: item.product_id,
                        onChange: (e) => updateItem(index, "product_id", e.target.value),
                        className: "w-full rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-slate-200",
                        children: [
                          /* @__PURE__ */ jsx("option", { value: "", children: "Sélectionner un produit" }),
                          products.map((product) => /* @__PURE__ */ jsx("option", { value: product.id, children: product.name }, product.id))
                        ]
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "md:col-span-2 space-y-1", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-xs text-slate-300", children: "Qté" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "number",
                        min: "1",
                        value: item.quantity,
                        onChange: (e) => updateItem(index, "quantity", e.target.value),
                        className: "w-full rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-slate-200"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "md:col-span-2 space-y-1", children: [
                    /* @__PURE__ */ jsxs("label", { className: "text-xs text-slate-300", children: [
                      "Prix U. (",
                      currencySymbol,
                      ")"
                    ] }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "number",
                        step: "0.01",
                        min: "0",
                        value: item.unit_price,
                        onChange: (e) => updateItem(index, "unit_price", e.target.value),
                        className: "w-full rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-slate-200"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "md:col-span-2 space-y-1", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-xs text-slate-300", children: "TVA (%)" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "number",
                        step: "0.01",
                        min: "0",
                        value: item.tax_rate,
                        onChange: (e) => updateItem(index, "tax_rate", e.target.value),
                        className: "w-full rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-slate-200"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "flex items-end md:col-span-1", children: /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => removeItem(index),
                      disabled: items.length === 1,
                      className: "w-full rounded-lg border border-rose-300/30 px-3 py-2 text-rose-200 transition hover:bg-rose-300/10 disabled:opacity-30 disabled:cursor-not-allowed",
                      children: /* @__PURE__ */ jsx(Trash2, { className: "mx-auto size-4" })
                    }
                  ) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-xs text-slate-300", children: "Description" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      value: item.description,
                      onChange: (e) => updateItem(index, "description", e.target.value),
                      placeholder: "Description optionnelle",
                      className: "w-full rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-slate-200"
                    }
                  )
                ] })
              ] }, index)) }),
              errors.items && /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-red-400", children: errors.items })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-5", children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "notes", className: "block text-sm font-medium text-slate-200", children: "Notes" }),
              /* @__PURE__ */ jsx(
                "textarea",
                {
                  id: "notes",
                  value: data.notes,
                  onChange: (e) => setData("notes", e.target.value),
                  rows: 4,
                  className: "mt-1 w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
                  placeholder: "Notes internes..."
                }
              ),
              errors.notes && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.notes })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("aside", { className: "h-fit rounded-2xl border border-amber-200/25 bg-gradient-to-br from-amber-300/15 via-orange-300/10 to-transparent p-5 xl:sticky xl:top-24", children: [
            /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center gap-2 text-amber-100", children: [
              /* @__PURE__ */ jsx(Calculator, { className: "size-5" }),
              /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Résumé" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-sm text-slate-200", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsx("span", { children: "Sous-total HT" }),
                /* @__PURE__ */ jsx("span", { children: /* @__PURE__ */ jsx(Currency, { amount: subtotal }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsx("span", { children: "TVA" }),
                /* @__PURE__ */ jsx("span", { children: /* @__PURE__ */ jsx(Currency, { amount: totalTax }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsx("span", { children: "Remise" }),
                /* @__PURE__ */ jsxs("span", { className: "text-red-300", children: [
                  "-",
                  /* @__PURE__ */ jsx(Currency, { amount: discountAmount })
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "mt-3 border-t border-white/15 pt-3 text-base font-semibold text-white", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsx("span", { children: "Total TTC" }),
                /* @__PURE__ */ jsx("span", { className: "text-amber-300", children: /* @__PURE__ */ jsx(Currency, { amount: total }) })
              ] }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-5 space-y-2", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "submit",
                  disabled: processing,
                  className: "w-full rounded-lg bg-amber-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:opacity-50",
                  children: processing ? "Enregistrement..." : "Enregistrer"
                }
              ),
              /* @__PURE__ */ jsx(
                Link_default,
                {
                  href: route("invoices.index"),
                  className: "block w-full rounded-lg border border-white/15 px-4 py-2.5 text-center text-sm text-slate-200 transition hover:bg-white/10",
                  children: "Retour"
                }
              )
            ] })
          ] })
        ] })
      ]
    }
  );
}
export {
  InvoicesEdit as default
};
