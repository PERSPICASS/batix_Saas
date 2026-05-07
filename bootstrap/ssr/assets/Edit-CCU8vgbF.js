import { jsxs, jsx } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { u as useForm, H as Head_default, L as Link_default } from "../ssr.js";
import { useState, useMemo, useRef, useEffect } from "react";
import { ArrowLeft, ShoppingCart, Package, Plus, Trash2, Save, ChevronDown, X, Search } from "lucide-react";
import { u as useRoute } from "./route-C2Ac8FMA.js";
import { I as InputLabel, T as TextInput } from "./TextInput-FO9W64oM.js";
import { I as InputError } from "./InputError-DiSBWiye.js";
import { P as PrimaryButton } from "./PrimaryButton-DgVfVBwo.js";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
function PurchaseProductCombobox({
  products,
  value,
  onChange,
  usedIds = []
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = products.find((p) => p.id === Number(value));
  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q) || (p.category?.name ?? "").toLowerCase().includes(q);
  });
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const select = (product) => {
    onChange(product.id.toString());
    setSearch("");
    setOpen(false);
  };
  const clear = () => {
    onChange("");
    setSearch("");
  };
  return /* @__PURE__ */ jsxs("div", { ref, className: "relative", children: [
    selected && !open ? (
      /* Produit sélectionné */
      /* @__PURE__ */ jsxs("div", { className: "mt-1 flex items-center justify-between rounded-lg border border-amber-300/40 bg-slate-900 px-3 py-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-white", children: selected.name }),
          selected.sku && /* @__PURE__ */ jsxs("span", { className: "ml-2 text-xs text-slate-400", children: [
            "(",
            selected.sku,
            ")"
          ] }),
          selected.category && /* @__PURE__ */ jsx("span", { className: "ml-2 text-xs text-slate-500", children: selected.category.name })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex shrink-0 items-center gap-1 pl-2", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setOpen(true),
              className: "rounded p-1 text-slate-400 hover:text-white transition-colors",
              title: "Changer",
              children: /* @__PURE__ */ jsx(ChevronDown, { className: "h-3.5 w-3.5" })
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: clear,
              className: "rounded p-1 text-slate-400 hover:text-red-400 transition-colors",
              title: "Effacer",
              children: /* @__PURE__ */ jsx(X, { className: "h-3.5 w-3.5" })
            }
          )
        ] })
      ] })
    ) : (
      /* Champ de recherche */
      /* @__PURE__ */ jsxs("div", { className: "relative mt-1", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: search,
            onChange: (e) => {
              setSearch(e.target.value);
              setOpen(true);
            },
            onFocus: () => setOpen(true),
            placeholder: "Rechercher par nom, SKU ou catégorie...",
            className: "w-full rounded-lg border-slate-700 bg-slate-900 pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
            autoComplete: "off"
          }
        )
      ] })
    ),
    open && /* @__PURE__ */ jsx("div", { className: "absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-white/10 bg-slate-900 shadow-2xl", children: filtered.length === 0 ? /* @__PURE__ */ jsx("div", { className: "px-4 py-3 text-sm text-slate-500 text-center", children: "Aucun produit trouvé" }) : filtered.map((product) => {
      const isUsed = usedIds.includes(product.id) && product.id !== Number(value);
      return /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => !isUsed && select(product),
          disabled: isUsed,
          className: `w-full flex items-center justify-between px-4 py-2.5 text-left text-sm border-b border-white/5 last:border-0 transition-colors ${product.id === Number(value) ? "bg-amber-300/10 text-amber-300" : isUsed ? "opacity-40 cursor-not-allowed text-slate-400" : "text-white hover:bg-white/5"}`,
          children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "font-medium", children: product.name }),
              product.sku && /* @__PURE__ */ jsx("span", { className: "ml-2 text-xs text-slate-400", children: product.sku }),
              product.category && /* @__PURE__ */ jsxs("span", { className: "ml-2 text-xs text-slate-500", children: [
                "— ",
                product.category.name
              ] }),
              isUsed && /* @__PURE__ */ jsx("span", { className: "ml-2 text-xs text-slate-500 italic", children: "déjà ajouté" })
            ] }),
            /* @__PURE__ */ jsx("span", { className: "ml-3 shrink-0 text-xs text-slate-400", children: parseFloat(product.purchase_price) > 0 ? `${parseFloat(product.purchase_price).toFixed(2)}` : "—" })
          ]
        },
        product.id
      );
    }) })
  ] });
}
function PurchasesEdit({ code_user, suppliers, products, currency, purchase }) {
  const route = useRoute();
  const initialItems = purchase.items.map((item) => ({
    product_id: item.product_id,
    quantity: item.quantity_ordered,
    unit_price: parseFloat(item.unit_price),
    notes: item.notes || ""
  }));
  const [items, setItems] = useState(initialItems);
  const { data, setData, put, processing, errors } = useForm({
    supplier_id: purchase.supplier_id.toString(),
    order_date: purchase.order_date,
    expected_date: purchase.expected_date || "",
    shipping_cost: parseFloat(purchase.shipping_cost),
    tax_rate: parseFloat(purchase.items[0]?.tax_rate || "0"),
    discount_rate: parseFloat(purchase.items[0]?.discount_rate || "0"),
    notes: purchase.notes || "",
    internal_notes: purchase.internal_notes || "",
    items
  });
  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        product_id: "",
        quantity: 1,
        unit_price: 0,
        notes: ""
      }
    ]);
  };
  const removeItem = (index) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((_, i) => i !== index));
    }
  };
  const updateItem = (index, field, value) => {
    setItems(
      (prev) => prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        if (field === "product_id" && value) {
          const product = products.find((p) => p.id === Number(value));
          if (product) {
            updated.unit_price = parseFloat(product.purchase_price);
          }
        }
        return updated;
      })
    );
  };
  const calculateLineTotal = (item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unit_price) || 0;
    return qty * price;
  };
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unit_price) || 0;
      return sum + qty * price;
    }, 0);
    const discountRate = Number(data.discount_rate) || 0;
    const totalDiscount = subtotal * (discountRate / 100);
    const subtotalAfterDiscount = subtotal - totalDiscount;
    const taxRate = Number(data.tax_rate) || 0;
    const totalTax = subtotalAfterDiscount * (taxRate / 100);
    const shipping = Number(data.shipping_cost) || 0;
    const grandTotal = subtotalAfterDiscount + totalTax + shipping;
    return {
      subtotal,
      totalDiscount,
      totalTax,
      shipping,
      grandTotal
    };
  }, [items, data.shipping_cost, data.tax_rate, data.discount_rate]);
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency
    }).format(amount);
  };
  const submit = (e) => {
    e.preventDefault();
    data.items = items;
    put(route("purchases.update", { code_user, purchase: purchase.id }));
  };
  return /* @__PURE__ */ jsxs(Authenticated, { children: [
    /* @__PURE__ */ jsx(Head_default, { title: "Modifier le bon de commande" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(
          Link_default,
          {
            href: route("purchases.show", { code_user, purchase: purchase.id }),
            className: "rounded-lg p-2 transition hover:bg-white/5",
            children: /* @__PURE__ */ jsx(ArrowLeft, { className: "size-5 text-slate-400" })
          }
        ),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-white", children: "Modifier le bon de commande" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-400", children: "Modifiez les informations du bon de commande" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-slate-800/50 p-6", children: [
          /* @__PURE__ */ jsxs("h2", { className: "mb-6 flex items-center gap-2 text-lg font-semibold text-white", children: [
            /* @__PURE__ */ jsx(ShoppingCart, { className: "size-5 text-amber-300" }),
            "Informations générales"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-6 md:grid-cols-2", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(InputLabel, { htmlFor: "supplier_id", value: "Fournisseur *" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  id: "supplier_id",
                  value: data.supplier_id,
                  onChange: (e) => setData("supplier_id", e.target.value),
                  className: "mt-1 block w-full rounded-lg border-white/10 bg-slate-900/50 text-white shadow-sm focus:border-amber-300 focus:ring-amber-300",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "Sélectionnez un fournisseur" }),
                    suppliers.map((supplier) => /* @__PURE__ */ jsxs("option", { value: supplier.id, children: [
                      supplier.name,
                      supplier.company_name && ` - ${supplier.company_name}`
                    ] }, supplier.id))
                  ]
                }
              ),
              /* @__PURE__ */ jsx(InputError, { message: errors.supplier_id, className: "mt-2" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(InputLabel, { htmlFor: "order_date", value: "Date de commande *" }),
              /* @__PURE__ */ jsx(
                TextInput,
                {
                  id: "order_date",
                  type: "date",
                  value: data.order_date,
                  onChange: (e) => setData("order_date", e.target.value),
                  className: "mt-1 block w-full"
                }
              ),
              /* @__PURE__ */ jsx(InputError, { message: errors.order_date, className: "mt-2" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(InputLabel, { htmlFor: "expected_date", value: "Date de livraison prévue" }),
              /* @__PURE__ */ jsx(
                TextInput,
                {
                  id: "expected_date",
                  type: "date",
                  value: data.expected_date,
                  onChange: (e) => setData("expected_date", e.target.value),
                  className: "mt-1 block w-full"
                }
              ),
              /* @__PURE__ */ jsx(InputError, { message: errors.expected_date, className: "mt-2" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(InputLabel, { htmlFor: "shipping_cost", value: "Frais de port" }),
              /* @__PURE__ */ jsx(
                TextInput,
                {
                  id: "shipping_cost",
                  type: "number",
                  step: "0.01",
                  min: "0",
                  value: data.shipping_cost,
                  onChange: (e) => setData("shipping_cost", parseFloat(e.target.value) || 0),
                  className: "mt-1 block w-full"
                }
              ),
              /* @__PURE__ */ jsx(InputError, { message: errors.shipping_cost, className: "mt-2" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-slate-800/50 p-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("h2", { className: "flex items-center gap-2 text-lg font-semibold text-white", children: [
              /* @__PURE__ */ jsx(Package, { className: "size-5 text-amber-300" }),
              "Articles"
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: addItem,
                className: "inline-flex items-center gap-2 rounded-lg bg-amber-300/10 px-4 py-2 text-sm font-semibold text-amber-300 transition hover:bg-amber-300/20",
                children: [
                  /* @__PURE__ */ jsx(Plus, { className: "size-4" }),
                  "Ajouter un article"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "space-y-4", children: items.map((item, index) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: "rounded-lg border border-white/10 bg-slate-900/50 p-4",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "mb-3 flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxs("span", { className: "text-sm font-medium text-slate-300", children: [
                    "Article ",
                    index + 1
                  ] }),
                  items.length > 1 && /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => removeItem(index),
                      className: "rounded-lg p-1.5 text-red-400 transition hover:bg-red-500/10",
                      children: /* @__PURE__ */ jsx(Trash2, { className: "size-4" })
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-6", children: [
                  /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
                    /* @__PURE__ */ jsx(InputLabel, { value: "Produit *" }),
                    /* @__PURE__ */ jsx(
                      PurchaseProductCombobox,
                      {
                        products,
                        value: item.product_id,
                        onChange: (id) => updateItem(index, "product_id", id),
                        usedIds: items.map((it) => Number(it.product_id)).filter(Boolean)
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      InputError,
                      {
                        message: errors[`items.${index}.product_id`],
                        className: "mt-2"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx(InputLabel, { value: "Qté *" }),
                    /* @__PURE__ */ jsx(
                      TextInput,
                      {
                        type: "number",
                        min: "1",
                        step: "1",
                        value: item.quantity,
                        onChange: (e) => updateItem(index, "quantity", e.target.value),
                        className: "mt-1 block w-full"
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      InputError,
                      {
                        message: errors[`items.${index}.quantity`],
                        className: "mt-2"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx(InputLabel, { value: "Prix unitaire *" }),
                    /* @__PURE__ */ jsx(
                      TextInput,
                      {
                        type: "number",
                        min: "0",
                        step: "0.01",
                        value: item.unit_price,
                        onChange: (e) => updateItem(index, "unit_price", e.target.value),
                        className: "mt-1 block w-full"
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      InputError,
                      {
                        message: errors[`items.${index}.unit_price`],
                        className: "mt-2"
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
                  /* @__PURE__ */ jsx(InputLabel, { value: "Notes (optionnel)" }),
                  /* @__PURE__ */ jsx(
                    "textarea",
                    {
                      value: item.notes,
                      onChange: (e) => updateItem(index, "notes", e.target.value),
                      rows: 2,
                      className: "mt-1 block w-full rounded-lg border-white/10 bg-slate-900/50 text-white shadow-sm focus:border-amber-300 focus:ring-amber-300"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx("div", { className: "mt-3 flex justify-end", children: /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400", children: "Total ligne:" }),
                  /* @__PURE__ */ jsx("div", { className: "text-lg font-semibold text-amber-300", children: formatCurrency(calculateLineTotal(item)) })
                ] }) })
              ]
            },
            index
          )) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-slate-800/50 p-6", children: [
          /* @__PURE__ */ jsx("h2", { className: "mb-6 text-lg font-semibold text-white", children: "Récapitulatif" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
              /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Sous-total:" }),
              /* @__PURE__ */ jsx("span", { className: "font-medium text-white", children: formatCurrency(totals.subtotal) })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "grid gap-4 md:grid-cols-2", children: /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(InputLabel, { htmlFor: "discount_rate", value: "Remise globale (%)" }),
              /* @__PURE__ */ jsx(
                TextInput,
                {
                  id: "discount_rate",
                  type: "number",
                  step: "0.01",
                  min: "0",
                  max: "100",
                  value: data.discount_rate,
                  onChange: (e) => setData("discount_rate", parseFloat(e.target.value) || 0),
                  className: "mt-1 block w-full"
                }
              )
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
              /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Montant remise:" }),
              /* @__PURE__ */ jsxs("span", { className: "font-medium text-white", children: [
                "-",
                formatCurrency(totals.totalDiscount)
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "grid gap-4 md:grid-cols-2", children: /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(InputLabel, { htmlFor: "tax_rate", value: "Taxe globale (%)" }),
              /* @__PURE__ */ jsx(
                TextInput,
                {
                  id: "tax_rate",
                  type: "number",
                  step: "0.01",
                  min: "0",
                  max: "100",
                  value: data.tax_rate,
                  onChange: (e) => setData("tax_rate", parseFloat(e.target.value) || 0),
                  className: "mt-1 block w-full"
                }
              )
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
              /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Montant taxes:" }),
              /* @__PURE__ */ jsx("span", { className: "font-medium text-white", children: formatCurrency(totals.totalTax) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
              /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Frais de port:" }),
              /* @__PURE__ */ jsx("span", { className: "font-medium text-white", children: formatCurrency(totals.shipping) })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "border-t border-white/10 pt-3", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { className: "text-lg font-semibold text-white", children: "Total général:" }),
              /* @__PURE__ */ jsx("span", { className: "text-2xl font-bold text-amber-300", children: formatCurrency(totals.grandTotal) })
            ] }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-slate-800/50 p-6", children: [
          /* @__PURE__ */ jsx("h2", { className: "mb-6 text-lg font-semibold text-white", children: "Notes" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(InputLabel, { htmlFor: "notes", value: "Notes (visibles sur le document)" }),
              /* @__PURE__ */ jsx(
                "textarea",
                {
                  id: "notes",
                  value: data.notes,
                  onChange: (e) => setData("notes", e.target.value),
                  rows: 3,
                  className: "mt-1 block w-full rounded-lg border-white/10 bg-slate-900/50 text-white shadow-sm focus:border-amber-300 focus:ring-amber-300",
                  placeholder: "Notes qui apparaîtront sur le bon de commande..."
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(
                InputLabel,
                {
                  htmlFor: "internal_notes",
                  value: "Notes internes (usage interne uniquement)"
                }
              ),
              /* @__PURE__ */ jsx(
                "textarea",
                {
                  id: "internal_notes",
                  value: data.internal_notes,
                  onChange: (e) => setData("internal_notes", e.target.value),
                  rows: 3,
                  className: "mt-1 block w-full rounded-lg border-white/10 bg-slate-900/50 text-white shadow-sm focus:border-amber-300 focus:ring-amber-300",
                  placeholder: "Notes privées, non visibles sur le document..."
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-3", children: [
          /* @__PURE__ */ jsx(
            Link_default,
            {
              href: route("purchases.show", { code_user, purchase: purchase.id }),
              className: "inline-flex items-center rounded-lg border border-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/5",
              children: "Annuler"
            }
          ),
          /* @__PURE__ */ jsxs(PrimaryButton, { disabled: processing, className: "gap-2", children: [
            /* @__PURE__ */ jsx(Save, { className: "size-4" }),
            processing ? "Enregistrement..." : "Enregistrer les modifications"
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  PurchasesEdit as default
};
