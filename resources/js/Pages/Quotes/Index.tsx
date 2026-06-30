import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import Table from '@/Components/Table';
import { Plus, Eye, Edit, Trash2, Send, CheckCircle, Download, FileText } from 'lucide-react';
import { useState } from 'react';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';
import { router } from '@inertiajs/react';
import { useRoute } from '@/utils/route';
import { useLocale } from '@/contexts/LocaleContext';

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

export default function QuotesIndex({ quotes }: { quotes: any }) {
    const route = useRoute();
    const { t } = useLocale();
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

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
        draft: 'Brouillon',
        sent: 'Envoyé',
        accepted: 'Accepté',
        expired: 'Expiré',
        rejected: 'Rejeté',
    };

    const columns = [
        {
            key: 'quote_number',
            label: 'N° Devis',
            render: (quote: Quote) => <span className="font-bold text-blue-300">{quote.quote_number}</span>,
        },
        {
            key: 'customer',
            label: 'Client',
            render: (quote: Quote) => (
                <div>
                    <p className="font-medium text-white">{quote.customer.name}</p>
                    <p className="text-xs text-slate-400">{quote.customer.email}</p>
                </div>
            ),
        },
        {
            key: 'total',
            label: 'Montant',
            render: (quote: Quote) => <span className="font-semibold text-green-400">{quote.total.toFixed(2)}€</span>,
        },
        {
            key: 'status',
            label: 'Statut',
            render: (quote: Quote) => (
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[quote.status]}`}>
                    {statusLabels[quote.status]}
                </span>
            ),
        },
        {
            key: 'expiry_date',
            label: 'Expire le',
            render: (quote: Quote) => (
                <span className="text-sm text-slate-400">{new Date(quote.expiry_date).toLocaleDateString('fr-FR')}</span>
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
                        title="Voir"
                    >
                        <Eye size={16} />
                    </Link>
                    {quote.status === 'draft' && (
                        <Link
                            href={route('quotes.edit', { quote: quote.id })}
                            className="p-2 text-amber-400 hover:bg-amber-500/10 rounded"
                            title="Modifier"
                        >
                            <Edit size={16} />
                        </Link>
                    )}
                    {quote.status === 'draft' && (
                        <button
                            onClick={() => handleSend(quote.id)}
                            className="p-2 text-purple-400 hover:bg-purple-500/10 rounded"
                            title="Envoyer"
                        >
                            <Send size={16} />
                        </button>
                    )}
                    {quote.status === 'sent' && (
                        <button
                            onClick={() => handleAccept(quote.id)}
                            className="p-2 text-green-400 hover:bg-green-500/10 rounded"
                            title="Accepter"
                        >
                            <CheckCircle size={16} />
                        </button>
                    )}
                    {quote.status === 'accepted' && (
                        <Link
                            href={route('quotes.convert', { quote: quote.id })}
                            method="post"
                            className="p-2 text-green-400 hover:bg-green-500/10 rounded"
                            title="Convertir en facture"
                        >
                            <Download size={16} />
                        </Link>
                    )}
                    <button
                        onClick={() => setConfirmDelete(quote.id)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded"
                        title="Supprimer"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            header={<h1 className="text-xl font-semibold text-white">Devis</h1>}
        >
            <Head title="Devis" />

            <section className="space-y-6">
                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm text-slate-400">Total devis</p>
                        <p className="mt-1 text-2xl font-bold text-white">{quotes.total}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm text-slate-400">En attente</p>
                        <p className="mt-1 text-2xl font-bold text-blue-400">
                            {quotes.data?.filter((q: Quote) => q.status === 'sent').length || 0}
                        </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm text-slate-400">Acceptés</p>
                        <p className="mt-1 text-2xl font-bold text-green-400">
                            {quotes.data?.filter((q: Quote) => q.status === 'accepted').length || 0}
                        </p>
                    </div>
                </div>

                {/* Header avec bouton */}
                <div className="flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                        <FileText className="size-5 text-amber-300" />
                        Tous les devis
                    </h2>
                    <Link
                        href={route('quotes.create')}
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-200"
                    >
                        <Plus className="size-4" />
                        Nouveau devis
                    </Link>
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
