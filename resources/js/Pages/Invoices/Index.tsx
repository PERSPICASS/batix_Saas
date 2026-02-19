import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import Table, { TableActions, TableActionButton } from '@/Components/Table';
import { useState } from 'react';

interface Customer {
    id: number;
    name: string;
}

interface Invoice {
    id: number;
    invoice_number: string;
    invoice_date: string;
    due_date: string;
    status: string;
    total_amount: string;
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

interface Props {
    invoices: PaginatedInvoices;
}

export default function InvoicesIndex({ invoices }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const handleSearch = () => {
        router.get(
            route('invoices.index'),
            { search: searchTerm, status: statusFilter },
            { preserveState: true }
        );
    };

    const handleDelete = (invoice: Invoice) => {
        if (confirm(`Êtes-vous sûr de vouloir supprimer la facture ${invoice.invoice_number} ?`)) {
            router.delete(route('invoices.destroy', invoice.id));
        }
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { bg: string; text: string }> = {
            draft: { bg: 'bg-slate-500/20', text: 'text-slate-300' },
            sent: { bg: 'bg-blue-500/20', text: 'text-blue-300' },
            paid: { bg: 'bg-green-500/20', text: 'text-green-300' },
            overdue: { bg: 'bg-red-500/20', text: 'text-red-300' },
            cancelled: { bg: 'bg-gray-500/20', text: 'text-gray-300' },
        };

        const statusLabels: Record<string, string> = {
            draft: 'Brouillon',
            sent: 'Envoyée',
            paid: 'Payée',
            overdue: 'En retard',
            cancelled: 'Annulée',
        };

        const badge = badges[status] || badges.draft;

        return (
            <span
                className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${badge.bg} ${badge.text}`}
            >
                {statusLabels[status] || status}
            </span>
        );
    };

    const columns = [
        {
            key: 'invoice_number',
            label: 'Numéro',
            render: (invoice: Invoice) => (
                <span className="font-medium text-amber-300">{invoice.invoice_number}</span>
            ),
        },
        {
            key: 'customer',
            label: 'Client',
            render: (invoice: Invoice) => invoice.customer.name,
        },
        {
            key: 'invoice_date',
            label: 'Date',
            render: (invoice: Invoice) => new Date(invoice.invoice_date).toLocaleDateString('fr-FR'),
        },
        {
            key: 'due_date',
            label: 'Échéance',
            render: (invoice: Invoice) => new Date(invoice.due_date).toLocaleDateString('fr-FR'),
        },
        {
            key: 'status',
            label: 'Statut',
            render: (invoice: Invoice) => getStatusBadge(invoice.status),
        },
        {
            key: 'total_amount',
            label: 'Montant TTC',
            render: (invoice: Invoice) => (
                <span className="font-semibold">
                    {parseFloat(invoice.total_amount).toLocaleString('fr-FR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}{' '}
                    DH
                </span>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            align: 'right' as const,
            render: (invoice: Invoice) => (
                <TableActions>
                    <Link
                        href={route('invoices.edit', invoice.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/10"
                    >
                        <Pencil className="size-3.5" /> Modifier
                    </Link>
                    <TableActionButton variant="danger" onClick={() => handleDelete(invoice)}>
                        <Trash2 className="size-3.5" /> Supprimer
                    </TableActionButton>
                </TableActions>
            ),
        },
    ];

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">Factures</h1>}>
            <Head title="Factures" />

            <section className="space-y-6">
                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm text-slate-400">Total factures</p>
                        <p className="mt-1 text-2xl font-bold text-white">{invoices.total}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm text-slate-400">Payées</p>
                        <p className="mt-1 text-2xl font-bold text-green-400">
                            {invoices.data.filter((inv) => inv.status === 'paid').length}
                        </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm text-slate-400">En attente</p>
                        <p className="mt-1 text-2xl font-bold text-blue-400">
                            {invoices.data.filter((inv) => inv.status === 'sent').length}
                        </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm text-slate-400">En retard</p>
                        <p className="mt-1 text-2xl font-bold text-red-400">
                            {invoices.data.filter((inv) => inv.status === 'overdue').length}
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4">
                    <input
                        type="text"
                        placeholder="Rechercher par numéro ou client..."
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
                        <option value="">Tous les statuts</option>
                        <option value="draft">Brouillon</option>
                        <option value="sent">Envoyée</option>
                        <option value="paid">Payée</option>
                        <option value="overdue">En retard</option>
                        <option value="cancelled">Annulée</option>
                    </select>
                    <button
                        onClick={handleSearch}
                        className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5"
                    >
                        Rechercher
                    </button>
                    <Link
                        href={route('invoices.create')}
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-200"
                    >
                        <Plus className="size-4" /> Nouvelle facture
                    </Link>
                </div>

                {/* Table */}
                <Table
                    columns={columns}
                    data={invoices.data}
                />

                {/* Pagination */}
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
