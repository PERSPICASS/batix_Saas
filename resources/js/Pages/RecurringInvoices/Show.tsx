import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { FileText, Edit, Trash2, ArrowLeft, RefreshCw, Play, Pause, Calendar } from 'lucide-react';
import { useState } from 'react';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';
import { useRoute } from '@/utils/route';
import Currency from '@/Components/Currency';

export default function ShowRecurringInvoice({ recurringInvoice }: { recurringInvoice: any }) {
    const route = useRoute();
    const [confirmDelete, setConfirmDelete] = useState(false);

    const handleDelete = () => {
        router.delete(route('recurring-invoices.destroy', { recurring_invoice: recurringInvoice.id }));
    };

    const handleToggleActive = () => {
        router.post(route('recurring-invoices.toggle', { recurring_invoice: recurringInvoice.id }), {});
    };

    const handleGenerateNow = () => {
        router.post(route('recurring-invoices.generate', { recurring_invoice: recurringInvoice.id }), {});
    };

    const frequencyLabels = {
        monthly: 'Mensuel',
        quarterly: 'Trimestriel',
        'semi-annual': 'Semestriel',
        annual: 'Annuel',
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">Cycle: {recurringInvoice.invoice_prefix}</h1>}>
            <Head title={`Cycle ${recurringInvoice.invoice_prefix}`} />

            <div className="grid gap-4 xl:grid-cols-3">
                <section className="space-y-4 xl:col-span-2">
                    {/* En-tête */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-white">
                                <FileText className="size-5 text-amber-300" />
                                <h2 className="text-lg font-semibold">{recurringInvoice.invoice_prefix}</h2>
                            </div>
                            <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                                recurringInvoice.is_active
                                    ? 'bg-green-500/20 text-green-300'
                                    : 'bg-slate-500/20 text-slate-400'
                            }`}>
                                {recurringInvoice.is_active ? 'Actif' : 'Inactif'}
                            </span>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <p className="text-sm text-slate-400 mb-1">Client</p>
                                <p className="text-white font-medium">{recurringInvoice.customer.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400 mb-1">Fréquence</p>
                                <p className="text-white font-medium">{frequencyLabels[recurringInvoice.frequency as keyof typeof frequencyLabels]}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400 mb-1">Première facture</p>
                                <p className="text-white font-medium">{new Date(recurringInvoice.start_date).toLocaleDateString('fr-FR')}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400 mb-1">Prochaine facture</p>
                                <p className="text-white font-medium">{new Date(recurringInvoice.next_invoice_date).toLocaleDateString('fr-FR')}</p>
                            </div>
                            {recurringInvoice.end_date && (
                                <div>
                                    <p className="text-sm text-slate-400 mb-1">Date d'expiration</p>
                                    <p className="text-white font-medium">{new Date(recurringInvoice.end_date).toLocaleDateString('fr-FR')}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Articles */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <h2 className="mb-4 text-lg font-semibold text-white">Articles du cycle</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Article</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-slate-300">Qté</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-slate-300">P.U.</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-slate-300">Montant</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {recurringInvoice.items.map((item: any, index: number) => (
                                        <tr key={index} className="hover:bg-white/5">
                                            <td className="px-4 py-3 text-white">{item.product_name}</td>
                                            <td className="px-4 py-3 text-right text-white">{item.quantity}</td>
                                            <td className="px-4 py-3 text-right text-white"><Currency amount={parseFloat(item.unit_price)} /></td>
                                            <td className="px-4 py-3 text-right text-white font-medium"><Currency amount={parseFloat(item.unit_price) * item.quantity} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Totaux */}
                        <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                            <div className="flex justify-end gap-8">
                                <span className="text-slate-300">Sous-total:</span>
                                <span className="w-24 text-right text-white font-medium"><Currency amount={parseFloat(recurringInvoice.subtotal)} /></span>
                            </div>
                            <div className="flex justify-end gap-8">
                                <span className="text-slate-300">TVA (18%):</span>
                                <span className="w-24 text-right text-white font-medium"><Currency amount={parseFloat(recurringInvoice.tax_amount)} /></span>
                            </div>
                            <div className="flex justify-end gap-8 border-t border-white/10 pt-2">
                                <span className="text-white font-bold">Total:</span>
                                <span className="w-24 text-right text-xl font-bold text-amber-300"><Currency amount={parseFloat(recurringInvoice.total)} /></span>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {recurringInvoice.notes && (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                            <h2 className="mb-4 text-lg font-semibold text-white">Notes</h2>
                            <p className="text-white whitespace-pre-wrap text-sm">{recurringInvoice.notes}</p>
                        </div>
                    )}

                    {/* Historique */}
                    {recurringInvoice.invoices && recurringInvoice.invoices.length > 0 && (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                                <Calendar className="size-5 text-amber-300" />
                                Factures générées
                            </h2>
                            <div className="space-y-2">
                                {recurringInvoice.invoices.map((invoice: any, index: number) => (
                                    <Link
                                        key={index}
                                        href={route('invoices.show', { invoice: invoice.id })}
                                        className="flex items-center justify-between rounded-lg border border-white/15 bg-white/5 px-4 py-3 transition hover:bg-white/10"
                                    >
                                        <div>
                                            <p className="font-medium text-amber-300">{invoice.invoice_number}</p>
                                            <p className="text-xs text-slate-400">{new Date(invoice.invoice_date).toLocaleDateString('fr-FR')}</p>
                                        </div>
                                        <span className="text-sm font-semibold text-green-400"><Currency amount={parseFloat(invoice.total)} /></span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                {/* Actions */}
                <aside className="xl:col-span-1">
                    <div className="sticky top-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                        <h2 className="mb-4 text-base font-semibold text-slate-300">Actions</h2>

                        <div className="space-y-3">
                            <Link
                                href={route('recurring-invoices.edit', { recurring_invoice: recurringInvoice.id })}
                                className="flex items-center justify-center gap-2 rounded-lg bg-amber-300 px-4 py-2.5 w-full font-semibold text-slate-950 transition-colors hover:bg-amber-200"
                            >
                                <Edit className="size-4" />
                                Modifier
                            </Link>

                            <button
                                onClick={handleGenerateNow}
                                className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 w-full font-semibold text-white transition-colors hover:bg-green-700"
                            >
                                <RefreshCw className="size-4" />
                                Générer maintenant
                            </button>

                            <button
                                onClick={handleToggleActive}
                                className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 w-full font-semibold transition-colors ${
                                    recurringInvoice.is_active
                                        ? 'bg-orange-600 text-white hover:bg-orange-700'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                            >
                                {recurringInvoice.is_active ? (
                                    <>
                                        <Pause className="size-4" />
                                        Mettre en pause
                                    </>
                                ) : (
                                    <>
                                        <Play className="size-4" />
                                        Reprendre
                                    </>
                                )}
                            </button>

                            <Link
                                href={route('recurring-invoices.index')}
                                className="flex items-center justify-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5 w-full"
                            >
                                <ArrowLeft className="size-4" />
                                Retour
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

            {confirmDelete && (
                <ConfirmDeleteModal
                    show={true}
                    onClose={() => setConfirmDelete(false)}
                    onConfirm={handleDelete}
                    title="Supprimer le cycle"
                    message="Êtes-vous sûr de vouloir supprimer ce cycle de facturation récurrente? Cette action est irréversible."
                />
            )}
        </AuthenticatedLayout>
    );
}
