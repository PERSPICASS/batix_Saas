import { jsxs, jsx } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { a as usePage, u as useForm, H as Head_default, L as Link_default } from "../ssr.js";
import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, ChevronDown, X, Search } from "lucide-react";
import { u as useRoute } from "./route-C2Ac8FMA.js";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
function ProductCombobox({
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
    return p.name.toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q);
  });
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const select = (product) => {
    onChange(product.id);
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
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between rounded-lg border border-amber-500/50 bg-slate-950/70 px-3 py-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-slate-200", children: selected.name }),
          selected.sku && /* @__PURE__ */ jsxs("span", { className: "ml-2 text-xs text-slate-400", children: [
            "(",
            selected.sku,
            ")"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "ml-2 text-xs text-slate-500", children: [
            "— Stock : ",
            selected.stock_quantity,
            " u."
          ] })
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
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
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
            placeholder: "Rechercher par nom ou SKU...",
            className: "w-full rounded-lg border border-white/15 bg-slate-950/70 pl-8 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
            autoComplete: "off"
          }
        )
      ] })
    ),
    open && /* @__PURE__ */ jsx("div", { className: "absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-white/15 bg-slate-900 shadow-2xl", children: filtered.length === 0 ? /* @__PURE__ */ jsx("div", { className: "px-4 py-3 text-sm text-slate-500 text-center", children: "Aucun produit trouvé" }) : filtered.map((product) => {
      const isUsed = usedIds.includes(product.id) && product.id !== Number(value);
      return /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => !isUsed && select(product),
          disabled: isUsed,
          className: `w-full flex items-center justify-between px-4 py-2 text-left text-sm border-b border-white/5 last:border-0 transition-colors ${product.id === Number(value) ? "bg-amber-500/10 text-amber-300" : isUsed ? "opacity-40 cursor-not-allowed text-slate-400" : "text-slate-200 hover:bg-white/5"}`,
          children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "font-medium", children: product.name }),
              product.sku && /* @__PURE__ */ jsx("span", { className: "ml-2 text-xs text-slate-400", children: product.sku }),
              isUsed && /* @__PURE__ */ jsx("span", { className: "ml-2 text-xs text-slate-500 italic", children: "déjà ajouté" })
            ] }),
            /* @__PURE__ */ jsxs("span", { className: `ml-3 shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${product.stock_quantity <= 0 ? "bg-red-500/15 text-red-400" : product.stock_quantity <= 5 ? "bg-orange-500/15 text-orange-400" : "bg-emerald-500/15 text-emerald-400"}`, children: [
              product.stock_quantity,
              " u."
            ] })
          ]
        },
        product.id
      );
    }) })
  ] });
}
function InventoryCreate({ shops, products }) {
  const route = useRoute();
  const { props } = usePage();
  const activeShop = props.activeShop;
  const [items, setItems] = useState([
    { product_id: "", counted_quantity: "" }
  ]);
  const { data, setData, post, processing, errors } = useForm({
    shop_id: activeShop?.id.toString() || shops[0]?.id.toString() || "",
    inventory_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    notes: "",
    items
  });
  const addItem = () => {
    setItems([...items, { product_id: "", counted_quantity: "" }]);
  };
  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };
  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };
  const submit = (e) => {
    e.preventDefault();
    data.items = items;
    post(route("inventory.store"));
  };
  return /* @__PURE__ */ jsxs(Authenticated, { header: /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-white", children: "Nouvel inventaire" }), children: [
    /* @__PURE__ */ jsx(Head_default, { title: "Nouvel inventaire" }),
    /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-4xl", children: /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "mb-4 text-lg font-semibold text-white", children: "Informations générales" }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-6 md:grid-cols-2", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "shop_id", className: "block text-sm font-medium text-slate-200", children: "Boutique *" }),
            /* @__PURE__ */ jsx(
              "select",
              {
                id: "shop_id",
                value: data.shop_id,
                disabled: true,
                className: "mt-1 block w-full rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2 text-slate-400 cursor-not-allowed",
                children: shops.map((shop) => /* @__PURE__ */ jsx("option", { value: shop.id, children: shop.name }, shop.id))
              }
            ),
            /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-slate-400", children: "Boutique sélectionnée via le switcher" }),
            errors.shop_id && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.shop_id })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "inventory_date", className: "block text-sm font-medium text-slate-200", children: "Date de l'inventaire *" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                id: "inventory_date",
                value: data.inventory_date,
                onChange: (e) => setData("inventory_date", e.target.value),
                className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200"
              }
            ),
            errors.inventory_date && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.inventory_date })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "notes", className: "block text-sm font-medium text-slate-200", children: "Notes" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                id: "notes",
                value: data.notes,
                onChange: (e) => setData("notes", e.target.value),
                rows: 3,
                className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200",
                placeholder: "Raison de l'inventaire, observations..."
              }
            ),
            errors.notes && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.notes })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-white", children: "Produits comptés" }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: addItem,
              className: "inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10",
              children: [
                /* @__PURE__ */ jsx(Plus, { className: "size-3.5" }),
                "Ajouter un produit"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "space-y-4", children: items.map((item, index) => {
          const selectedProduct = products.find((p) => p.id === Number(item.product_id));
          return /* @__PURE__ */ jsxs(
            "div",
            {
              className: "rounded-xl border border-white/10 bg-slate-900/60 p-4 space-y-3",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "grid gap-3 md:grid-cols-12 items-end", children: [
                  /* @__PURE__ */ jsxs("div", { className: "md:col-span-6", children: [
                    /* @__PURE__ */ jsxs("label", { className: "block text-xs font-medium text-slate-300 mb-1.5", children: [
                      "Produit #",
                      index + 1,
                      " *"
                    ] }),
                    /* @__PURE__ */ jsx(
                      ProductCombobox,
                      {
                        products,
                        value: item.product_id,
                        onChange: (id) => updateItem(index, "product_id", id),
                        usedIds: items.map((it) => Number(it.product_id)).filter(Boolean)
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "md:col-span-5", children: [
                    /* @__PURE__ */ jsx("label", { className: "block text-xs font-medium text-slate-300 mb-1.5", children: "Quantité comptée *" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "number",
                        min: "0",
                        value: item.counted_quantity,
                        onChange: (e) => updateItem(index, "counted_quantity", e.target.value),
                        className: "block w-full rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
                        placeholder: "0"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "md:col-span-1", children: /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => removeItem(index),
                      disabled: items.length === 1,
                      className: "w-full rounded-lg border border-rose-300/30 px-3 py-2 text-rose-200 transition hover:bg-rose-300/10 disabled:opacity-30 disabled:cursor-not-allowed",
                      title: "Supprimer",
                      children: /* @__PURE__ */ jsx(Trash2, { className: "mx-auto size-4" })
                    }
                  ) })
                ] }),
                selectedProduct && /* @__PURE__ */ jsx("div", { className: "rounded-lg border border-blue-500/30 bg-blue-500/10 p-3", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-4 text-sm", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mb-0.5", children: "Stock système" }),
                    /* @__PURE__ */ jsx("p", { className: "font-semibold text-blue-300", children: selectedProduct.stock_quantity })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mb-0.5", children: "Compté" }),
                    /* @__PURE__ */ jsx("p", { className: "font-semibold text-blue-300", children: item.counted_quantity || 0 })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mb-0.5", children: "Écart" }),
                    /* @__PURE__ */ jsxs(
                      "p",
                      {
                        className: `font-semibold ${Number(item.counted_quantity || 0) - selectedProduct.stock_quantity > 0 ? "text-green-400" : Number(item.counted_quantity || 0) - selectedProduct.stock_quantity < 0 ? "text-red-400" : "text-slate-400"}`,
                        children: [
                          Number(item.counted_quantity || 0) - selectedProduct.stock_quantity > 0 ? "+" : "",
                          Number(item.counted_quantity || 0) - selectedProduct.stock_quantity
                        ]
                      }
                    )
                  ] })
                ] }) })
              ]
            },
            index
          );
        }) }),
        errors.items && /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-red-400", children: errors.items })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-3", children: [
        /* @__PURE__ */ jsx(
          Link_default,
          {
            href: route("inventory.index"),
            className: "rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/5",
            children: "Annuler"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            disabled: processing,
            className: "rounded-lg bg-amber-300 px-6 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50",
            children: processing ? "Création..." : "Créer l'inventaire"
          }
        )
      ] })
    ] }) })
  ] });
}
export {
  InventoryCreate as default
};
