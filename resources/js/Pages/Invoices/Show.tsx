import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Currency from '@/Components/Currency';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Ban, CheckCircle2, Pencil, Printer, Repeat2, X, Send } from 'lucide-react';
import { useRoute } from '@/utils/route';
import { useLocale } from '@/contexts/LocaleContext';
import { useState } from 'react';
import Modal from '@/Components/Modal';

interface Customer {
    id: number;
    name: string;
}

interface Shop {
    id: number;
    name: string;
    logo?: string;
}

interface User {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    parent: { id: number; name: string } | null;
}

interface InvoiceItem {
    id: number;
    product_name: string;
    description: string | null;
    quantity: number;
    unit_price: string | number;
    total: string | number;
    product: Product | null;
}

interface Invoice {
    id: number;
    invoice_number: string;
    invoice_date: string;
    due_date: string | null;
    status: string;
    payment_method: string | null;
    subtotal: string | number;
    tax_amount: string | number;
    discount_amount: string | number;
    total: string | number;
    notes: string | null;
    customer: Customer;
    shop: Shop;
    user: User;
    items: InvoiceItem[];
}

interface Props {
    invoice: Invoice;
}

const statusLabels: Record<string, string> = {
    draft: 'Brouillon',
    sent: 'Envoyée',
    paid: 'Payée',
    overdue: 'En retard',
    cancelled: 'Annulée',
};

const paymentLabels: Record<string, string> = {
    cash: 'Espèces',
    card: 'Carte bancaire',
    transfer: 'Virement',
    check: 'Chèque',
    mobile: 'Mobile',
};

