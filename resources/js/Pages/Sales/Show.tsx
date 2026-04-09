import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Printer, CreditCard, CheckCircle, Trash2 } from 'lucide-react';
import Currency from '@/Components/Currency';
import { useRoute } from '@/utils/route';
import { useState } from 'react';
import { PageProps } from '@/types';

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

interface SaleItem {
    id: number;
    product_name: string;
    quantity: number;
    unit_price: string;
    tax_rate: string;
    tax_amount: string;
    total: string;
    product: Product | null;
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
    const route = useRoute();
    const [showCreditModal, setShowCreditModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    const isAdmin = auth.user?.role === 'super_admin' || auth.user?.role === 'manager';
    const canCancel = sale.status !== 'cancelled'
        && auth.user?.role !== 'cashier'
        && auth.user?.role !== 'caisse'
        && (isAdmin || sale.status === 'completed');

    const handleCancelSale = () => {
        setCancelling(true);
        router.delete(route('sales.destroy', { sale: sale.id }), {
            onSuccess: () => { setShowCancelModal(false); setCancelling(false); },
            onError: () => setCancelling(false),
        });
    };

    const creditForm = useForm({
        payment_amount: sale.remaining_amount,
        payment_method: 'cash',
        notes: '',
    });

    const handlePrint = () => {
        window.print();
    };

    const handlePayCredit = (e: React.FormEvent) => {
        e.preventDefault();
        creditForm.post(route('sales.pay-credit', { sale: sale.id }), {
            onSuccess: () => setShowCreditModal(false),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-white">Ticket {sale.ticket_number}</h1>
                    <div className="flex items-center gap-2">
                        {canCancel && (
                            <button
                                onClick={() => setShowCancelModal(true)}
                                className="inline-flex items-center gap-2 rounded-lg border border-rose-400/40 bg-rose-400/10 px-4 py-2 text-sm font-medium text-rose-300 hover:bg-rose-400/20"
                            >
                                <Trash2 className="size-4" /> Annuler la vente
                            </button>
                        )}
                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
                        >
                            <Printer className="size-4" /> Imprimer
                        </button>
                    </div>
                </div>
            }
        >
            <Head title={`Ticket ${sale.ticket_number}`} />

            <div className="space-y-4">
                <Link
                    href={route('sales.index')}
                    className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"
                >
                    <ArrowLeft className="size-4" /> Retour aux ventes
                </Link>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
                    {/* En-tête du ticket */}
                    <div className="mb-8 text-center">
                        {sale.shop.logo && (
                            <div className="mb-4 flex justify-center">
                                <img 
                                    src={`/storage/${sale.shop.logo}`} 
                                    alt={sale.shop.name}
                                    className="h-20 w-auto object-contain print:h-16"
                                />
                            </div>
                        )}
                        <h2 className="text-2xl font-bold text-white">{sale.shop.name}</h2>
                        <p className="text-sm text-slate-400">{sale.shop.address}</p>
                        <p className="text-sm text-slate-400">{sale.shop.phone}</p>
                    </div>

                    <div className="mb-6 space-y-2 border-y border-white/10 py-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">N° Ticket:</span>
                            <span className="font-mono font-semibold text-white">
                                {sale.ticket_number}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Date:</span>
                            <span className="text-white">
                                {new Date(sale.sale_date).toLocaleString('fr-FR')}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Vendeur:</span>
                            <span className="text-white">{sale.user.name}</span>
                        </div>
                        {sale.customer && (
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Client:</span>
                                <span className="text-white">{sale.customer.name}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Statut:</span>
                            <span
                                className={`font-semibold ${
                                    sale.status === 'completed'
                                        ? 'text-green-400'
                                        : sale.status === 'cancelled'
                                          ? 'text-red-400'
                                          : 'text-slate-300'
                                }`}
                            >
                                {statusLabels[sale.status] || sale.status}
                            </span>
                        </div>
                    </div>

                    {/* Articles */}
                    <div className="mb-6">
                        <table className="w-full text-sm">
                            <thead className="border-b border-white/10">
                                <tr>
                                    <th className="pb-2 text-left text-slate-400">Article</th>
                                    <th className="pb-2 text-center text-slate-400">Qté</th>
                                    <th className="pb-2 text-right text-slate-400">P.U.</th>
                                    <th className="pb-2 text-right text-slate-400">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sale.items.map((item) => (
                                    <tr key={item.id} className="border-b border-white/5">
                                        <td className="py-2">
                                            {item.product?.parent ? (
                                                <span className="text-white">
                                                    <span className="text-slate-400">{item.product.parent.name}</span>
                                                    <span className="mx-1 text-slate-500">›</span>
                                                    <span>{item.product.name}</span>
                                                </span>
                                            ) : (
                                                <span className="text-white">{item.product_name}</span>
                                            )}
                                        </td>
                                        <td className="py-2 text-center text-slate-300">
                                            {item.quantity}
                                        </td>
                                        <td className="py-2 text-right text-slate-300">
                                            <Currency amount={parseFloat(item.unit_price)} />
                                        </td>
                                        <td className="py-2 text-right font-semibold text-white">
                                            <Currency amount={parseFloat(item.total)} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totaux */}
                    <div className="space-y-2 border-t border-white/10 pt-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Sous-total:</span>
                            <span className="text-white">
                                <Currency amount={parseFloat(sale.subtotal)} />
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">TVA:</span>
                            <span className="text-white">
                                <Currency amount={parseFloat(sale.tax_amount)} />
                            </span>
                        </div>
                        {parseFloat(sale.discount_amount) > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Remise:</span>
                                <span className="text-red-400">
                                    -<Currency amount={parseFloat(sale.discount_amount)} />
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between border-t border-white/10 pt-2 text-lg font-bold">
                            <span className="text-white">TOTAL:</span>
                            <span className="text-amber-300">
                                <Currency amount={parseFloat(sale.total)} />
                            </span>
                        </div>
                    </div>

                    {/* Paiement */}
                    <div className="mt-6 space-y-2 border-t border-white/10 pt-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Mode de paiement:</span>
                            <span className="text-white">
                                {paymentMethodLabels[sale.payment_method] || sale.payment_method}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Montant payé:</span>
                            <span className="text-white">
                                <Currency amount={parseFloat(sale.amount_paid)} />
                            </span>
                        </div>
                        {parseFloat(sale.change_amount) > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Monnaie rendue:</span>
                                <span className="font-semibold text-emerald-400">
                                    <Currency amount={parseFloat(sale.change_amount)} />
                                </span>
                            </div>
                        )}
                        {parseFloat(sale.remaining_amount) > 0 && (
                            <div className="flex justify-between text-sm font-semibold border-t border-white/10 pt-2">
                                <span className="text-rose-400">Reste à payer:</span>
                                <span className="text-rose-400">
                                    <Currency amount={parseFloat(sale.remaining_amount)} />
                                </span>
                            </div>
                        )}
                        {sale.credit_due_date && parseFloat(sale.remaining_amount) > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Échéance:</span>
                                <span className="text-amber-300">
                                    {new Date(sale.credit_due_date).toLocaleDateString('fr-FR')}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Bouton Encaisser le reste */}
                    {parseFloat(sale.remaining_amount) > 0 && (
                        <div className="mt-6 rounded-xl border border-rose-400/30 bg-rose-500/10 p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CreditCard className="size-5 text-rose-400" />
                                    <div>
                                        <p className="text-sm font-semibold text-rose-300">Vente à crédit</p>
                                        <p className="text-xs text-slate-400">
                                            Reste : <Currency amount={parseFloat(sale.remaining_amount)} />
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

                    {sale.notes && (
                        <div className="mt-6 rounded-lg bg-slate-900/50 p-4">
                            <p className="text-sm text-slate-400">Notes:</p>
                            <p className="text-white">{sale.notes}</p>
                        </div>
                    )}

                    <div className="mt-8 text-center text-xs text-slate-500">
                        <p>Merci de votre visite</p>
                        <p>À bientôt !</p>
                    </div>
                </div>
            </div>

            {/* Modal: Encaisser le reste */}
            {showCreditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-white/10 p-6 shadow-2xl">
                        <div className="mb-4 flex items-center gap-3">
                            <CreditCard className="size-5 text-rose-400" />
                            <h3 className="text-lg font-semibold text-white">Encaisser le reste</h3>
                        </div>
                        <div className="mb-4 rounded-lg bg-white/5 p-3 text-center">
                            <p className="text-xs text-slate-400">Reste à payer</p>
                            <p className="text-2xl font-bold text-rose-400">
                                <Currency amount={parseFloat(sale.remaining_amount)} />
                            </p>
                        </div>
                        <form onSubmit={handlePayCredit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm text-slate-300">Montant encaissé *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={sale.remaining_amount}
                                    value={creditForm.data.payment_amount}
                                    onChange={e => creditForm.setData('payment_amount', e.target.value)}
                                    className="w-full rounded-lg border border-white/15 bg-slate-800 px-3 py-2 text-white focus:border-amber-300 focus:outline-none"
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
                                    className="w-full rounded-lg border border-white/15 bg-slate-800 px-3 py-2 text-white focus:border-amber-300 focus:outline-none"
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
                                    className="flex-1 rounded-xl border border-white/15 py-2.5 text-sm text-slate-300 hover:bg-white/5"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-slate-900 p-6 shadow-xl border border-white/10">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-full bg-rose-400/10">
                                <Trash2 className="size-5 text-rose-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-white">Annuler la vente</h3>
                        </div>
                        <p className="mb-2 text-sm text-slate-300">
                            Voulez-vous vraiment annuler la vente <strong className="text-white">{sale.ticket_number}</strong> ?
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
                                className="flex-1 rounded-xl border border-white/15 py-2.5 text-sm text-slate-300 hover:bg-white/5"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
