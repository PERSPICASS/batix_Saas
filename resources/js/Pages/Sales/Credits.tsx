import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Calendar,
    Check,
    Clock,
    CreditCard,
    Download,
    Eye,
    Search,
    X,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useRoute } from '@/utils/route';
import { PageProps } from '@/types';
import { useLocale } from '@/contexts/LocaleContext';
import { useShopSettings } from '@/Components/Currency';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Shop {
    id: number;
    name: string;
}

interface Customer {
    id: number;
    name: string;
    phone?: string;
    email?: string;
}

interface CreditSale {
    id: number;
    ticket_number: string;
    sale_date: string;
    customer: Customer | null;
    shop: Shop;
    total: number;
    amount_paid: number;
    remaining_amount: number;
    credit_due_date: string | null;
    overdue: boolean;
    due_soon: boolean;
    days_overdue: number | null;
    days_until_due: number | null;
    notes: string | null;
}

interface PaginatedData {
    data: CreditSale[];
    links: any;
    meta: any;
}

interface KPIs {
    total_remaining: number;
    total_count: number;
    overdue_remaining: number;
    overdue_count: number;
    due_soon_count: number;
    no_date_count: number;
}

interface Props extends PageProps {
    credits?: PaginatedData | null;
    shops?: Shop[] | null;
    kpis?: KPIs | null;
    filters?: {
        search?: string;
        shop_id?: string;
        sort?: string;
        status?: string;
    } | Record<string, unknown> | null;
}

// ─── Payment Modal ────────────────────────────────────────────────────────────

interface PaymentModalProps {
    sale: CreditSale;
    onClose: () => void;
    routeFn: (name: string, params?: any) => string;
}