export default function InvoicesShow({ invoice }: Props) {
    const { t } = useLocale();
    const route = useRoute();
    const [showRecurringModal, setShowRecurringModal] = useState(false);
    const [frequency, setFrequency] = useState('monthly');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePrint = () => window.print();

    const handleCreateRecurring = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        router.post(route('invoices.create-recurring', { invoice: invoice.id }), {
            frequency,
            start_date: startDate,
            end_date: endDate,
        });
    };

    const handleSend = () => {
        const message = `${t.invoices.actions.send} ${t.common.misc.sendEmailTo || 'par email à'} ${invoice.customer.name} ?`;
        if (confirm(message)) {
            router.post(route('invoices.send', { invoice: invoice.id }));
        }
    };

    // Une facture émise est figée : son contenu ne se modifie plus, seul son statut
    // évolue, et via une action dédiée (invoices.status) et non plus le formulaire
    // d'édition. Le serveur refuse de toute façon, mais afficher un bouton Modifier qui
    // mène à un refus serait trompeur.
    const isDraft = invoice.status === 'draft';
    const isClosed = invoice.status === 'paid' || invoice.status === 'cancelled';

    const changeStatus = (status: 'paid' | 'cancelled') => {
        const message = (status === 'paid' ? t.invoices.confirm.markPaid : t.invoices.confirm.cancelInvoice)
            .replace(':number', invoice.invoice_number);

        if (confirm(message)) {
            router.post(route('invoices.status', { invoice: invoice.id }), { status });
        }
    };

    return (
        <AuthenticatedLayout
            header={<h1 className="text-xl font-semibold text-slate-900 dark:text-white">{t.invoices.form.editTitle} {invoice.invoice_number}</h1>}
        >
            <Head title={`${t.invoices.form.editTitle} ${invoice.invoice_number}`} />

            <div className="space-y-4">
                <div className="print:hidden space-y-4">
                    <Link
                        href={route('invoices.index')}
                        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                    >
                        <ArrowLeft className="size-4" /> {t.common.actions.back}
                    </Link>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={handleSend}
                            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                        >
                            <Send className="size-4" /> {t.invoices.actions.send}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowRecurringModal(true)}
                            className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200"
                        >
                            <Repeat2 className="size-4" /> {t.invoices.actions.createRecurring || "Créer un cycle"}
                        </button>
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
                        >
                            <Printer className="size-4" /> {t.common.actions.print || "Imprimer"}
                        </button>
                        {isDraft && (
                            <Link
                                href={route('invoices.edit', { invoice: invoice.id })}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
                            >
                                <Pencil className="size-4" /> {t.invoices.actions.edit}
                            </Link>
                        )}
                        {!isClosed && (
                            <>
                                {invoice.status === 'sent' && (
                                    <button
                                        type="button"
                                        onClick={() => changeStatus('paid')}
                                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                                    >
                                        <CheckCircle2 className="size-4" /> {t.invoices.actions.markPaid}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => changeStatus('cancelled')}
                                    className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/10"
                                >
                                    <Ban className="size-4" /> {t.invoices.actions.cancelInvoice}
                                </button>
                            </>
                        )}
                    </div>

                    {!isDraft && (
                        <p className="text-sm text-slate-500 dark:text-slate-400">{t.invoices.issuedNotice}</p>
                    )}
                </div>

                <div className="invoice-print rounded-2xl border border-white/10 bg-white/5 p-6 print:rounded-none print:border-0 print:bg-white print:px-2 print:py-0">
                    <div className="mb-6 rounded-xl border border-white/10 bg-gradient-to-r from-slate-900/70 to-slate-800/40 p-5 print:border print:bg-transparent">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-4">
                                {invoice.shop.logo && (
                                    <img 
                                        src={`/storage/${invoice.shop.logo}`} 
                                        alt={invoice.shop.name}
                                        className="h-16 w-auto object-contain print:h-12"
                                    />
                                )}
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] text-amber-300">Facture</p>
                                    <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{invoice.invoice_number}</h2>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-500 dark:text-slate-400">Émise par</p>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{invoice.shop.name}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6 grid gap-3 md:grid-cols-2 print:grid-cols-2 print:gap-x-8 print:gap-y-3">
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 print:border print:bg-transparent dark:border-white/10 dark:bg-slate-900/40">
                            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Client</p>
                            <p className="mt-1 font-medium text-slate-900 dark:text-white">{invoice.customer.name}</p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-right print:border print:bg-transparent dark:border-white/10 dark:bg-slate-900/40">
                            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Boutique</p>
                            <p className="mt-1 font-medium text-slate-900 dark:text-white">{invoice.shop.name}</p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 print:border print:bg-transparent dark:border-white/10 dark:bg-slate-900/40">
                            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Date facture</p>
                            <p className="mt-1 text-slate-900 dark:text-white">{new Date(invoice.invoice_date).toLocaleDateString('fr-FR')}</p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-right print:border print:bg-transparent dark:border-white/10 dark:bg-slate-900/40">
                            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Échéance</p>
                            <p className="mt-1 text-slate-900 dark:text-white">
                                {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('fr-FR') : '-'}
                            </p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 print:border print:bg-transparent dark:border-white/10 dark:bg-slate-900/40">
                            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Statut</p>
                            <p className="mt-1 text-slate-900 dark:text-white">{statusLabels[invoice.status] || invoice.status}</p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-right print:border print:bg-transparent dark:border-white/10 dark:bg-slate-900/40">
                            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Mode de paiement</p>
                            <p className="mt-1 text-slate-900 dark:text-white">
                                {invoice.payment_method ? paymentLabels[invoice.payment_method] || invoice.payment_method : 'Non défini'}
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-white/10 print:overflow-visible print:border">
                        <table className="w-full text-sm print:table-fixed">
                            <thead className="border-b border-white/10 bg-slate-900/50 text-slate-300 print:bg-transparent">
                                <tr>
                                    <th className="py-2.5 pl-4 text-left">Produit</th>
                                    <th className="py-2.5 text-center">Qté</th>
                                    <th className="py-2.5 text-right">Prix U.</th>
                                    <th className="py-2.5 pr-4 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.items.map((item) => (
                                    <tr key={item.id} className="border-b border-white/5">
                                        <td className="py-2.5 pl-4">
                                            {item.product?.parent ? (
                                                <span className="text-slate-900 dark:text-white">
                                                    <span className="text-slate-500 dark:text-slate-400">{item.product.parent.name}</span>
                                                    <span className="mx-1 text-slate-500">›</span>
                                                    <span>{item.product.name}</span>
                                                </span>
                                            ) : (
                                                <span className="text-slate-900 dark:text-white">{item.product_name}</span>
                                            )}
                                        </td>
                                        <td className="py-2.5 text-center text-slate-300">{item.quantity}</td>
                                        <td className="py-2.5 text-right text-slate-300">
                                            <Currency amount={Number(item.unit_price)} />
                                        </td>
                                        <td className="py-2.5 pr-4 text-right font-semibold text-white">
                                            <Currency amount={Number(item.total)} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 ml-auto w-full max-w-sm rounded-xl border border-white/10 bg-slate-900/40 p-4 text-sm print:max-w-[320px] print:border print:bg-transparent">
                        <div className="flex justify-between text-slate-300">
                            <span>Sous-total</span>
                            <span><Currency amount={Number(invoice.subtotal)} /></span>
                        </div>
                        <div className="mt-2 flex justify-between text-slate-300">
                            <span>TVA</span>
                            <span><Currency amount={Number(invoice.tax_amount)} /></span>
                        </div>
                        {Number(invoice.discount_amount) > 0 && (
                            <div className="mt-2 flex justify-between text-red-300">
                                <span>Remise</span>
                                <span>-<Currency amount={Number(invoice.discount_amount)} /></span>
                            </div>
                        )}
                        <div className="mt-3 flex justify-between border-t border-white/10 pt-3 text-lg font-semibold text-white">
                            <span>Total TTC</span>
                            <span><Currency amount={Number(invoice.total)} /></span>
                        </div>
                    </div>

                    {invoice.notes && (
                        <div className="mt-6 rounded-xl border border-white/10 bg-slate-900/40 p-4 print:border print:bg-transparent">
                            <p className="mb-1 text-sm text-slate-400">Notes</p>
                            <p className="text-sm text-slate-900 dark:text-white">{invoice.notes}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Créer Cycle Récurrent */}
            <Modal show={showRecurringModal} onClose={() => setShowRecurringModal(false)} maxWidth="md">
                <div className="bg-slate-950 p-6 text-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold">Créer un cycle de facturation</h3>
                        <button
                            type="button"
                            onClick={() => setShowRecurringModal(false)}
                            className="rounded-md border border-gray-300 p-1 text-slate-600 hover:bg-gray-100 dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/10"
                        >
                            <X className="size-4" />
                        </button>
                    </div>

                    <form onSubmit={handleCreateRecurring} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Fréquence *</label>
                            <select
                                value={frequency}
                                onChange={(e) => setFrequency(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                                required
                            >
                                <option value="monthly">Mensuel</option>
                                <option value="quarterly">Trimestriel</option>
                                <option value="semi-annual">Semestriel</option>
                                <option value="annual">Annuel</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Date de début *</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Date de fin (optionnel)</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowRecurringModal(false)}
                                className="flex-1 rounded-lg border border-white/15 px-4 py-2 text-slate-200 transition-colors hover:bg-white/5"
                            >
                                {t.common.actions.cancel}
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 rounded-lg bg-amber-300 px-4 py-2 font-semibold text-slate-950 transition-colors hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Création...' : 'Créer le cycle'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            <style>{`
                @media print {
                    @page { margin: 12mm; }
                    body { background: #fff !important; }
                    .invoice-print {
                        max-width: 190mm;
                        margin: 0 auto;
                    }
                    .invoice-print, .invoice-print * {
                        color: #000 !important;
                        border-color: #ddd !important;
                        background: transparent !important;
                    }
                    .invoice-print table th,
                    .invoice-print table td {
                        padding-top: 6px !important;
                        padding-bottom: 6px !important;
                        vertical-align: top !important;
                    }
                    .invoice-print p,
                    .invoice-print span,
                    .invoice-print td,
                    .invoice-print th {
                        line-height: 1.35 !important;
                    }
                }
            `}</style>
        </AuthenticatedLayout>
    );
}
