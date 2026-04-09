import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { TableActionButton, TableActions } from '@/Components/Table';
import { Head, router } from '@inertiajs/react';
import {
    Plus, Trash2, Search, X, SlidersHorizontal, RotateCcw,
    Receipt, TrendingDown, Calendar, Pencil, Upload, FileText
} from 'lucide-react';
import Currency from '@/Components/Currency';
import { useRoute } from '@/utils/route';
import { useState, useRef, FormEvent } from 'react';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';
import { PageProps } from '@/types';

// ─── Constantes ───────────────────────────────────────────────────────────────

const CATEGORIES = [
    'Loyer',
    'Salaires',
    'Transport',
    'Fournitures',
    'Entretien',
    'Électricité / Eau',
    'Téléphone / Internet',
    'Publicité',
    'Taxes & Impôts',
    'Remboursement',
    'Autre',
];

const PAYMENT_METHODS: Record<string, string> = {
    cash: 'Espèces',
    card: 'Carte',
    transfer: 'Virement',
    check: 'Chèque',
    mobile: 'Mobile Money',
};

const CATEGORY_COLORS: Record<string, string> = {
    'Loyer': 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    'Salaires': 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    'Transport': 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    'Fournitures': 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    'Entretien': 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
    'Électricité / Eau': 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
    'Téléphone / Internet': 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
    'Publicité': 'bg-pink-500/20 text-pink-300 border border-pink-500/30',
    'Taxes & Impôts': 'bg-red-500/20 text-red-300 border border-red-500/30',
    'Remboursement': 'bg-teal-500/20 text-teal-300 border border-teal-500/30',
    'Autre': 'bg-slate-500/20 text-slate-300 border border-slate-500/30',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
    id: number;
    name: string;
}

interface Expense {
    id: number;
    title: string;
    amount: string;
    category: string;
    expense_date: string;
    payment_method: string | null;
    reference: string | null;
    notes: string | null;
    receipt: string | null;
    user: User;
}