function PaymentModal({ sale, onClose, routeFn }: PaymentModalProps) {
    const { t } = useLocale();
    const { formatCurrency } = useShopSettings();
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [notes, setNotes] = useState('');
    const [newDueDate, setNewDueDate] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const maxAmount = parseFloat(sale.remaining_amount.toString());

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const parsed = parseFloat(amount);
        if (!amount || isNaN(parsed) || parsed <= 0) {
            setError(t.credits.form.invalidAmount);
            return;
        }
        if (parsed > maxAmount) {
            setError(t.credits.form.exceedsAmount(maxAmount));
            return;
        }
        setError('');
        setSubmitting(true);
        router.post(
            routeFn('sales.credits.pay', { sale: sale.id }),
            {
                amount: parsed,
                payment_method: paymentMethod,
                notes: notes || undefined,
                new_due_date: newDueDate || undefined,
            },
            {
                onSuccess: () => onClose(),
                onError: (errors: any) => {
                    setError(Object.values(errors).join(' '));
                    setSubmitting(false);
                },
                onFinish: () => setSubmitting(false),
            }
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t.credits.modals.paymentTitle}</h2>
                        <p className="text-sm text-slate-400 mt-0.5">
                            Ticket {sale.ticket_number} —{' '}
                            {sale.customer?.name ?? <span className="italic">{t.credits.modals.unknownCustomer}</span>}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Résumé */}
                    <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-800/60 p-4">
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{t.credits.form.totalSale}</p>
                            <p className="font-semibold text-slate-900 dark:text-white">
                                {formatCurrency(Number(sale.total))}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{t.credits.form.alreadyPaid}</p>
                            <p className="font-semibold text-emerald-400">
                                {formatCurrency(Number(sale.amount_paid))}
                            </p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-xs text-slate-500 dark:text-slate-400">{t.credits.form.remainingToPay}</p>
                            <p className="text-xl font-bold text-amber-400">
                                {formatCurrency(Number(sale.remaining_amount))}
                            </p>
                        </div>
                    </div>

                    {error && (
                        <p className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-400">
                            {error}
                        </p>
                    )}

                    {/* Montant */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            {t.credits.form.paymentAmount} <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="number"
                            min="1"
                            max={maxAmount}
                            step="1"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder={`Max: ${maxAmount.toLocaleString('fr-FR')}`}
                            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setAmount(maxAmount.toString())}
                            className="mt-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
                        >
                            {t.credits.buttons.payFully} ({formatCurrency(maxAmount)})
                        </button>
                    </div>

                    {/* Mode de paiement */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            {t.credits.form.paymentMethod}
                        </label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                        >
                            <option value="cash">{t.sales.payment.cash}</option>
                            <option value="card">{t.sales.payment.card}</option>
                            <option value="transfer">{t.sales.payment.transfer}</option>
                            <option value="mobile">{t.sales.payment.mobile}</option>
                            <option value="check">{t.sales.payment.check}</option>
                        </select>
                    </div>

                    {/* Nouvelle échéance (optionnelle) */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            {t.credits.form.newDueDate} <span className="text-slate-500">{t.credits.form.optional}</span>
                        </label>
                        <input
                            type="date"
                            value={newDueDate}
                            onChange={(e) => setNewDueDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            {t.credits.form.notes} <span className="text-slate-500">{t.credits.form.optional}</span>
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            placeholder={t.credits.form.paymentObservation}
                            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-lg border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                        >
                            {t.credits.buttons.cancel}
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-r-transparent" />
                            ) : (
                                <Check className="h-4 w-4" />
                            )}
                            {t.credits.buttons.validate}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Due Date Modal ───────────────────────────────────────────────────────────

interface DueDateModalProps {
    sale: CreditSale;
    onClose: () => void;
    routeFn: (name: string, params?: any) => string;
}

function DueDateModal({ sale, onClose, routeFn }: DueDateModalProps) {
    const { t } = useLocale();
    const [dueDate, setDueDate] = useState(sale.credit_due_date ?? '');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        router.patch(
            routeFn('sales.credits.update-due-date', { sale: sale.id }),
            { credit_due_date: dueDate || null },
            {
                onSuccess: () => onClose(),
                onFinish: () => setSubmitting(false),
            }
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t.credits.modals.dueDateTitle}</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Ticket <span className="text-slate-900 dark:text-white font-medium">{sale.ticket_number}</span>
                    </p>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            {t.credits.form.dueDate}
                        </label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                        />
                        {dueDate && (
                            <button
                                type="button"
                                onClick={() => setDueDate('')}
                                className="mt-1 text-xs text-slate-400 hover:text-slate-300 transition-colors"
                            >
                                {t.credits.buttons.removeDueDate}
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-lg border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                        >
                            {t.credits.buttons.cancel}
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-amber-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-r-transparent" />
                            ) : (
                                <Check className="h-4 w-4" />
                            )}
                            {t.credits.buttons.save}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
    label,
    value,
    sub,
    color,
    icon: Icon,
}: {
    label: string;
    value: string | number;
    sub?: string;
    color: 'amber' | 'red' | 'orange' | 'slate';
    icon: React.ElementType;
}) {
    const colors = {
        amber:  'border-amber-500/30  bg-amber-500/10  text-amber-400',
        red:    'border-red-500/30    bg-red-500/10    text-red-400',
        orange: 'border-orange-500/30 bg-orange-500/10 text-orange-400',
        slate:  'border-slate-600/40  bg-slate-700/20  text-slate-400',
    };
    return (
        <div className={`rounded-2xl border p-5 ${colors[color]}`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium opacity-70">{label}</p>
                    <p className="mt-1 text-2xl font-bold">{value}</p>
                    {sub && <p className="mt-0.5 text-xs opacity-60">{sub}</p>}
                </div>
                <div className="rounded-xl p-2.5 bg-current/10 opacity-60">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

// ─── Due Badge ────────────────────────────────────────────────────────────────

function DueBadge({ sale }: { sale: CreditSale }) {
    const { t } = useLocale();
    if (!sale.credit_due_date) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-700/60 px-2.5 py-1 text-xs text-slate-400">
                <Clock className="h-3 w-3" /> {t.credits.status.noDate}
            </span>
        );
    }
    if (sale.overdue) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-medium text-red-400">
                <AlertTriangle className="h-3 w-3" />
                {sale.days_overdue != null ? `${sale.days_overdue}j de retard` : t.credits.status.overdue}
            </span>
        );
    }
    if (sale.due_soon) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2.5 py-1 text-xs font-medium text-orange-400">
                <Clock className="h-3 w-3" />
                {sale.days_until_due != null ? `Dans ${sale.days_until_due}j` : t.credits.status.soon}
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-400">
            <Calendar className="h-3 w-3" />
            {new Date(sale.credit_due_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Credits({ credits, shops = [], kpis, filters = {}, auth }: Props) {
    const { t } = useLocale();
    const { formatCurrency, currencySymbol } = useShopSettings();
    const buildRoute = useRoute();
    const isFirstRender = useRef(true);
    const safeFilters: Record<string, unknown> =
        filters && typeof filters === 'object' && !Array.isArray(filters) ? filters : {};
    const safeShops: Shop[] = Array.isArray(shops) ? shops : [];
    const getFilterValue = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback);

    const [search, setSearch]       = useState<string>(getFilterValue(safeFilters.search));
    const [shopId, setShopId]       = useState<string>(getFilterValue(safeFilters.shop_id));
    const [sortBy, setSortBy]       = useState<string>(getFilterValue(safeFilters.sort, 'overdue_first'));
    const [statusTab, setStatusTab] = useState<string>(getFilterValue(safeFilters.status));

    const [payModal, setPayModal]         = useState<CreditSale | null>(null);
    const [dueDateModal, setDueDateModal] = useState<CreditSale | null>(null);

    // Safe KPI defaults in case data not yet loaded
    const safeKpis: KPIs = kpis ?? {
        total_remaining: 0,
        total_count: 0,
        overdue_remaining: 0,
        overdue_count: 0,
        due_soon_count: 0,
        no_date_count: 0,
    };

    const safeCredits: PaginatedData = {
        data: Array.isArray(credits?.data) ? credits.data : [],
        links: Array.isArray(credits?.links) ? credits.links : [],
        meta: credits?.meta ?? { last_page: 1, from: 0, to: 0, total: 0 },
    };

    // Debounce search — skip au premier rendu
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const timer = setTimeout(() => applyFilters(), 400);
        return () => clearTimeout(timer);
    }, [search]);

    const applyFilters = (overrides: Record<string, string> = {}) => {
        router.get(
            buildRoute('sales.credits'),
            {
                ...(search   ? { search }              : {}),
                ...(shopId   ? { shop_id: shopId }     : {}),
                ...(sortBy   ? { sort: sortBy }        : {}),
                ...(statusTab ? { status: statusTab }  : {}),
                ...overrides,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleStatusTab = (val: string) => {
        setStatusTab(val);
        applyFilters({ status: val });
    };

    const handleSortChange = (val: string) => {
        setSortBy(val);
        applyFilters({ sort: val });
    };

    const handleShopChange = (val: string) => {
        setShopId(val);
        applyFilters({ shop_id: val });
    };

    const resetFilters = () => {
        setSearch('');
        setShopId('');
        setSortBy('overdue_first');
        setStatusTab('');
        router.get(buildRoute('sales.credits'), {}, { preserveState: false, replace: true });
    };

    const exportUrl = buildRoute('sales.credits.export', {
        ...(search    ? { search }              : {}),
        ...(shopId    ? { shop_id: shopId }     : {}),
        ...(statusTab ? { status: statusTab }   : {}),
    });

    const statusTabs = [
        { value: '',         label: t.credits.tabs.all,     count: safeKpis.total_count },
        { value: 'overdue',  label: t.credits.tabs.overdue, count: safeKpis.overdue_count },
        { value: 'due_soon', label: t.credits.tabs.dueSoon, count: safeKpis.due_soon_count },
        { value: 'no_date',  label: t.credits.tabs.noDate,  count: safeKpis.no_date_count },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <CreditCard className="h-6 w-6 text-amber-400" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t.credits.title}</h2>
                </div>
            }
        >
            <Head title={t.credits.title} />

            <div className="space-y-6">

                {/* ── KPI Cards ─────────────────────────────────────── */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <KpiCard
                        label={t.credits.kpis.totalRemaining}
                        value={formatCurrency(safeKpis.total_remaining)}
                        sub={`${safeKpis.total_count} vente${safeKpis.total_count !== 1 ? 's' : ''}`}
                        color="amber"
                        icon={CreditCard}
                    />
                    <KpiCard
                        label={t.credits.kpis.overdue}
                        value={formatCurrency(safeKpis.overdue_remaining)}
                        sub={`${safeKpis.overdue_count} vente${safeKpis.overdue_count !== 1 ? 's' : ''}`}
                        color="red"
                        icon={AlertTriangle}
                    />
                    <KpiCard
                        label={t.credits.kpis.dueSoon}
                        value={safeKpis.due_soon_count}
                        sub={t.credits.kpis.dueSoonDesc}
                        color="orange"
                        icon={Clock}
                    />
                    <KpiCard
                        label={t.credits.kpis.noDate}
                        value={safeKpis.no_date_count}
                        sub={t.credits.kpis.noDateDesc}
                        color="slate"
                        icon={Calendar}
                    />
                </div>

                {/* ── Filters Bar ───────────────────────────────────── */}
                <div className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-4">
                    <div className="flex flex-wrap gap-3">
                        {/* Search */}
                        <div className="relative flex-1 min-w-48">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={t.credits.filters.searchPlaceholder}
                                className="w-full rounded-lg border border-slate-600 bg-slate-800 pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                        </div>

                        {/* Shop filter (only if multiple shops) */}
                        {safeShops.length > 1 && (
                            <select
                                value={shopId}
                                onChange={(e) => handleShopChange(e.target.value)}
                                className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                            >
                                <option value="">{t.credits.filters.allShops}</option>
                                {safeShops.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        )}

                        {/* Sort */}
                        <select
                            value={sortBy}
                            onChange={(e) => handleSortChange(e.target.value)}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                        >
                            <option value="overdue_first">{t.credits.filters.sortOverdueFirst}</option>
                            <option value="amount_desc">{t.credits.filters.sortAmountDesc}</option>
                            <option value="amount_asc">{t.credits.filters.sortAmountAsc}</option>
                            <option value="date_asc">{t.credits.filters.sortDateNearest}</option>
                            <option value="date_desc">{t.credits.filters.sortDateFarthest}</option>
                            <option value="oldest">{t.credits.filters.sortOldestSales}</option>
                        </select>

                        {/* Reset */}
                        {(search || shopId || sortBy !== 'overdue_first' || statusTab) && (
                            <button
                                onClick={resetFilters}
                                className="flex items-center gap-1.5 rounded-lg border border-slate-600 px-3 py-2.5 text-sm text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
                            >
                                <X className="h-4 w-4" /> {t.credits.filters.reset}
                            </button>
                        )}

                        {/* Export */}
                        <a
                            href={exportUrl}
                            className="ml-auto flex items-center gap-1.5 rounded-lg bg-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-600 hover:text-white transition-colors"
                        >
                            <Download className="h-4 w-4" /> Export CSV
                        </a>
                    </div>

                    {/* Status tabs */}
                    <div className="mt-3 flex flex-wrap gap-2">
                        {statusTabs.map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => handleStatusTab(tab.value)}
                                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                                    statusTab === tab.value
                                        ? 'bg-amber-500 text-slate-900'
                                        : 'bg-slate-700/60 text-slate-400 hover:bg-slate-700 hover:text-white'
                                }`}
                            >
                                {tab.label}
                                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                    statusTab === tab.value ? 'bg-slate-900/30' : 'bg-slate-600'
                                }`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Table ─────────────────────────────────────────── */}
                <div className="rounded-2xl border border-slate-700/60 bg-slate-800/40 overflow-hidden">
                    {safeCredits.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                            <CreditCard className="mb-3 h-10 w-10 opacity-30" />
                            <p className="text-sm font-medium">{t.credits.empty.noCredits}</p>
                            <p className="mt-1 text-xs opacity-70">
                                {search || statusTab || shopId
                                    ? t.credits.empty.tryModifyFilters
                                    : t.credits.empty.allSettled}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-700/60 bg-slate-900/40">
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            {t.credits.columns.customerTicket}
                                        </th>
                                        {safeShops.length > 1 && (
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                {t.credits.columns.shop}
                                            </th>
                                        )}
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            {t.credits.columns.saleDate}
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            {t.credits.columns.total}
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            {t.credits.columns.paid}
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            {t.credits.columns.remaining}
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
                                            {t.credits.columns.dueDate2}
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
                                            {t.credits.columns.actions}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/40">
                                    {safeCredits.data.map((sale) => (
                                        <tr
                                            key={sale.id}
                                            className={`group transition-colors hover:bg-slate-700/20 ${
                                                sale.overdue ? 'bg-red-500/5' : ''
                                            }`}
                                        >
                                            {/* Client / Ticket */}
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-slate-900 dark:text-white">
                                                    {sale.customer?.name ?? (
                                                        <span className="italic text-slate-500">{t.credits.customer.anonymous}</span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                    <span className="font-mono">{sale.ticket_number}</span>
                                                    {sale.customer?.phone && (
                                                        <>
                                                            <span className="text-slate-700">·</span>
                                                            <span>{sale.customer.phone}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Boutique */}
                                            {safeShops.length > 1 && (
                                                <td className="px-4 py-3 text-slate-400 text-xs">
                                                    {sale.shop.name}
                                                </td>
                                            )}

                                            {/* Date */}
                                            <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                                                {new Date(sale.sale_date).toLocaleDateString('fr-FR', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </td>

                                            {/* Total */}
                                            <td className="px-4 py-3 text-right text-white font-medium whitespace-nowrap">
                                                {Number(sale.total).toLocaleString('fr-FR')}
                                                <span className="ml-1 text-xs text-slate-500">{currencySymbol}</span>
                                            </td>

                                            {/* Payé */}
                                            <td className="px-4 py-3 text-right text-emerald-400 whitespace-nowrap">
                                                {Number(sale.amount_paid).toLocaleString('fr-FR')}
                                                <span className="ml-1 text-xs text-emerald-600">{currencySymbol}</span>
                                            </td>

                                            {/* Reste */}
                                            <td className="px-4 py-3 text-right whitespace-nowrap">
                                                <span className={`font-semibold ${sale.overdue ? 'text-red-400' : 'text-amber-400'}`}>
                                                    {Number(sale.remaining_amount).toLocaleString('fr-FR')}
                                                </span>
                                                <span className="ml-1 text-xs text-slate-500">{currencySymbol}</span>
                                            </td>

                                            {/* Échéance */}
                                            <td className="px-4 py-3 text-center">
                                                <DueBadge sale={sale} />
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {/* Payer */}
                                                    <button
                                                        onClick={() => setPayModal(sale)}
                                                        title={t.credits.modals.paymentTitle}
                                                        className="flex items-center gap-1 rounded-lg bg-amber-500/15 px-2.5 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/25 transition-colors"
                                                    >
                                                        <CreditCard className="h-3.5 w-3.5" />
                                                        {t.credits.buttons.pay}
                                                    </button>

                                                    {/* Modifier échéance */}
                                                    <button
                                                        onClick={() => setDueDateModal(sale)}
                                                        title={t.credits.modals.dueDateTitle}
                                                        className="rounded-lg bg-gray-100 p-1.5 text-slate-500 hover:bg-gray-200 hover:text-slate-900 transition-colors dark:bg-slate-700/50 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
                                                    >
                                                        <Calendar className="h-3.5 w-3.5" />
                                                    </button>

                                                    {/* Voir vente */}
                                                    <Link
                                                        href={buildRoute('sales.show', { sale: sale.id })}
                                                        title={t.credits.buttons.seeSale}
                                                        className="rounded-lg bg-gray-100 p-1.5 text-slate-500 hover:bg-gray-200 hover:text-slate-900 transition-colors dark:bg-slate-700/50 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* ── Pagination ────────────────────────────────────── */}
                {safeCredits.meta?.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-slate-400">
                        <span>
                            {safeCredits.meta.from}–{safeCredits.meta.to} sur {safeCredits.meta.total} créances
                        </span>
                        <div className="flex gap-1">
                            {safeCredits.links.map((link: any, i: number) => (
                                <Link
                                    key={i}
                                    href={link.url ?? '#'}
                                    preserveState
                                    className={`rounded-lg px-3 py-1.5 transition-colors ${
                                        link.active
                                            ? 'bg-amber-500 text-slate-900 font-semibold'
                                            : link.url
                                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                            : 'bg-slate-800/40 text-slate-600 cursor-default pointer-events-none'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Modals ────────────────────────────────────────────── */}
            {payModal && (
                <PaymentModal
                    sale={payModal}
                    onClose={() => setPayModal(null)}
                    routeFn={buildRoute}
                />
            )}
            {dueDateModal && (
                <DueDateModal
                    sale={dueDateModal}
                    onClose={() => setDueDateModal(null)}
                    routeFn={buildRoute}
                />
            )}
        </AuthenticatedLayout>
    );
}
