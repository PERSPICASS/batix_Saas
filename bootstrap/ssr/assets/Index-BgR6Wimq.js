import { jsxs, jsx } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { u as useForm, H as Head_default, L as Link_default, r as router3 } from "../ssr.js";
import { Layers, Plus, X, ArrowLeft, Copy, Pencil, Trash2 } from "lucide-react";
import { T as Table, b as TableBadge, c as TableActions, d as TableActionButton } from "./Table-Cvz7wd2g.js";
import { C as Currency } from "./Currency-BX_NSrIs.js";
import { u as useRoute } from "./route-C2Ac8FMA.js";
import { useState } from "react";
import { C as ConfirmDeleteModal } from "./ConfirmDeleteModal-GTROztIR.js";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
import "./Modal-BeSeEOS3.js";
import "@headlessui/react";
function VariationsIndex({ product, variations }) {
  const route = useRoute();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVariation, setEditingVariation] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, variation: null });
  const [deleting, setDeleting] = useState(false);
  const addForm = useForm({
    name: "",
    purchase_price: product.purchase_price.toString(),
    selling_price: product.selling_price.toString(),
    stock_quantity: "0"
  });
  const editForm = useForm({
    name: "",
    purchase_price: "",
    selling_price: "",
    stock_quantity: "",
    is_active: true
  });
  const handleAddVariation = (e) => {
    e.preventDefault();
    addForm.post(route("products.variations.store", { product: product.id }), {
      onSuccess: () => {
        setShowAddModal(false);
        addForm.reset();
        addForm.setData({
          name: "",
          purchase_price: product.purchase_price.toString(),
          selling_price: product.selling_price.toString(),
          stock_quantity: "0"
        });
      }
    });
  };
  const handleEditVariation = (e) => {
    e.preventDefault();
    if (!editingVariation) return;
    editForm.patch(route("products.variations.update", { product: product.id, variation: editingVariation.id }), {
      onSuccess: () => {
        setEditingVariation(null);
        editForm.reset();
      }
    });
  };
  const handleDeleteVariation = (variation) => {
    setDeleteModal({ show: true, variation });
  };
  const confirmDelete = () => {
    if (!deleteModal.variation) return;
    setDeleting(true);
    router3.delete(route("products.variations.destroy", { product: product.id, variation: deleteModal.variation.id }), {
      onSuccess: () => {
        setDeleteModal({ show: false, variation: null });
        setDeleting(false);
      },
      onError: () => setDeleting(false)
    });
  };
  const openEditModal = (variation) => {
    editForm.setData({
      name: variation.name,
      purchase_price: variation.purchase_price.toString(),
      selling_price: variation.selling_price.toString(),
      stock_quantity: variation.stock_quantity.toString(),
      is_active: variation.is_active
    });
    setEditingVariation(variation);
  };
  const duplicateVariation = (variation) => {
    addForm.setData({
      name: variation.name + " (copie)",
      purchase_price: variation.purchase_price.toString(),
      selling_price: variation.selling_price.toString(),
      stock_quantity: "0"
    });
    setShowAddModal(true);
  };
  const nameSuggestions = [
    `${product.name} - 1L`,
    `${product.name} - 5L`,
    `${product.name} - 10L`,
    `${product.name} - Petit`,
    `${product.name} - Moyen`,
    `${product.name} - Grand`
  ];
  const columns = [
    {
      key: "name",
      label: "Déclinaison",
      render: (variation) => /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "font-medium text-white", children: variation.name }),
        variation.sku && /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-500 font-mono", children: variation.sku })
      ] })
    },
    {
      key: "purchase_price",
      label: "Prix achat",
      align: "right",
      render: (variation) => /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: /* @__PURE__ */ jsx(Currency, { amount: variation.purchase_price }) })
    },
    {
      key: "selling_price",
      label: "Prix vente",
      align: "right",
      render: (variation) => /* @__PURE__ */ jsx(Currency, { amount: variation.selling_price })
    },
    {
      key: "stock_quantity",
      label: "Stock",
      align: "center",
      render: (variation) => /* @__PURE__ */ jsx("span", { className: variation.stock_quantity <= 0 ? "text-red-400" : "", children: variation.stock_quantity })
    },
    {
      key: "is_active",
      label: "Statut",
      align: "center",
      render: (variation) => /* @__PURE__ */ jsx(TableBadge, { variant: variation.is_active ? "success" : "danger", children: variation.is_active ? "Actif" : "Inactif" })
    },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (variation) => /* @__PURE__ */ jsxs(TableActions, { children: [
        /* @__PURE__ */ jsx(TableActionButton, { onClick: () => duplicateVariation(variation), children: /* @__PURE__ */ jsx(Copy, { className: "size-3.5" }) }),
        /* @__PURE__ */ jsx(TableActionButton, { onClick: () => openEditModal(variation), children: /* @__PURE__ */ jsx(Pencil, { className: "size-3.5" }) }),
        /* @__PURE__ */ jsx(
          TableActionButton,
          {
            variant: "danger",
            onClick: () => handleDeleteVariation(variation),
            children: /* @__PURE__ */ jsx(Trash2, { className: "size-3.5" })
          }
        )
      ] })
    }
  ];
  const totalStock = variations.reduce((sum, v) => sum + v.stock_quantity, 0);
  return /* @__PURE__ */ jsxs(
    Authenticated,
    {
      header: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(
          Link_default,
          {
            href: route("products.index"),
            className: "p-1.5 rounded-lg hover:bg-white/10 transition",
            title: "Retour aux produits",
            children: /* @__PURE__ */ jsx(ArrowLeft, { className: "size-5 text-slate-400" })
          }
        ),
        /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-white", children: "Déclinaisons" }) })
      ] }),
      children: [
        /* @__PURE__ */ jsx(Head_default, { title: `Déclinaisons - ${product.name}` }),
        /* @__PURE__ */ jsxs("section", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-slate-700 bg-gradient-to-r from-slate-800 to-slate-800/50 p-5", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                /* @__PURE__ */ jsx("div", { className: "flex size-14 items-center justify-center rounded-xl bg-amber-300/10 border border-amber-300/20", children: /* @__PURE__ */ jsx(Layers, { className: "size-7 text-amber-300" }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-white", children: product.name }),
                  /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-400", children: [
                    product.brand && /* @__PURE__ */ jsxs("span", { children: [
                      product.brand,
                      " • "
                    ] }),
                    product.category?.name || "Sans catégorie"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-white", children: /* @__PURE__ */ jsx(Currency, { amount: product.selling_price }) }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: "Prix de base" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-4 pt-4 border-t border-slate-700 grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-amber-300", children: variations.length }),
                /* @__PURE__ */ jsxs("div", { className: "text-xs text-slate-400", children: [
                  "Déclinaison",
                  variations.length !== 1 ? "s" : ""
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-emerald-400", children: totalStock }),
                /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-400", children: "Stock total" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setShowAddModal(true),
              className: "inline-flex items-center gap-2 rounded-lg bg-amber-300 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-200 transition shadow-lg shadow-amber-300/20",
              children: [
                /* @__PURE__ */ jsx(Plus, { className: "size-4" }),
                " Ajouter une déclinaison"
              ]
            }
          ) }),
          variations.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-dashed border-slate-600 bg-slate-800/30 p-12 text-center", children: [
            /* @__PURE__ */ jsx(Layers, { className: "size-12 mx-auto text-slate-600 mb-4" }),
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium text-white mb-2", children: "Aucune déclinaison" }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-400 mb-6 max-w-md mx-auto", children: "Ajoutez des déclinaisons pour gérer différentes versions de ce produit (ex: différentes tailles, couleurs ou contenances)." }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => setShowAddModal(true),
                className: "inline-flex items-center gap-2 rounded-lg bg-amber-300 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-200",
                children: [
                  /* @__PURE__ */ jsx(Plus, { className: "size-4" }),
                  " Créer ma première déclinaison"
                ]
              }
            )
          ] }) : /* @__PURE__ */ jsx(
            Table,
            {
              columns,
              data: variations
            }
          )
        ] }),
        showAddModal && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md rounded-xl bg-slate-800 shadow-2xl overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-5 border-b border-slate-700", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-white", children: "Nouvelle déclinaison" }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setShowAddModal(false),
                className: "p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700",
                children: /* @__PURE__ */ jsx(X, { className: "size-5" })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("form", { onSubmit: handleAddVariation, className: "p-5 space-y-5", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-300 mb-2", children: "Nom de la déclinaison" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: addForm.data.name,
                  onChange: (e) => addForm.setData("name", e.target.value),
                  placeholder: `Ex: ${product.name} - 5L`,
                  className: "w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20",
                  autoFocus: true
                }
              ),
              /* @__PURE__ */ jsx("div", { className: "mt-2 flex flex-wrap gap-1.5", children: nameSuggestions.slice(0, 3).map((suggestion, i) => /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => addForm.setData("name", suggestion),
                  className: "text-xs px-2 py-1 rounded bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-600 transition",
                  children: suggestion.replace(product.name + " - ", "")
                },
                i
              )) }),
              addForm.errors.name && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: addForm.errors.name })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-300 mb-2", children: "Prix d'achat" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    step: "1",
                    value: addForm.data.purchase_price,
                    onChange: (e) => addForm.setData("purchase_price", e.target.value),
                    className: "w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-300 mb-2", children: "Prix de vente" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    step: "1",
                    value: addForm.data.selling_price,
                    onChange: (e) => addForm.setData("selling_price", e.target.value),
                    className: "w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-300 mb-2", children: "Stock initial" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  value: addForm.data.stock_quantity,
                  onChange: (e) => addForm.setData("stock_quantity", e.target.value),
                  className: "w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-3 pt-2", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setShowAddModal(false),
                  className: "flex-1 px-4 py-3 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition",
                  children: "Annuler"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "submit",
                  disabled: addForm.processing || !addForm.data.name,
                  className: "flex-1 rounded-lg bg-amber-300 px-4 py-3 font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50 transition",
                  children: addForm.processing ? "Création..." : "Créer"
                }
              )
            ] })
          ] })
        ] }) }),
        editingVariation && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md rounded-xl bg-slate-800 shadow-2xl overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-5 border-b border-slate-700", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-white", children: "Modifier" }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setEditingVariation(null),
                className: "p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700",
                children: /* @__PURE__ */ jsx(X, { className: "size-5" })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("form", { onSubmit: handleEditVariation, className: "p-5 space-y-5", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-300 mb-2", children: "Nom" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: editForm.data.name,
                  onChange: (e) => editForm.setData("name", e.target.value),
                  className: "w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-300 mb-2", children: "Prix d'achat" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    step: "1",
                    value: editForm.data.purchase_price,
                    onChange: (e) => editForm.setData("purchase_price", e.target.value),
                    className: "w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-300 mb-2", children: "Prix de vente" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    step: "1",
                    value: editForm.data.selling_price,
                    onChange: (e) => editForm.setData("selling_price", e.target.value),
                    className: "w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-300 mb-2", children: "Stock" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  value: editForm.data.stock_quantity,
                  onChange: (e) => editForm.setData("stock_quantity", e.target.value),
                  className: "w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-3 cursor-pointer", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "checkbox",
                  checked: editForm.data.is_active,
                  onChange: (e) => editForm.setData("is_active", e.target.checked),
                  className: "size-5 rounded border-slate-600 bg-slate-700 text-amber-300 focus:ring-amber-300 focus:ring-offset-0"
                }
              ),
              /* @__PURE__ */ jsx("span", { className: "text-sm text-slate-300", children: "Déclinaison active (visible à la vente)" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-3 pt-2", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setEditingVariation(null),
                  className: "flex-1 px-4 py-3 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition",
                  children: "Annuler"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "submit",
                  disabled: editForm.processing,
                  className: "flex-1 rounded-lg bg-amber-300 px-4 py-3 font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50 transition",
                  children: editForm.processing ? "Enregistrement..." : "Enregistrer"
                }
              )
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx(
          ConfirmDeleteModal,
          {
            show: deleteModal.show,
            onClose: () => setDeleteModal({ show: false, variation: null }),
            onConfirm: confirmDelete,
            message: `Êtes-vous sûr de vouloir supprimer la déclinaison "${deleteModal.variation?.name}" ?`,
            processing: deleting
          }
        )
      ]
    }
  );
}
export {
  VariationsIndex as default
};