interface PaginatedExpenses {
    data: Expense[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props extends PageProps {
    expenses: PaginatedExpenses;
    totalAmount: number;
    monthTotal: number;
    currency: string;
    filters: {
        search?: string;
        category?: string;
        payment_method?: string;
        date_from?: string;
        date_to?: string;
    };
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function ExpensesIndex({
    expenses,
    totalAmount,
    monthTotal,
    currency,
    filters,
}: Props) {
    const route = useRoute();

    // ── Filtres ──
    const [search, setSearch]               = useState(filters.search ?? '');
    const [category, setCategory]           = useState(filters.category ?? '');
    const [paymentMethod, setPaymentMethod] = useState(filters.payment_method ?? '');
    const [dateFrom, setDateFrom]           = useState(filters.date_from ?? '');
    const [dateTo, setDateTo]               = useState(filters.date_to ?? '');
    const [showFilters, setShowFilters]     = useState(false);

    const activeFilterCount = [category, paymentMethod, dateFrom, dateTo].filter(Boolean).length;

    const applyFilters = () => {
        router.get(route('expenses.index'), {
            ...(search        ? { search }                          : {}),
            ...(category      ? { category }                        : {}),
            ...(paymentMethod ? { payment_method: paymentMethod }   : {}),
            ...(dateFrom      ? { date_from: dateFrom }             : {}),
            ...(dateTo        ? { date_to: dateTo }                 : {}),
        }, { preserveState: true, replace: true });
    };

    const resetFilters = () => {
        setSearch(''); setCategory(''); setPaymentMethod('');
        setDateFrom(''); setDateTo('');
        router.get(route('expenses.index'), {}, { preserveState: false });
    };

    // ── Modal créer ──
    const emptyForm = {
        title: '', amount: '', category: 'Autre', expense_date: '',
        payment_method: '', reference: '', notes: '', receipt: null as File | null,
    };
    const [createOpen, setCreateOpen] = useState(false);
    const [form, setForm] = useState({ ...emptyForm });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const receiptRef = useRef<HTMLInputElement>(null);
    const [receiptName, setReceiptName] = useState('');

    const openCreate = () => { setForm({ ...emptyForm }); setFormErrors({}); setReceiptName(''); setCreateOpen(true); };
    const closeCreate = () => { setCreateOpen(false); setReceiptName(''); };

    const handleCreate = (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const data = new FormData();
        data.append('title', form.title);
        data.append('amount', form.amount);
        data.append('category', form.category);
        data.append('expense_date', form.expense_date);
        if (form.payment_method) data.append('payment_method', form.payment_method);
        if (form.reference)      data.append('reference', form.reference);
        if (form.notes)          data.append('notes', form.notes);
        if (form.receipt)        data.append('receipt', form.receipt);

        router.post(route('expenses.store'), data, {
            forceFormData: true,
            onSuccess: () => { setSubmitting(false); closeCreate(); },
            onError: (errors) => { setFormErrors(errors); setSubmitting(false); },
        });
    };

    // ── Modal éditer ──
    const [editOpen, setEditOpen] = useState(false);
    const [editExpense, setEditExpense] = useState<Expense | null>(null);
    const [editForm, setEditForm] = useState({ ...emptyForm });
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});
    const [editReceiptName, setEditReceiptName] = useState('');
    const editReceiptRef = useRef<HTMLInputElement>(null);

    const openEdit = (expense: Expense) => {
        setEditExpense(expense);
        setEditForm({
            title: expense.title,
            amount: expense.amount,
            category: expense.category,
            expense_date: expense.expense_date,
            payment_method: expense.payment_method ?? '',
            reference: expense.reference ?? '',
            notes: expense.notes ?? '',
            receipt: null,
        });
        setEditErrors({});
        setEditReceiptName('');
        setEditOpen(true);
    };
    const closeEdit = () => { setEditOpen(false); setEditExpense(null); setEditReceiptName(''); };

    const handleEdit = (e: FormEvent) => {
        e.preventDefault();
        if (!editExpense) return;
        setSubmitting(true);
        const data = new FormData();
        data.append('_method', 'PATCH');
        data.append('title', editForm.title);
        data.append('amount', editForm.amount);
        data.append('category', editForm.category);
        data.append('expense_date', editForm.expense_date);
        if (editForm.payment_method) data.append('payment_method', editForm.payment_method);
        if (editForm.reference)      data.append('reference', editForm.reference);
        if (editForm.notes)          data.append('notes', editForm.notes);
        if (editForm.receipt)        data.append('receipt', editForm.receipt);

        router.post(route('expenses.update', { expense: editExpense.id }), data, {
            forceFormData: true,
            onSuccess: () => { setSubmitting(false); closeEdit(); },
            onError: (errors) => { setEditErrors(errors); setSubmitting(false); },
        });
    };

    // ── Modal supprimer ──
    const [deleteModal, setDeleteModal] = useState<{ show: boolean; expense: Expense | null }>({ show: false, expense: null });
    const [deleting, setDeleting] = useState(false);

    const handleDelete = () => {
        if (!deleteModal.expense) return;
        setDeleting(true);
        router.delete(route('expenses.destroy', { expense: deleteModal.expense.id }), {
            onSuccess: () => { setDeleting(false); setDeleteModal({ show: false, expense: null }); },
            onFinish: () => setDeleting(false),
        });
    };

    // ─── Rendu ────────────────────────────────────────────────────────────────
    return (
        <AuthenticatedLayout>
            <Head title="Dépenses" />

            <div className="space-y-6">
                {/* ── En-tête ── */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <TrendingDown className="size-6 text-red-400" />
                            Dépenses
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Gérez les dépenses de votre boutique
                        </p>
                    </div>
                    <button
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-amber-300 transition-colors"
                    >
                        <Plus className="size-4" />
                        Nouvelle dépense
                    </button>
                </div>

                {/* ── Stat cards ── */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-800/60">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-red-500/10 p-2">
                                <TrendingDown className="size-5 text-red-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Total (filtre actif)</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">
                                    <Currency amount={totalAmount} />
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-800/60">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-orange-500/10 p-2">
                                <Calendar className="size-5 text-orange-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Ce mois-ci</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">
                                    <Currency amount={monthTotal} />
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Barre de recherche + filtres ── */}
                <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Rechercher par titre, référence..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && applyFilters()}
                                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 dark:border-white/10 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                            />
                            {search && (
                                <button onClick={() => { setSearch(''); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <X className="size-4 text-slate-400 hover:text-slate-600" />
                                </button>
                            )}
                        </div>
                        <button
                            onClick={applyFilters}
                            className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-amber-300 transition-colors"
                        >
                            Rechercher
                        </button>
                        <button
                            onClick={() => setShowFilters(v => !v)}
                            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${showFilters ? 'border-amber-400 bg-amber-400/10 text-amber-400' : 'border-slate-300 text-slate-600 hover:border-amber-400 dark:border-white/10 dark:text-slate-300'}`}
                        >
                            <SlidersHorizontal className="size-4" />
                            Filtres
                            {activeFilterCount > 0 && (
                                <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-xs font-bold text-slate-900">{activeFilterCount}</span>
                            )}
                        </button>
                        {(activeFilterCount > 0 || search) && (
                            <button onClick={resetFilters} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-500 hover:text-red-500 dark:border-white/10 dark:text-slate-400">
                                <RotateCcw className="size-4" />
                            </button>
                        )}
                    </div>

                    {showFilters && (
                        <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-800/60 sm:grid-cols-4">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Catégorie</label>
                                <select
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 focus:border-amber-400 focus:outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white"
                                >
                                    <option value="">Toutes</option>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Mode de paiement</label>
                                <select
                                    value={paymentMethod}
                                    onChange={e => setPaymentMethod(e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 focus:border-amber-400 focus:outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white"
                                >
                                    <option value="">Tous</option>
                                    {Object.entries(PAYMENT_METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Date début</label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={e => setDateFrom(e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 focus:border-amber-400 focus:outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Date fin</label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={e => setDateTo(e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 focus:border-amber-400 focus:outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white"
                                />
                            </div>
                            <div className="col-span-2 flex justify-end gap-2 sm:col-span-4">
                                <button onClick={resetFilters} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5">
                                    Réinitialiser
                                </button>
                                <button onClick={applyFilters} className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-amber-300">
                                    Appliquer
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Tableau ── */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-300">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">Date</th>
                                    <th className="px-4 py-3 text-left font-medium">Libellé</th>
                                    <th className="px-4 py-3 text-left font-medium">Catégorie</th>
                                    <th className="px-4 py-3 text-left font-medium">Mode paiement</th>
                                    <th className="px-4 py-3 text-left font-medium">Référence</th>
                                    <th className="px-4 py-3 text-right font-medium">Montant</th>
                                    <th className="px-4 py-3 text-left font-medium">Ajouté par</th>
                                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                                            <Receipt className="mx-auto mb-3 size-10 opacity-40" />
                                            <p className="text-sm">Aucune dépense enregistrée</p>
                                        </td>
                                    </tr>
                                ) : expenses.data.map((expense) => (
                                    <tr key={expense.id} className="border-t border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {new Date(expense.expense_date).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-slate-900 dark:text-white">{expense.title}</span>
                                                {expense.receipt && (
                                                    <a
                                                        href={`/storage/${expense.receipt}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title="Voir le justificatif"
                                                        className="text-amber-400 hover:text-amber-300"
                                                    >
                                                        <FileText className="size-4" />
                                                    </a>
                                                )}
                                            </div>
                                            {expense.notes && (
                                                <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500 truncate max-w-xs">{expense.notes}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[expense.category] ?? 'bg-slate-500/20 text-slate-300 border border-slate-500/30'}`}>
                                                {expense.category}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                                            {expense.payment_method ? PAYMENT_METHODS[expense.payment_method] ?? expense.payment_method : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                                            {expense.reference ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-red-500 dark:text-red-400 whitespace-nowrap">
                                            − <Currency amount={parseFloat(expense.amount)} />
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                                            {expense.user.name}
                                        </td>
                                        <td className="px-4 py-3">
                                            <TableActions>
                                                <TableActionButton onClick={() => openEdit(expense)}>
                                                    <Pencil className="size-3" /> Modifier
                                                </TableActionButton>
                                                <TableActionButton variant="danger" onClick={() => setDeleteModal({ show: true, expense })}>
                                                    <Trash2 className="size-3" /> Supprimer
                                                </TableActionButton>
                                            </TableActions>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── Pagination ── */}
                {expenses.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {expenses.total} dépense{expenses.total > 1 ? 's' : ''} • Page {expenses.current_page}/{expenses.last_page}
                        </p>
                        <div className="flex gap-1">
                            {expenses.links.map((link, i) => (
                                link.url ? (
                                    <button
                                        key={i}
                                        onClick={() => router.get(link.url!)}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`rounded px-3 py-1.5 text-sm transition-colors ${link.active ? 'bg-amber-400 font-semibold text-slate-900' : 'border border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5'}`}
                                    />
                                ) : (
                                    <span
                                        key={i}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className="rounded px-3 py-1.5 text-sm text-slate-400 dark:text-slate-600"
                                    />
                                )
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ══════════════════════════════════════════════
                MODAL — CRÉER UNE DÉPENSE
            ══════════════════════════════════════════════ */}
            {createOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
                        <div className="mb-5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex size-9 items-center justify-center rounded-xl bg-red-500/10">
                                    <Receipt className="size-4 text-red-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Nouvelle dépense</h3>
                            </div>
                            <button onClick={closeCreate} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200">
                                <X className="size-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4">
                            {/* Libellé */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Libellé *</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    placeholder="Ex : Loyer boutique mars 2026"
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
                                />
                                {formErrors.title && <p className="mt-1 text-xs text-rose-500">{formErrors.title}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {/* Montant */}
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Montant *</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.amount}
                                        onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                                        placeholder="0.00"
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
                                    />
                                    {formErrors.amount && <p className="mt-1 text-xs text-rose-500">{formErrors.amount}</p>}
                                </div>
                                {/* Date */}
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Date *</label>
                                    <input
                                        type="date"
                                        value={form.expense_date}
                                        onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
                                    />
                                    {formErrors.expense_date && <p className="mt-1 text-xs text-rose-500">{formErrors.expense_date}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {/* Catégorie */}
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Catégorie *</label>
                                    <select
                                        value={form.category}
                                        onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
                                    >
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    {formErrors.category && <p className="mt-1 text-xs text-rose-500">{formErrors.category}</p>}
                                </div>
                                {/* Mode de paiement */}
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Mode de paiement</label>
                                    <select
                                        value={form.payment_method}
                                        onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
                                    >
                                        <option value="">— Non précisé —</option>
                                        {Object.entries(PAYMENT_METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                    {formErrors.payment_method && <p className="mt-1 text-xs text-rose-500">{formErrors.payment_method}</p>}
                                </div>
                            </div>

                            {/* Référence */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Référence / N° reçu</label>
                                <input
                                    type="text"
                                    value={form.reference}
                                    onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
                                    placeholder="Ex : REF-001"
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
                                />
                                {formErrors.reference && <p className="mt-1 text-xs text-rose-500">{formErrors.reference}</p>}
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
                                <textarea
                                    rows={2}
                                    value={form.notes}
                                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                    placeholder="Détails supplémentaires..."
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-amber-300 focus:outline-none"
                                />
                                {formErrors.notes && <p className="mt-1 text-xs text-rose-500">{formErrors.notes}</p>}
                            </div>

                            {/* Justificatif */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Justificatif (photo / PDF)</label>
                                <div
                                    onClick={() => receiptRef.current?.click()}
                                    className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-center hover:border-amber-400 dark:border-white/15 dark:bg-slate-800/50 dark:hover:border-amber-400"
                                >
                                    <Upload className="size-5 text-slate-400" />
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                        {receiptName || 'Cliquez pour sélectionner (JPG, PNG, PDF – max 5 Mo)'}
                                    </span>
                                </div>
                                <input
                                    ref={receiptRef}
                                    type="file"
                                    accept="image/*,.pdf"
                                    className="hidden"
                                    onChange={e => {
                                        const file = e.target.files?.[0] ?? null;
                                        setForm(f => ({ ...f, receipt: file }));
                                        setReceiptName(file?.name ?? '');
                                    }}
                                />
                                {formErrors.receipt && <p className="mt-1 text-xs text-rose-500">{formErrors.receipt}</p>}
                            </div>

                            {/* Boutons */}
                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={closeCreate} className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5">
                                    Annuler
                                </button>
                                <button type="submit" disabled={submitting} className="flex-1 rounded-xl bg-amber-300 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50">
                                    {submitting ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════
                MODAL — MODIFIER UNE DÉPENSE
            ══════════════════════════════════════════════ */}
            {editOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
                        <div className="mb-5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex size-9 items-center justify-center rounded-xl bg-amber-300/10">
                                    <Pencil className="size-4 text-amber-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Modifier la dépense</h3>
                            </div>
                            <button onClick={closeEdit} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200">
                                <X className="size-5" />
                            </button>
                        </div>

                        <form onSubmit={handleEdit} className="space-y-4">
                            {/* Libellé */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Libellé *</label>
                                <input
                                    type="text"
                                    value={editForm.title}
                                    onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
                                />
                                {editErrors.title && <p className="mt-1 text-xs text-rose-500">{editErrors.title}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Montant *</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={editForm.amount}
                                        onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
                                    />
                                    {editErrors.amount && <p className="mt-1 text-xs text-rose-500">{editErrors.amount}</p>}
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Date *</label>
                                    <input
                                        type="date"
                                        value={editForm.expense_date}
                                        onChange={e => setEditForm(f => ({ ...f, expense_date: e.target.value }))}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
                                    />
                                    {editErrors.expense_date && <p className="mt-1 text-xs text-rose-500">{editErrors.expense_date}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Catégorie *</label>
                                    <select
                                        value={editForm.category}
                                        onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
                                    >
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    {editErrors.category && <p className="mt-1 text-xs text-rose-500">{editErrors.category}</p>}
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Mode de paiement</label>
                                    <select
                                        value={editForm.payment_method}
                                        onChange={e => setEditForm(f => ({ ...f, payment_method: e.target.value }))}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
                                    >
                                        <option value="">— Non précisé —</option>
                                        {Object.entries(PAYMENT_METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                    {editErrors.payment_method && <p className="mt-1 text-xs text-rose-500">{editErrors.payment_method}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Référence / N° reçu</label>
                                <input
                                    type="text"
                                    value={editForm.reference}
                                    onChange={e => setEditForm(f => ({ ...f, reference: e.target.value }))}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
                                />
                                {editErrors.reference && <p className="mt-1 text-xs text-rose-500">{editErrors.reference}</p>}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
                                <textarea
                                    rows={2}
                                    value={editForm.notes}
                                    onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-amber-300 focus:outline-none"
                                />
                                {editErrors.notes && <p className="mt-1 text-xs text-rose-500">{editErrors.notes}</p>}
                            </div>

                            {/* Justificatif */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Remplacer le justificatif (optionnel)</label>
                                {editExpense?.receipt && !editForm.receipt && (
                                    <div className="mb-2 flex items-center gap-2 rounded-lg border border-amber-300/30 bg-amber-300/5 px-3 py-2 text-sm">
                                        <FileText className="size-4 shrink-0 text-amber-400" />
                                        <a href={`/storage/${editExpense.receipt}`} target="_blank" rel="noopener noreferrer" className="truncate text-amber-400 underline hover:text-amber-300">
                                            Voir le justificatif actuel
                                        </a>
                                    </div>
                                )}
                                <div
                                    onClick={() => editReceiptRef.current?.click()}
                                    className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-center hover:border-amber-400 dark:border-white/15 dark:bg-slate-800/50 dark:hover:border-amber-400"
                                >
                                    <Upload className="size-5 text-slate-400" />
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                        {editReceiptName || 'Cliquez pour sélectionner un nouveau fichier'}
                                    </span>
                                </div>
                                <input
                                    ref={editReceiptRef}
                                    type="file"
                                    accept="image/*,.pdf"
                                    className="hidden"
                                    onChange={e => {
                                        const file = e.target.files?.[0] ?? null;
                                        setEditForm(f => ({ ...f, receipt: file }));
                                        setEditReceiptName(file?.name ?? '');
                                    }}
                                />
                                {editErrors.receipt && <p className="mt-1 text-xs text-rose-500">{editErrors.receipt}</p>}
                            </div>

                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={closeEdit} className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5">
                                    Annuler
                                </button>
                                <button type="submit" disabled={submitting} className="flex-1 rounded-xl bg-amber-300 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50">
                                    {submitting ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Modal suppression ── */}
            <ConfirmDeleteModal
                show={deleteModal.show}
                title="Supprimer la dépense"
                message={`Voulez-vous vraiment supprimer "${deleteModal.expense?.title}" ? Cette action est irréversible.`}
                processing={deleting}
                onConfirm={handleDelete}
                onClose={() => setDeleteModal({ show: false, expense: null })}
            />
        </AuthenticatedLayout>
    );
}
