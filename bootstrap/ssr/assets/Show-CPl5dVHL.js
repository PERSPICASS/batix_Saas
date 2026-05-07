import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { a as usePage, u as useForm, H as Head_default, L as Link_default, r as router3 } from "../ssr.js";
import { u as useRoute } from "./route-C2Ac8FMA.js";
import { CheckCircle, AlertCircle, Warehouse, ArrowRight, Pencil, Package, AlertTriangle, TrendingUp, Plus, ArrowUpRight, Upload, Download, Search, X, Trash2 } from "lucide-react";
import { useState, useRef } from "react";
import { P as ProductImage } from "./ProductImage-5zmeiiH5.js";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
function Show({ depot, products, recentTransfers, stats, otherDepots }) {
  const buildRoute = useRoute();
  const page = usePage();
  const shops = page.props.shops || [];
  page.props.allProducts || [];
  const [showAddStock, setShowAddStock] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showTransferDepot, setShowTransferDepot] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [search, setSearch] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const imageInputRef = useRef(null);
  const editImageInputRef = useRef(null);
  const filteredProducts = search.trim() === "" ? products : products.filter((p) => {
    const q = search.toLowerCase();
    return p.product_name.toLowerCase().includes(q) || (p.product_sku ?? "").toLowerCase().includes(q) || (p.product_category ?? "").toLowerCase().includes(q);
  });
  const fileInputRef = useRef(null);
  const flash = page.props.flash;
  const importErrors = page.props.import_errors;
  const addStockForm = useForm({
    name: "",
    sku: "",
    quantity: "",
    min_stock_alert: "0",
    purchase_price: "0",
    image: null
  });
  const transferForm = useForm({
    shop_id: "",
    notes: "",
    items: [{ product_id: "", quantity: "1" }]
  });
  const transferDepotForm = useForm({
    target_depot_id: "",
    notes: "",
    items: [{ product_id: "", quantity: "1" }]
  });
  const editForm = useForm({
    quantity: 0,
    min_stock_alert: 0,
    purchase_price: 0,
    name: "",
    sku: "",
    image: null
  });
  const handleAddStock = (e) => {
    e.preventDefault();
    addStockForm.post(buildRoute("depots.stock.add", { depot: depot.id }), {
      forceFormData: true,
      onSuccess: () => {
        setShowAddStock(false);
        setImagePreview(null);
        addStockForm.reset();
      }
    });
  };
  const handleTransfer = (e) => {
    e.preventDefault();
    transferForm.post(buildRoute("depots.transfer", { depot: depot.id }), {
      onSuccess: () => {
        setShowTransfer(false);
        transferForm.reset();
      }
    });
  };
  const handleTransferDepot = (e) => {
    e.preventDefault();
    transferDepotForm.post(buildRoute("depots.transfer-depot", { depot: depot.id }), {
      onSuccess: () => {
        setShowTransferDepot(false);
        transferDepotForm.reset();
      }
    });
  };
  const handleEditStock = (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    editForm.post(buildRoute("depots.stock.update", { depot: depot.id, depotProduct: editingProduct.id }), {
      forceFormData: true,
      headers: { "X-HTTP-Method-Override": "PATCH" },
      onSuccess: () => {
        setEditingProduct(null);
        setEditImagePreview(null);
      }
    });
  };
  const handleRemoveProduct = (depotProductId) => {
    if (!confirm("Retirer ce produit du dépôt ?")) return;
    router3.delete(buildRoute("depots.stock.remove", { depot: depot.id, depotProduct: depotProductId }));
  };
  const handleImport = (e) => {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    router3.post(buildRoute("depots.stock.import", { depot: depot.id }), formData, {
      onSuccess: () => {
        setShowImport(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    });
  };
  return /* @__PURE__ */ jsxs(Authenticated, { header: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
    /* @__PURE__ */ jsx(Link_default, { href: buildRoute("depots.index"), className: "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200", children: "Dépôts" }),
    /* @__PURE__ */ jsx("span", { className: "text-slate-300", children: "/" }),
    /* @__PURE__ */ jsx("span", { className: "font-semibold", children: depot.name })
  ] }), children: [
    /* @__PURE__ */ jsx(Head_default, { title: depot.name }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      flash?.success && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-400", children: [
        /* @__PURE__ */ jsx(CheckCircle, { className: "size-4 shrink-0" }),
        flash.success
      ] }),
      flash?.warning && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-400", children: [
        /* @__PURE__ */ jsx(AlertCircle, { className: "size-4 shrink-0" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { children: flash.warning }),
          importErrors && importErrors.length > 0 && /* @__PURE__ */ jsx("ul", { className: "mt-1 list-disc pl-4 text-xs opacity-80", children: importErrors.map((err, i) => /* @__PURE__ */ jsx("li", { children: err }, i)) })
        ] })
      ] }),
      flash?.error && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-400", children: [
        /* @__PURE__ */ jsx(AlertCircle, { className: "size-4 shrink-0" }),
        flash.error
      ] }),
      "                ",
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "flex size-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-300/10", children: /* @__PURE__ */ jsx(Warehouse, { className: "size-6 text-amber-600 dark:text-amber-300" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-slate-900 dark:text-white", children: depot.name }),
              /* @__PURE__ */ jsx("span", { className: `rounded-full px-2 py-0.5 text-xs font-medium ${depot.is_active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400" : "bg-slate-100 text-slate-500"}`, children: depot.is_active ? "Actif" : "Inactif" })
            ] }),
            (depot.city || depot.address) && /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: [depot.address, depot.city].filter(Boolean).join(", ") })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxs(
            Link_default,
            {
              href: buildRoute("depots.transfers", { depot: depot.id }),
              className: "inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5",
              children: [
                /* @__PURE__ */ jsx(ArrowRight, { className: "size-4" }),
                "Historique transferts"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Link_default,
            {
              href: buildRoute("depots.edit", { depot: depot.id }),
              className: "inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5",
              children: [
                /* @__PURE__ */ jsx(Pencil, { className: "size-4" }),
                "Modifier"
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400", children: [
            /* @__PURE__ */ jsx(Package, { className: "size-4" }),
            "Références produits"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-3xl font-bold text-slate-900 dark:text-white", children: stats.total_products })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400", children: [
            /* @__PURE__ */ jsx(Warehouse, { className: "size-4" }),
            "Unités en stock"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-3xl font-bold text-slate-900 dark:text-white", children: stats.total_stock })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-amber-500", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { className: "size-4" }),
            "Stock faible"
          ] }),
          /* @__PURE__ */ jsx("p", { className: `mt-2 text-3xl font-bold ${stats.low_stock_count > 0 ? "text-amber-500" : "text-slate-900 dark:text-white"}`, children: stats.low_stock_count })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400", children: [
            /* @__PURE__ */ jsx(TrendingUp, { className: "size-4" }),
            "Valeur du stock"
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400", children: [
            Number(stats.total_value).toLocaleString("fr-FR"),
            " ",
            /* @__PURE__ */ jsx("span", { className: "text-lg", children: "FCFA" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-3", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setShowAddStock(true),
            className: "inline-flex items-center gap-2 rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200",
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "size-4" }),
              "Ajouter du stock"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setShowTransfer(true),
            className: "inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600",
            children: [
              /* @__PURE__ */ jsx(ArrowUpRight, { className: "size-4" }),
              "Transférer vers une boutique"
            ]
          }
        ),
        otherDepots.length > 0 && /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setShowTransferDepot(true),
            className: "inline-flex items-center gap-2 rounded-xl border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-300 dark:hover:bg-indigo-400/20",
            children: [
              /* @__PURE__ */ jsx(Warehouse, { className: "size-4" }),
              "Transférer vers un dépôt"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setShowImport(true),
            className: "inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5",
            children: [
              /* @__PURE__ */ jsx(Upload, { className: "size-4" }),
              "Importer CSV / Excel"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "a",
          {
            href: buildRoute("depots.stock.template", { depot: depot.id }),
            className: "inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5",
            children: [
              /* @__PURE__ */ jsx(Download, { className: "size-4" }),
              "Modèle Excel"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 border-b border-slate-200 px-6 py-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-semibold text-slate-900 dark:text-white", children: "Stock du dépôt" }),
            search.trim() !== "" && /* @__PURE__ */ jsxs("span", { className: "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-400/10 dark:text-amber-400", children: [
              filteredProducts.length,
              " résultat",
              filteredProducts.length !== 1 ? "s" : ""
            ] })
          ] }),
          products.length > 0 && /* @__PURE__ */ jsxs("div", { className: "relative w-full sm:w-64", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: search,
                onChange: (e) => setSearch(e.target.value),
                placeholder: "Nom, SKU, catégorie...",
                className: "w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-8 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
              }
            ),
            search && /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setSearch(""),
                className: "absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200",
                children: /* @__PURE__ */ jsx(X, { className: "size-3.5" })
              }
            )
          ] })
        ] }),
        products.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center py-12", children: [
          /* @__PURE__ */ jsx(Package, { className: "size-10 text-slate-300 dark:text-slate-600" }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-slate-500 dark:text-slate-400", children: "Aucun produit en stock" }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setShowAddStock(true),
              className: "mt-3 inline-flex items-center gap-1.5 text-sm text-amber-500 hover:text-amber-400",
              children: [
                /* @__PURE__ */ jsx(Plus, { className: "size-3.5" }),
                "Ajouter des produits"
              ]
            }
          )
        ] }) : filteredProducts.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center py-12", children: [
          /* @__PURE__ */ jsx(Search, { className: "size-10 text-slate-300 dark:text-slate-600" }),
          /* @__PURE__ */ jsxs("p", { className: "mt-2 text-sm text-slate-500 dark:text-slate-400", children: [
            'Aucun produit ne correspond à "',
            /* @__PURE__ */ jsx("strong", { children: search }),
            '"'
          ] }),
          /* @__PURE__ */ jsx("button", { onClick: () => setSearch(""), className: "mt-2 text-sm text-amber-500 hover:text-amber-400", children: "Effacer la recherche" })
        ] }) : /* @__PURE__ */ jsx("div", { className: "divide-y divide-slate-100 dark:divide-white/5", children: filteredProducts.map((product) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-6 py-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(
              ProductImage,
              {
                src: product.product_image,
                name: product.product_name,
                thumbnailClass: "size-9"
              }
            ),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-slate-900 dark:text-white", children: product.product_name }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400", children: [
                product.product_sku && /* @__PURE__ */ jsxs("span", { children: [
                  "SKU: ",
                  product.product_sku
                ] }),
                product.product_category && /* @__PURE__ */ jsxs("span", { children: [
                  "• ",
                  product.product_category
                ] }),
                product.purchase_price > 0 && /* @__PURE__ */ jsxs("span", { className: "text-emerald-600 dark:text-emerald-400", children: [
                  "• PA : ",
                  Number(product.purchase_price).toLocaleString("fr-FR"),
                  " FCFA"
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
              /* @__PURE__ */ jsx("p", { className: `text-lg font-bold ${product.is_low_stock ? "text-amber-500" : "text-slate-900 dark:text-white"}`, children: product.quantity }),
              product.is_low_stock && /* @__PURE__ */ jsx("p", { className: "text-xs text-amber-500", children: "Stock faible" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => {
                    setEditingProduct(product);
                    setEditImagePreview(
                      product.product_image ? `/storage/${product.product_image}` : null
                    );
                    editForm.setData({
                      quantity: product.quantity,
                      min_stock_alert: product.min_stock_alert,
                      purchase_price: product.purchase_price,
                      name: product.product_name,
                      sku: product.product_sku ?? "",
                      image: null
                    });
                  },
                  className: "rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800",
                  children: /* @__PURE__ */ jsx(Pencil, { className: "size-3.5" })
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => handleRemoveProduct(product.id),
                  className: "rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-400/10",
                  children: /* @__PURE__ */ jsx(Trash2, { className: "size-3.5" })
                }
              )
            ] })
          ] })
        ] }, product.id)) })
      ] }),
      recentTransfers.length > 0 && /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-white/10", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-semibold text-slate-900 dark:text-white", children: "Derniers transferts" }),
          /* @__PURE__ */ jsx(
            Link_default,
            {
              href: buildRoute("depots.transfers", { depot: depot.id }),
              className: "text-sm text-amber-500 hover:text-amber-400",
              children: "Voir tout"
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "divide-y divide-slate-100 dark:divide-white/5", children: recentTransfers.map((t) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-6 py-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(
              ProductImage,
              {
                src: t.product_image,
                name: t.product_name,
                thumbnailClass: "size-8"
              }
            ),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("p", { className: "text-sm font-medium text-slate-900 dark:text-white", children: [
                t.product_name,
                " → ",
                t.shop_name
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: [
                t.reference,
                " • ",
                t.user_name,
                " • ",
                t.transferred_at
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "rounded-full bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200", children: [
            t.quantity,
            " unités"
          ] })
        ] }, t.id)) })
      ] })
    ] }),
    showAddStock && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900", children: [
      /* @__PURE__ */ jsx("h3", { className: "mb-4 text-lg font-semibold text-slate-900 dark:text-white", children: "Ajouter du stock" }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleAddStock, className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Nom du produit *" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: addStockForm.data.name,
              onChange: (e) => addStockForm.setData("name", e.target.value),
              className: "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none",
              placeholder: "Ex : Ciment Portland 50kg",
              required: true
            }
          ),
          addStockForm.errors.name && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-rose-500", children: addStockForm.errors.name })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300", children: "SKU / Référence" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: addStockForm.data.sku,
              onChange: (e) => addStockForm.setData("sku", e.target.value),
              className: "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none",
              placeholder: "Ex : SKU-001 (optionnel)"
            }
          ),
          addStockForm.errors.sku && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-rose-500", children: addStockForm.errors.sku })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Quantité *" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                min: "1",
                value: addStockForm.data.quantity,
                onChange: (e) => addStockForm.setData("quantity", e.target.value),
                className: "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none",
                required: true
              }
            ),
            addStockForm.errors.quantity && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-rose-500", children: addStockForm.errors.quantity })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Alerte stock min" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                min: "0",
                value: addStockForm.data.min_stock_alert,
                onChange: (e) => addStockForm.setData("min_stock_alert", e.target.value),
                className: "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Prix d'achat (FCFA)" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "number",
              min: "0",
              step: "1",
              value: addStockForm.data.purchase_price,
              onChange: (e) => addStockForm.setData("purchase_price", e.target.value),
              className: "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none",
              placeholder: "0"
            }
          ),
          addStockForm.errors.purchase_price && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-rose-500", children: addStockForm.errors.purchase_price })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Photo du produit" }),
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-center hover:border-amber-400 dark:border-white/15 dark:bg-slate-800/50 dark:hover:border-amber-400",
              onClick: () => imageInputRef.current?.click(),
              children: imagePreview ? /* @__PURE__ */ jsx("img", { src: imagePreview ?? void 0, alt: "Aperçu", className: "mx-auto h-20 w-20 rounded-lg object-cover" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Upload, { className: "size-6 text-slate-400" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: "Cliquer pour choisir une image" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "(JPG, PNG, max 2 Mo)" })
              ] })
            }
          ),
          /* @__PURE__ */ jsx(
            "input",
            {
              ref: imageInputRef,
              type: "file",
              accept: "image/*",
              className: "hidden",
              onChange: (e) => {
                const file = e.target.files?.[0] ?? null;
                addStockForm.setData("image", file);
                setImagePreview(file ? URL.createObjectURL(file) : null);
              }
            }
          ),
          imagePreview && /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => {
                addStockForm.setData("image", null);
                setImagePreview(null);
                if (imageInputRef.current) imageInputRef.current.value = "";
              },
              className: "mt-1 text-xs text-rose-500 hover:text-rose-600",
              children: "Supprimer l'image"
            }
          ),
          addStockForm.errors.image && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-rose-500", children: addStockForm.errors.image })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-3 pt-2", children: [
          /* @__PURE__ */ jsx("button", { type: "submit", disabled: addStockForm.processing, className: "flex-1 rounded-xl bg-amber-300 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50", children: addStockForm.processing ? "Ajout..." : "Ajouter" }),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setShowAddStock(false), className: "flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-medium text-slate-700 dark:border-white/10 dark:text-slate-300", children: "Annuler" })
        ] })
      ] })
    ] }) }),
    showTransfer && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: "Transférer vers une boutique" }),
        /* @__PURE__ */ jsx("button", { onClick: () => setShowTransfer(false), className: "rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200", children: /* @__PURE__ */ jsx(X, { className: "size-5" }) })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleTransfer, className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Boutique destination *" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: transferForm.data.shop_id,
              onChange: (e) => transferForm.setData("shop_id", e.target.value),
              className: "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none",
              required: true,
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "-- Sélectionner une boutique --" }),
                shops.map((s) => /* @__PURE__ */ jsx("option", { value: s.id, children: s.name }, s.id))
              ]
            }
          ),
          transferForm.errors.shop_id && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-rose-500", children: transferForm.errors.shop_id })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-slate-700 dark:text-slate-300", children: "Produits *" }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => transferForm.setData("items", [...transferForm.data.items ?? [], { product_id: "", quantity: "1" }]),
                className: "inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-500 dark:text-amber-400",
                children: [
                  /* @__PURE__ */ jsx(Plus, { className: "size-3.5" }),
                  "Ajouter un produit"
                ]
              }
            )
          ] }),
          (transferForm.data.items ?? []).map((item, index) => {
            const depotProd = products.find((p) => String(p.product_id) === item.product_id);
            return /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-800/50", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-2", children: [
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    value: item.product_id,
                    onChange: (e) => {
                      const newItems = [...transferForm.data.items ?? []];
                      newItems[index] = { ...newItems[index], product_id: e.target.value };
                      transferForm.setData("items", newItems);
                    },
                    className: "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none",
                    required: true,
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "", children: "-- Produit --" }),
                      products.map((p) => /* @__PURE__ */ jsxs("option", { value: p.product_id, disabled: p.quantity <= 0, children: [
                        p.product_name,
                        " (stock: ",
                        p.quantity,
                        ")"
                      ] }, p.product_id))
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "number",
                      min: "1",
                      max: depotProd?.quantity ?? void 0,
                      value: item.quantity,
                      onChange: (e) => {
                        const newItems = [...transferForm.data.items ?? []];
                        newItems[index] = { ...newItems[index], quantity: e.target.value };
                        transferForm.setData("items", newItems);
                      },
                      className: "w-24 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none",
                      placeholder: "Qté",
                      required: true
                    }
                  ),
                  depotProd && /* @__PURE__ */ jsxs("span", { className: "text-xs text-slate-500 dark:text-slate-400", children: [
                    "/ ",
                    depotProd.quantity,
                    " disponible",
                    depotProd.quantity > 1 ? "s" : ""
                  ] })
                ] }),
                transferForm.errors[`items.${index}.quantity`] && /* @__PURE__ */ jsx("p", { className: "text-xs text-rose-500", children: transferForm.errors[`items.${index}.quantity`] })
              ] }),
              (transferForm.data.items ?? []).length > 1 && /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    const newItems = (transferForm.data.items ?? []).filter((_, i) => i !== index);
                    transferForm.setData("items", newItems);
                  },
                  className: "mt-1 rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-400/10",
                  children: /* @__PURE__ */ jsx(X, { className: "size-4" })
                }
              )
            ] }, index);
          })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Notes" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              value: transferForm.data.notes,
              onChange: (e) => transferForm.setData("notes", e.target.value),
              rows: 2,
              className: "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none",
              placeholder: "Optionnel..."
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-3 pt-2", children: [
          /* @__PURE__ */ jsx("button", { type: "submit", disabled: transferForm.processing, className: "flex-1 rounded-xl bg-amber-300 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50", children: transferForm.processing ? "Transfert..." : `Transférer ${(transferForm.data.items ?? []).length > 1 ? `(${(transferForm.data.items ?? []).length} produits)` : ""}` }),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setShowTransfer(false), className: "flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-medium text-slate-700 dark:border-white/10 dark:text-slate-300", children: "Annuler" })
        ] })
      ] })
    ] }) }),
    editingProduct && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: "Modifier le produit" }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => {
          setEditingProduct(null);
          setEditImagePreview(null);
        }, className: "rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200", children: /* @__PURE__ */ jsx(X, { className: "size-5" }) })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleEditStock, className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Nom du produit" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: editForm.data.name,
              onChange: (e) => editForm.setData("name", e.target.value),
              className: "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
            }
          ),
          editForm.errors.name && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-rose-500", children: editForm.errors.name })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300", children: "SKU / Référence" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: editForm.data.sku,
              onChange: (e) => editForm.setData("sku", e.target.value),
              className: "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none",
              placeholder: "Ex : SKU-001 (optionnel)"
            }
          ),
          editForm.errors.sku && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-rose-500", children: editForm.errors.sku })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Quantité" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                min: "0",
                value: editForm.data.quantity,
                onChange: (e) => editForm.setData("quantity", parseInt(e.target.value) || 0),
                className: "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
              }
            ),
            editForm.errors.quantity && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-rose-500", children: editForm.errors.quantity })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Alerte min" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                min: "0",
                value: editForm.data.min_stock_alert,
                onChange: (e) => editForm.setData("min_stock_alert", parseInt(e.target.value) || 0),
                className: "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Prix d'achat (FCFA)" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "number",
              min: "0",
              step: "1",
              value: editForm.data.purchase_price,
              onChange: (e) => editForm.setData("purchase_price", parseFloat(e.target.value) || 0),
              className: "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none",
              placeholder: "0"
            }
          ),
          editForm.errors.purchase_price && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-rose-500", children: editForm.errors.purchase_price })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Photo du produit" }),
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-center hover:border-amber-400 dark:border-white/15 dark:bg-slate-800/50 dark:hover:border-amber-400",
              onClick: () => editImageInputRef.current?.click(),
              children: editImagePreview ? /* @__PURE__ */ jsx("img", { src: editImagePreview ?? void 0, alt: "Aperçu", className: "mx-auto h-20 w-20 rounded-lg object-cover" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Upload, { className: "size-6 text-slate-400" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: "Cliquer pour changer l'image" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "(JPG, PNG, max 2 Mo)" })
              ] })
            }
          ),
          /* @__PURE__ */ jsx(
            "input",
            {
              ref: editImageInputRef,
              type: "file",
              accept: "image/*",
              className: "hidden",
              onChange: (e) => {
                const file = e.target.files?.[0] ?? null;
                editForm.setData("image", file);
                setEditImagePreview(file ? URL.createObjectURL(file) : null);
              }
            }
          ),
          editImagePreview && /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => {
                editForm.setData("image", null);
                setEditImagePreview(null);
                if (editImageInputRef.current) editImageInputRef.current.value = "";
              },
              className: "mt-1 text-xs text-rose-500 hover:text-rose-600",
              children: "Supprimer l'image"
            }
          ),
          editForm.errors.image && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-rose-500", children: editForm.errors.image })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-3 pt-2", children: [
          /* @__PURE__ */ jsx("button", { type: "submit", disabled: editForm.processing, className: "flex-1 rounded-xl bg-amber-300 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50", children: editForm.processing ? "Enregistrement..." : "Enregistrer" }),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => {
            setEditingProduct(null);
            setEditImagePreview(null);
          }, className: "flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-medium dark:border-white/10 dark:text-slate-300", children: "Annuler" })
        ] })
      ] })
    ] }) }),
    showImport && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: "Importer du stock (CSV / Excel)" }),
        /* @__PURE__ */ jsx("button", { onClick: () => setShowImport(false), className: "rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200", children: /* @__PURE__ */ jsx(X, { className: "size-5" }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-white/10 dark:bg-slate-800 dark:text-slate-400", children: [
        /* @__PURE__ */ jsx("p", { className: "mb-1 font-semibold text-slate-700 dark:text-slate-300", children: "Colonnes attendues :" }),
        /* @__PURE__ */ jsx("code", { className: "block", children: "sku, code_barres, nom, quantite, stock_minimum, prix_achat" }),
        /* @__PURE__ */ jsxs("p", { className: "mt-2", children: [
          "Le produit est recherché par ",
          /* @__PURE__ */ jsx("strong", { children: "SKU" }),
          ", puis ",
          /* @__PURE__ */ jsx("strong", { children: "code-barres" }),
          ", puis ",
          /* @__PURE__ */ jsx("strong", { children: "nom" }),
          ".",
          /* @__PURE__ */ jsx("br", {}),
          "Si le produit existe déjà dans le dépôt, la quantité est ",
          /* @__PURE__ */ jsx("strong", { children: "ajoutée" }),
          ". La colonne ",
          /* @__PURE__ */ jsx("strong", { children: "prix_achat" }),
          " est optionnelle."
        ] }),
        /* @__PURE__ */ jsxs(
          "a",
          {
            href: buildRoute("depots.stock.template", { depot: depot.id }),
            className: "mt-2 inline-flex items-center gap-1 text-amber-500 hover:text-amber-400",
            children: [
              /* @__PURE__ */ jsx(Download, { className: "size-3.5" }),
              "Télécharger le modèle Excel (.xlsx)"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleImport, className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Fichier CSV / Excel *" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              ref: fileInputRef,
              type: "file",
              accept: ".csv,.xlsx,.xls",
              required: true,
              className: "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-amber-100 file:px-3 file:py-1 file:text-xs file:font-medium file:text-amber-700 dark:border-white/15 dark:bg-slate-800 dark:text-slate-300"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-3 pt-1", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "submit",
              className: "flex-1 rounded-xl bg-amber-300 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-200",
              children: [
                /* @__PURE__ */ jsx(Upload, { className: "mr-1.5 inline size-4" }),
                "Importer"
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setShowImport(false),
              className: "flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-medium text-slate-700 dark:border-white/10 dark:text-slate-300",
              children: "Annuler"
            }
          )
        ] })
      ] })
    ] }) }),
    showTransferDepot && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: "Transférer vers un autre dépôt" }),
        /* @__PURE__ */ jsx("button", { onClick: () => setShowTransferDepot(false), className: "rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200", children: /* @__PURE__ */ jsx(X, { className: "size-5" }) })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleTransferDepot, className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Dépôt destination *" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: transferDepotForm.data.target_depot_id,
              onChange: (e) => transferDepotForm.setData("target_depot_id", e.target.value),
              className: "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none",
              required: true,
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "-- Sélectionner un dépôt --" }),
                otherDepots.map((d) => /* @__PURE__ */ jsx("option", { value: d.id, children: d.name }, d.id))
              ]
            }
          ),
          transferDepotForm.errors.target_depot_id && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-rose-500", children: transferDepotForm.errors.target_depot_id })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-slate-700 dark:text-slate-300", children: "Produits *" }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => transferDepotForm.setData("items", [...transferDepotForm.data.items, { product_id: "", quantity: "1" }]),
                className: "inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-500 dark:text-amber-400",
                children: [
                  /* @__PURE__ */ jsx(Plus, { className: "size-3.5" }),
                  "Ajouter un produit"
                ]
              }
            )
          ] }),
          transferDepotForm.data.items.map((item, index) => {
            const depotProd = products.find((p) => String(p.product_id) === item.product_id);
            return /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-800/50", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-2", children: [
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    value: item.product_id,
                    onChange: (e) => {
                      const newItems = [...transferDepotForm.data.items];
                      newItems[index] = { ...newItems[index], product_id: e.target.value };
                      transferDepotForm.setData("items", newItems);
                    },
                    className: "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none",
                    required: true,
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "", children: "-- Produit --" }),
                      products.map((p) => /* @__PURE__ */ jsxs("option", { value: p.product_id, disabled: p.quantity <= 0, children: [
                        p.product_name,
                        " (stock: ",
                        p.quantity,
                        ")"
                      ] }, p.product_id))
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "number",
                      min: "1",
                      max: depotProd?.quantity ?? void 0,
                      value: item.quantity,
                      onChange: (e) => {
                        const newItems = [...transferDepotForm.data.items];
                        newItems[index] = { ...newItems[index], quantity: e.target.value };
                        transferDepotForm.setData("items", newItems);
                      },
                      className: "w-24 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none",
                      placeholder: "Qté",
                      required: true
                    }
                  ),
                  depotProd && /* @__PURE__ */ jsxs("span", { className: "text-xs text-slate-500 dark:text-slate-400", children: [
                    "/ ",
                    depotProd.quantity,
                    " disponible",
                    depotProd.quantity > 1 ? "s" : ""
                  ] })
                ] }),
                transferDepotForm.errors[`items.${index}.quantity`] && /* @__PURE__ */ jsx("p", { className: "text-xs text-rose-500", children: transferDepotForm.errors[`items.${index}.quantity`] })
              ] }),
              transferDepotForm.data.items.length > 1 && /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    const newItems = transferDepotForm.data.items.filter((_, i) => i !== index);
                    transferDepotForm.setData("items", newItems);
                  },
                  className: "mt-1 rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-400/10",
                  children: /* @__PURE__ */ jsx(X, { className: "size-4" })
                }
              )
            ] }, index);
          })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Notes" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              value: transferDepotForm.data.notes,
              onChange: (e) => transferDepotForm.setData("notes", e.target.value),
              rows: 2,
              className: "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none",
              placeholder: "Optionnel..."
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-3 pt-2", children: [
          /* @__PURE__ */ jsx("button", { type: "submit", disabled: transferDepotForm.processing, className: "flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50", children: transferDepotForm.processing ? "Transfert..." : `Transférer${transferDepotForm.data.items.length > 1 ? ` (${transferDepotForm.data.items.length} produits)` : ""}` }),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setShowTransferDepot(false), className: "flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-medium text-slate-700 dark:border-white/10 dark:text-slate-300", children: "Annuler" })
        ] })
      ] })
    ] }) })
  ] });
}
export {
  Show as default
};
