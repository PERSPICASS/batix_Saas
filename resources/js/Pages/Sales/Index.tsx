import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Table, { TableActionButton, TableActions, TableBadge } from '@/Components/Table';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Eye, Trash2, Search, X, SlidersHorizontal, RotateCcw } from 'lucide-react';
import Currency from '@/Components/Currency';
import { useRoute } from '@/utils/route';
import { useState, useEffect } from 'react';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';
import { PageProps } from '@/types';
import { useLocale } from '@/contexts/LocaleContext';

interface Shop { id: number; name: string }
interface User { id: number; name: string }
interface Customer { id: number; name: string }

interface Sale {
    id: number;
    ticket_number: string;
    sale_date: string;
    payment_method: string;
    status: string;
    total: string;
    amount_paid: string;
    remaining_amount: string;
    credit_due_date: string | null;
    shop: Shop;
    user: User;
    customer: Customer | null;
}

interface PaginatedData { data: Sale[]; links: any; meta: any }
interface Stats {
    total_revenue: number;
    total_sales: number;
    total_credit_remaining: number;
    total_credit_sales: number;
}

interface Props extends PageProps {
    sales: PaginatedData;
    stats: Stats;
    shops: Shop[];
    filters: {
        search?: string;
        status?: string;
        shop_id?: string;
        payment_method?: string;
        date_from?: string;
        date_to?: string;
        credit_only?: string;
    };
}

