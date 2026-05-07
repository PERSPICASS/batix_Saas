import { jsxs, jsx } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { a as usePage, u as useForm, H as Head_default, L as Link_default } from "../ssr.js";
import { useState } from "react";
import { Trash2, Minus, Plus, CreditCard } from "lucide-react";
import { C as Currency } from "./Currency-BX_NSrIs.js";
import { P as ProductImage } from "./ProductImage-5zmeiiH5.js";
import { u as useRoute } from "./route-C2Ac8FMA.js";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
function SalesCreate({ shops, customers, products }) {
  const route = useRoute();
  const { props } = usePage();
  const activeShop = props.activeShop;
  const [cart, setCart] = useState([]);
  const [searchProduct, setSearchProduct] = useState("");
  const { data, setData, post, processing, errors } = useForm({
    shop_id: activeShop?.id.toString() || shops[0]?.id.toString() || "",
    customer_id: "",
    payment_method: "cash",
    amount_paid: "",
    discount_amount: "0",
    credit_due_date: "",
    notes: "",
    items: []
  });
  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.product_id === product.id);
    if (existingItem) {
      setCart(
        cart.map(
          (item) => item.product_id === product.id ? {
            ...item,
            quantity: item.quantity + 1,
            subtotal: (item.quantity + 1) * item.unit_price
          } : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          product_id: product.id,
          product_name: product.name,
          quantity: 1,
          unit_price: parseFloat(product.selling_price),
          tax_rate: parseFloat(product.tax_rate || "0"),
          subtotal: parseFloat(product.selling_price)
        }
      ]);
    }
  };
  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.product_id !== productId));
  };
  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(
      cart.map(
        (item) => item.product_id === productId ? {
          ...item,
          quantity,
          subtotal: quantity * item.unit_price
        } : item
      )
    );
  };
  const updateUnitPrice = (productId, newPrice) => {
    setCart(
      cart.map(
        (item) => item.product_id === productId ? {
          ...item,
          unit_price: newPrice,
          subtotal: item.quantity * newPrice
        } : item
      )
    );
  };
  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const taxAmount = cart.reduce(
      (sum, item) => sum + item.subtotal * item.tax_rate / 100,
      0
    );
    const discount = parseFloat(data.discount_amount || "0");
    return subtotal + taxAmount - discount;
  };
  const isCredit = () => data.payment_method === "credit";
  const calculateRemaining = () => {
    const total = calculateTotal();
    const amountPaid = parseFloat(data.amount_paid || "0");
    return Math.max(0, total - amountPaid);
  };
  const calculateChange = () => {
    if (isCredit()) return 0;
    const amountPaid = parseFloat(data.amount_paid || "0");
    const total = calculateTotal();
    return Math.max(0, amountPaid - total);
  };
  const onSubmit = (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert("Veuillez ajouter au moins un produit au panier");
      return;
    }
    const items = cart.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price
      // Envoyer le prix négocié
    }));
    post(route("sales.store"), {
      preserveScroll: true,
      onBefore: () => {
        data.items = items;
        return true;
      }
    });
  };
  const filteredProducts = products.filter(
    (product) => product.name.toLowerCase().includes(searchProduct.toLowerCase()) || product.sku?.toLowerCase().includes(searchProduct.toLowerCase()) || product.variations?.some(
      (v) => v.name.toLowerCase().includes(searchProduct.toLowerCase()) || v.sku?.toLowerCase().includes(searchProduct.toLowerCase())
    )
  );
  return /* @__PURE__ */ jsxs(Authenticated, { header: /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-white", children: "Caisse" }), children: [
    /* @__PURE__ */ jsx(Head_default, { title: "Nouvelle vente" }),
    /* @__PURE__ */ jsx("form", { onSubmit, className: "space-y-4", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-4 lg:grid-cols-3", children: [
      /* @__PURE__ */ jsx("div", { className: "lg:col-span-2 space-y-4", children: /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "mb-4 text-lg font-semibold text-white", children: "Produits" }),
        /* @__PURE__ */ jsx("div", { className: "mb-4", children: /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            placeholder: "Rechercher un produit (nom, SKU)...",
            value: searchProduct,
            onChange: (e) => setSearchProduct(e.target.value),
            className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-4 py-2 text-white"
          }
        ) }),
        /* @__PURE__ */ jsx("div", { className: "grid gap-2 max-h-96 overflow-y-auto", children: filteredProducts.map((product) => /* @__PURE__ */ jsx("div", { children: product.has_variations && product.variations.length > 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-white/10 bg-slate-900/50 p-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(ProductImage, { src: product.image, name: product.name, thumbnailClass: "size-10" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "font-medium text-white", children: product.name }),
              /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400", children: [
                "SKU: ",
                product.sku,
                " • ",
                /* @__PURE__ */ jsxs("span", { className: "text-amber-400", children: [
                  product.variations.length,
                  " déclinaison",
                  product.variations.length > 1 ? "s" : ""
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-2 ml-4 space-y-1 border-l-2 border-amber-300/30 pl-3", children: product.variations.map((variation) => /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => addToCart(variation),
              className: "flex w-full items-center justify-between rounded-lg border border-white/5 bg-slate-800/60 px-3 py-2 text-left hover:bg-white/10 transition",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(ProductImage, { src: variation.image ?? product.image, name: variation.name, thumbnailClass: "size-7" }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-white", children: variation.name }),
                    /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400", children: [
                      "SKU: ",
                      variation.sku,
                      " • Stock: ",
                      variation.stock_quantity
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "ml-3 shrink-0 font-semibold text-amber-300 text-sm", children: /* @__PURE__ */ jsx(Currency, { amount: parseFloat(variation.selling_price) }) })
              ]
            },
            variation.id
          )) })
        ] }) : /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => addToCart(product),
            className: "flex w-full items-center justify-between rounded-lg border border-white/10 bg-slate-900/50 p-3 text-left hover:bg-white/10 transition",
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx(ProductImage, { src: product.image, name: product.name, thumbnailClass: "size-10" }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "font-medium text-white", children: product.name }),
                  /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400", children: [
                    "SKU: ",
                    product.sku,
                    " • Stock: ",
                    product.stock_quantity
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "text-right shrink-0 ml-3", children: /* @__PURE__ */ jsx("p", { className: "font-semibold text-amber-300", children: /* @__PURE__ */ jsx(Currency, { amount: parseFloat(product.selling_price) }) }) })
            ]
          }
        ) }, product.id)) })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6", children: [
          /* @__PURE__ */ jsx("h2", { className: "mb-4 text-lg font-semibold text-white", children: "Panier" }),
          cart.length === 0 ? /* @__PURE__ */ jsx("p", { className: "py-8 text-center text-slate-400", children: "Panier vide" }) : /* @__PURE__ */ jsx("div", { className: "space-y-2", children: cart.map((item) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: "rounded-lg border border-white/10 bg-slate-900/50 p-3",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between mb-2", children: [
                  /* @__PURE__ */ jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-white", children: item.product_name }) }),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => removeFromCart(item.product_id),
                      className: "rounded p-1 text-rose-300 hover:bg-rose-300/10 transition",
                      children: /* @__PURE__ */ jsx(Trash2, { className: "size-4" })
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 items-center mb-3", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("label", { className: "block text-xs text-slate-400 mb-1", children: "Prix unitaire" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "number",
                        min: "0",
                        step: "0.01",
                        value: item.unit_price,
                        onChange: (e) => updateUnitPrice(
                          item.product_id,
                          parseFloat(e.target.value) || 0
                        ),
                        className: "w-full rounded border border-white/15 bg-slate-900/70 px-2 py-1.5 text-sm text-white"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("label", { className: "block text-xs text-slate-400 mb-1", children: "Quantité" }),
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsx(
                        "button",
                        {
                          type: "button",
                          onClick: () => updateQuantity(
                            item.product_id,
                            item.quantity - 1
                          ),
                          className: "flex items-center justify-center rounded border border-white/15 bg-slate-900/70 p-2 text-white hover:bg-white/10 transition",
                          children: /* @__PURE__ */ jsx(Minus, { className: "size-4" })
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "number",
                          min: "1",
                          value: item.quantity,
                          onChange: (e) => updateQuantity(
                            item.product_id,
                            parseInt(e.target.value) || 0
                          ),
                          className: "w-full rounded border border-white/15 bg-slate-900/70 px-2 py-2 text-center text-sm text-white"
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        "button",
                        {
                          type: "button",
                          onClick: () => updateQuantity(
                            item.product_id,
                            item.quantity + 1
                          ),
                          className: "flex items-center justify-center rounded border border-white/15 bg-slate-900/70 p-2 text-white hover:bg-white/10 transition",
                          children: /* @__PURE__ */ jsx(Plus, { className: "size-4" })
                        }
                      )
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-xs text-slate-400 ", children: "Total" }),
                  /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-amber-300 py-1.5", children: /* @__PURE__ */ jsx(Currency, { amount: item.subtotal }) })
                ] })
              ]
            },
            item.product_id
          )) }),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-2 border-t border-white/10 pt-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm text-slate-300", children: [
              /* @__PURE__ */ jsx("span", { children: "Sous-total" }),
              /* @__PURE__ */ jsx("span", { children: /* @__PURE__ */ jsx(Currency, { amount: cart.reduce((sum, item) => sum + item.subtotal, 0) }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm text-slate-300", children: [
              /* @__PURE__ */ jsx("span", { children: "TVA" }),
              /* @__PURE__ */ jsx("span", { children: /* @__PURE__ */ jsx(Currency, { amount: cart.reduce(
                (sum, item) => sum + item.subtotal * item.tax_rate / 100,
                0
              ) }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-lg font-bold text-amber-300", children: [
              /* @__PURE__ */ jsx("span", { children: "Total" }),
              /* @__PURE__ */ jsx("span", { children: /* @__PURE__ */ jsx(Currency, { amount: calculateTotal() }) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4", children: [
          /* @__PURE__ */ jsxs("label", { className: "block space-y-1 text-sm text-slate-200", children: [
            /* @__PURE__ */ jsx("span", { children: "Boutique *" }),
            /* @__PURE__ */ jsx(
              "select",
              {
                value: data.shop_id,
                disabled: true,
                className: "w-full rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2 text-slate-400 cursor-not-allowed",
                children: shops.map((shop) => /* @__PURE__ */ jsx("option", { value: shop.id, children: shop.name }, shop.id))
              }
            ),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "Boutique sélectionnée via le switcher" }),
            errors.shop_id && /* @__PURE__ */ jsx("span", { className: "text-xs text-red-400", children: errors.shop_id })
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "block space-y-1 text-sm text-slate-200", children: [
            /* @__PURE__ */ jsx("span", { children: "Client" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: data.customer_id,
                onChange: (e) => setData("customer_id", e.target.value),
                className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "", children: "Anonyme" }),
                  customers.map((customer) => /* @__PURE__ */ jsx("option", { value: customer.id, children: customer.name }, customer.id))
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "block space-y-1 text-sm text-slate-200", children: [
            /* @__PURE__ */ jsx("span", { children: "Mode de paiement *" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: data.payment_method,
                onChange: (e) => setData("payment_method", e.target.value),
                className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "cash", children: "Espèces" }),
                  /* @__PURE__ */ jsx("option", { value: "card", children: "Carte" }),
                  /* @__PURE__ */ jsx("option", { value: "transfer", children: "Virement" }),
                  /* @__PURE__ */ jsx("option", { value: "check", children: "Chèque" }),
                  /* @__PURE__ */ jsx("option", { value: "mobile", children: "Mobile" }),
                  /* @__PURE__ */ jsx("option", { value: "multiple", children: "Multiple" }),
                  /* @__PURE__ */ jsx("option", { value: "credit", children: "Crédit (avec acompte)" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "block space-y-1 text-sm text-slate-200", children: [
            /* @__PURE__ */ jsx("span", { children: isCredit() ? "Acompte versé *" : "Montant payé *" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                step: "0.01",
                min: "0",
                max: isCredit() ? calculateTotal() : void 0,
                value: data.amount_paid,
                onChange: (e) => setData("amount_paid", e.target.value),
                className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
              }
            ),
            errors.amount_paid && /* @__PURE__ */ jsx("span", { className: "text-xs text-red-400", children: errors.amount_paid })
          ] }),
          isCredit() && data.amount_paid !== "" && /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-amber-500/15 border border-amber-400/30 p-3 space-y-1", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
              /* @__PURE__ */ jsx("span", { className: "text-slate-300", children: "Acompte" }),
              /* @__PURE__ */ jsx("span", { className: "font-semibold text-amber-300", children: /* @__PURE__ */ jsx(Currency, { amount: parseFloat(data.amount_paid || "0") }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
              /* @__PURE__ */ jsx("span", { className: "text-rose-300 font-medium", children: "Reste à payer" }),
              /* @__PURE__ */ jsx("span", { className: "font-bold text-rose-300", children: /* @__PURE__ */ jsx(Currency, { amount: calculateRemaining() }) })
            ] })
          ] }),
          isCredit() && /* @__PURE__ */ jsxs("label", { className: "block space-y-1 text-sm text-slate-200", children: [
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(CreditCard, { className: "size-3.5" }),
              "Date d'échéance (optionnel)"
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: data.credit_due_date,
                min: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
                onChange: (e) => setData("credit_due_date", e.target.value),
                className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
              }
            ),
            errors.credit_due_date && /* @__PURE__ */ jsx("span", { className: "text-xs text-red-400", children: errors.credit_due_date })
          ] }),
          !isCredit() && data.amount_paid && /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-emerald-500/20 p-3 text-center", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-300", children: "Monnaie à rendre" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-emerald-300", children: /* @__PURE__ */ jsx(Currency, { amount: calculateChange() }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsx(
              Link_default,
              {
                href: route("sales.index"),
                className: "flex-1 rounded-lg border border-white/15 px-4 py-3 text-center text-sm text-slate-200 hover:bg-white/10",
                children: "Annuler"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "submit",
                disabled: processing || cart.length === 0,
                className: "flex-1 rounded-lg bg-amber-300 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50",
                children: processing ? "Traitement..." : "Valider la vente"
              }
            )
          ] })
        ] })
      ] })
    ] }) })
  ] });
}
export {
  SalesCreate as default
};
