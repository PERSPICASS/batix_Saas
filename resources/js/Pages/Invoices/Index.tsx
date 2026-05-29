import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import Table, { TableActions, TableActionButton } from '@/Components/Table';
import { useState } from 'react';
import { useRoute } from '@/utils/route';
import Currency from '@/Components/Currency';
import { useLocale } from '@/contexts/LocaleContext';

interface Customer { id: number; name: string }
interface Invoice {
    id: number;
    invoice_number: string;
    invoice_date: string;
    due_date: string;
    status: string;
    total: string | number | null;
    total_amount?: string | number | null;
    customer: Customer;
}

interface PaginatedInvoices {
    data: Invoice[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props { invoices: PaginatedInvoices }

export default function InvoicesIndex({ invoices }: Props) {
    const route = useRoute();
    const { t, locale } = useLocale();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const handleSearch = () => {
        router.get(route('invoices.index'), { search: searchTerm, status: statusFilter }, { preserveState: true });
    };

    const handleDelete = (invoice: Invoice) => {
        if (confirm(`${t.invoices.filters.searchPlaceholder.replace('...', '')} ${invoice.invoice_number} ?`)) {
            router.delete(route('invoices.destroy', { invoice: invoice.id }));
        }
    };

    const statusLabels: Record<string, string> = {
        draft: t.invoices.status.draft,
        sent: t.invoices.status.sent,
        paid: t.invoices.status.paid,
        overdue: t.invoices.status.overdue,
        cancelled: t.invoices.status.cancelled,
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { bg: string; text: string }> = {
            draft: { bg: 'bg-slate-500/20', text: 'text-slate-300' },
            sent: { bg: 'bg-blue-500/20', text: 'text-blue-300' },
            paid: { bg: 'bg-green-500/20', text: 'text-green-300' },
            overdue: { bg: 'bg-red-500/20', text: 'text-red-300' },
            cancelled: { bg: 'bg-gray-500/20', text: 'text-gray-300' },
        };
        const badge = badges[status] || badges.draft;
        return (
            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${badge.bg} ${badge.text}`}>
                {statusLabels[status] || status}
            </span>
        );
    };

    const getInvoiceTotal = (invoice: Invoice): number => {
        const value = Number(invoice.total ?? invoice.total_amount ?? 0);
        return Number.isFinite(value) ? value : 0;
    };

    const columns = [
        {
            key: 'invoice_number',
            label: t.invoices.columns.number,
            render: (invoice: Invoice) => (
                <span className="font-medium text-amber-300">{invoice.invoice_number}</span>
            ),
        },
        {
            key: 'customer',
            label: t.invoices.columns.customer,
            render: (invoice: Invoice) => invoice.customer.name,
        },
        {
            key: 'invoice_date',
            label: t.invoices.columns.date,
            render: (invoice: Invoice) => new Date(invoice.invoice_date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB'),
        },
        {
            key: 'due_date',
            label: t.invoices.columns.dueDate,
            render: (invoice: Invoice) => new Date(invoice.due_date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB'),
        },
        {
            key: 'status',
            label: t.invoices.columns.status,
            render: (invoice: Invoice) => getStatusBadge(invoice.status),
        },
        {
            key: 'total',
            label: t.invoices.columns.total,
            render: (invoice: Invoice) => (
                <span className="font-semibold"><Currency amount={getInvoiceTotal(invoice)} /></span>
            ),
        },
        {
            key: 'actions',
            label: t.invoices.columns.actions,
            align: 'right' as const,
            render: (invoice: Invoice) => (
                <TableActions>
                    <Link
                        href={route('invoices.show', { invoice: invoice.id })}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/10"
                    >
                        <Eye className="size-3.5" /> {t.invoices.actions.view}
                    </Link>
                    <Link
                        href={route('invoices.edit', { invoice: invoice.id })}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/10"
                    >
                        <Pencil className="size-3.5" /> {t.invoices.actions.edit}
                    </Link>
                    <TableActionButton variant="danger" onClick={() => handleDelete(invoice)}>
                        <Trash2 className="size-3.5" /> {t.invoices.actions.delete}
                    </TableActionButton>
                </TableActions>
            ),
        },
    ];

    const statCounts = {
        total: invoices.total,
        paid: invoices.data.filter(inv => inv.status === 'paid').length,
        sent: invoices.data.filter(inv => inv.status === 'sent').length,
        overdue: invoices.data.filter(inv => inv.status === 'overdue').length,
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">{t.invoices.title}</h1>}>
            <Head title={t.invoices.title} />

            <section className="space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm text-slate-400">{t.invoices.title}</p>
                        <p className="mt-1 text-2xl font-bold text-white">{statCounts.total}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm text-slate-400">{t.invoices.status.paid}</p>
                        <p className="mt-1 text-2xl font-bold text-green-400">{statCounts.paid}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm text-slate-400">{t.invoices.status.sent}</p>
                        <p className="mt-1 text-2xl font-bold text-blue-400">{statCounts.sent}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm text-slate-400">{t.invoices.status.overdue}</p>
                        <p className="mt-1 text-2xl font-bold text-red-400">{statCounts.overdue}</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <input
                        type="text"
                        placeholder={t.invoices.filters.searchPlaceholder}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="flex-1 rounded-lg border border-white/15 bg-slate-900/70 px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                    />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="rounded-lg border border-white/15 bg-slate-900/70 px-4 py-2 text-sm text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                    >
                        <option value="">{t.invoices.filters.allStatuses}</option>
                        <option value="draft">{t.invoices.status.draft}</option>
                        <option value="sent">{t.invoices.status.sent}</option>
                        <option value="paid">{t.invoices.status.paid}</option>
                        <option value="overdue">{t.invoices.status.overdue}</option>
                        <option value="cancelled">{t.invoices.status.cancelled}</option>
                    </select>
                    <button
                        onClick={handleSearch}
                        className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5"
                    >
                        {t.common.actions.search}
                    </button>
                    <Link
                        href={route('invoices.create')}
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-200"
                    >
                        <Plus className="size-4" /> {t.invoices.actions.new}
                    </Link>
                </div>

                <Table columns={columns} data={invoices.data} />

                {invoices.links && (
                    <div className="flex items-center justify-center gap-1">
                        {invoices.links.map((link, index) => (
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
        </AuthenticatedLayout>
    );
}
