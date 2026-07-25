import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import axios from 'axios';
import { ArrowLeft, Printer, CreditCard, CheckCircle, FileDown, Trash2, Download, RotateCcw } from 'lucide-react';
import Currency from '@/Components/Currency';
import { useRoute } from '@/utils/route';
import { useState, useEffect } from 'react';
import { PageProps } from '@/types';
import { useLocale } from '@/contexts/LocaleContext';

interface Shop {
    id: number;
    name: string;
    address: string;
    phone: string;
    logo?: string;
}

interface User {
    id: number;
    name: string;
}

interface Customer {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    parent: { id: number; name: string } | null;
}

interface SaleReturn {
    id: number;
    quantity_returned: number;
}

interface SaleItem {
    id: number;
    product_name: string;
    quantity: number;
    unit_price: string;
    tax_rate: string;
    tax_amount: string;
    total: string;
    product: Product | null;
    returns?: SaleReturn[];
}

interface Sale {
    id: number;
    ticket_number: string;
    sale_date: string;
    payment_method: string;
    status: string;
    subtotal: string;
    tax_amount: string;
    discount_amount: string;
    total: string;
    amount_paid: string;
    change_amount: string;
    remaining_amount: string;
    credit_due_date: string | null;
    notes: string | null;
    shop: Shop;
    user: User;
    customer: Customer | null;
    items: SaleItem[];
}

interface Props extends PageProps {
    sale: Sale;
}

const paymentMethodLabels: Record<string, string> = {
    cash: 'Espèces',
    card: 'Carte',
    transfer: 'Virement',
    check: 'Chèque',
    mobile: 'Mobile',
    multiple: 'Multiple',
    credit: 'Crédit',
};

const statusLabels: Record<string, string> = {
    completed: 'Terminée',
    pending: 'En attente',
    cancelled: 'Annulée',
    returned: 'Retournée',
};

