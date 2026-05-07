import { jsxs, jsx } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { u as useForm, r as router3, H as Head_default, L as Link_default } from "../ssr.js";
import { Upload, Download, Plus, Search, X, FileSpreadsheet, LogOut, AlertTriangle, Layers, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { T as Table, b as TableBadge, c as TableActions, d as TableActionButton } from "./Table-Cvz7wd2g.js";
import { C as Currency } from "./Currency-BX_NSrIs.js";
import { u as useRoute } from "./route-C2Ac8FMA.js";
import { useState, useRef, useEffect } from "react";
import { C as ConfirmDeleteModal } from "./ConfirmDeleteModal-GTROztIR.js";
import { P as ProductImage } from "./ProductImage-5zmeiiH5.js";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
import "./Modal-BeSeEOS3.js";
import "@headlessui/react";
function ProductsIndex({ products, categories = [], shops = [], filters = {}, canCreateProduct = true, remainingProducts = -1 }) {
  const route = useRoute();
  const [showImportModal, setShowImportModal] = useState(false);
  const [search, setSearch] = useState(filters.search || "");
  const [categoryId, setCategoryId] = useState(filters.category_id || "");
  const [status, setStatus] = useState(filters.status || "");
  const fileInputRef = useRef(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, product: null });
  const [removeModal, setRemoveModal] = useState({ show: false, product: null });
  const [deleting, setDeleting] = useState(false);
  const { data, setData, post, processing, reset, errors } = useForm({
    file: null
  });
  const handleDelete = (product) => {
    setDeleteModal({ show: true, product });
  };
  const handleRemoveFromShop = (product) => {
    setRemoveModal({ show: true, product });
  };
  const confirmRemoveFromShop = () => {
    if (!removeModal.product) return;
    router3.patch(route("products.remove-from-shop", { product: removeModal.product.id }), {}, {
      onSuccess: () => setRemoveModal({ show: false, product: null })
    });
  };
  const confirmDelete = () => {
    if (!deleteModal.product) return;
    setDeleting(true);
    router3.delete(route("products.destroy", { product: deleteModal.product.id }), {
      onSuccess: () => {
        setDeleteModal({ show: false, product: null });
        setDeleting(false);
      },
      onError: () => setDeleting(false)
    });
  };
  const isLowStock = (product) => {
    if (!product.track_stock || !product.min_stock_alert) return false;
    return product.stock_quantity <= product.min_stock_alert;
  };
  const clearFilters = () => {
    setSearch("");
    setCategoryId("");
    setStatus("");
  };
  const handleImport = (e) => {
    e.preventDefault();
    if (!data.file) return;
    post(route("products.import"), {
      forceFormData: true,
      onSuccess: () => {
        setShowImportModal(false);
        reset();
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    });
  };
  const hasActiveFilters = search || categoryId || status;
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      router3.get(route("products.index"), {
        search: search || void 0,
        category_id: categoryId || void 0,
        status: status || void 0
      }, {
        preserveState: true,
        preserveScroll: true,
        replace: true
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [search, categoryId, status]);
  const columns = [
    {
      key: "barcode",
      label: "Code-barres",
      render: (product) => product.barcode ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-0.5", children: [
        /* @__PURE__ */ jsx("div", { className: "flex w-full h-6 justify-center", children: product.barcode.split("").map((digit, i) => {
          const d = parseInt(digit);
          return /* @__PURE__ */ jsxs("div", { className: "flex h-full", children: [
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "h-full bg-slate-700",
                style: { width: d % 2 === 0 ? "1px" : "2px" }
              }
            ),
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "h-full",
                style: { width: d % 3 === 0 ? "2px" : "1px" }
              }
            )
          ] }, i);
        }) }),
        /* @__PURE__ */ jsx("span", { className: "font-mono text-[10px] text-slate-500 tracking-wider", children: product.barcode })
      ] }) : /* @__PURE__ */ jsx("span", { className: "text-slate-500", children: "-" })
    },
    {
      key: "name",
      label: "Nom",
      render: (product) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(ProductImage, { src: product.image, name: product.name, thumbnailClass: "size-10" }),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
            isLowStock(product) && /* @__PURE__ */ jsx("span", { title: "Stock faible", children: /* @__PURE__ */ jsx(AlertTriangle, { className: "size-3.5 shrink-0 text-amber-400" }) }),
            /* @__PURE__ */ jsx("span", { className: "font-medium text-white truncate", children: product.name })
          ] }),
          product.sku && /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-500 font-mono", children: product.sku })
        ] })
      ] })
    },
    {
      key: "category",
      label: "Catégorie",
      render: (product) => product.category?.name || "-"
    },
    {
      key: "selling_price",
      label: "Prix",
      align: "right",
      render: (product) => /* @__PURE__ */ jsx(Currency, { amount: product.selling_price })
    },
    {
      key: "stock_quantity",
      label: "Stock",
      align: "center",
      render: (product) => /* @__PURE__ */ jsx("span", { className: isLowStock(product) ? "text-amber-300 font-semibold" : "", children: product.stock_quantity })
    },
    {
      key: "is_active",
      label: "Statut",
      align: "center",
      render: (product) => /* @__PURE__ */ jsx(TableBadge, { variant: product.is_active ? "success" : "danger", children: product.is_active ? "Actif" : "Inactif" })
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (product) => /* @__PURE__ */ jsxs(TableActions, { children: [
        /* @__PURE__ */ jsx(Link_default, { href: route("products.variations.index", { product: product.id }), children: /* @__PURE__ */ jsxs(TableActionButton, { children: [
          /* @__PURE__ */ jsx(Layers, { className: "size-3.5" }),
          " Déclinaisons"
        ] }) }),
        /* @__PURE__ */ jsx(Link_default, { href: route("products.edit", { product: product.id }), children: /* @__PURE__ */ jsxs(TableActionButton, { children: [
          /* @__PURE__ */ jsx(Pencil, { className: "size-3.5" }),
          " Modifier"
        ] }) }),
        product.is_active && /* @__PURE__ */ jsxs(
          TableActionButton,
          {
            onClick: () => handleRemoveFromShop(product),
            children: [
              /* @__PURE__ */ jsx(LogOut, { className: "size-3.5" }),
              " Retirer boutique"
            ]
          }
        ),
        !product.is_active && /* @__PURE__ */ jsxs(
          TableActionButton,
          {
            variant: "success",
            onClick: () => router3.patch(route("products.restore-to-shop", { product: product.id })),
            children: [
              /* @__PURE__ */ jsx(RotateCcw, { className: "size-3.5" }),
              " Remettre en boutique"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          TableActionButton,
          {
            variant: "danger",
            onClick: () => handleDelete(product),
            children: [
              /* @__PURE__ */ jsx(Trash2, { className: "size-3.5" }),
              " Supprimer"
            ]
          }
        )
      ] })
    }
  ];
  return /* @__PURE__ */ jsxs(
    Authenticated,
    {
      header: /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-white", children: "Produits" }),
      children: [
        /* @__PURE__ */ jsx(Head_default, { title: "Produits" }),
        /* @__PURE__ */ jsxs("section", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-300", children: "Gérez votre catalogue de produits." }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => setShowImportModal(true),
                    className: "inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10",
                    children: [
                      /* @__PURE__ */ jsx(Upload, { className: "size-4" }),
                      "Importer"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "a",
                  {
                    href: route("products.export"),
                    className: "inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10",
                    children: [
                      /* @__PURE__ */ jsx(Download, { className: "size-4" }),
                      "Exporter"
                    ]
                  }
                )
              ] }),
              canCreateProduct ? /* @__PURE__ */ jsxs(
                Link_default,
                {
                  href: route("products.create"),
                  className: "inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200",
                  children: [
                    /* @__PURE__ */ jsx(Plus, { className: "size-4" }),
                    "Nouveau produit"
                  ]
                }
              ) : /* @__PURE__ */ jsxs("div", { className: "group relative", children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    disabled: true,
                    className: "inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-slate-600 px-4 py-2 text-sm font-semibold text-slate-400 opacity-60",
                    children: [
                      /* @__PURE__ */ jsx(Plus, { className: "size-4" }),
                      "Nouveau produit"
                    ]
                  }
                ),
                /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100", children: "Limite de produits atteinte. Passez à un plan supérieur." })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "rounded-lg border border-white/10 bg-white/5 p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center", children: [
            /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
              /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: search,
                  onChange: (e) => setSearch(e.target.value),
                  placeholder: "Rechercher par nom, SKU ou code-barres...",
                  className: "w-full rounded-lg border border-white/15 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:border-amber-300/50 focus:outline-none focus:ring-1 focus:ring-amber-300/50"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: categoryId,
                onChange: (e) => setCategoryId(e.target.value),
                className: "rounded-lg border border-white/15 bg-slate-800 px-3 py-2 text-sm text-white focus:border-amber-300/50 focus:outline-none focus:ring-1 focus:ring-amber-300/50",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "", children: "Toutes les catégories" }),
                  categories.map((category) => /* @__PURE__ */ jsx("option", { value: category.id, children: category.name }, category.id))
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: status,
                onChange: (e) => setStatus(e.target.value),
                className: "rounded-lg border border-white/15 bg-slate-800 px-3 py-2 text-sm text-white focus:border-amber-300/50 focus:outline-none focus:ring-1 focus:ring-amber-300/50",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "", children: "Tous les actifs" }),
                  /* @__PURE__ */ jsx("option", { value: "active", children: "Actifs" }),
                  /* @__PURE__ */ jsx("option", { value: "inactive", children: "Retirés de la boutique" }),
                  /* @__PURE__ */ jsx("option", { value: "low_stock", children: "Stock faible" })
                ]
              }
            ),
            hasActiveFilters && /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: clearFilters,
                className: "inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10",
                children: [
                  /* @__PURE__ */ jsx(X, { className: "size-4" }),
                  "Effacer"
                ]
              }
            )
          ] }) }),
          hasActiveFilters && /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2 text-sm", children: [
            /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Filtres actifs :" }),
            search && /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-amber-300/20 px-2 py-0.5 text-amber-300", children: [
              'Recherche: "',
              search,
              '"',
              /* @__PURE__ */ jsx("button", { onClick: () => setSearch(""), children: /* @__PURE__ */ jsx(X, { className: "size-3" }) })
            ] }),
            categoryId && /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-amber-300/20 px-2 py-0.5 text-amber-300", children: [
              categories.find((c) => c.id.toString() === categoryId)?.name,
              /* @__PURE__ */ jsx("button", { onClick: () => setCategoryId(""), children: /* @__PURE__ */ jsx(X, { className: "size-3" }) })
            ] }),
            status && /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-amber-300/20 px-2 py-0.5 text-amber-300", children: [
              status === "active" ? "Actifs" : status === "inactive" ? "Inactifs" : "Stock faible",
              /* @__PURE__ */ jsx("button", { onClick: () => setStatus(""), children: /* @__PURE__ */ jsx(X, { className: "size-3" }) })
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            Table,
            {
              columns,
              data: products.data,
              emptyMessage: "Aucun produit trouvé. Créez-en un pour commencer."
            }
          ),
          products.last_page > 1 && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              "Page ",
              products.current_page,
              " sur ",
              products.last_page,
              " • Total: ",
              products.total,
              " produits"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
              products.current_page > 1 && /* @__PURE__ */ jsx(
                Link_default,
                {
                  href: route("products.index", {
                    page: products.current_page - 1,
                    search: search || void 0,
                    category_id: categoryId || void 0,
                    status: status || void 0
                  }),
                  className: "rounded-lg border border-white/15 px-3 py-1.5 hover:bg-white/10",
                  children: "Précédent"
                }
              ),
              products.current_page < products.last_page && /* @__PURE__ */ jsx(
                Link_default,
                {
                  href: route("products.index", {
                    page: products.current_page + 1,
                    search: search || void 0,
                    category_id: categoryId || void 0,
                    status: status || void 0
                  }),
                  className: "rounded-lg border border-white/15 px-3 py-1.5 hover:bg-white/10",
                  children: "Suivant"
                }
              )
            ] })
          ] })
        ] }),
        showImportModal && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-lg rounded-xl border border-white/10 bg-slate-900 p-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-white", children: "Importer des produits" }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setShowImportModal(false),
                className: "rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white",
                children: /* @__PURE__ */ jsx(X, { className: "size-5" })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("form", { onSubmit: handleImport, className: "space-y-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-white/10 bg-white/5 p-4", children: [
              /* @__PURE__ */ jsxs("h3", { className: "mb-2 flex items-center gap-2 font-medium text-white", children: [
                /* @__PURE__ */ jsx(FileSpreadsheet, { className: "size-5 text-amber-300" }),
                "Instructions"
              ] }),
              /* @__PURE__ */ jsxs("ul", { className: "space-y-1 text-sm text-slate-300", children: [
                /* @__PURE__ */ jsx("li", { children: "• Téléchargez d'abord le modèle Excel" }),
                /* @__PURE__ */ jsx("li", { children: "• Remplissez vos produits en suivant le format" }),
                /* @__PURE__ */ jsx("li", { children: "• Les colonnes obligatoires sont : Nom et Prix de vente" }),
                /* @__PURE__ */ jsx("li", { children: "• Les produits existants (même SKU/code-barres) seront mis à jour" })
              ] }),
              /* @__PURE__ */ jsxs(
                "a",
                {
                  href: route("products.template"),
                  className: "mt-3 inline-flex items-center gap-2 text-sm font-medium text-amber-300 hover:text-amber-200",
                  children: [
                    /* @__PURE__ */ jsx(Download, { className: "size-4" }),
                    "Télécharger le modèle Excel"
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "mb-2 block text-sm font-medium text-slate-300", children: "Fichier Excel (.xlsx, .xls, .csv)" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  ref: fileInputRef,
                  type: "file",
                  accept: ".xlsx,.xls,.csv",
                  onChange: (e) => setData("file", e.target.files?.[0] || null),
                  className: "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-amber-300 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-950 hover:file:bg-amber-200"
                }
              ),
              errors.file && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.file })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-3", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setShowImportModal(false),
                  className: "rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-300 hover:bg-white/10",
                  children: "Annuler"
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "submit",
                  disabled: !data.file || processing,
                  className: "inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:opacity-50",
                  children: [
                    /* @__PURE__ */ jsx(Upload, { className: "size-4" }),
                    processing ? "Importation..." : "Importer"
                  ]
                }
              )
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx(
          ConfirmDeleteModal,
          {
            show: deleteModal.show,
            onClose: () => setDeleteModal({ show: false, product: null }),
            onConfirm: confirmDelete,
            message: `Êtes-vous sûr de vouloir supprimer le produit "${deleteModal.product?.name}" ?`,
            processing: deleting
          }
        ),
        removeModal.show && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "flex size-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-400/10", children: /* @__PURE__ */ jsx(LogOut, { className: "size-5 text-amber-600 dark:text-amber-400" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "font-semibold text-slate-900 dark:text-white", children: "Retirer de la boutique" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: removeModal.product?.name })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "mb-6 text-sm text-slate-600 dark:text-slate-300", children: [
            "Ce produit sera ",
            /* @__PURE__ */ jsx("strong", { children: "désactivé" }),
            " dans la boutique (stock remis à 0) mais restera disponible dans les dépôts. Il pourra être réactivé depuis la fiche produit."
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: confirmRemoveFromShop,
                className: "flex-1 rounded-xl bg-amber-300 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-200",
                children: "Confirmer"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setRemoveModal({ show: false, product: null }),
                className: "flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-medium text-slate-700 dark:border-white/10 dark:text-slate-300",
                children: "Annuler"
              }
            )
          ] })
        ] }) })
      ]
    }
  );
}
export {
  ProductsIndex as default
};
