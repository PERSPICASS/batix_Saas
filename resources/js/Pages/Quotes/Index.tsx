import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import Table from '@/Components/Table';
import { Plus, Eye, Edit, Trash2, Send, CheckCircle, Download, FileText, Search, BarChart3 } from 'lucide-react';
import { useState } from 'react';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';
import { router } from '@inertiajs/react';
import { useRoute } from '@/utils/route';
import { useLocale } from '@/contexts/LocaleContext';
import Currency from '@/Components/Currency';

interface Quote {
    id: number;
    quote_number: string;
    customer: {
        id: number;
        name: string;
        email: string;
    };
    status: 'draft' | 'sent' | 'accepted' | 'expired' | 'rejected';
    quote_date: string;
    expiry_date: string;
    total: number;
    created_at: string;
}

export default function QuotesIndex({ quotes, filters = {} }: { quotes: any; filters?: any }) {
    const route = useRoute();
    const { t } = useLocale();
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    const handleSearch = () => {
        router.get(route('quotes.index'), { search: searchTerm, status: statusFilter }, { preserveState: true });
    };

    const handleDelete = (id: number) => {
        router.delete(route('quotes.destroy', { quote: id }), {
            onSuccess: () => setConfirmDelete(null),
        });
    };

    const handleSend = (id: number) => {
        router.post(route('quotes.send', { quote: id }), {});
    };

    const handleAccept = (id: number) => {
        router.post(route('quotes.accept', { quote: id }), {});
    };

    const statusColors = {
        draft: 'bg-slate-500/20 text-slate-300 border border-slate-500/30',
        sent: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
        accepted: 'bg-green-500/20 text-green-300 border border-green-500/30',
        expired: 'bg-red-500/20 text-red-300 border border-red-500/30',
        rejected: 'bg-red-500/20 text-red-300 border border-red-500/30',
    };

    const statusLabels = {
        draft: t.quotes.status.draft,
        sent: t.quotes.status.sent,
        accepted: t.quotes.status.accepted,
        expired: t.quotes.status.expired,
        rejected: t.quotes.status.rejected,
    };

    const columns = [
        {
            key: 'quote_number',
            label: t.quotes.columns.number,
            render: (quote: Quote) => <span className="font-bold text-blue-300">{quote.quote_number}</span>,
        },
        {
            key: 'customer',
            label: t.quotes.columns.customer,
            render: (quote: Quote) => (
                <div>
                    <p className="font-medium text-slate-900 dark:text-white">{quote.customer.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{quote.customer.email}</p>
                </div>
            ),
        },
        {
            key: 'total',
            label: t.quotes.columns.total,
            render: (quote: Quote) => <span className="font-semibold text-green-400"><Currency amount={parseFloat(String(quote.total))} /></span>,
        },
        {
            key: 'status',
            label: t.quotes.columns.status,
            render: (quote: Quote) => (
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[quote.status]}`}>
                    {statusLabels[quote.status]}
                </span>
            ),
        },
        {
            key: 'expiry_date',
            label: t.quotes.columns.expiryDate,
            render: (quote: Quote) => (
                <span className="text-sm text-slate-500 dark:text-slate-400">{new Date(quote.expiry_date).toLocaleDateString('fr-FR')}</span>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (quote: Quote) => (
                <div className="flex gap-2">
                    <Link
                        href={route('quotes.show', { quote: quote.id })}
                        className="p-2 text-blue-400 hover:bg-blue-500/10 rounded"
                        title={t.common.actions.view || "Voir"}
                    >
                        <Eye size={16} />
                    </Link>
                    {quote.status === 'draft' && (
                        <Link
                            href={route('quotes.edit', { quote: quote.id })}
                            className="p-2 text-amber-400 hover:bg-amber-500/10 rounded"
                            title={t.common.actions.edit || "Modifier"}
                        >
                            <Edit size={16} />
                        </Link>
                    )}
                    {quote.status === 'draft' && (
                        <button
                            onClick={() => handleSend(quote.id)}
                            className="p-2 text-purple-400 hover:bg-purple-500/10 rounded"
                            title={t.quotes.actions.send}
                        >
                            <Send size={16} />
                        </button>
                    )}
                    {quote.status === 'sent' && (
                        <button
                            onClick={() => handleAccept(quote.id)}
                            className="p-2 text-green-400 hover:bg-green-500/10 rounded"
                            title={t.quotes.actions.accept}
                        >
                            <CheckCircle size={16} />
                        </button>
                    )}
                    {quote.status === 'accepted' && (
                        <Link
                            href={route('quotes.convert', { quote: quote.id })}
                            method="post"
                            className="p-2 text-green-400 hover:bg-green-500/10 rounded"
                            title={t.quotes.actions.convert}
                        >
                            <Download size={16} />
                        </Link>
                    )}
                    <button
                        onClick={() => setConfirmDelete(quote.id)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded"
                        title={t.common.actions.delete || "Supprimer"}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            header={<h1 className="text-xl font-semibold text-slate-900 dark:text-white">Devis</h1>}
        >
            <Head title="Devis" />

            <section className="space-y-6">
                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Total devis</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{quotes.total}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                        <p className="text-sm text-slate-500 dark:text-slate-400">En attente</p>
                        <p className="mt-1 text-2xl font-bold text-blue-400">
                            {quotes.data?.filter((q: Quote) => q.status === 'sent').length || 0}
                        </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Acceptés</p>
                        <p className="mt-1 text-2xl font-bold text-green-400">
                            {quotes.data?.filter((q: Quote) => q.status === 'accepted').length || 0}
                        </p>
                    </div>
                </div>

                {/* Filtres et recherche */}
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="relative flex-1 min-w-64">
                            <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Rechercher par N° devis ou client..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-full rounded-lg border border-white/15 bg-slate-900/70 pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                        >
                            <option value="">Tous les statuts</option>
                            <option value="draft">Brouillon</option>
                            <option value="sent">Envoyé</option>
                            <option value="accepted">Accepté</option>
                            <option value="expired">Expiré</option>
                            <option value="rejected">Rejeté</option>
                        </select>
                        <button
                            onClick={handleSearch}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5"
                        >
                            Rechercher
                        </button>
                        <div className="flex items-center gap-2">
                            <Link
                                href={route('quotes.create')}
                                className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-200"
                            >
                                <Plus className="size-4" />
                                {t.quotes.actions.new}
                            </Link>
                            <a
                                href={route('quotes.export', {})}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
                            >
                                <Download className="size-4" /> {t.common.actions.export}
                            </a>
                            <Link
                                href={route('reports.analytics', {})}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
                            >
                                <BarChart3 className="size-4" /> {t.quotes.actions.reports}
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <Table
                    columns={columns}
                    data={quotes.data}
                    emptyMessage="Aucun devis. Créez votre premier devis pour commencer."
                />
            </section>

            {confirmDelete && (
                <ConfirmDeleteModal
                    show={true}
                    onClose={() => setConfirmDelete(null)}
                    onConfirm={() => handleDelete(confirmDelete)}
                    title="Supprimer le devis"
                    message="Êtes-vous sûr de vouloir supprimer ce devis? Cette action est irréversible."
                />
            )}
        </AuthenticatedLayout>
    );
}