export default function SalesIndex({ sales, stats, shops, filters, auth }: Props) {
    const route = useRoute();
    const { t, locale } = useLocale();
    const [deleteModal, setDeleteModal] = useState<{ show: boolean; sale: Sale | null }>({ show: false, sale: null });
    const [restoreModal, setRestoreModal] = useState<{ show: boolean; sale: Sale | null }>({ show: false, sale: null });
    const [deleting, setDeleting] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    const [search, setSearch]               = useState(filters.search ?? '');
    const [status, setStatus]               = useState(filters.status ?? '');
    const [paymentMethod, setPaymentMethod] = useState(filters.payment_method ?? '');
    const [dateFrom, setDateFrom]           = useState(filters.date_from ?? '');
    const [dateTo, setDateTo]               = useState(filters.date_to ?? '');
    const [creditOnly, setCreditOnly]       = useState(filters.credit_only === '1' || filters.credit_only === 'true');

    const canCancelSale = auth.user?.role !== 'cashier' && auth.user?.role !== 'caisse';
    const isAdmin = auth.user?.role === 'super_admin' || auth.user?.role === 'manager';

    const activeFilterCount = [status, paymentMethod, dateFrom, dateTo, creditOnly ? '1' : ''].filter(Boolean).length;

    const applyFilters = () => {
        router.get(route('sales.index'), {
            ...(search        ? { search }          : {}),
            ...(status        ? { status }          : {}),
            ...(paymentMethod ? { payment_method: paymentMethod } : {}),
            ...(dateFrom      ? { date_from: dateFrom } : {}),
            ...(dateTo        ? { date_to: dateTo }   : {}),
            ...(creditOnly    ? { credit_only: '1' }  : {}),
        }, { preserveState: true, replace: true });
    };

    const resetFilters = () => {
        setSearch(''); setStatus(''); setPaymentMethod(''); setDateFrom(''); setDateTo(''); setCreditOnly(false);
        router.get(route('sales.index'), {}, { preserveState: false, replace: true });
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(route('sales.index'), {
                ...(search        ? { search }          : {}),
                ...(status        ? { status }          : {}),
                ...(paymentMethod ? { payment_method: paymentMethod } : {}),
                ...(dateFrom      ? { date_from: dateFrom } : {}),
                ...(dateTo        ? { date_to: dateTo }   : {}),
                ...(creditOnly    ? { credit_only: '1' }  : {}),
            }, { preserveState: true, replace: true });
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    const handleDelete = (sale: Sale) => setDeleteModal({ show: true, sale });
    const handleRestore = (sale: Sale) => setRestoreModal({ show: true, sale });

    const confirmRestore = () => {
        if (!restoreModal.sale) return;
        setRestoring(true);
        router.patch(route('sales.restore', { sale: restoreModal.sale.id }), {}, {
            onSuccess: () => { setRestoreModal({ show: false, sale: null }); setRestoring(false); },
            onError: () => setRestoring(false),
        });
    };

    const confirmDelete = () => {
        if (!deleteModal.sale) return;
        setDeleting(true);
        router.delete(route('sales.destroy', { sale: deleteModal.sale.id }), {
            onSuccess: () => { setDeleteModal({ show: false, sale: null }); setDeleting(false); },
            onError: () => setDeleting(false),
        });
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'completed': return 'success';
            case 'pending':   return 'warning';
            case 'cancelled':
            case 'returned':  return 'danger';
            default:          return 'default';
        }
    };

    const statusLabels: Record<string, string> = {
        completed: t.common.status.completed,
        pending:   t.common.status.pending,
        cancelled: t.common.status.cancelled,
        returned:  t.common.status.returned,
    };

    const paymentMethodLabels: Record<string, string> = {
        cash:     t.common.payment.cash,
        card:     t.common.payment.card,
        transfer: t.common.payment.transfer,
        check:    t.common.payment.check,
        mobile:   t.common.payment.mobile,
        multiple: t.common.payment.multiple,
        credit:   t.common.payment.credit,
    };

    const totalCount = sales.meta?.total ?? sales.data.length;

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-slate-900 dark:text-white">{t.sales.title}</h1>}>
            <Head title={t.sales.title} />
            <section className="space-y-4">
                <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-white/5">
                        <h3 className="text-sm text-slate-500 dark:text-slate-400">{t.sales.stats.revenue}</h3>
                        <p className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-300">
                            <Currency amount={parseFloat(String(stats.total_revenue))} />
                        </p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-white/5">
                        <h3 className="text-sm text-slate-500 dark:text-slate-400">{t.sales.stats.count}</h3>
                        <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{stats.total_sales}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-white/5">
                        <h3 className="text-sm text-slate-500 dark:text-slate-400">{t.sales.stats.credits}</h3>
                        <p className="mt-2 text-3xl font-bold text-rose-600 dark:text-rose-400">
                            <Currency amount={parseFloat(String(stats.total_credit_remaining))} />
                        </p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-white/5">
                        <h3 className="text-sm text-slate-500 dark:text-slate-400">{t.sales.stats.creditSales}</h3>
                        <p className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-300">{stats.total_credit_sales}</p>
                    </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder={t.sales.filters.searchPlaceholder}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-300 focus:outline-none dark:border-white/15 dark:bg-slate-900/70 dark:text-white dark:placeholder-slate-500"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white">
                                <X className="size-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowFilters(v => !v)}
                            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${showFilters || activeFilterCount > 0 ? 'border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-300/50 dark:bg-amber-300/10 dark:text-amber-300' : 'border-gray-300 text-slate-600 hover:bg-gray-100 dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/5'}`}
                        >
                            <SlidersHorizontal className="size-4" />
                            {t.sales.filters.filters}
                            {activeFilterCount > 0 && (
                                <span className="flex size-5 items-center justify-center rounded-full bg-amber-300 text-xs font-bold text-slate-950">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>

                        {(search || activeFilterCount > 0) && (
                            <button onClick={resetFilters} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-500 hover:text-slate-900 dark:border-white/15 dark:text-slate-400 dark:hover:text-white">
                                <X className="size-4" /> {t.sales.filters.reset}
                            </button>
                        )}

                        <Link
                            href={route('sales.create')}
                            className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200"
                        >
                            <Plus className="size-4" /> {t.sales.actions.new}
                        </Link>
                    </div>
                </div>

                {showFilters && (
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">{t.sales.filters.status}</label>
                                <select
                                    value={status}
                                    onChange={e => setStatus(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-300 focus:outline-none dark:border-white/15 dark:bg-slate-900/70 dark:text-white"
                                >
                                    <option value="">{t.sales.filters.allStatuses}</option>
                                    <option value="completed">{t.sales.status.completed}</option>
                                    <option value="pending">{t.sales.status.pending}</option>
                                    <option value="cancelled">{t.sales.status.cancelled}</option>
                                    <option value="returned">{t.sales.status.returned}</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">{t.sales.filters.paymentMethod}</label>
                                <select
                                    value={paymentMethod}
                                    onChange={e => setPaymentMethod(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-300 focus:outline-none dark:border-white/15 dark:bg-slate-900/70 dark:text-white"
                                >
                                    <option value="">{t.sales.filters.allMethods}</option>
                                    <option value="cash">{t.common.payment.cash}</option>
                                    <option value="card">{t.common.payment.card}</option>
                                    <option value="transfer">{t.common.payment.transfer}</option>
                                    <option value="check">{t.common.payment.check}</option>
                                    <option value="mobile">{t.common.payment.mobile}</option>
                                    <option value="multiple">{t.common.payment.multiple}</option>
                                    <option value="credit">{t.common.payment.credit}</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">{t.sales.filters.dateFrom}</label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={e => setDateFrom(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-300 focus:outline-none dark:border-white/15 dark:bg-slate-900/70 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">{t.sales.filters.dateTo}</label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={e => setDateTo(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-300 focus:outline-none dark:border-white/15 dark:bg-slate-900/70 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="mt-3 flex items-center gap-3">
                            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={creditOnly}
                                    onChange={e => setCreditOnly(e.target.checked)}
                                    className="size-4 rounded border-gray-300 bg-white accent-amber-300 dark:border-white/20 dark:bg-slate-800"
                                />
                                {t.sales.filters.creditOnlyLabel}
                            </label>
                        </div>

                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={applyFilters}
                                className="rounded-lg bg-amber-300 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200"
                            >
                                {t.sales.filters.applyFilters}
                            </button>
                        </div>
                    </div>
                )}

                <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t.sales.countLabel(totalCount)}
                    {(search || activeFilterCount > 0) && ` · ${t.sales.filtered}`}
                </p>

                <Table
                    data={sales.data}
                    columns={[
                        { key: 'ticket_number', label: t.sales.columns.ticket },
                        {
                            key: 'sale_date',
                            label: t.sales.columns.date,
                            render: (sale) =>
                                new Date(sale.sale_date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                }),
                        },
                        {
                            key: 'customer',
                            label: t.sales.columns.customer,
                            render: (sale) => sale.customer?.name || t.sales.anonymous,
                        },
                        {
                            key: 'payment_method',
                            label: t.sales.columns.payment,
                            render: (sale) => paymentMethodLabels[sale.payment_method] || sale.payment_method,
                        },
                        {
                            key: 'total',
                            label: t.sales.columns.total,
                            align: 'right',
                            render: (sale) => <Currency amount={parseFloat(sale.total)} />,
                        },
                        {
                            key: 'remaining_amount',
                            label: t.sales.columns.remaining,
                            align: 'right',
                            render: (sale) => parseFloat(sale.remaining_amount) > 0 ? (
                                <span className="font-semibold text-rose-400">
                                    <Currency amount={parseFloat(sale.remaining_amount)} />
                                </span>
                            ) : (
                                <span className="text-slate-500">—</span>
                            ),
                        },
                        {
                            key: 'status',
                            label: t.sales.columns.status,
                            align: 'center',
                            render: (sale) => (
                                <TableBadge variant={getStatusVariant(sale.status)}>
                                    {statusLabels[sale.status] || sale.status}
                                </TableBadge>
                            ),
                        },
                        {
                            key: 'user',
                            label: t.sales.columns.seller,
                            render: (sale) => sale.user.name,
                        },
                        {
                            key: 'actions',
                            label: t.sales.columns.actions,
                            align: 'right',
                            render: (sale) => (
                                <TableActions>
                                    <Link
                                        href={route('sales.show', { sale: sale.id })}
                                        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
                                    >
                                        <Eye className="size-3.5" /> {t.sales.actions.view}
                                    </Link>
                                    {canCancelSale && sale.status !== 'cancelled' && (isAdmin || sale.status === 'completed') && (
                                        <TableActionButton variant="danger" onClick={() => handleDelete(sale)}>
                                            <Trash2 className="size-3.5" /> {t.sales.actions.cancel}
                                        </TableActionButton>
                                    )}
                                    {isAdmin && sale.status === 'cancelled' && (
                                        <TableActionButton variant="success" onClick={() => handleRestore(sale)}>
                                            <RotateCcw className="size-3.5" /> {t.sales.actions.reactivate}
                                        </TableActionButton>
                                    )}
                                </TableActions>
                            ),
                        },
                    ]}
                    emptyMessage={t.sales.emptyMessage}
                />

                {sales.links && (
                    <div className="flex items-center justify-center gap-1">
                        {sales.links.map((link: any, index: number) => (
                            <Link
                                key={index}
                                href={link.url || '#'}
                                className={`rounded-lg px-3 py-2 text-sm ${
                                    link.active
                                        ? 'bg-amber-300 text-slate-950 font-semibold'
                                        : 'border border-gray-300 text-slate-600 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10'
                                } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}

                <ConfirmDeleteModal
                    show={deleteModal.show}
                    onClose={() => setDeleteModal({ show: false, sale: null })}
                    onConfirm={confirmDelete}
                    title={t.sales.cancelModal.title}
                    message={`Êtes-vous sûr de vouloir annuler la vente "${deleteModal.sale?.ticket_number}" ?`}
                    confirmText={t.sales.actions.cancel}
                    processing={deleting}
                />

                {restoreModal.show && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                        <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-slate-900">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-400/10">
                                    <RotateCcw className="size-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t.sales.restoreModal.title}</h3>
                            </div>
                            <p className="mb-2 text-sm text-slate-600 dark:text-slate-300">
                                {t.sales.restoreModal.body(restoreModal.sale?.ticket_number ?? '')}
                            </p>
                            <p className="mb-6 text-xs text-slate-500 dark:text-slate-400">{t.sales.restoreModal.note}</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={confirmRestore}
                                    disabled={restoring}
                                    className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
                                >
                                    {restoring ? t.common.actions.processing : t.sales.restoreModal.confirm}
                                </button>
                                <button
                                    onClick={() => setRestoreModal({ show: false, sale: null })}
                                    className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm text-slate-600 hover:bg-gray-100 dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/5"
                                >
                                    {t.common.actions.close}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </AuthenticatedLayout>
    );
}
