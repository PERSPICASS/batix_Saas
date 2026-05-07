import { jsxs, jsx } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { a as usePage, u as useForm, H as Head_default, L as Link_default } from "../ssr.js";
import { useState, useRef, useEffect } from "react";
import { u as useRoute } from "./route-C2Ac8FMA.js";
import { ChevronDown, X, Search } from "lucide-react";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
function StocksCreate({ shops, products }) {
  const route = useRoute();
  const { props } = usePage();
  const activeShop = props.activeShop;
  const { data, setData, post, processing, errors } = useForm({
    shop_id: activeShop?.id.toString() || shops[0]?.id.toString() || "",
    product_id: "",
    type: "in",
    quantity: 1,
    unit_cost: "",
    notes: "",
    movement_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
  });
  const [productSearch, setProductSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const comboRef = useRef(null);
  const selectedProduct = products.find((p) => p.id === Number(data.product_id));
  const filteredProducts = products.filter((p) => {
    const q = productSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q);
  });
  useEffect(() => {
    const handler = (e) => {
      if (comboRef.current && !comboRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const selectProduct = (product) => {
    setData("product_id", product.id.toString());
    setProductSearch("");
    setDropdownOpen(false);
  };
  const clearProduct = () => {
    setData("product_id", "");
    setProductSearch("");
  };
  const submit = (e) => {
    e.preventDefault();
    post(route("stocks.store"));
  };
  return /* @__PURE__ */ jsxs(Authenticated, { header: /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-white", children: "Nouveau mouvement de stock" }), children: [
    /* @__PURE__ */ jsx(Head_default, { title: "Nouveau mouvement de stock" }),
    /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-2xl", children: /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6", children: [
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
          /* @__PURE__ */ jsx("label", { htmlFor: "type", className: "block text-sm font-medium text-slate-200", children: "Type de mouvement *" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              id: "type",
              value: data.type,
              onChange: (e) => setData("type", e.target.value),
              className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200",
              children: [
                /* @__PURE__ */ jsx("option", { value: "in", children: "Entrée (+)" }),
                /* @__PURE__ */ jsx("option", { value: "out", children: "Sortie (-)" }),
                /* @__PURE__ */ jsx("option", { value: "transfer", children: "Transfert" }),
                /* @__PURE__ */ jsx("option", { value: "adjustment", children: "Ajustement" })
              ]
            }
          ),
          errors.type && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.type })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-200", children: "Produit *" }),
          /* @__PURE__ */ jsxs("div", { ref: comboRef, className: "relative mt-1", children: [
            selectedProduct && !dropdownOpen ? /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between rounded-lg border border-amber-500/50 bg-slate-900/70 px-3 py-2", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-slate-200", children: selectedProduct.name }),
                selectedProduct.sku && /* @__PURE__ */ jsxs("span", { className: "ml-2 text-xs text-slate-400", children: [
                  "(",
                  selectedProduct.sku,
                  ")"
                ] }),
                /* @__PURE__ */ jsxs("span", { className: "ml-2 text-xs text-slate-500", children: [
                  "— Stock : ",
                  selectedProduct.stock_quantity,
                  " u."
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setDropdownOpen(true),
                    className: "rounded p-1 text-slate-400 hover:text-white transition-colors",
                    title: "Changer de produit",
                    children: /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4" })
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: clearProduct,
                    className: "rounded p-1 text-slate-400 hover:text-red-400 transition-colors",
                    title: "Supprimer",
                    children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
                  }
                )
              ] })
            ] }) : (
              /* Champ de recherche */
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: productSearch,
                    onChange: (e) => {
                      setProductSearch(e.target.value);
                      setDropdownOpen(true);
                    },
                    onFocus: () => setDropdownOpen(true),
                    placeholder: "Rechercher par nom ou SKU...",
                    className: "w-full rounded-lg border border-white/15 bg-slate-900/70 pl-9 pr-3 py-2 text-slate-200 placeholder-slate-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30",
                    autoComplete: "off"
                  }
                )
              ] })
            ),
            dropdownOpen && /* @__PURE__ */ jsx("div", { className: "absolute z-50 mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-white/15 bg-slate-900 shadow-2xl", children: filteredProducts.length === 0 ? /* @__PURE__ */ jsx("div", { className: "px-4 py-3 text-sm text-slate-500 text-center", children: "Aucun produit trouvé" }) : filteredProducts.map((product) => /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => selectProduct(product),
                className: `w-full flex items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 ${data.product_id === product.id.toString() ? "bg-amber-500/10 text-amber-300" : "text-slate-200"}`,
                children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("span", { className: "font-medium", children: product.name }),
                    product.sku && /* @__PURE__ */ jsx("span", { className: "ml-2 text-xs text-slate-400", children: product.sku })
                  ] }),
                  /* @__PURE__ */ jsxs("span", { className: `text-xs font-medium px-2 py-0.5 rounded-full ${product.stock_quantity <= 0 ? "bg-red-500/15 text-red-400" : product.stock_quantity <= 5 ? "bg-orange-500/15 text-orange-400" : "bg-emerald-500/15 text-emerald-400"}`, children: [
                    product.stock_quantity,
                    " u."
                  ] })
                ]
              },
              product.id
            )) })
          ] }),
          errors.product_id && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.product_id }),
          selectedProduct && /* @__PURE__ */ jsx("div", { className: "mt-2 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3", children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-blue-300", children: [
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Stock actuel :" }),
            " ",
            selectedProduct.stock_quantity,
            " unités"
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("label", { htmlFor: "quantity", className: "block text-sm font-medium text-slate-200", children: [
            "Quantité * ",
            data.type === "out" ? "(sera soustraite)" : "(sera ajoutée)"
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "number",
              id: "quantity",
              value: data.quantity,
              onChange: (e) => setData("quantity", Number(e.target.value)),
              className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200",
              min: "1"
            }
          ),
          errors.quantity && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.quantity })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "unit_cost", className: "block text-sm font-medium text-slate-200", children: "Coût unitaire (DH)" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "number",
              step: "0.01",
              id: "unit_cost",
              value: data.unit_cost,
              onChange: (e) => setData("unit_cost", e.target.value),
              className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200",
              placeholder: "0.00"
            }
          ),
          errors.unit_cost && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.unit_cost })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "movement_date", className: "block text-sm font-medium text-slate-200", children: "Date du mouvement *" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "date",
              id: "movement_date",
              value: data.movement_date,
              onChange: (e) => setData("movement_date", e.target.value),
              className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200"
            }
          ),
          errors.movement_date && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.movement_date })
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
              placeholder: "Raison du mouvement, détails..."
            }
          ),
          errors.notes && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.notes })
        ] })
      ] }),
      selectedProduct && /* @__PURE__ */ jsx("div", { className: "rounded-lg border border-amber-500/30 bg-amber-500/10 p-4", children: /* @__PURE__ */ jsxs("p", { className: "text-sm font-medium text-amber-300", children: [
        "Nouveau stock prévisionnel: ",
        " ",
        /* @__PURE__ */ jsxs("span", { className: "text-lg font-bold", children: [
          data.type === "in" || data.type === "adjustment" ? selectedProduct.stock_quantity + (data.quantity || 0) : selectedProduct.stock_quantity - (data.quantity || 0),
          " unités"
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-3 border-t border-white/10 pt-4", children: [
        /* @__PURE__ */ jsx(
          Link_default,
          {
            href: route("stocks.index"),
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
            children: processing ? "Enregistrement..." : "Enregistrer"
          }
        )
      ] })
    ] }) })
  ] });
}
export {
  StocksCreate as default
};
