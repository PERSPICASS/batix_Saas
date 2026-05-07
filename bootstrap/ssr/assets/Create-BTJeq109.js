import { jsxs, jsx } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { a as usePage, u as useForm, H as Head_default, L as Link_default } from "../ssr.js";
import { useState, useMemo, useEffect } from "react";
import { FileText, UserRound, X, Plus, Trash2, Calculator, Search } from "lucide-react";
import { u as useShopSettings, C as Currency } from "./Currency-BX_NSrIs.js";
import { u as useRoute } from "./route-C2Ac8FMA.js";
import { M as Modal } from "./Modal-BeSeEOS3.js";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
import "@headlessui/react";
function InvoicesCreate({ customers, shops, products }) {
  const route = useRoute();
  const { props } = usePage();
  const activeShop = props.activeShop;
  const { currencySymbol } = useShopSettings();
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [activeCustomerIndex, setActiveCustomerIndex] = useState(-1);
  const [productSearch, setProductSearch] = useState("");
  const [showProductModal, setShowProductModal] = useState(false);
  const [activeProductIndex, setActiveProductIndex] = useState(-1);
  const [productTargetLine, setProductTargetLine] = useState(null);
  const [items, setItems] = useState([
    {
      product_id: "",
      product_name: "",
      description: "",
      quantity: 1,
      unit_price: 0,
      tax_rate: 0
    }
  ]);
  const { data, setData, post, processing, errors } = useForm({
    shop_id: activeShop?.id || shops[0]?.id || 0,
    customer_id: 0,
    invoice_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    due_date: "",
    status: "draft",
    payment_method: "",
    discount_amount: 0,
    notes: "",
    items
  });
  const filteredCustomers = useMemo(() => {
    const scoped = customers.filter((customer) => customer.shop_id === Number(data.shop_id));
    const term = customerSearch.trim().toLowerCase();
    if (!term) return scoped;
    return scoped.filter((customer) => customer.name.toLowerCase().includes(term));
  }, [customers, data.shop_id, customerSearch]);
  const selectedCustomer = useMemo(() => {
    return customers.find((customer) => customer.id === Number(data.customer_id)) || null;
  }, [customers, data.customer_id]);
  const filteredProducts = useMemo(() => {
    return products.filter((product) => product.shop_id === Number(data.shop_id));
  }, [products, data.shop_id]);
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unit_price) || 0;
      return sum + Math.max(qty * price, 0);
    }, 0);
  }, [items]);
  const discountAmount = Math.max(Number(data.discount_amount) || 0, 0);
  const total = Math.max(subtotal - discountAmount, 0);
  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        product_id: "",
        product_name: "",
        description: "",
        quantity: 1,
        unit_price: 0,
        tax_rate: 0
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
          let product = filteredProducts.find((p) => p.id === Number(value));
          let parentProduct;
          if (!product) {
            for (const p of filteredProducts) {
              const v = p.variations?.find((v2) => v2.id === Number(value));
              if (v) {
                product = v;
                parentProduct = p;
                break;
              }
            }
          }
          if (product) {
            updated.product_name = parentProduct ? `${parentProduct.name} › ${product.name}` : product.name;
            updated.unit_price = product.selling_price;
          }
        }
        return updated;
      })
    );
  };
  const handleShopChange = (value) => {
    const shopId = Number(value);
    setData("shop_id", shopId);
    setData("customer_id", 0);
    setCustomerSearch("");
    setItems(
      (prev) => prev.map((item) => ({
        ...item,
        product_id: "",
        product_name: "",
        unit_price: 0
      }))
    );
  };
  const selectCustomer = (customer) => {
    setData("customer_id", customer.id);
    setShowCustomerModal(false);
  };
  const openProductModal = (lineIndex) => {
    setProductTargetLine(lineIndex);
    setProductSearch("");
    setShowProductModal(true);
  };
  const selectProduct = (product, parent) => {
    if (productTargetLine === null) return;
    setItems(
      (prev) => prev.map((item, i) => {
        if (i !== productTargetLine) return item;
        return {
          ...item,
          product_id: product.id,
          product_name: parent ? `${parent.name} › ${product.name}` : product.name,
          unit_price: product.selling_price
        };
      })
    );
    setShowProductModal(false);
  };
  useEffect(() => {
    if (!showCustomerModal) {
      setActiveCustomerIndex(-1);
      return;
    }
    if (filteredCustomers.length === 0) {
      setActiveCustomerIndex(-1);
      return;
    }
    setActiveCustomerIndex(0);
  }, [showCustomerModal, filteredCustomers.length, customerSearch]);
  const filteredProductsBySearch = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return filteredProducts;
    return filteredProducts.filter((product) => product.name.toLowerCase().includes(term));
  }, [filteredProducts, productSearch]);
  useEffect(() => {
    if (!showProductModal) {
      setActiveProductIndex(-1);
      return;
    }
    if (filteredProductsBySearch.length === 0) {
      setActiveProductIndex(-1);
      return;
    }
    setActiveProductIndex(0);
  }, [showProductModal, filteredProductsBySearch.length, productSearch]);
  const handleSearchKeyDown = (e) => {
    if (!showCustomerModal || filteredCustomers.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveCustomerIndex(
        (prev) => prev < filteredCustomers.length - 1 ? prev + 1 : 0
      );
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveCustomerIndex(
        (prev) => prev > 0 ? prev - 1 : filteredCustomers.length - 1
      );
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (activeCustomerIndex >= 0) {
        selectCustomer(filteredCustomers[activeCustomerIndex]);
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setShowCustomerModal(false);
    }
  };
  const handleProductSearchKeyDown = (e) => {
    if (!showProductModal || filteredProductsBySearch.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveProductIndex(
        (prev) => prev < filteredProductsBySearch.length - 1 ? prev + 1 : 0
      );
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveProductIndex(
        (prev) => prev > 0 ? prev - 1 : filteredProductsBySearch.length - 1
      );
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (activeProductIndex >= 0) {
        selectProduct(filteredProductsBySearch[activeProductIndex]);
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setShowProductModal(false);
    }
  };
  const submit = (e) => {
    e.preventDefault();
    data.items = items;
    post(route("invoices.store"));
  };
  return /* @__PURE__ */ jsxs(Authenticated, { header: /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-white", children: "Nouvelle facture" }), children: [
    /* @__PURE__ */ jsx(Head_default, { title: "Nouvelle facture" }),
    /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "grid gap-4 xl:grid-cols-3", children: [
      /* @__PURE__ */ jsxs("section", { className: "space-y-4 xl:col-span-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-5", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center gap-2 text-white", children: [
            /* @__PURE__ */ jsx(FileText, { className: "size-5 text-amber-200" }),
            /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Informations facture" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "shop_id", className: "block text-sm font-medium text-slate-200", children: "Boutique *" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  id: "shop_id",
                  value: data.shop_id,
                  onChange: (e) => handleShopChange(e.target.value),
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
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-200", children: "Client *" }),
              /* @__PURE__ */ jsxs("div", { className: "mt-1 space-y-2", children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => setShowCustomerModal(true),
                    className: "flex w-full items-center justify-between rounded-xl border border-white/15 bg-gradient-to-r from-slate-900 to-slate-800 px-3 py-2.5 text-left text-slate-200 transition hover:border-amber-300/40",
                    children: [
                      /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-2", children: [
                        /* @__PURE__ */ jsx(UserRound, { className: "size-4 text-amber-300" }),
                        selectedCustomer ? selectedCustomer.name : "Choisir un client"
                      ] }),
                      /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400", children: "Ouvrir" })
                    ]
                  }
                ),
                selectedCustomer && /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => setData("customer_id", 0),
                    className: "inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200",
                    children: [
                      /* @__PURE__ */ jsx(X, { className: "size-3.5" }),
                      "Retirer le client sélectionné"
                    ]
                  }
                )
              ] }),
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
                    /* @__PURE__ */ jsx("option", { value: "transfer", children: "Virement" }),
                    /* @__PURE__ */ jsx("option", { value: "mobile", children: "Mobile" })
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
              /* @__PURE__ */ jsx("label", { htmlFor: "due_date", className: "block text-sm font-medium text-slate-200", children: "Date d'échéance" }),
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
            /* @__PURE__ */ jsxs("div", { className: "grid items-end gap-2 md:grid-cols-12", children: [
              /* @__PURE__ */ jsxs("div", { className: "md:col-span-7 space-y-1", children: [
                /* @__PURE__ */ jsxs("label", { className: "text-xs text-slate-300", children: [
                  "Produit #",
                  index + 1
                ] }),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => openProductModal(index),
                    className: "flex h-10 w-full items-center justify-between rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-left text-sm text-slate-200 transition hover:border-amber-300/40",
                    children: [
                      /* @__PURE__ */ jsx("span", { children: item.product_name || "Choisir un produit" }),
                      /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400", children: "Ouvrir" })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "md:col-span-1 space-y-1", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs text-slate-300", children: "Qté" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    min: "1",
                    value: item.quantity,
                    onChange: (e) => updateItem(index, "quantity", e.target.value),
                    className: "h-10 w-full rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-slate-200"
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
                    readOnly: true,
                    className: "h-10 w-full cursor-not-allowed rounded-lg border border-white/10 bg-slate-800/70 px-3 py-2 text-sm text-slate-400"
                  }
                )
              ] }),
              /* @__PURE__ */ jsx("div", { className: "md:col-span-2 flex items-end", children: /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => removeItem(index),
                  disabled: items.length === 1,
                  className: "ml-auto flex h-10 w-10 items-center justify-center rounded-lg border border-rose-300/30 text-rose-200 transition hover:bg-rose-300/10 disabled:cursor-not-allowed disabled:opacity-30",
                  children: /* @__PURE__ */ jsx(Trash2, { className: "size-4" })
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
        /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-5", children: /* @__PURE__ */ jsxs("label", { className: "space-y-1 text-sm text-slate-200", children: [
          /* @__PURE__ */ jsx("span", { children: "Note interne" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              value: data.notes,
              onChange: (e) => setData("notes", e.target.value),
              rows: 4,
              className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2",
              placeholder: "Informations supplémentaires..."
            }
          )
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("aside", { className: "h-fit rounded-2xl border border-amber-200/25 bg-gradient-to-br from-amber-300/15 via-orange-300/10 to-transparent p-5 xl:sticky xl:top-24", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center gap-2 text-amber-100", children: [
          /* @__PURE__ */ jsx(Calculator, { className: "size-5" }),
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Résumé" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-sm text-slate-200", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsx("span", { children: "Sous-total" }),
            /* @__PURE__ */ jsx("span", { children: /* @__PURE__ */ jsx(Currency, { amount: subtotal }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsx("span", { children: "Remise" }),
            /* @__PURE__ */ jsxs("span", { className: "text-red-300", children: [
              "-",
              /* @__PURE__ */ jsx(Currency, { amount: discountAmount })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-3 border-t border-white/15 pt-3 text-base font-semibold text-white", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsx("span", { children: "Total" }),
            /* @__PURE__ */ jsx("span", { children: /* @__PURE__ */ jsx(Currency, { amount: total }) })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-5 space-y-2", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              disabled: processing,
              className: "w-full rounded-lg bg-amber-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:opacity-50",
              children: processing ? "Enregistrement..." : "Créer la facture"
            }
          ),
          /* @__PURE__ */ jsx(
            Link_default,
            {
              href: route("invoices.index"),
              className: "block w-full rounded-lg border border-white/15 px-4 py-2.5 text-center text-sm text-slate-200 transition hover:bg-white/10",
              children: "Annuler"
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Modal, { show: showCustomerModal, onClose: () => setShowCustomerModal(false), maxWidth: "md", children: /* @__PURE__ */ jsxs("div", { className: "flex max-h-[80vh] flex-col bg-slate-950 p-5 text-slate-100", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-4 flex shrink-0 items-center justify-between", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-base font-semibold", children: "Choisir un client" }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => setShowCustomerModal(false),
            className: "rounded-md border border-white/15 p-1 text-slate-300 hover:bg-white/10",
            children: /* @__PURE__ */ jsx(X, { className: "size-4" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mb-3 shrink-0 rounded-xl border border-amber-300/20 bg-gradient-to-r from-slate-900 to-slate-800 p-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 rounded-lg border border-white/10 bg-slate-900 px-3 py-2", children: [
          /* @__PURE__ */ jsx(Search, { className: "size-4 text-amber-300" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              value: customerSearch,
              onChange: (e) => setCustomerSearch(e.target.value),
              onKeyDown: handleSearchKeyDown,
              placeholder: "Rechercher un client...",
              className: "w-full !bg-transparent !text-slate-100 text-sm caret-amber-300 placeholder:text-slate-400 focus:outline-none"
            }
          ),
          customerSearch && /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setCustomerSearch(""),
              className: "rounded-md p-1 text-slate-400 transition hover:bg-white/10 hover:text-slate-200",
              children: /* @__PURE__ */ jsx(X, { className: "size-3.5" })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-2 flex items-center justify-between px-1 text-xs text-slate-400", children: [
          /* @__PURE__ */ jsx("span", { children: "Utilise ↑ ↓ puis Entrée pour sélectionner" }),
          /* @__PURE__ */ jsxs("span", { children: [
            filteredCustomers.length,
            " résultat(s)"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "min-h-0 flex-1 space-y-1 overflow-y-auto rounded-lg border border-white/10 bg-slate-900/40 p-2", children: filteredCustomers.length > 0 ? filteredCustomers.map((customer, index) => /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => selectCustomer(customer),
          className: `flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition ${activeCustomerIndex === index ? "bg-amber-300/25 text-amber-100 ring-1 ring-amber-300/40" : Number(data.customer_id) === customer.id ? "bg-amber-300/20 text-amber-200" : "text-slate-200 hover:bg-white/10"}`,
          children: [
            /* @__PURE__ */ jsx("span", { children: customer.name }),
            Number(data.customer_id) === customer.id && /* @__PURE__ */ jsx("span", { className: "text-xs", children: "Sélectionné" })
          ]
        },
        customer.id
      )) : /* @__PURE__ */ jsx("p", { className: "px-3 py-2 text-sm text-slate-400", children: "Aucun client trouvé pour cette boutique." }) })
    ] }) }),
    /* @__PURE__ */ jsx(Modal, { show: showProductModal, onClose: () => setShowProductModal(false), maxWidth: "md", children: /* @__PURE__ */ jsxs("div", { className: "h-[560px] bg-slate-950 p-5 text-slate-100", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-base font-semibold", children: "Choisir un produit" }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => setShowProductModal(false),
            className: "rounded-md border border-white/15 p-1 text-slate-300 hover:bg-white/10",
            children: /* @__PURE__ */ jsx(X, { className: "size-4" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mb-3 rounded-xl border border-amber-300/20 bg-gradient-to-r from-slate-900 to-slate-800 p-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 rounded-lg border border-white/10 bg-slate-900 px-3 py-2", children: [
          /* @__PURE__ */ jsx(Search, { className: "size-4 text-amber-300" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              value: productSearch,
              onChange: (e) => setProductSearch(e.target.value),
              onKeyDown: handleProductSearchKeyDown,
              placeholder: "Rechercher un produit...",
              className: "w-full !bg-transparent !text-slate-100 text-sm caret-amber-300 placeholder:text-slate-400 focus:outline-none"
            }
          ),
          productSearch && /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setProductSearch(""),
              className: "rounded-md p-1 text-slate-400 transition hover:bg-white/10 hover:text-slate-200",
              children: /* @__PURE__ */ jsx(X, { className: "size-3.5" })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-2 flex items-center justify-between px-1 text-xs text-slate-400", children: [
          /* @__PURE__ */ jsx("span", { children: "Utilise ↑ ↓ puis Entrée pour sélectionner" }),
          /* @__PURE__ */ jsxs("span", { children: [
            filteredProductsBySearch.length,
            " résultat(s)"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "h-[420px] space-y-1 overflow-y-auto rounded-lg border border-white/10 bg-slate-900/40 p-2", children: filteredProductsBySearch.length > 0 ? filteredProductsBySearch.map((product, index) => /* @__PURE__ */ jsx("div", { children: product.has_variations && product.variations?.length > 0 ? /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-400", children: [
          /* @__PURE__ */ jsx("span", { className: "font-medium text-slate-300", children: product.name }),
          /* @__PURE__ */ jsxs("span", { className: "rounded-full bg-amber-300/15 px-1.5 py-0.5 text-xs text-amber-400", children: [
            product.variations.length,
            " décl."
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "ml-3 space-y-0.5 border-l-2 border-amber-300/25 pl-2", children: product.variations.map((variation) => /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => selectProduct(variation, product),
            className: "flex w-full items-center justify-between rounded-md px-3 py-1.5 text-left text-sm text-slate-200 transition hover:bg-white/10",
            children: [
              /* @__PURE__ */ jsx("span", { children: variation.name }),
              /* @__PURE__ */ jsx("span", { className: "text-xs text-amber-300", children: variation.selling_price })
            ]
          },
          variation.id
        )) })
      ] }) : /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => selectProduct(product),
          className: `flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition ${activeProductIndex === index ? "bg-amber-300/25 text-amber-100 ring-1 ring-amber-300/40" : "text-slate-200 hover:bg-white/10"}`,
          children: /* @__PURE__ */ jsx("span", { children: product.name })
        },
        product.id
      ) }, product.id)) : /* @__PURE__ */ jsx("p", { className: "px-3 py-2 text-sm text-slate-400", children: "Aucun produit trouvé pour cette boutique." }) })
    ] }) })
  ] });
}
export {
  InvoicesCreate as default
};