export default function SalesShow({ sale, auth }: Props) {
    const { t } = useLocale();
    const route = useRoute();
    const [displayedSale, setDisplayedSale] = useState<Sale>(sale);
    const [showCreditModal, setShowCreditModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    const isAdmin = auth.user?.role === 'super_admin' || auth.user?.role === 'manager';
    const canCancel = sale.status !== 'cancelled'
        && auth.user?.role !== 'cashier'
        && auth.user?.role !== 'caisse'
        && (isAdmin || sale.status === 'completed');

    const canCreateReturn = auth.user?.role === 'super_admin'
        || auth.user?.role === 'admin_platforme'
        || auth.user?.permissions?.find(p => p.module === 'returns')?.can_create === true;
    const [showReturnPermissionDenied, setShowReturnPermissionDenied] = useState(false);

    const handleCancelSale = () => {
        setCancelling(true);
        router.delete(route('sales.destroy', { sale: sale.id }), {
            onSuccess: () => { setShowCancelModal(false); setCancelling(false); },
            onError: () => setCancelling(false),
        });
    };

    const creditForm = useForm({
        payment_amount: displayedSale.remaining_amount,
        payment_method: 'cash',
        notes: '',
    });

    const [showReturnModal, setShowReturnModal] = useState(false);
    const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());
    const [itemQuantities, setItemQuantities] = useState<{[key: number]: number}>({});
    const [showItemsDropdown, setShowItemsDropdown] = useState(false);
    const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
    const [returnMessage, setReturnMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('print') === '1') {
            const timer = setTimeout(() => window.print(), 400);
            return () => clearTimeout(timer);
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('[data-dropdown-items]')) {
                setShowItemsDropdown(false);
            }
        };

        if (showItemsDropdown) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [showItemsDropdown]);
    const handlePrint = () => {
        window.print();
    };

    const handlePayCredit = (e: React.FormEvent) => {
        e.preventDefault();
        creditForm.post(route('sales.pay-credit', { sale: sale.id }), {
            onSuccess: () => setShowCreditModal(false),
        });
    };

    const returnForm = useForm({
        refund_method: 'cash',
        reason: 'other',
        condition: 'good',
        notes: '',
    });

    const handleCreateReturn = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('handleCreateReturn appelé', { selectedItemIds: Array.from(selectedItemIds) });

        if (selectedItemIds.size === 0) {
            setReturnMessage({ type: 'error', text: 'Sélectionnez au moins un article' });
            return;
        }

        setReturnMessage(null);
        setIsSubmittingReturn(true);
        console.log('Envoi des retours...');
        const itemsArray = Array.from(selectedItemIds);
        let index = 0;
        let successCount = 0;

        const submitNextItem = () => {
            if (index >= itemsArray.length) {
                setIsSubmittingReturn(false);
                if (successCount === itemsArray.length) {
                    setReturnMessage({
                        type: 'success',
                        text: `${successCount} retour${successCount > 1 ? 's' : ''} enregistré${successCount > 1 ? 's' : ''} avec succès`
                    });
                    setTimeout(() => {
                        setShowReturnModal(false);
                        setSelectedItemIds(new Set());
                        setItemQuantities({});
                        setReturnMessage(null);
                        router.reload();
                    }, 1500);
                } else if (successCount === 0) {
                    setReturnMessage({
                        type: 'error',
                        text: 'Erreur lors de la création des retours'
                    });
                } else {
                    setReturnMessage({
                        type: 'error',
                        text: `${successCount}/${itemsArray.length} retour(s) enregistré(s). Des erreurs se sont produites.`
                    });
                }
                return;
            }

            const itemId = itemsArray[index];
            index++;

            const postData = {
                sale_item_id: itemId,
                quantity_returned: itemQuantities[itemId] || 1,
                refund_method: returnForm.data.refund_method,
                reason: returnForm.data.reason,
                notes: returnForm.data.notes,
            };

            axios.post(route('returns.store', { sale: sale.id }), postData)
            .then(({ data }) => {
                if (data.success && data.sale) {
                    setDisplayedSale(data.sale);
                    successCount++;
                    submitNextItem();
                } else {
                    console.error('Erreur: pas de données retournées', data);
                    submitNextItem();
                }
            })
            .catch(error => {
                console.error('Erreur lors de l\'enregistrement du retour', error);
                submitNextItem();
            });
        };

        submitNextItem();
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="print:hidden flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{t.sales.title} {displayedSale.ticket_number}</h1>
                    <div className="flex items-center gap-2">

                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
                        >
                            <Printer className="size-4" /> {t.common.actions.print || "Imprimer"}
                        </button>
                        {/* Le ticket en PDF, au format ruban 80 mm. Sert aussi quand il n'y
                            a pas d'imprimante sous la main — et c'est le fichier que
                            l'envoi WhatsApp partagera. */}
                        <a
                            href={route('sales.pdf', { sale: displayedSale.id })}
                            target="_blank"
                            rel="noopener"
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
                        >
                            <FileDown className="size-4" /> PDF
                        </a>

                    </div>
                </div>
            }
        >
            <Head title={`Ticket ${displayedSale.ticket_number}`} />

            <style>{`
                @page {
                    size: 88mm auto;
                    margin: 5mm;
                }
                @media print {
                    #ticket-print * { color: #000 !important; background: #fff !important; }
                    #ticket-print { max-width: 78mm; margin: 0 auto; }
                    #ticket-print table th,
                    #ticket-print table td { border-color: #ccc !important; }
                    #ticket-print .border-white\\/10,
                    #ticket-print .border-white\\/5 { border-color: #ddd !important; }
                    #ticket-print .credit-block { display: none !important; }
                    #ticket-print .total-line { color: #000 !important; font-weight: 800; }
                    #ticket-print .monnaie-line { color: #166534 !important; }
                    #ticket-print .credit-line { color: #991b1b !important; }
                    #ticket-print .footer-msg { color: #6b7280 !important; }
                }
            `}</style>

            <div className="space-y-4">
                <div className='w-full print:hidden flex justify-between items-center'>
                    <Link
                        href={route('sales.index')}
                        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                    >
                        <ArrowLeft className="size-4" /> {t.sales.title}
                    </Link>
                    <div className='flex items-center gap-2'>
                        {canCancel && (
                            <button
                                onClick={() => setShowCancelModal(true)}
                                className="inline-flex items-center gap-2 rounded-lg border border-rose-400/40 bg-rose-400/10 px-4 py-2 text-sm font-medium text-rose-300 hover:bg-rose-400/20"
                            >
                                <Trash2 className="size-4" /> Annuler la vente
                            </button>
                        )}
                        <button
                            onClick={() => {
                                const codeUser = window.location.pathname.split('/')[1];
                                window.location.href = route('sales.receipt', { code_user: codeUser, sale: sale.id });
                            }}
                            className="inline-flex items-center gap-2 rounded-lg border border-blue-400/40 bg-blue-400/10 px-4 py-2 text-sm font-medium text-blue-300 hover:bg-blue-400/20"
                        >
                            <Download className="size-4" /> {t.common.actions.download || "Télécharger"}
                        </button>
                        <button
                            onClick={() => canCreateReturn ? setShowReturnModal(true) : setShowReturnPermissionDenied(true)}
                            className="inline-flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-300 hover:bg-amber-400/20"
                        >
                            <RotateCcw className="size-4" /> Retourner
                        </button>
                    </div>
                </div>
                <div id="ticket-print" className="rounded-2xl border border-white/10 bg-white/5 p-8 print:rounded-none print:border-0 print:bg-white print:p-0 print:text-black">
                    {/* En-tête du ticket */}
                    <div className="mb-8 text-center">
                        {displayedSale.shop.logo && (
                            <div className="mb-4 flex justify-center">
                                <img 
                                    src={`/storage/${displayedSale.shop.logo}`} 
                                    alt={displayedSale.shop.name}
                                    className="h-20 w-auto object-contain print:h-16"
                                />
                            </div>
                        )}
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{displayedSale.shop.name}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{displayedSale.shop.address}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{displayedSale.shop.phone}</p>
                    </div>

                    <div className="mb-6 space-y-2 border-y border-white/10 py-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400">{t.sales.title}:</span>
                            <span className="font-mono font-semibold text-white">
                                {displayedSale.ticket_number}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400">{t.sales.columns.date}:</span>
                            <span className="text-slate-900 dark:text-white">
                                {new Date(displayedSale.sale_date).toLocaleString('fr-FR')}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400">Vendeur:</span>
                            <span className="text-slate-900 dark:text-white">{displayedSale.user.name}</span>
                        </div>
                        {displayedSale.customer && (
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">{t.sales.columns.customer || "Client"}:</span>
                                <span className="text-slate-900 dark:text-white">{displayedSale.customer?.name}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400">{t.sales.columns.status}:</span>
                            <span
                                className={`font-semibold ${
                                    displayedSale.status === 'completed'
                                        ? 'text-green-400'
                                        : displayedSale.status === 'cancelled'
                                          ? 'text-red-400'
                                          : 'text-slate-300'
                                }`}
                            >
                                {statusLabels[displayedSale.status] || displayedSale.status}
                            </span>
                        </div>
                    </div>

                    {/* Articles */}
                    <div className="mb-6">
                        <table className="w-full text-sm">
                            <thead className="border-b border-gray-200 dark:border-white/10">
                                <tr>
                                    <th className="pb-2 text-left text-slate-400">Article</th>
                                    <th className="pb-2 text-center text-slate-400">Qté</th>
                                    <th className="pb-2 text-right text-slate-400">P.U.</th>
                                    <th className="pb-2 text-right text-slate-400">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayedSale.items.map((item) => (
                                    <tr key={item.id} className="border-b border-white/5">
                                        <td className="py-2">
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
                                        <td className="py-2 text-center text-slate-300">
                                            {(() => {
                                                const alreadyReturned = (item.returns || []).reduce((sum, ret) => sum + ret.quantity_returned, 0);
                                                if (alreadyReturned > 0) {
                                                    return `${item.quantity} (-${alreadyReturned})`;
                                                }
                                                return item.quantity;
                                            })()}
                                        </td>
                                        <td className="py-2 text-right text-slate-300">
                                            <Currency amount={parseFloat(item.unit_price)} />
                                        </td>
                                        <td className="py-2 text-right font-semibold text-white">
                                            {(() => {
                                                const alreadyReturned = (item.returns || []).reduce((sum, ret) => sum + ret.quantity_returned, 0);
                                                if (alreadyReturned > 0) {
                                                    const refundedAmount = alreadyReturned * parseFloat(item.unit_price);
                                                    return (
                                                        <div className="flex flex-col items-end">
                                                            <Currency amount={parseFloat(item.total)} />
                                                            <span className="text-xs text-red-400">
                                                                -<Currency amount={refundedAmount} />
                                                            </span>
                                                        </div>
                                                    );
                                                }
                                                return <Currency amount={parseFloat(item.total)} />;
                                            })()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totaux */}
                    <div className="space-y-2 border-t border-white/10 pt-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400">Sous-total:</span>
                            <span className="text-slate-900 dark:text-white">
                                <Currency amount={parseFloat(displayedSale.subtotal)} />
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400">TVA:</span>
                            <span className="text-slate-900 dark:text-white">
                                <Currency amount={parseFloat(displayedSale.tax_amount)} />
                            </span>
                        </div>
                        {parseFloat(displayedSale.discount_amount) > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Remise:</span>
                                <span className="text-red-400">
                                    -<Currency amount={parseFloat(displayedSale.discount_amount)} />
                                </span>
                            </div>
                        )}
                        <div className="total-line flex justify-between border-t border-white/10 pt-2 text-lg font-bold">
                            <span className="text-slate-900 dark:text-white">TOTAL:</span>
                            <span className="text-amber-300">
                                <Currency amount={parseFloat(displayedSale.total)} />
                            </span>
                        </div>
                    </div>

                    {/* Paiement */}
                    <div className="mt-6 space-y-2 border-t border-white/10 pt-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400">Mode de paiement:</span>
                            <span className="text-slate-900 dark:text-white">
                                {paymentMethodLabels[displayedSale.payment_method] || displayedSale.payment_method}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400">Montant payé:</span>
                            <span className="text-slate-900 dark:text-white">
                                <Currency amount={parseFloat(displayedSale.amount_paid)} />
                            </span>
                        </div>
                        {parseFloat(displayedSale.change_amount) > 0 && (
                            <div className="monnaie-line flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Monnaie rendue:</span>
                                <span className="font-semibold text-emerald-400">
                                    <Currency amount={parseFloat(displayedSale.change_amount)} />
                                </span>
                            </div>
                        )}
                        {parseFloat(displayedSale.remaining_amount) > 0 && (
                            <div className="flex justify-between text-sm font-semibold border-t border-white/10 pt-2">
                                <span className="text-rose-400">Reste à payer:</span>
                                <span className="text-rose-400">
                                    <Currency amount={parseFloat(displayedSale.remaining_amount)} />
                                </span>
                            </div>
                        )}
                        {displayedSale.credit_due_date && parseFloat(displayedSale.remaining_amount) > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Échéance:</span>
                                <span className="text-amber-300">
                                    {new Date(displayedSale.credit_due_date || '').toLocaleDateString('fr-FR')}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Bouton Encaisser le reste */}
                    {parseFloat(displayedSale.remaining_amount) > 0 && (
                        <div className="credit-block mt-6 rounded-xl border border-rose-400/30 bg-rose-500/10 p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CreditCard className="size-5 text-rose-400" />
                                    <div>
                                        <p className="text-sm font-semibold text-rose-300">Vente à crédit</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Reste : <Currency amount={parseFloat(displayedSale.remaining_amount)} />
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowCreditModal(true)}
                                    className="inline-flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-400"
                                >
                                    <CheckCircle className="size-4" />
                                    Encaisser le reste
                                </button>
                            </div>
                        </div>
                    )}

                    {displayedSale.notes && (
                        <div className="mt-6 rounded-lg bg-slate-900/50 p-4">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Notes:</p>
                            <p className="text-slate-900 dark:text-white">{displayedSale.notes}</p>
                        </div>
                    )}

                    <div className="footer-msg mt-8 text-center text-xs text-slate-500">
                        <p>Merci de votre visite</p>
                        <p>À bientôt !</p>
                    </div>
                </div>
            </div>

            {/* Modal: Encaisser le reste */}
            {showCreditModal && (
                <div className="print:hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-white/10 p-6 shadow-2xl">
                        <div className="mb-4 flex items-center gap-3">
                            <CreditCard className="size-5 text-rose-400" />
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Encaisser le reste</h3>
                        </div>
                        <div className="mb-4 rounded-lg bg-white/5 p-3 text-center">
                            <p className="text-xs text-slate-500 dark:text-slate-400">Reste à payer</p>
                            <p className="text-2xl font-bold text-rose-400">
                                <Currency amount={parseFloat(displayedSale.remaining_amount)} />
                            </p>
                        </div>
                        <form onSubmit={handlePayCredit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm text-slate-300">Montant encaissé *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={displayedSale.remaining_amount}
                                    value={creditForm.data.payment_amount}
                                    onChange={e => creditForm.setData('payment_amount', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                                    required
                                />
                                {creditForm.errors.payment_amount && (
                                    <p className="mt-1 text-xs text-red-400">{creditForm.errors.payment_amount}</p>
                                )}
                            </div>
                            <div>
                                <label className="mb-1 block text-sm text-slate-300">Mode de paiement *</label>
                                <select
                                    value={creditForm.data.payment_method}
                                    onChange={e => creditForm.setData('payment_method', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                                >
                                    <option value="cash">Espèces</option>
                                    <option value="card">Carte</option>
                                    <option value="transfer">Virement</option>
                                    <option value="check">Chèque</option>
                                    <option value="mobile">Mobile</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button
                                    type="submit"
                                    disabled={creditForm.processing}
                                    className="flex-1 rounded-xl bg-rose-500 py-2.5 text-sm font-semibold text-white hover:bg-rose-400 disabled:opacity-50"
                                >
                                    {creditForm.processing ? 'Traitement...' : 'Confirmer'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreditModal(false)}
                                    className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm text-slate-600 hover:bg-gray-100 dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/5"
                                >
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Confirmer annulation */}
            {showCancelModal && (
                <div className="print:hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-slate-900 p-6 shadow-xl border border-white/10">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-full bg-rose-400/10">
                                <Trash2 className="size-5 text-rose-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Annuler la vente</h3>
                        </div>
                        <p className="mb-2 text-sm text-slate-300">
                            Voulez-vous vraiment annuler la vente <strong className="text-slate-900 dark:text-white">{displayedSale.ticket_number}</strong> ?
                        </p>
                        <p className="mb-6 text-xs text-slate-400">
                            Le stock des produits tracés sera automatiquement remis à jour. Cette action est irréversible.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleCancelSale}
                                disabled={cancelling}
                                className="flex-1 rounded-xl bg-rose-500 py-2.5 text-sm font-semibold text-white hover:bg-rose-400 disabled:opacity-50"
                            >
                                {cancelling ? 'Annulation...' : 'Confirmer'}
                            </button>
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm text-slate-600 hover:bg-gray-100 dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/5"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showReturnPermissionDenied && (
                <div className="print:hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-slate-900 p-6 shadow-xl border border-white/10">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-full bg-amber-400/10">
                                <RotateCcw className="size-5 text-amber-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Accès refusé</h3>
                        </div>
                        <p className="mb-6 text-sm text-slate-300">
                            Vous n'avez pas la permission d'effectuer un retour. Contactez votre administrateur si vous pensez qu'il s'agit d'une erreur.
                        </p>
                        <button
                            onClick={() => setShowReturnPermissionDenied(false)}
                            className="w-full rounded-xl border border-gray-300 py-2.5 text-sm text-slate-600 hover:bg-gray-100 dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/5"
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            )}

            {/* Modal de retour */}
            {showReturnModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="rounded-xl border border-white/10 bg-slate-900 p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Créer un retour</h3>

                        {/* Message de feedback */}
                        {returnMessage && (
                            <div className={`mb-4 p-3 rounded-lg text-sm ${
                                returnMessage.type === 'success'
                                    ? 'bg-green-500/10 border border-green-500/20 text-green-300'
                                    : 'bg-red-500/10 border border-red-500/20 text-red-300'
                            }`}>
                                {returnMessage.text}
                            </div>
                        )}

                        <form onSubmit={handleCreateReturn} className="space-y-4">
                            {/* Sélection des articles avec dropdown */}
                            <div className="relative" data-dropdown-items>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Articles à retourner *
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowItemsDropdown(!showItemsDropdown)}
                                    className={`w-full rounded-lg border px-3 py-2 text-left text-white hover:bg-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 ${selectedItemIds.size === 0 ? 'border-red-500/50 bg-red-500/10' : 'border-white/10 bg-slate-800/50'}`}
                                >
                                    <span className="text-sm">
                                        {selectedItemIds.size === 0
                                            ? 'Sélectionner les articles...'
                                            : `${selectedItemIds.size} article${selectedItemIds.size > 1 ? 's' : ''} sélectionné${selectedItemIds.size > 1 ? 's' : ''}`}
                                    </span>
                                </button>
                                {selectedItemIds.size === 0 && (
                                    <p className="mt-1 text-xs text-red-400">Au moins un article doit être sélectionné</p>
                                )}

                                {/* Dropdown avec checkboxes */}
                                {showItemsDropdown && (
                                    <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-white/10 bg-slate-900 shadow-lg" data-dropdown-items>
                                        <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                                            {displayedSale.items.map((item) => {
                                                const alreadyReturned = (item.returns || []).reduce((sum, ret) => sum + ret.quantity_returned, 0);
                                                const available = item.quantity - alreadyReturned;
                                                const canReturn = available > 0;

                                                return (
                                                    <label key={item.id} className={`flex items-start gap-2 p-2 rounded ${canReturn ? 'hover:bg-white/5 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
                                                        <input
                                                            type="checkbox"
                                                            disabled={!canReturn}
                                                            checked={canReturn && selectedItemIds.has(item.id)}
                                                            onChange={(e) => {
                                                                const newSelected = new Set(selectedItemIds);
                                                                if (e.target.checked) {
                                                                    newSelected.add(item.id);
                                                                    setItemQuantities({...itemQuantities, [item.id]: 1});
                                                                } else {
                                                                    newSelected.delete(item.id);
                                                                    const newQty = {...itemQuantities};
                                                                    delete newQty[item.id];
                                                                    setItemQuantities(newQty);
                                                                }
                                                                setSelectedItemIds(newSelected);
                                                            }}
                                                            className="mt-1"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm text-slate-900 dark:text-white font-medium">{item.product_name}</p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                Vendu: {item.quantity} | Retourné: {alreadyReturned} | Disponible: {available}
                                                            </p>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Quantités à retourner */}
                            {selectedItemIds.size > 0 && (
                                <div className="bg-slate-800/30 rounded-lg p-3 space-y-2">
                                    {displayedSale.items
                                        .filter(item => selectedItemIds.has(item.id))
                                        .map((item) => {
                                            const alreadyReturned = (item.returns || []).reduce((sum, ret) => sum + ret.quantity_returned, 0);
                                            const available = item.quantity - alreadyReturned;

                                            return (
                                                <div key={item.id} className="space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-slate-500 dark:text-slate-400">{item.product_name}</span>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max={available}
                                                            value={Math.min(itemQuantities[item.id] || 1, available)}
                                                            onChange={(e) => {
                                                                const val = Math.min(parseInt(e.target.value) || 1, available);
                                                                setItemQuantities({...itemQuantities, [item.id]: val});
                                                            }}
                                                            className="w-12 text-xs rounded border border-white/10 bg-slate-800 px-2 py-1 text-white focus:border-amber-500 focus:outline-none"
                                                        />
                                                    </div>
                                                    <p className="text-xs text-slate-500 ml-0">Max: {available}</p>
                                                </div>
                                            );
                                        })}
                                </div>
                            )}

                            {/* Raison */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Raison *
                                </label>
                                <select
                                    value={returnForm.data.reason}
                                    onChange={(e) => returnForm.setData('reason', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-white/10 dark:bg-slate-800/50 dark:text-white"
                                >
                                    <option value="defective">Défectueux</option>
                                    <option value="wrong_item">Mauvais article</option>
                                    <option value="not_satisfied">Non satisfait</option>
                                    <option value="other">Autre</option>
                                </select>
                            </div>

                            {/* Condition */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    État de l'article *
                                </label>
                                <select
                                    value={returnForm.data.condition}
                                    onChange={(e) => returnForm.setData('condition', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-white/10 dark:bg-slate-800/50 dark:text-white"
                                >
                                    <option value="good">Bon état</option>
                                    <option value="defective">Défectueux</option>
                                </select>
                            </div>

                            {/* Méthode de remboursement */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Mode de remboursement *
                                </label>
                                <select
                                    value={returnForm.data.refund_method}
                                    onChange={(e) => returnForm.setData('refund_method', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-white/10 dark:bg-slate-800/50 dark:text-white"
                                >
                                    <option value="cash">Espèces</option>
                                    <option value="card">Carte</option>
                                    <option value="store_credit">Crédit magasin</option>
                                    <option value="exchange">Échange</option>
                                </select>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Notes
                                </label>
                                <textarea
                                    value={returnForm.data.notes}
                                    onChange={(e) => returnForm.setData('notes', e.target.value)}
                                    rows={2}
                                    placeholder="Ajouter des détails sur le retour..."
                                    className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowReturnModal(false)}
                                    className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm text-slate-600 hover:bg-gray-100 dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/5"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingReturn || selectedItemIds.size === 0}
                                    className="flex-1 rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
                                >
                                    {isSubmittingReturn ? 'Traitement...' : 'Créer le retour'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
