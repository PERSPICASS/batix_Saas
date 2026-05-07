import { jsxs, jsx } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { u as useForm, H as Head_default, L as Link_default } from "../ssr.js";
import { useState } from "react";
import { Search, Plus, Trash2, ArrowLeft } from "lucide-react";
import { u as useRoute } from "./route-C2Ac8FMA.js";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
function InventoryEdit({ inventory, shops, products }) {
  const route = useRoute();
  const [searchProduct, setSearchProduct] = useState("");
  const { data, setData, put, processing, errors } = useForm({
    shop_id: inventory.shop_id.toString(),
    inventory_date: inventory.inventory_date.split("T")[0],
    status: inventory.status,
    notes: inventory.notes || "",
    items: inventory.items.map((item) => ({
      product_id: item.product_id,
      counted_quantity: item.counted_quantity,
      product_name: item.product.name,
      product_sku: item.product.sku,
      expected_quantity: item.expected_quantity
    }))
  });
  const filteredProducts = products.filter(
    (product) => product.shop.id.toString() === data.shop_id && !data.items.some((item) => item.product_id === product.id) && (product.name.toLowerCase().includes(searchProduct.toLowerCase()) || product.sku.toLowerCase().includes(searchProduct.toLowerCase()))
  );
  const addProduct = (product) => {
    setData("items", [
      ...data.items,
      {
        product_id: product.id,
        counted_quantity: null,
        product_name: product.name,
        product_sku: product.sku,
        expected_quantity: product.stock_quantity
      }
    ]);
    setSearchProduct("");
  };
  const removeProduct = (productId) => {
    setData("items", data.items.filter((item) => item.product_id !== productId));
  };
  const updateCountedQuantity = (productId, quantity) => {
    setData(
      "items",
      data.items.map(
        (item) => item.product_id === productId ? { ...item, counted_quantity: quantity } : item
      )
    );
  };
  const submit = (e) => {
    e.preventDefault();
    put(route("inventory.update", { inventory: inventory.id }));
  };
  return /* @__PURE__ */ jsxs(
    Authenticated,
    {
      header: /* @__PURE__ */ jsxs("h1", { className: "text-xl font-semibold text-white", children: [
        "Modifier l'inventaire ",
        inventory.inventory_number
      ] }),
      children: [
        /* @__PURE__ */ jsx(Head_default, { title: `Modifier inventaire ${inventory.inventory_number}` }),
        /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6", children: [
            /* @__PURE__ */ jsx("h2", { className: "mb-4 text-lg font-semibold text-white", children: "Informations générales" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-3", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-200", children: "Boutique" }),
                /* @__PURE__ */ jsx(
                  "select",
                  {
                    value: data.shop_id,
                    onChange: (e) => {
                      setData("shop_id", e.target.value);
                      setData("items", []);
                    },
                    className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200",
                    disabled: inventory.status === "completed",
                    children: shops.map((shop) => /* @__PURE__ */ jsx("option", { value: shop.id, children: shop.name }, shop.id))
                  }
                ),
                errors.shop_id && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.shop_id })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-200", children: "Date de l'inventaire" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "date",
                    value: data.inventory_date,
                    onChange: (e) => setData("inventory_date", e.target.value),
                    className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200",
                    disabled: inventory.status === "completed"
                  }
                ),
                errors.inventory_date && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.inventory_date })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-200", children: "Statut" }),
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    value: data.status,
                    onChange: (e) => setData("status", e.target.value),
                    className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200",
                    disabled: inventory.status === "completed",
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "draft", children: "Brouillon" }),
                      /* @__PURE__ */ jsx("option", { value: "in_progress", children: "En cours" }),
                      /* @__PURE__ */ jsx("option", { value: "cancelled", children: "Annulé" })
                    ]
                  }
                ),
                errors.status && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.status })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-200", children: "Notes" }),
              /* @__PURE__ */ jsx(
                "textarea",
                {
                  value: data.notes,
                  onChange: (e) => setData("notes", e.target.value),
                  rows: 3,
                  className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200",
                  placeholder: "Notes optionnelles..."
                }
              )
            ] })
          ] }),
          inventory.status !== "completed" && /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6", children: [
            /* @__PURE__ */ jsx("h2", { className: "mb-4 text-lg font-semibold text-white", children: "Ajouter des produits" }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: searchProduct,
                  onChange: (e) => setSearchProduct(e.target.value),
                  placeholder: "Rechercher un produit par nom ou SKU...",
                  className: "w-full rounded-lg border border-white/15 bg-slate-900/70 py-2 pl-10 pr-4 text-slate-200"
                }
              )
            ] }),
            searchProduct && filteredProducts.length > 0 && /* @__PURE__ */ jsx("div", { className: "mt-2 max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-slate-900", children: filteredProducts.slice(0, 10).map((product) => /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => addProduct(product),
                className: "flex w-full items-center justify-between px-4 py-2 text-left hover:bg-white/10",
                children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "text-white", children: product.name }),
                    /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400", children: [
                      "SKU: ",
                      product.sku,
                      " • Stock: ",
                      product.stock_quantity
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx(Plus, { className: "size-4 text-amber-300" })
                ]
              },
              product.id
            )) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6", children: [
            /* @__PURE__ */ jsxs("h2", { className: "mb-4 text-lg font-semibold text-white", children: [
              "Produits à inventorier (",
              data.items.length,
              ")"
            ] }),
            data.items.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-center text-slate-400", children: "Aucun produit ajouté" }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full", children: [
              /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-white/10 text-left text-sm text-slate-400", children: [
                /* @__PURE__ */ jsx("th", { className: "pb-3 pr-4", children: "Produit" }),
                /* @__PURE__ */ jsx("th", { className: "pb-3 pr-4 text-right", children: "Stock théorique" }),
                /* @__PURE__ */ jsx("th", { className: "pb-3 pr-4 text-right", children: "Stock réel" }),
                /* @__PURE__ */ jsx("th", { className: "pb-3 pr-4 text-right", children: "Écart" }),
                /* @__PURE__ */ jsx("th", { className: "pb-3" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-white/5", children: data.items.map((item) => {
                const difference = (item.counted_quantity ?? 0) - item.expected_quantity;
                return /* @__PURE__ */ jsxs("tr", { children: [
                  /* @__PURE__ */ jsx("td", { className: "py-3 pr-4", children: /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "font-medium text-white", children: item.product_name }),
                    /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400", children: [
                      "SKU: ",
                      item.product_sku
                    ] })
                  ] }) }),
                  /* @__PURE__ */ jsx("td", { className: "py-3 pr-4 text-right text-slate-300", children: item.expected_quantity }),
                  /* @__PURE__ */ jsx("td", { className: "py-3 pr-4 text-right", children: /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "number",
                      min: "0",
                      value: item.counted_quantity ?? "",
                      onChange: (e) => updateCountedQuantity(
                        item.product_id,
                        e.target.value ? parseInt(e.target.value) : null
                      ),
                      className: "w-24 rounded-lg border border-white/15 bg-slate-900/70 px-3 py-1 text-right text-white",
                      placeholder: "-",
                      disabled: inventory.status === "completed"
                    }
                  ) }),
                  /* @__PURE__ */ jsx("td", { className: "py-3 pr-4 text-right", children: item.counted_quantity !== null && /* @__PURE__ */ jsxs(
                    "span",
                    {
                      className: `font-medium ${difference === 0 ? "text-slate-400" : difference > 0 ? "text-green-300" : "text-red-300"}`,
                      children: [
                        difference > 0 ? "+" : "",
                        difference
                      ]
                    }
                  ) }),
                  /* @__PURE__ */ jsx("td", { className: "py-3 text-right", children: inventory.status !== "completed" && /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => removeProduct(item.product_id),
                      className: "rounded-lg p-1 text-red-400 hover:bg-red-500/20",
                      children: /* @__PURE__ */ jsx(Trash2, { className: "size-4" })
                    }
                  ) })
                ] }, item.product_id);
              }) })
            ] }) }),
            errors.items && /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-red-400", children: errors.items })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs(
              Link_default,
              {
                href: route("inventory.index"),
                className: "inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10",
                children: [
                  /* @__PURE__ */ jsx(ArrowLeft, { className: "size-4" }),
                  "Annuler"
                ]
              }
            ),
            inventory.status !== "completed" && /* @__PURE__ */ jsx(
              "button",
              {
                type: "submit",
                disabled: processing || data.items.length === 0,
                className: "inline-flex items-center gap-2 rounded-lg bg-amber-300 px-6 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:opacity-50",
                children: processing ? "Enregistrement..." : "Enregistrer les modifications"
              }
            )
          ] })
        ] })
      ]
    }
  );
}
export {
  InventoryEdit as default
};
