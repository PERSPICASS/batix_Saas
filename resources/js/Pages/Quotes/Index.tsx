import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import Table from '@/Components/Table';
import { Plus, Eye, Edit, Trash2, Send, CheckCircle, Download } from 'lucide-react';
import { useState } from 'react';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';
import { router } from '@inertiajs/react';
import { useRoute } from '@/utils/route';

interface Quote {
    id: number;
    quote_number: string;
    customer: {
        id: number;
        first_name: string;
        last_name: string;
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
        draft: 'bg-gray-500/20 text-gray-300',
        sent: 'bg-blue-500/20 text-blue-300',
        accepted: 'bg-green-500/20 text-green-300',
        expired: 'bg-red-500/20 text-red-300',
        rejected: 'bg-red-500/20 text-red-300',
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
                    <p className="font-medium text-white">{quote.customer.first_name} {quote.customer.last_name}</p>
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
            header={
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">Devis</h1>
                    <Link
                        href={route('quotes.create')}
                        className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700"
                    >
                        <Plus size={18} />
                        Nouveau devis
                    </Link>
                </div>
            }
        >
            <Head title="Devis" />

            <div className="space-y-4">
                <div className="text-sm text-slate-400">
                    Total devis: <span className="font-bold text-white">{quotes.total}</span>
                </div>

                <Table
                    columns={columns}
                    data={quotes.data}
                    emptyMessage="Aucun devis. Créez votre premier devis pour commencer."
                />
            </div>

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
