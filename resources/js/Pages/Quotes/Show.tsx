import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Send, CheckCircle, Download, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useRoute } from '@/utils/route';

export default function ShowQuote({ quote }: { quote: any }) {
    const route = useRoute();
    const [confirmDelete, setConfirmDelete] = useState(false);

    const handleDelete = () => {
        router.delete(route('quotes.destroy', quote.id));
    };

    const handleSend = () => {
        router.post(route('quotes.send', quote.id), {});
    };

    const handleAccept = () => {
        router.post(route('quotes.accept', quote.id), {});
    };

    const handleConvert = () => {
        router.post(route('quotes.convert', quote.id), {});
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

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">Devis {quote.quote_number}</h1>
                    <a href={route('quotes.index')} className="flex items-center gap-2 text-blue-400 hover:text-blue-300">
                        <ArrowLeft size={18} />
                        Retour
                    </a>
                </div>
            }
        >
            <Head title={`Devis ${quote.quote_number}`} />

            <div className="max-w-4xl space-y-6">
                {/* En-tête */}
                <div className="bg-slate-800/50 p-6 rounded-lg flex justify-between items-start">
                    <div>
                        <p className="text-slate-400 text-sm">N° Devis</p>
                        <p className="text-2xl font-bold text-white">{quote.quote_number}</p>
                    </div>
                    <span className={`px-4 py-2 rounded-full font-medium text-sm ${statusColors[quote.status as keyof typeof statusColors]}`}>
                        {statusLabels[quote.status as keyof typeof statusLabels]}
                    </span>
                </div>

                {/* Client & Dates */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                        <p className="text-slate-400 text-sm mb-2">Client</p>
                        <p className="text-white font-medium">{quote.customer.name}</p>
                        <p className="text-slate-400 text-sm">{quote.customer.email}</p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                        <p className="text-slate-400 text-sm mb-2">Dates</p>
                        <p className="text-white">Du {new Date(quote.quote_date).toLocaleDateString('fr-FR')}</p>
                        <p className="text-white">Au {new Date(quote.expiry_date).toLocaleDateString('fr-FR')}</p>
                    </div>
                </div>

                {/* Articles */}
                <div className="bg-slate-800/50 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-700">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Article</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">Qté</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">Prix unitaire</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">Montant</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {quote.items.map((item: any, index: number) => (
                                    <tr key={index} className="hover:bg-slate-700/50">
                                        <td className="px-4 py-3 text-white">{item.product.name}</td>
                                        <td className="px-4 py-3 text-right text-white">{item.quantity}</td>
                                        <td className="px-4 py-3 text-right text-white">{parseFloat(item.unit_price).toFixed(2)}€</td>
                                        <td className="px-4 py-3 text-right text-white font-medium">{parseFloat(item.line_total).toFixed(2)}€</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totaux */}
                    <div className="bg-slate-700/50 px-4 py-4 space-y-2">
                        <div className="flex justify-end gap-8">
                            <span className="text-slate-300">Sous-total:</span>
                            <span className="w-24 text-right text-white">{parseFloat(quote.subtotal).toFixed(2)}€</span>
                        </div>
                        <div className="flex justify-end gap-8">
                            <span className="text-slate-300">TVA (18%):</span>
                            <span className="w-24 text-right text-white">{parseFloat(quote.tax_amount).toFixed(2)}€</span>
                        </div>
                        <div className="border-t border-slate-600 pt-2 flex justify-end gap-8">
                            <span className="text-white font-bold">Total:</span>
                            <span className="w-24 text-right text-lg font-bold text-green-400">{parseFloat(quote.total).toFixed(2)}€</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 flex-wrap">
                    {quote.status === 'draft' && (
                        <>
                            <Link
                                href={route('quotes.edit', quote.id)}
                                className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700"
                            >
                                <Edit size={18} />
                                Modifier
                            </Link>
                            <button
                                onClick={handleSend}
                                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                            >
                                <Send size={18} />
                                Envoyer
                            </button>
                        </>
                    )}

                    {quote.status === 'sent' && (
                        <button
                            onClick={handleAccept}
                            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                        >
                            <CheckCircle size={18} />
                            Accepter
                        </button>
                    )}

                    {quote.status === 'accepted' && (
                        <button
                            onClick={handleConvert}
                            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                        >
                            <Download size={18} />
                            Convertir en facture
                        </button>
                    )}

                    <button
                        onClick={() => setConfirmDelete(true)}
                        className="flex items-center gap-2 bg-red-600/20 text-red-400 px-4 py-2 rounded-lg hover:bg-red-600/30 ml-auto"
                    >
                        <Trash2 size={18} />
                        Supprimer
                    </button>
                </div>

                {/* Notes */}
                {(quote.notes || quote.terms) && (
                    <div className="bg-slate-800/50 p-6 rounded-lg space-y-4">
                        {quote.notes && (
                            <div>
                                <p className="text-slate-400 text-sm mb-2">Notes</p>
                                <p className="text-white whitespace-pre-wrap">{quote.notes}</p>
                            </div>
                        )}
                        {quote.terms && (
                            <div>
                                <p className="text-slate-400 text-sm mb-2">Conditions</p>
                                <p className="text-white whitespace-pre-wrap">{quote.terms}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal de suppression */}
            {confirmDelete && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
                    <div className="bg-slate-800 p-6 rounded-lg max-w-sm">
                        <h3 className="text-lg font-bold text-white mb-4">Supprimer le devis</h3>
                        <p className="text-slate-300 mb-6">Êtes-vous sûr de vouloir supprimer ce devis? Cette action est irréversible.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmDelete(false)}
                                className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
