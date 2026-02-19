import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';

interface Shop {
    id: number;
    name: string;
    address: string;
    phone: string;
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
    notes: string | null;
    shop: Shop;
    user: User;
    customer: Customer | null;
    items: SaleItem[];
}

interface Props {
    sale: Sale;
}

const paymentMethodLabels: Record<string, string> = {
    cash: 'Espèces',
    card: 'Carte',
    transfer: 'Virement',
    check: 'Chèque',
    mobile: 'Mobile',
    multiple: 'Multiple',
};

const statusLabels: Record<string, string> = {
    completed: 'Terminée',
    pending: 'En attente',
    cancelled: 'Annulée',
    returned: 'Retournée',
};

export default function SalesShow({ sale }: Props) {
    const handlePrint = () => {
        window.print();
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-white">Ticket {sale.ticket_number}</h1>
                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
                    >
                        <Printer className="size-4" /> Imprimer
                    </button>
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
                                        <td className="py-2 text-white">{item.product_name}</td>
                                        <td className="py-2 text-center text-slate-300">
                                            {item.quantity}
                                        </td>
                                        <td className="py-2 text-right text-slate-300">
                                            {parseFloat(item.unit_price).toFixed(2)} €
                                        </td>
                                        <td className="py-2 text-right font-semibold text-white">
                                            {parseFloat(item.total).toFixed(2)} €
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
                                {parseFloat(sale.subtotal).toFixed(2)} €
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">TVA:</span>
                            <span className="text-white">
                                {parseFloat(sale.tax_amount).toFixed(2)} €
                            </span>
                        </div>
                        {parseFloat(sale.discount_amount) > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Remise:</span>
                                <span className="text-red-400">
                                    -{parseFloat(sale.discount_amount).toFixed(2)} €
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between border-t border-white/10 pt-2 text-lg font-bold">
                            <span className="text-white">TOTAL:</span>
                            <span className="text-amber-300">
                                {parseFloat(sale.total).toFixed(2)} €
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
                                {parseFloat(sale.amount_paid).toFixed(2)} €
                            </span>
                        </div>
                        {parseFloat(sale.change_amount) > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Monnaie rendue:</span>
                                <span className="font-semibold text-emerald-400">
                                    {parseFloat(sale.change_amount).toFixed(2)} €
                                </span>
                            </div>
                        )}
                    </div>

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
        </AuthenticatedLayout>
    );
}
