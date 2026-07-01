import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Eye, Edit, Trash2, Play, Pause, RefreshCw, FileText, Search } from 'lucide-react';
import { useState } from 'react';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';
import { useRoute } from '@/utils/route';
import Currency from '@/Components/Currency';
import { useLocale } from '@/contexts/LocaleContext';

interface RecurringInvoice {
    id: number;
    invoice_prefix: string;
    customer: {
        id: number;
        name: string;
        email: string;
    };
    frequency: 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
    next_invoice_date: string;
    total: number;
    is_active: boolean;
}

export default function RecurringInvoicesIndex({ recurringInvoices, filters = {} }: { recurringInvoices: any; filters?: any }) {
    const route = useRoute();
    const { t, locale } = useLocale();
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    const handleSearch = () => {
        router.get(route('recurring-invoices.index'), { search: searchTerm, status: statusFilter }, { preserveState: true });
    };

    const handleDelete = (id: number) => {
        router.delete(route('recurring-invoices.destroy', { recurring_invoice: id }), {
            onSuccess: () => setConfirmDelete(null),
        });
    };

    const handleToggleActive = (id: number) => {
        router.post(route('recurring-invoices.toggle', { recurring_invoice: id }), {});
    };

    const handleGenerateNow = (id: number) => {
        router.post(route('recurring-invoices.generate', { recurring_invoice: id }), {});
    };

    const columns = [
        {
            key: 'invoice_prefix',
            label: t.recurringInvoices.columns.cycle,
            render: (ri: RecurringInvoice) => <span className="font-bold text-amber-300">{ri.invoice_prefix}</span>,
        },
        {
            key: 'customer',
            label: t.recurringInvoices.columns.customer,
            render: (ri: RecurringInvoice) => (
                <div>
                    <p className="font-medium text-white">{ri.customer.name}</p>
                    <p className="text-xs text-slate-400">{ri.customer.email}</p>
                </div>
            ),
        },
        {
            key: 'frequency',
            label: t.recurringInvoices.columns.frequency,
            render: (ri: RecurringInvoice) => (
                <span className="inline-flex rounded-full bg-blue-500/20 px-2 py-1 text-xs font-medium text-blue-300">
                    {t.recurringInvoices.frequency[ri.frequency as keyof typeof t.recurringInvoices.frequency]}
                </span>
            ),
        },
        {
            key: 'next_invoice_date',
            label: t.recurringInvoices.columns.nextInvoiceDate,
            render: (ri: RecurringInvoice) => (
                <span className="text-sm text-slate-400">{new Date(ri.next_invoice_date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB')}</span>
            ),
        },
        {
            key: 'total',
            label: t.recurringInvoices.columns.amount,
            render: (ri: RecurringInvoice) => <span className="font-semibold text-green-400"><Currency amount={parseFloat(String(ri.total))} /></span>,
        },
        {
            key: 'status',
            label: t.recurringInvoices.columns.status,
            render: (ri: RecurringInvoice) => (
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                    ri.is_active
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-slate-500/20 text-slate-400'
                }`}>
                    {ri.is_active ? t.recurringInvoices.status.active : t.recurringInvoices.status.inactive}
                </span>
            ),
        },
        {
            key: 'actions',
            label: t.recurringInvoices.columns.actions,
            render: (ri: RecurringInvoice) => (
                <div className="flex gap-2">
                    <Link
                        href={route('recurring-invoices.show', { recurring_invoice: ri.id })}
                        className="p-2 text-blue-400 hover:bg-blue-500/10 rounded"
                        title={t.recurringInvoices.actions.view}
                    >
                        <Eye size={16} />
                    </Link>
                    <Link
                        href={route('recurring-invoices.edit', { recurring_invoice: ri.id })}
                        className="p-2 text-amber-400 hover:bg-amber-500/10 rounded"
                        title={t.recurringInvoices.actions.edit}
                    >
                        <Edit size={16} />
                    </Link>
                    <button
                        onClick={() => handleGenerateNow(ri.id)}
                        className="p-2 text-green-400 hover:bg-green-500/10 rounded"
                        title={t.recurringInvoices.actions.generateNow}
                    >
                        <RefreshCw size={16} />
                    </button>
                    <button
                        onClick={() => handleToggleActive(ri.id)}
                        className={`p-2 rounded ${
                            ri.is_active
                                ? 'text-orange-400 hover:bg-orange-500/10'
                                : 'text-blue-400 hover:bg-blue-500/10'
                        }`}
                        title={ri.is_active ? t.recurringInvoices.actions.pause : t.recurringInvoices.actions.resume}
                    >
                        {ri.is_active ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <button
                        onClick={() => setConfirmDelete(ri.id)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded"
                        title={t.recurringInvoices.actions.delete}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ),
        },
    ];

    const activeCount = recurringInvoices.data?.filter((ri: RecurringInvoice) => ri.is_active).length || 0;
    const inactiveCount = recurringInvoices.data?.filter((ri: RecurringInvoice) => !ri.is_active).length || 0;

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">{t.recurringInvoices.title}</h1>}>
            <Head title={t.recurringInvoices.title} />

            <section className="space-y-6">
                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm text-slate-400">{t.recurringInvoices.stats.totalCycles}</p>
                        <p className="mt-1 text-2xl font-bold text-white">{recurringInvoices.total}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm text-slate-400">{t.recurringInvoices.stats.active}</p>
                        <p className="mt-1 text-2xl font-bold text-green-400">{activeCount}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm text-slate-400">{t.recurringInvoices.stats.inactive}</p>
                        <p className="mt-1 text-2xl font-bold text-slate-400">{inactiveCount}</p>
                    </div>
                </div>

                {/* Filtres */}
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="relative flex-1 min-w-64">
                            <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder={t.recurringInvoices.filters.searchPlaceholder}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-full rounded-lg border border-white/15 bg-slate-900/70 pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="rounded-lg border border-white/15 bg-slate-900/70 px-4 py-2 text-sm text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                        >
                            <option value="">{t.recurringInvoices.filters.allStatuses}</option>
                            <option value="active">{t.recurringInvoices.filters.activeStatus}</option>
                            <option value="expired">{t.recurringInvoices.filters.expiredStatus}</option>
                        </select>
                        <button
                            onClick={handleSearch}
                            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5"
                        >
                            {t.recurringInvoices.filters.search}
                        </button>
                        <Link
                            href={route('recurring-invoices.create')}
                            className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-200"
                        >
                            <Plus className="size-4" />
                            {t.recurringInvoices.actions.new}
                        </Link>
                    </div>
                </div>

                {/* Tableau */}
                <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                {columns.map((col) => (
                                    <th key={col.key} className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {recurringInvoices.data?.map((ri: RecurringInvoice, index: number) => (
                                <tr key={index} className="hover:bg-white/5">
                                    {columns.map((col) => (
                                        <td key={`${index}-${col.key}`} className="px-6 py-4 text-sm">
                                            {col.render(ri)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {recurringInvoices.data?.length === 0 && (
                        <div className="px-6 py-12 text-center text-slate-400">
                            {t.recurringInvoices.emptyMessage}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {recurringInvoices.links && (
                    <div className="flex items-center justify-center gap-1">
                        {recurringInvoices.links.map((link: any, index: number) => (
                            <Link
                                key={index}
                                href={link.url || '#'}
                                className={`rounded-lg px-3 py-2 text-sm ${
                                    link.active
                                        ? 'bg-amber-300 text-slate-950 font-semibold'
                                        : 'border border-white/15 text-slate-200 hover:bg-white/10'
                                } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </section>

            {confirmDelete && (
                <ConfirmDeleteModal
                    show={true}
                    onClose={() => setConfirmDelete(null)}
                    onConfirm={() => handleDelete(confirmDelete)}
                    title={t.recurringInvoices.modal.deleteTitle}
                    message={t.recurringInvoices.modal.deleteMessage}
                />
            )}
        </AuthenticatedLayout>
    );
}
