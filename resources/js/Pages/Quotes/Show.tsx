import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { FileText, FileDown, Send, CheckCircle, Download, Edit, Trash2, ArrowLeft, Calculator } from 'lucide-react';
import { useState } from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import { useRoute } from '@/utils/route';
import Currency, { useShopSettings } from '@/Components/Currency';
import WhatsAppShareButton from '@/Components/WhatsAppShareButton';

export default function ShowQuote({ quote, shareUrl }: { quote: any; shareUrl: string }) {
    const { t } = useLocale();
    const route = useRoute();
    const { currencySymbol } = useShopSettings();
    const [confirmDelete, setConfirmDelete] = useState(false);

    const handleDelete = () => {
        router.delete(route('quotes.destroy', { quote: quote.id }));
    };

    const handleSend = () => {
        router.post(route('quotes.send', { quote: quote.id }), {});
    };

    const handleAccept = () => {
        router.post(route('quotes.accept', { quote: quote.id }), {});
    };

    const handleConvert = () => {
        router.post(route('quotes.convert', { quote: quote.id }), {});
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

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-slate-900 dark:text-white">Devis {quote.quote_number}</h1>}>
            <Head title={`Devis ${quote.quote_number}`} />

            <div className="grid gap-4 xl:grid-cols-3">
                <section className="space-y-4 xl:col-span-2">
                    {/* En-tête */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                                <FileText className="size-5 text-amber-300" />
                                <h2 className="text-lg font-semibold">{quote.quote_number}</h2>
                            </div>
                            <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${statusColors[quote.status as keyof typeof statusColors]}`}>
                                {statusLabels[quote.status as keyof typeof statusLabels]}
                            </span>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Client</p>
                                <p className="text-slate-900 dark:text-white font-medium">{quote.customer.name}</p>
                                {quote.customer.email && (
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{quote.customer.email}</p>
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Dates</p>
                                <p className="text-slate-900 dark:text-white font-medium">{new Date(quote.quote_date).toLocaleDateString('fr-FR')}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Expire le {new Date(quote.expiry_date).toLocaleDateString('fr-FR')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Articles */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                            <FileText className="size-5 text-amber-300" />
                            Articles
                        </h2>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-white/10">
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Article</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-slate-600 dark:text-slate-300">Qté</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-slate-600 dark:text-slate-300">P.U.</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-slate-600 dark:text-slate-300">Montant</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {quote.items.map((item: any, index: number) => (
                                        <tr key={index} className="hover:bg-white/5">
                                            <td className="px-4 py-3 text-slate-900 dark:text-white">{item.product.name}</td>
                                            <td className="px-4 py-3 text-right text-slate-900 dark:text-white">{item.quantity}</td>
                                            <td className="px-4 py-3 text-right text-slate-900 dark:text-white"><Currency amount={parseFloat(item.unit_price)} /></td>
                                            <td className="px-4 py-3 text-right text-slate-900 dark:text-white font-medium"><Currency amount={parseFloat(item.line_total)} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Totaux */}
                        <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                            <div className="flex justify-end gap-8">
                                <span className="text-slate-600 dark:text-slate-300">Sous-total:</span>
                                <span className="w-24 text-right text-slate-900 dark:text-white font-medium"><Currency amount={parseFloat(quote.subtotal)} /></span>
                            </div>
                            <div className="flex justify-end gap-8">
                                {/* Sans taux dans le libellé : chaque ligne porte le sien
                                    (produit, sinon boutique), donc annoncer un taux unique
                                    serait faux dès que deux lignes diffèrent. Le montant
                                    affiché reste celui calculé par le serveur. */}
                                <span className="text-slate-600 dark:text-slate-300">TVA:</span>
                                <span className="w-24 text-right text-slate-900 dark:text-white font-medium"><Currency amount={parseFloat(quote.tax_amount)} /></span>
                            </div>
                            <div className="flex justify-end gap-8 border-t border-white/10 pt-2">
                                <span className="text-slate-900 dark:text-white font-bold">Total:</span>
                                <span className="w-24 text-right text-xl font-bold text-amber-300"><Currency amount={parseFloat(quote.total)} /></span>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {(quote.notes || quote.terms) && (
                        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
                            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Notes et conditions</h2>
                            {quote.notes && (
                                <div className="mb-4">
                                    <p className="text-sm text-slate-400 mb-2">Notes</p>
                                    <p className="text-slate-900 dark:text-white whitespace-pre-wrap text-sm">{quote.notes}</p>
                                </div>
                            )}
                            {quote.terms && (
                                <div>
                                    <p className="text-sm text-slate-400 mb-2">Conditions</p>
                                    <p className="text-slate-900 dark:text-white whitespace-pre-wrap text-sm">{quote.terms}</p>
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* Actions */}
                <aside className="xl:col-span-1">
                    <div className="sticky top-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Total:</h2>
                            <span className="text-2xl font-bold text-amber-300"><Currency amount={parseFloat(quote.total)} /></span>
                        </div>
                        <div className="border-b border-white/10 mb-4 pb-4">
                            <h2 className="text-base font-semibold text-slate-300">Actions</h2>
                        </div>

                        <div className="space-y-3">
                            {quote.status === 'draft' && (
                                <>
                                    <Link
                                        href={route('quotes.edit', { quote: quote.id })}
                                        className="flex items-center justify-center gap-2 rounded-lg bg-amber-300 px-4 py-2.5 font-semibold text-slate-950 transition-colors hover:bg-amber-200 w-full"
                                    >
                                        <Edit className="size-4" />
                                        Modifier
                                    </Link>
                                    <button
                                        onClick={handleSend}
                                        className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 w-full font-semibold text-white transition-colors hover:bg-blue-700"
                                    >
                                        <Send className="size-4" />
                                        Envoyer
                                    </button>
                                </>
                            )}

                            {/* Toujours disponible : un devis se télécharge quel que soit
                                son statut, y compris pour le renvoyer au client. */}
                            <WhatsAppShareButton
                                shareUrl={shareUrl}
                                phone={quote.customer?.phone}
                                message={t.documents.share.quoteMessage
                                    .replace(':number', quote.quote_number)
                                    .replace(':shop', quote.shop?.name ?? '')}
                            />

                            <a
                                href={route('quotes.pdf', { quote: quote.id })}
                                target="_blank"
                                rel="noopener"
                                className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 w-full font-semibold text-slate-700 transition-colors hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
                            >
                                <FileDown className="size-4" />
                                PDF
                            </a>

                            {quote.status === 'sent' && (
                                <button
                                    onClick={handleAccept}
                                    className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 w-full font-semibold text-white transition-colors hover:bg-green-700"
                                >
                                    <CheckCircle className="size-4" />
                                    Accepter
                                </button>
                            )}

                            {quote.status === 'accepted' && (
                                <button
                                    onClick={handleConvert}
                                    className="flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 w-full font-semibold text-white transition-colors hover:bg-purple-700"
                                >
                                    <Download className="size-4" />
                                    Convertir en facture
                                </button>
                            )}

                            <Link
                                href={route('quotes.index')}
                                className="flex items-center justify-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5 w-full"
                            >
                                <ArrowLeft className="size-4" />
                                Retour à la liste
                            </Link>

                            <button
                                onClick={() => setConfirmDelete(true)}
                                className="flex items-center justify-center gap-2 rounded-lg border border-red-500/30 px-4 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 w-full"
                            >
                                <Trash2 className="size-4" />
                                Supprimer
                            </button>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Modal de suppression */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 max-w-sm">
                        <h3 className="text-lg font-bold text-white mb-4">Supprimer le devis</h3>
                        <p className="text-slate-300 mb-6">Êtes-vous sûr de vouloir supprimer ce devis? Cette action est irréversible.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmDelete(false)}
                                className="flex-1 rounded-lg border border-white/15 px-4 py-2 text-slate-200 transition-colors hover:bg-white/5"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-red-700"
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
