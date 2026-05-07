import { jsxs, jsx } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { c as TableActions, d as TableActionButton } from "./Table-Cvz7wd2g.js";
import { H as Head_default, r as router3 } from "../ssr.js";
import { TrendingDown, Plus, Calendar, Search, X, SlidersHorizontal, RotateCcw, Receipt, FileText, Pencil, Trash2, Upload } from "lucide-react";
import { C as Currency } from "./Currency-BX_NSrIs.js";
import { u as useRoute } from "./route-C2Ac8FMA.js";
import { useState, useRef } from "react";
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
const CATEGORIES = [
  "Loyer",
  "Salaires",
  "Transport",
  "Fournitures",
  "Entretien",
  "Électricité / Eau",
  "Téléphone / Internet",
  "Publicité",
  "Taxes & Impôts",
  "Remboursement",
  "Autre"
];
const PAYMENT_METHODS = {
  cash: "Espèces",
  card: "Carte",
  transfer: "Virement",
  check: "Chèque",
  mobile: "Mobile Money"
};
const CATEGORY_COLORS = {
  "Loyer": "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  "Salaires": "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  "Transport": "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  "Fournitures": "bg-purple-500/20 text-purple-300 border border-purple-500/30",
  "Entretien": "bg-orange-500/20 text-orange-300 border border-orange-500/30",
  "Électricité / Eau": "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30",
  "Téléphone / Internet": "bg-sky-500/20 text-sky-300 border border-sky-500/30",
  "Publicité": "bg-pink-500/20 text-pink-300 border border-pink-500/30",
  "Taxes & Impôts": "bg-red-500/20 text-red-300 border border-red-500/30",
  "Remboursement": "bg-teal-500/20 text-teal-300 border border-teal-500/30",
  "Autre": "bg-slate-500/20 text-slate-300 border border-slate-500/30"
};
function ExpensesIndex({
  expenses,
  totalAmount,
  monthTotal,
  currency,
  filters
}) {
  const route = useRoute();
  const [search, setSearch] = useState(filters.search ?? "");
  const [category, setCategory] = useState(filters.category ?? "");
  const [paymentMethod, setPaymentMethod] = useState(filters.payment_method ?? "");
  const [dateFrom, setDateFrom] = useState(filters.date_from ?? "");
  const [dateTo, setDateTo] = useState(filters.date_to ?? "");
  const [showFilters, setShowFilters] = useState(false);
  const activeFilterCount = [category, paymentMethod, dateFrom, dateTo].filter(Boolean).length;
  const applyFilters = () => {
    router3.get(route("expenses.index"), {
      ...search ? { search } : {},
      ...category ? { category } : {},
      ...paymentMethod ? { payment_method: paymentMethod } : {},
      ...dateFrom ? { date_from: dateFrom } : {},
      ...dateTo ? { date_to: dateTo } : {}
    }, { preserveState: true, replace: true });
  };
  const resetFilters = () => {
    setSearch("");
    setCategory("");
    setPaymentMethod("");
    setDateFrom("");
    setDateTo("");
    router3.get(route("expenses.index"), {}, { preserveState: false });
  };
  const emptyForm = {
    title: "",
    amount: "",
    category: "Autre",
    expense_date: "",
    payment_method: "",
    reference: "",
    notes: "",
    receipt: null
  };
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const receiptRef = useRef(null);
  const [receiptName, setReceiptName] = useState("");
  const openCreate = () => {
    setForm({ ...emptyForm });
    setFormErrors({});
    setReceiptName("");
    setCreateOpen(true);
  };
  const closeCreate = () => {
    setCreateOpen(false);
    setReceiptName("");
  };
  const handleCreate = (e) => {
    e.preventDefault();
    setSubmitting(true);
    const data = new FormData();
    data.append("title", form.title);
    data.append("amount", form.amount);
    data.append("category", form.category);
    data.append("expense_date", form.expense_date);
    if (form.payment_method) data.append("payment_method", form.payment_method);
    if (form.reference) data.append("reference", form.reference);
    if (form.notes) data.append("notes", form.notes);
    if (form.receipt) data.append("receipt", form.receipt);
    router3.post(route("expenses.store"), data, {
      forceFormData: true,
      onSuccess: () => {
        setSubmitting(false);
        closeCreate();
      },
      onError: (errors) => {
        setFormErrors(errors);
        setSubmitting(false);
      }
    });
  };
  const [editOpen, setEditOpen] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [editForm, setEditForm] = useState({ ...emptyForm });
  const [editErrors, setEditErrors] = useState({});
  const [editReceiptName, setEditReceiptName] = useState("");
  const editReceiptRef = useRef(null);
  const openEdit = (expense) => {
    setEditExpense(expense);
    setEditForm({
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      expense_date: expense.expense_date,
      payment_method: expense.payment_method ?? "",
      reference: expense.reference ?? "",
      notes: expense.notes ?? "",
      receipt: null
    });
    setEditErrors({});
    setEditReceiptName("");
    setEditOpen(true);
  };
  const closeEdit = () => {
    setEditOpen(false);
    setEditExpense(null);
    setEditReceiptName("");
  };
  const handleEdit = (e) => {
    e.preventDefault();
    if (!editExpense) return;
    setSubmitting(true);
    const data = new FormData();
    data.append("_method", "PATCH");
    data.append("title", editForm.title);
    data.append("amount", editForm.amount);
    data.append("category", editForm.category);
    data.append("expense_date", editForm.expense_date);
    if (editForm.payment_method) data.append("payment_method", editForm.payment_method);
    if (editForm.reference) data.append("reference", editForm.reference);
    if (editForm.notes) data.append("notes", editForm.notes);
    if (editForm.receipt) data.append("receipt", editForm.receipt);
    router3.post(route("expenses.update", { expense: editExpense.id }), data, {
      forceFormData: true,
      onSuccess: () => {
        setSubmitting(false);
        closeEdit();
      },
      onError: (errors) => {
        setEditErrors(errors);
        setSubmitting(false);
      }
    });
  };
  const [deleteModal, setDeleteModal] = useState({ show: false, expense: null });
  const [deleting, setDeleting] = useState(false);
  const handleDelete = () => {
    if (!deleteModal.expense) return;
    setDeleting(true);
    router3.delete(route("expenses.destroy", { expense: deleteModal.expense.id }), {
      onSuccess: () => {
        setDeleting(false);
        setDeleteModal({ show: false, expense: null });
      },
      onFinish: () => setDeleting(false)
    });
  };
  return /* @__PURE__ */ jsxs(Authenticated, { children: [
    /* @__PURE__ */ jsx(Head_default, { title: "Dépenses" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(TrendingDown, { className: "size-6 text-red-400" }),
            "Dépenses"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-500 dark:text-slate-400", children: "Gérez les dépenses de votre boutique" })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: openCreate,
            className: "inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-amber-300 transition-colors",
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "size-4" }),
              "Nouvelle dépense"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-800/60", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-red-500/10 p-2", children: /* @__PURE__ */ jsx(TrendingDown, { className: "size-5 text-red-400" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: "Total (filtre actif)" }),
            /* @__PURE__ */ jsx("p", { className: "text-xl font-bold text-slate-900 dark:text-white", children: /* @__PURE__ */ jsx(Currency, { amount: totalAmount }) })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-800/60", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-orange-500/10 p-2", children: /* @__PURE__ */ jsx(Calendar, { className: "size-5 text-orange-400" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: "Ce mois-ci" }),
            /* @__PURE__ */ jsx("p", { className: "text-xl font-bold text-slate-900 dark:text-white", children: /* @__PURE__ */ jsx(Currency, { amount: monthTotal }) })
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "Rechercher par titre, référence...",
                value: search,
                onChange: (e) => setSearch(e.target.value),
                onKeyDown: (e) => e.key === "Enter" && applyFilters(),
                className: "w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 dark:border-white/10 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
              }
            ),
            search && /* @__PURE__ */ jsx("button", { onClick: () => {
              setSearch("");
            }, className: "absolute right-3 top-1/2 -translate-y-1/2", children: /* @__PURE__ */ jsx(X, { className: "size-4 text-slate-400 hover:text-slate-600" }) })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: applyFilters,
              className: "rounded-lg bg-amber-400 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-amber-300 transition-colors",
              children: "Rechercher"
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setShowFilters((v) => !v),
              className: `inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${showFilters ? "border-amber-400 bg-amber-400/10 text-amber-400" : "border-slate-300 text-slate-600 hover:border-amber-400 dark:border-white/10 dark:text-slate-300"}`,
              children: [
                /* @__PURE__ */ jsx(SlidersHorizontal, { className: "size-4" }),
                "Filtres",
                activeFilterCount > 0 && /* @__PURE__ */ jsx("span", { className: "rounded-full bg-amber-400 px-1.5 py-0.5 text-xs font-bold text-slate-900", children: activeFilterCount })
              ]
            }
          ),
          (activeFilterCount > 0 || search) && /* @__PURE__ */ jsx("button", { onClick: resetFilters, className: "inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-500 hover:text-red-500 dark:border-white/10 dark:text-slate-400", children: /* @__PURE__ */ jsx(RotateCcw, { className: "size-4" }) })
        ] }),
        showFilters && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-800/60 sm:grid-cols-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400", children: "Catégorie" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: category,
                onChange: (e) => setCategory(e.target.value),
                className: "w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 focus:border-amber-400 focus:outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "", children: "Toutes" }),
                  CATEGORIES.map((c) => /* @__PURE__ */ jsx("option", { value: c, children: c }, c))
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400", children: "Mode de paiement" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: paymentMethod,
                onChange: (e) => setPaymentMethod(e.target.value),
                className: "w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 focus:border-amber-400 focus:outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "", children: "Tous" }),
                  Object.entries(PAYMENT_METHODS).map(([k, v]) => /* @__PURE__ */ jsx("option", { value: k, children: v }, k))
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400", children: "Date début" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: dateFrom,
                onChange: (e) => setDateFrom(e.target.value),
                className: "w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 focus:border-amber-400 focus:outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400", children: "Date fin" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: dateTo,
                onChange: (e) => setDateTo(e.target.value),
                className: "w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 focus:border-amber-400 focus:outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "col-span-2 flex justify-end gap-2 sm:col-span-4", children: [
            /* @__PURE__ */ jsx("button", { onClick: resetFilters, className: "rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5", children: "Réinitialiser" }),
            /* @__PURE__ */ jsx("button", { onClick: applyFilters, className: "rounded-lg bg-amber-400 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-amber-300", children: "Appliquer" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-300", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left font-medium", children: "Date" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left font-medium", children: "Libellé" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left font-medium", children: "Catégorie" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left font-medium", children: "Mode paiement" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left font-medium", children: "Référence" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right font-medium", children: "Montant" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left font-medium", children: "Ajouté par" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right font-medium", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: expenses.data.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsxs("td", { colSpan: 8, className: "py-12 text-center text-slate-400 dark:text-slate-500", children: [
          /* @__PURE__ */ jsx(Receipt, { className: "mx-auto mb-3 size-10 opacity-40" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm", children: "Aucune dépense enregistrée" })
        ] }) }) : expenses.data.map((expense) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors", children: [
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 whitespace-nowrap", children: new Date(expense.expense_date).toLocaleDateString("fr-FR") }),
          /* @__PURE__ */ jsxs("td", { className: "px-4 py-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("span", { className: "font-medium text-slate-900 dark:text-white", children: expense.title }),
              expense.receipt && /* @__PURE__ */ jsx(
                "a",
                {
                  href: `/storage/${expense.receipt}`,
                  target: "_blank",
                  rel: "noopener noreferrer",
                  title: "Voir le justificatif",
                  className: "text-amber-400 hover:text-amber-300",
                  children: /* @__PURE__ */ jsx(FileText, { className: "size-4" })
                }
              )
            ] }),
            expense.notes && /* @__PURE__ */ jsx("p", { className: "mt-0.5 text-xs text-slate-400 dark:text-slate-500 truncate max-w-xs", children: expense.notes })
          ] }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx("span", { className: `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[expense.category] ?? "bg-slate-500/20 text-slate-300 border border-slate-500/30"}`, children: expense.category }) }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-slate-500 dark:text-slate-400", children: expense.payment_method ? PAYMENT_METHODS[expense.payment_method] ?? expense.payment_method : "—" }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-slate-500 dark:text-slate-400", children: expense.reference ?? "—" }),
          /* @__PURE__ */ jsxs("td", { className: "px-4 py-3 text-right font-semibold text-red-500 dark:text-red-400 whitespace-nowrap", children: [
            "− ",
            /* @__PURE__ */ jsx(Currency, { amount: parseFloat(expense.amount) })
          ] }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-slate-500 dark:text-slate-400", children: expense.user.name }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxs(TableActions, { children: [
            /* @__PURE__ */ jsxs(TableActionButton, { onClick: () => openEdit(expense), children: [
              /* @__PURE__ */ jsx(Pencil, { className: "size-3" }),
              " Modifier"
            ] }),
            /* @__PURE__ */ jsxs(TableActionButton, { variant: "danger", onClick: () => setDeleteModal({ show: true, expense }), children: [
              /* @__PURE__ */ jsx(Trash2, { className: "size-3" }),
              " Supprimer"
            ] })
          ] }) })
        ] }, expense.id)) })
      ] }) }) }),
      expenses.last_page > 1 && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: [
          expenses.total,
          " dépense",
          expenses.total > 1 ? "s" : "",
          " • Page ",
          expenses.current_page,
          "/",
          expenses.last_page
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex gap-1", children: expenses.links.map((link, i) => link.url ? /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => router3.get(link.url),
            dangerouslySetInnerHTML: { __html: link.label },
            className: `rounded px-3 py-1.5 text-sm transition-colors ${link.active ? "bg-amber-400 font-semibold text-slate-900" : "border border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"}`
          },
          i
        ) : /* @__PURE__ */ jsx(
          "span",
          {
            dangerouslySetInnerHTML: { __html: link.label },
            className: "rounded px-3 py-1.5 text-sm text-slate-400 dark:text-slate-600"
          },
          i
        )) })
      ] })
    ] }),
    createOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 max-h-[90vh] overflow-y-auto", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-5 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "flex size-9 items-center justify-center rounded-xl bg-red-500/10", children: /* @__PURE__ */ jsx(Receipt, { className: "size-4 text-red-400" }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: "Nouvelle dépense" })
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: closeCreate, className: "rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200", children: /* @__PURE__ */ jsx(X, { className: "size-5" }) })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleCreate, className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Libellé *" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: form.title,
              onChange: (e) => setForm((f) => ({ ...f, title: e.target.value })),
              placeholder: "Ex : Loyer boutique mars 2026",
              className: "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
            }
          ),
          formErrors.title && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-rose-500", children: formErrors.title })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Montant *" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                min: "0",
                step: "0.01",
                value: form.amount,
                onChange: (e) => setForm((f) => ({ ...f, amount: e.target.value })),
                placeholder: "0.00",
                className: "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
              }
            ),
            formErrors.amount && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-rose-500", children: formErrors.amount })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Date *" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: form.expense_date,
                onChange: (e) => setForm((f) => ({ ...f, expense_date: e.target.value })),
                className: "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
              }
            ),
            formErrors.expense_date && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-rose-500", children: formErrors.expense_date })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Catégorie *" }),
            /* @__PURE__ */ jsx(
              "select",
              {
                value: form.category,
                onChange: (e) => setForm((f) => ({ ...f, category: e.target.value })),
                className: "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none",
                children: CATEGORIES.map((c) => /* @__PURE__ */ jsx("option", { value: c, children: c }, c))
              }
            ),
            formErrors.category && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-rose-500", children: formErrors.category })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Mode de paiement" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: form.payment_method,
                onChange: (e) => setForm((f) => ({ ...f, payment_method: e.target.value })),
                className: "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "", children: "— Non précisé —" }),
                  Object.entries(PAYMENT_METHODS).map(([k, v]) => /* @__PURE__ */ jsx("option", { value: k, children: v }, k))
                ]
              }
            ),
            formErrors.payment_method && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-rose-500", children: formErrors.payment_method })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Référence / N° reçu" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: form.reference,
              onChange: (e) => setForm((f) => ({ ...f, reference: e.target.value })),
              placeholder: "Ex : REF-001",
              className: "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
            }
          ),
          formErrors.reference && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-rose-500", children: formErrors.reference })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Notes" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              rows: 2,
              value: form.notes,
              onChange: (e) => setForm((f) => ({ ...f, notes: e.target.value })),
              placeholder: "Détails supplémentaires...",
              className: "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-amber-300 focus:outline-none"
            }
          ),
          formErrors.notes && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-rose-500", children: formErrors.notes })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Justificatif (photo / PDF)" }),
          /* @__PURE__ */ jsxs(
            "div",
            {
              onClick: () => receiptRef.current?.click(),
              className: "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-center hover:border-amber-400 dark:border-white/15 dark:bg-slate-800/50 dark:hover:border-amber-400",
              children: [
                /* @__PURE__ */ jsx(Upload, { className: "size-5 text-slate-400" }),
                /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-500 dark:text-slate-400", children: receiptName || "Cliquez pour sélectionner (JPG, PNG, PDF – max 5 Mo)" })
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            "input",
            {
              ref: receiptRef,
              type: "file",
              accept: "image/*,.pdf",
              className: "hidden",
              onChange: (e) => {
                const file = e.target.files?.[0] ?? null;
                setForm((f) => ({ ...f, receipt: file }));
                setReceiptName(file?.name ?? "");
              }
            }
          ),
          formErrors.receipt && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-rose-500", children: formErrors.receipt })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-3 pt-1", children: [
          /* @__PURE__ */ jsx("button", { type: "button", onClick: closeCreate, className: "flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5", children: "Annuler" }),
          /* @__PURE__ */ jsx("button", { type: "submit", disabled: submitting, className: "flex-1 rounded-xl bg-amber-300 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50", children: submitting ? "Enregistrement..." : "Enregistrer" })
        ] })
      ] })
    ] }) }),
    editOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 max-h-[90vh] overflow-y-auto", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-5 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "flex size-9 items-center justify-center rounded-xl bg-amber-300/10", children: /* @__PURE__ */ jsx(Pencil, { className: "size-4 text-amber-400" }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: "Modifier la dépense" })
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: closeEdit, className: "rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200", children: /* @__PURE__ */ jsx(X, { className: "size-5" }) })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleEdit, className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Libellé *" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: editForm.title,
              onChange: (e) => setEditForm((f) => ({ ...f, title: e.target.value })),
              className: "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
            }
          ),
          editErrors.title && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-rose-500", children: editErrors.title })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Montant *" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                min: "0",
                step: "0.01",
                value: editForm.amount,
                onChange: (e) => setEditForm((f) => ({ ...f, amount: e.target.value })),
                className: "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
              }
            ),
            editErrors.amount && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-rose-500", children: editErrors.amount })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Date *" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: editForm.expense_date,
                onChange: (e) => setEditForm((f) => ({ ...f, expense_date: e.target.value })),
                className: "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
              }
            ),
            editErrors.expense_date && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-rose-500", children: editErrors.expense_date })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Catégorie *" }),
            /* @__PURE__ */ jsx(
              "select",
              {
                value: editForm.category,
                onChange: (e) => setEditForm((f) => ({ ...f, category: e.target.value })),
                className: "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none",
                children: CATEGORIES.map((c) => /* @__PURE__ */ jsx("option", { value: c, children: c }, c))
              }
            ),
            editErrors.category && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-rose-500", children: editErrors.category })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Mode de paiement" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: editForm.payment_method,
                onChange: (e) => setEditForm((f) => ({ ...f, payment_method: e.target.value })),
                className: "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "", children: "— Non précisé —" }),
                  Object.entries(PAYMENT_METHODS).map(([k, v]) => /* @__PURE__ */ jsx("option", { value: k, children: v }, k))
                ]
              }
            ),
            editErrors.payment_method && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-rose-500", children: editErrors.payment_method })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Référence / N° reçu" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: editForm.reference,
              onChange: (e) => setEditForm((f) => ({ ...f, reference: e.target.value })),
              className: "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
            }
          ),
          editErrors.reference && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-rose-500", children: editErrors.reference })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Notes" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              rows: 2,
              value: editForm.notes,
              onChange: (e) => setEditForm((f) => ({ ...f, notes: e.target.value })),
              className: "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-amber-300 focus:outline-none"
            }
          ),
          editErrors.notes && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-rose-500", children: editErrors.notes })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Remplacer le justificatif (optionnel)" }),
          editExpense?.receipt && !editForm.receipt && /* @__PURE__ */ jsxs("div", { className: "mb-2 flex items-center gap-2 rounded-lg border border-amber-300/30 bg-amber-300/5 px-3 py-2 text-sm", children: [
            /* @__PURE__ */ jsx(FileText, { className: "size-4 shrink-0 text-amber-400" }),
            /* @__PURE__ */ jsx("a", { href: `/storage/${editExpense.receipt}`, target: "_blank", rel: "noopener noreferrer", className: "truncate text-amber-400 underline hover:text-amber-300", children: "Voir le justificatif actuel" })
          ] }),
          /* @__PURE__ */ jsxs(
            "div",
            {
              onClick: () => editReceiptRef.current?.click(),
              className: "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-center hover:border-amber-400 dark:border-white/15 dark:bg-slate-800/50 dark:hover:border-amber-400",
              children: [
                /* @__PURE__ */ jsx(Upload, { className: "size-5 text-slate-400" }),
                /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-500 dark:text-slate-400", children: editReceiptName || "Cliquez pour sélectionner un nouveau fichier" })
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            "input",
            {
              ref: editReceiptRef,
              type: "file",
              accept: "image/*,.pdf",
              className: "hidden",
              onChange: (e) => {
                const file = e.target.files?.[0] ?? null;
                setEditForm((f) => ({ ...f, receipt: file }));
                setEditReceiptName(file?.name ?? "");
              }
            }
          ),
          editErrors.receipt && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-rose-500", children: editErrors.receipt })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-3 pt-1", children: [
          /* @__PURE__ */ jsx("button", { type: "button", onClick: closeEdit, className: "flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5", children: "Annuler" }),
          /* @__PURE__ */ jsx("button", { type: "submit", disabled: submitting, className: "flex-1 rounded-xl bg-amber-300 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50", children: submitting ? "Enregistrement..." : "Enregistrer" })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(
      ConfirmDeleteModal,
      {
        show: deleteModal.show,
        title: "Supprimer la dépense",
        message: `Voulez-vous vraiment supprimer "${deleteModal.expense?.title}" ? Cette action est irréversible.`,
        processing: deleting,
        onConfirm: handleDelete,
        onClose: () => setDeleteModal({ show: false, expense: null })
      }
    )
  ] });
}
export {
  ExpensesIndex as default
};
