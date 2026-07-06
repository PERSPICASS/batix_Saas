import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2, Eye, Search, ShoppingCart, Package, Calendar, DollarSign } from 'lucide-react';
import Table, { TableActions, TableActionButton, TableBadge } from '@/Components/Table';
import { useState, FormEventHandler } from 'react';
import { useRoute } from '@/utils/route';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';
import { useLocale } from '@/contexts/LocaleContext';

interface Supplier { id: number; name: string; company_name: string | null }
interface User { id: number; name: string }
interface PurchaseItem { id: number; quantity_ordered: number; quantity_received: number }

interface Purchase {
    id: number;
    reference: string;
    status: 'draft' | 'confirmed' | 'received' | 'partial' | 'cancelled';
    order_date: string;
    expected_date: string | null;
    received_date: string | null;
    total: string;
    currency: string;
    supplier: Supplier;
    user: User;
    items: PurchaseItem[];
}

interface PaginatedPurchases {
    data: Purchase[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface SupplierOption { id: number; name: string }

interface Props {
    code_user: string;
    purchases: PaginatedPurchases;
    suppliers: SupplierOption[];
    currency: string;
    filters: { search?: string; status?: string; supplier_id?: string };
}

export default function PurchasesIndex({ code_user, purchases, suppliers, currency, filters }: Props) {
    const route = useRoute();
    const { t, locale } = useLocale();
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [supplierId, setSupplierId] = useState(filters.supplier_id || '');
    const [deleteModal, setDeleteModal] = useState<{ show: boolean; purchase: Purchase | null }>({ show: false, purchase: null });
    const [deleting, setDeleting] = useState(false);

    const handleFilter: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(
            route('purchases.index', { code_user }),
            { search, status: status !== 'all' ? status : undefined, supplier_id: supplierId || undefined },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleDelete = (purchase: Purchase) => setDeleteModal({ show: true, purchase });

    const confirmDelete = () => {
        if (!deleteModal.purchase) return;
        setDeleting(true);
        router.delete(route('purchases.destroy', { code_user, purchase: deleteModal.purchase.id }), {
            onSuccess: () => { setDeleteModal({ show: false, purchase: null }); setDeleting(false); },
            onError: () => setDeleting(false),
        });
    };

    const statusLabels: Record<string, string> = {
        draft: t.purchases.status.draft,
        confirmed: t.purchases.status.confirmed,
        received: t.purchases.status.received,
        partial: t.purchases.status.partial,
        cancelled: t.purchases.status.cancelled,
    };

    const getStatusBadge = (status: Purchase['status']) => {
        const variants: Record<string, 'default' | 'info' | 'warning' | 'success' | 'danger'> = {
            draft: 'default',
            confirmed: 'info',
            partial: 'warning',
            received: 'success',
            cancelled: 'danger',
        };
        return <TableBadge variant={variants[status] ?? 'default'}>{statusLabels[status]}</TableBadge>;
    };

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', {
            day: '2-digit', month: '2-digit', year: 'numeric',
        });

    const formatCurrencyVal = (amount: string, curr: string) =>
        new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', { style: 'currency', currency: curr }).format(parseFloat(amount));

    const columns = [
        {
            key: 'reference',
            label: t.purchases.columns.reference,
            render: (purchase: Purchase) => (
                <div>
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="size-4 text-amber-300" />
                        <span className="font-medium">{purchase.reference}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t.purchases.items(purchase.items.length)}</div>
                </div>
            ),
        },
        {
            key: 'supplier',
            label: t.purchases.columns.supplier,
            render: (purchase: Purchase) => (
                <div>
                    <div className="font-medium">{purchase.supplier.name}</div>
                    {purchase.supplier.company_name && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">{purchase.supplier.company_name}</div>
                    )}
                </div>
            ),
        },
        {
            key: 'dates',
            label: t.purchases.columns.date,
            render: (purchase: Purchase) => (
                <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <Calendar className="size-3.5" />
                        <span>{t.purchases.dates.order} {formatDate(purchase.order_date)}</span>
                    </div>
                    {purchase.expected_date && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">{t.purchases.dates.expected} {formatDate(purchase.expected_date)}</div>
                    )}
                    {purchase.received_date && (
                        <div className="text-xs text-green-400">{t.purchases.dates.received} {formatDate(purchase.received_date)}</div>
                    )}
                </div>
            ),
        },
        {
            key: 'status',
            label: t.purchases.columns.status,
            render: (purchase: Purchase) => getStatusBadge(purchase.status),
        },
        {
            key: 'total',
            label: t.purchases.columns.total,
            render: (purchase: Purchase) => (
                <span className="font-semibold text-green-400">{formatCurrencyVal(purchase.total, purchase.currency)}</span>
            ),
        },
        {
            key: 'actions',
            label: t.purchases.columns.actions,
            render: (purchase: Purchase) => (
                <TableActions>
                    <Link href={route('purchases.show', { code_user, purchase: purchase.id })}>
                        <TableActionButton><Eye className="size-4" /> {t.purchases.actions.view}</TableActionButton>
                    </Link>
                    {purchase.status === 'draft' && (
                        <>
                            <Link href={route('purchases.edit', { code_user, purchase: purchase.id })}>
                                <TableActionButton><Pencil className="size-4" /> {t.purchases.actions.edit}</TableActionButton>
                            </Link>
                            <TableActionButton onClick={() => handleDelete(purchase)} variant="danger">
                                <Trash2 className="size-4" /> {t.purchases.actions.delete}
                            </TableActionButton>
                        </>
                    )}
                    {purchase.status === 'cancelled' && (
                        <TableActionButton onClick={() => handleDelete(purchase)} variant="danger">
                            <Trash2 className="size-4" /> {t.purchases.actions.delete}
                        </TableActionButton>
                    )}
                </TableActions>
            ),
        },
    ];

    const pendingCount = purchases.data.filter(p => p.status === 'confirmed' || p.status === 'partial').length;
    const receivedCount = purchases.data.filter(p => p.status === 'received').length;
    const totalValue = purchases.data
        .filter(p => p.status !== 'cancelled')
        .reduce((sum, p) => sum + parseFloat(p.total), 0)
        .toString();

    return (
        <AuthenticatedLayout>
            <Head title={t.purchases.titleLong} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.purchases.titleLong}</h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.purchases.subtitle}</p>
                    </div>
                    <Link
                        href={route('purchases.create', { code_user })}
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
                    >
                        <Plus className="size-5" />
                        {t.purchases.newLong}
                    </Link>
                </div>

                <form onSubmit={handleFilter} className="rounded-xl bg-gray-100 p-4 dark:bg-slate-800/50">
                    <div className="grid gap-4 md:grid-cols-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{t.common.actions.search}</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={t.purchases.filters.searchPlaceholder}
                                    className="w-full rounded-lg border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-300 focus:ring-amber-300 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white dark:placeholder-slate-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{t.common.misc.status}</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full rounded-lg border-gray-300 bg-white py-2 px-4 text-sm text-slate-900 focus:border-amber-300 focus:ring-amber-300 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white"
                            >
                                <option value="all">{t.purchases.filters.allStatuses}</option>
                                <option value="draft">{t.purchases.status.draft}</option>
                                <option value="confirmed">{t.purchases.status.confirmed}</option>
                                <option value="partial">{t.purchases.status.partial}</option>
                                <option value="received">{t.purchases.status.received}</option>
                                <option value="cancelled">{t.purchases.status.cancelled}</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{t.nav.suppliers}</label>
                            <select
                                value={supplierId}
                                onChange={(e) => setSupplierId(e.target.value)}
                                className="w-full rounded-lg border-gray-300 bg-white py-2 px-4 text-sm text-slate-900 focus:border-amber-300 focus:ring-amber-300 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white"
                            >
                                <option value="">{t.purchases.filters.allSuppliers}</option>
                                {suppliers.map((supplier) => (
                                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                type="submit"
                                className="w-full rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
                            >
                                {t.common.actions.filter}
                            </button>
                        </div>
                    </div>
                </form>

                <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-xl bg-gray-100 p-4 dark:bg-slate-800/50">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-blue-500/10 p-3"><ShoppingCart className="size-6 text-blue-400" /></div>
                            <div>
                                <div className="text-2xl font-bold text-slate-900 dark:text-white">{purchases.total}</div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">{t.purchases.stats.total}</div>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl bg-gray-100 p-4 dark:bg-slate-800/50">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-yellow-500/10 p-3"><Package className="size-6 text-yellow-400" /></div>
                            <div>
                                <div className="text-2xl font-bold text-slate-900 dark:text-white">{pendingCount}</div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">{t.purchases.stats.pending}</div>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl bg-gray-100 p-4 dark:bg-slate-800/50">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-green-500/10 p-3"><Package className="size-6 text-green-400" /></div>
                            <div>
                                <div className="text-2xl font-bold text-slate-900 dark:text-white">{receivedCount}</div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">{t.purchases.stats.received}</div>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl bg-gray-100 p-4 dark:bg-slate-800/50">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-amber-500/10 p-3"><DollarSign className="size-6 text-amber-400" /></div>
                            <div>
                                <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrencyVal(totalValue, currency)}</div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">{t.purchases.stats.totalValue}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <Table columns={columns} data={purchases.data} emptyMessage={t.purchases.emptyMessage} />

                {purchases.last_page > 1 && (
                    <div className="mt-6 flex items-center justify-center gap-2">
                        {purchases.links.map((link, index) => {
                            if (link.url === null) {
                                return (
                                    <span
                                        key={index}
                                        className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5"
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                );
                            }
                            return (
                                <Link
                                    key={index}
                                    href={link.url}
                                    preserveState
                                    preserveScroll
                                    className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                                        link.active
                                            ? 'border-amber-300 bg-amber-300 text-slate-950 font-semibold'
                                            : 'border-gray-300 bg-white text-slate-600 hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            );
                        })}
                    </div>
                )}
            </div>

            <ConfirmDeleteModal
                show={deleteModal.show}
                onClose={() => setDeleteModal({ show: false, purchase: null })}
                onConfirm={confirmDelete}
                title={t.purchases.deleteTitle}
                message={t.purchases.deleteMessage(deleteModal.purchase?.reference ?? '')}
                processing={deleting}
            />
        </AuthenticatedLayout>
    );
}
