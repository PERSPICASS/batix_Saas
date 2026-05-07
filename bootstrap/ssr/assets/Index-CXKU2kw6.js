import { jsxs, jsx } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { u as useForm, H as Head_default, r as router3 } from "../ssr.js";
import { Plus, Tags, ChevronDown, ChevronRight, Pencil, Trash2, X } from "lucide-react";
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
function ProductAttributesIndex({ attributes }) {
  const route = useRoute();
  const [expandedAttributes, setExpandedAttributes] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState(null);
  const [addingValueTo, setAddingValueTo] = useState(null);
  const [editingValue, setEditingValue] = useState(null);
  const [deleteAttrModal, setDeleteAttrModal] = useState({ show: false, attribute: null });
  const [deleteValueModal, setDeleteValueModal] = useState({ show: false, value: null });
  const [deleting, setDeleting] = useState(false);
  const toggleExpanded = (id) => {
    setExpandedAttributes(
      (prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
  const addForm = useForm({
    name: "",
    order: 0
  });
  const editForm = useForm({
    name: "",
    order: 0
  });
  const valueForm = useForm({
    value: "",
    order: 0
  });
  const editValueForm = useForm({
    value: "",
    order: 0
  });
  const handleAddAttribute = (e) => {
    e.preventDefault();
    addForm.post(route("product-attributes.store"), {
      onSuccess: () => {
        setShowAddModal(false);
        addForm.reset();
      }
    });
  };
  const handleEditAttribute = (e) => {
    e.preventDefault();
    if (!editingAttribute) return;
    editForm.patch(route("product-attributes.update", { attribute: editingAttribute.id }), {
      onSuccess: () => {
        setEditingAttribute(null);
        editForm.reset();
      }
    });
  };
  const handleDeleteAttribute = (attribute) => {
    setDeleteAttrModal({ show: true, attribute });
  };
  const confirmDeleteAttribute = () => {
    if (!deleteAttrModal.attribute) return;
    setDeleting(true);
    router3.delete(route("product-attributes.destroy", { attribute: deleteAttrModal.attribute.id }), {
      onSuccess: () => {
        setDeleteAttrModal({ show: false, attribute: null });
        setDeleting(false);
      },
      onError: () => setDeleting(false)
    });
  };
  const handleAddValue = (e) => {
    e.preventDefault();
    if (!addingValueTo) return;
    valueForm.post(route("product-attributes.add-value", { attribute: addingValueTo.id }), {
      onSuccess: () => {
        setAddingValueTo(null);
        valueForm.reset();
      }
    });
  };
  const handleEditValue = (e) => {
    e.preventDefault();
    if (!editingValue) return;
    editValueForm.patch(route("product-attributes.update-value", { value: editingValue.value.id }), {
      onSuccess: () => {
        setEditingValue(null);
        editValueForm.reset();
      }
    });
  };
  const handleDeleteValue = (value) => {
    setDeleteValueModal({ show: true, value });
  };
  const confirmDeleteValue = () => {
    if (!deleteValueModal.value) return;
    setDeleting(true);
    router3.delete(route("product-attributes.destroy-value", { value: deleteValueModal.value.id }), {
      onSuccess: () => {
        setDeleteValueModal({ show: false, value: null });
        setDeleting(false);
      },
      onError: () => setDeleting(false)
    });
  };
  const openEditAttribute = (attribute) => {
    editForm.setData({ name: attribute.name, order: attribute.order });
    setEditingAttribute(attribute);
  };
  const openEditValue = (attribute, value) => {
    editValueForm.setData({ value: value.value, order: value.order });
    setEditingValue({ attribute, value });
  };
  return /* @__PURE__ */ jsxs(Authenticated, { header: /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-white", children: "Attributs de produits" }), children: [
    /* @__PURE__ */ jsx(Head_default, { title: "Attributs de produits" }),
    /* @__PURE__ */ jsxs("section", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-300", children: "Gérez les attributs de variation de vos produits (couleur, taille, poids, etc.)" }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setShowAddModal(true),
            className: "inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200",
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "size-4" }),
              " Nouvel attribut"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "rounded-lg border border-slate-700 bg-slate-800/50 overflow-hidden", children: attributes.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-12 text-slate-400", children: [
        /* @__PURE__ */ jsx(Tags, { className: "size-12 mb-4 opacity-50" }),
        /* @__PURE__ */ jsx("p", { className: "text-lg font-medium", children: "Aucun attribut" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm", children: "Créez des attributs pour gérer les variations de vos produits." })
      ] }) : /* @__PURE__ */ jsx("div", { className: "divide-y divide-slate-700", children: attributes.map((attribute) => /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 hover:bg-slate-700/30", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => toggleExpanded(attribute.id),
              className: "flex items-center gap-3 flex-1",
              children: [
                expandedAttributes.includes(attribute.id) ? /* @__PURE__ */ jsx(ChevronDown, { className: "size-5 text-slate-400" }) : /* @__PURE__ */ jsx(ChevronRight, { className: "size-5 text-slate-400" }),
                /* @__PURE__ */ jsxs("div", { className: "text-left", children: [
                  /* @__PURE__ */ jsx("h3", { className: "font-medium text-white", children: attribute.name }),
                  /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-400", children: [
                    attribute.values.length,
                    " valeur",
                    attribute.values.length !== 1 ? "s" : ""
                  ] })
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setAddingValueTo(attribute),
                className: "p-2 text-slate-400 hover:text-amber-300 hover:bg-slate-700 rounded",
                title: "Ajouter une valeur",
                children: /* @__PURE__ */ jsx(Plus, { className: "size-4" })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => openEditAttribute(attribute),
                className: "p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded",
                title: "Modifier",
                children: /* @__PURE__ */ jsx(Pencil, { className: "size-4" })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => handleDeleteAttribute(attribute),
                className: "p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded",
                title: "Supprimer",
                children: /* @__PURE__ */ jsx(Trash2, { className: "size-4" })
              }
            )
          ] })
        ] }),
        expandedAttributes.includes(attribute.id) && /* @__PURE__ */ jsx("div", { className: "bg-slate-800/80 border-t border-slate-700 p-4 pl-12", children: attribute.values.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 italic", children: "Aucune valeur définie. Ajoutez des valeurs pour cet attribut." }) : /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: attribute.values.map((value) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: "group inline-flex items-center gap-1 rounded-full bg-slate-700 px-3 py-1.5 text-sm",
            children: [
              /* @__PURE__ */ jsx("span", { className: "text-white", children: value.value }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => openEditValue(attribute, value),
                  className: "ml-1 p-0.5 text-slate-400 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity",
                  children: /* @__PURE__ */ jsx(Pencil, { className: "size-3" })
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => handleDeleteValue(value),
                  className: "p-0.5 text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity",
                  children: /* @__PURE__ */ jsx(X, { className: "size-3" })
                }
              )
            ]
          },
          value.id
        )) }) })
      ] }, attribute.id)) }) })
    ] }),
    showAddModal && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md rounded-lg bg-slate-800 p-6 shadow-xl", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-white mb-4", children: "Nouvel attribut" }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleAddAttribute, className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-300 mb-1", children: "Nom de l'attribut" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: addForm.data.name,
              onChange: (e) => addForm.setData("name", e.target.value),
              placeholder: "Ex: Couleur, Taille, Poids...",
              className: "w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white placeholder-slate-400 focus:border-amber-400 focus:outline-none",
              autoFocus: true
            }
          ),
          addForm.errors.name && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: addForm.errors.name })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-3", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setShowAddModal(false),
              className: "px-4 py-2 text-sm text-slate-300 hover:text-white",
              children: "Annuler"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              disabled: addForm.processing,
              className: "rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50",
              children: "Créer"
            }
          )
        ] })
      ] })
    ] }) }),
    editingAttribute && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md rounded-lg bg-slate-800 p-6 shadow-xl", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-white mb-4", children: "Modifier l'attribut" }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleEditAttribute, className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-300 mb-1", children: "Nom de l'attribut" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: editForm.data.name,
              onChange: (e) => editForm.setData("name", e.target.value),
              className: "w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white placeholder-slate-400 focus:border-amber-400 focus:outline-none",
              autoFocus: true
            }
          ),
          editForm.errors.name && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: editForm.errors.name })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-3", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setEditingAttribute(null),
              className: "px-4 py-2 text-sm text-slate-300 hover:text-white",
              children: "Annuler"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              disabled: editForm.processing,
              className: "rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50",
              children: "Enregistrer"
            }
          )
        ] })
      ] })
    ] }) }),
    addingValueTo && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md rounded-lg bg-slate-800 p-6 shadow-xl", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-white mb-4", children: [
        'Ajouter une valeur à "',
        addingValueTo.name,
        '"'
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleAddValue, className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-300 mb-1", children: "Valeur" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: valueForm.data.value,
              onChange: (e) => valueForm.setData("value", e.target.value),
              placeholder: "Ex: Rouge, XL, 500g...",
              className: "w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white placeholder-slate-400 focus:border-amber-400 focus:outline-none",
              autoFocus: true
            }
          ),
          valueForm.errors.value && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: valueForm.errors.value })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-3", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setAddingValueTo(null),
              className: "px-4 py-2 text-sm text-slate-300 hover:text-white",
              children: "Annuler"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              disabled: valueForm.processing,
              className: "rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50",
              children: "Ajouter"
            }
          )
        ] })
      ] })
    ] }) }),
    editingValue && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md rounded-lg bg-slate-800 p-6 shadow-xl", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-white mb-4", children: "Modifier la valeur" }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleEditValue, className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-300 mb-1", children: "Valeur" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: editValueForm.data.value,
              onChange: (e) => editValueForm.setData("value", e.target.value),
              className: "w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white placeholder-slate-400 focus:border-amber-400 focus:outline-none",
              autoFocus: true
            }
          ),
          editValueForm.errors.value && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: editValueForm.errors.value })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-3", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setEditingValue(null),
              className: "px-4 py-2 text-sm text-slate-300 hover:text-white",
              children: "Annuler"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              disabled: editValueForm.processing,
              className: "rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50",
              children: "Enregistrer"
            }
          )
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(
      ConfirmDeleteModal,
      {
        show: deleteAttrModal.show,
        onClose: () => setDeleteAttrModal({ show: false, attribute: null }),
        onConfirm: confirmDeleteAttribute,
        message: `Êtes-vous sûr de vouloir supprimer l'attribut "${deleteAttrModal.attribute?.name}" et toutes ses valeurs ?`,
        processing: deleting
      }
    ),
    /* @__PURE__ */ jsx(
      ConfirmDeleteModal,
      {
        show: deleteValueModal.show,
        onClose: () => setDeleteValueModal({ show: false, value: null }),
        onConfirm: confirmDeleteValue,
        message: `Êtes-vous sûr de vouloir supprimer la valeur "${deleteValueModal.value?.value}" ?`,
        processing: deleting
      }
    )
  ] });
}
export {
  ProductAttributesIndex as default
};
