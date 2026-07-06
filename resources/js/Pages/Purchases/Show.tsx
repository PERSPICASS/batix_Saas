import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { 
    ArrowLeft, 
    Edit, 
    Trash2, 
    CheckCircle, 
    XCircle, 
    Package, 
    Calendar,
    User,
    Building2,
    FileText,
    Truck,
    DollarSign
} from 'lucide-react';
import { useRoute } from '@/utils/route';
import { useState } from 'react';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { useLocale } from '@/contexts/LocaleContext';

interface Supplier {
    id: number;
    name: string;
    company_name: string | null;
    email: string | null;
    phone: string | null;
}

interface User {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    sku: string | null;
}

interface PurchaseItem {
    id: number;
    product_id: number;
    product_name: string;
    product_sku: string | null;
    quantity_ordered: number;
    quantity_received: number;
    unit_price: string;
    tax_rate: string;
    tax_amount: string;
    discount_rate: string;
    discount_amount: string;
    subtotal: string;
    total: string;
    notes: string | null;
    product: Product;
}

interface Shop {
    id: number;
    name: string;
}

interface Purchase {
    id: number;
    reference: string;
    status: 'draft' | 'confirmed' | 'received' | 'partial' | 'cancelled';
    order_date: string;
    expected_date: string | null;
    received_date: string | null;
    subtotal: string;
    tax_amount: string;
    discount_amount: string;
    shipping_cost: string;
    total: string;
    currency: string;
    notes: string | null;
    internal_notes: string | null;
    supplier: Supplier;
    user: User;
    items: PurchaseItem[];
    shop: Shop;
}

interface Props {
    code_user: string;
    purchase: Purchase;
}

export default function PurchasesShow({ code_user, purchase }: Props) {
    const { t } = useLocale();
    const route = useRoute();
    const [showReceiveModal, setShowReceiveModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [receivingQuantities, setReceivingQuantities] = useState<Record<number, number>>(
        purchase.items.reduce((acc, item) => {
            acc[item.id] = item.quantity_ordered - item.quantity_received;
            return acc;
        }, {} as Record<number, number>)
    );
    const [processing, setProcessing] = useState(false);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    };

    const formatCurrency = (amount: string) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: purchase.currency,
        }).format(parseFloat(amount));
    };

    const getStatusBadge = () => {
        const statusConfig = {
            draft: { label: 'Brouillon', color: 'bg-slate-500/20 text-slate-300' },
            confirmed: { label: 'Confirmé', color: 'bg-blue-500/20 text-blue-300' },
            partial: { label: 'Partiel', color: 'bg-yellow-500/20 text-yellow-300' },
            received: { label: 'Reçu', color: 'bg-green-500/20 text-green-300' },
            cancelled: { label: 'Annulé', color: 'bg-red-500/20 text-red-300' },
        };
        const config = statusConfig[purchase.status];
        return (
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${config.color}`}>
                {config.label}
            </span>
        );
    };

    const handleConfirm = () => {
        setProcessing(true);
        router.post(
            route('purchases.confirm', { code_user, purchase: purchase.id }),
            {},
            {
                onFinish: () => {
                    setProcessing(false);
                    setShowConfirmModal(false);
                },
            }
        );
    };

    const handleReceive = () => {
        setProcessing(true);
        const items = Object.entries(receivingQuantities).map(([id, quantity]) => ({
            id: parseInt(id),
            quantity: quantity,
        }));

        router.post(
            route('purchases.receive', { code_user, purchase: purchase.id }),
            { items },
            {
                onFinish: () => {
                    setProcessing(false);
                    setShowReceiveModal(false);
                },
            }
        );
    };

    const handleCancel = () => {
        setProcessing(true);
        router.post(
            route('purchases.cancel', { code_user, purchase: purchase.id }),
            {},
            {
                onFinish: () => {
                    setProcessing(false);
                    setShowCancelModal(false);
                },
            }
        );
    };

    const handleDelete = () => {
        setProcessing(true);
        router.delete(
            route('purchases.destroy', { code_user, purchase: purchase.id }),
            {
                onFinish: () => {
                    setProcessing(false);
                    setShowDeleteModal(false);
                },
            }
        );
    };

    const canReceive = purchase.status === 'confirmed' || purchase.status === 'partial';

    return (
        <AuthenticatedLayout>
            <Head title={`${t.purchases.title} ${purchase.reference}`} />

            <div className="space-y-6">
                {/* En-tête */}
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                        <Link
                            href={route('purchases.index', { code_user })}
                            className="rounded-lg p-2 transition hover:bg-gray-100 dark:hover:bg-white/5"
                        >
                            <ArrowLeft className="size-5 text-slate-500 dark:text-slate-400" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{purchase.reference}</h1>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Bon de commande fournisseur
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {getStatusBadge()}
                        
                        {/* Actions selon le statut */}
                        {purchase.status === 'draft' && (
                            <>
                                <button
                                    onClick={() => setShowConfirmModal(true)}
                                    className="inline-flex items-center gap-2 rounded-lg bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/20"
                                >
                                    <CheckCircle className="size-4" />
                                    Confirmer
                                </button>
                                <Link
                                    href={route('purchases.edit', { code_user, purchase: purchase.id })}
                                    className="inline-flex items-center gap-2 rounded-lg bg-amber-300/10 px-4 py-2 text-sm font-semibold text-amber-300 transition hover:bg-amber-300/20"
                                >
                                    <Edit className="size-4" />
                                    Modifier
                                </Link>
                            </>
                        )}

                        {canReceive && (
                            <button
                                onClick={() => setShowReceiveModal(true)}
                                className="inline-flex items-center gap-2 rounded-lg bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-300 transition hover:bg-green-500/20"
                            >
                                <Package className="size-4" />
                                Réceptionner
                            </button>
                        )}

                        {purchase.status !== 'cancelled' && purchase.status !== 'received' && (
                            <button
                                onClick={() => setShowCancelModal(true)}
                                className="inline-flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
                            >
                                <XCircle className="size-4" />
                                Annuler
                            </button>
                        )}

                        {(purchase.status === 'draft' || purchase.status === 'cancelled') && (
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="inline-flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
                            >
                                <Trash2 className="size-4" />
                                Supprimer
                            </button>
                        )}
                    </div>
                </div>

                {/* Informations principales */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Fournisseur */}
                    <div className="rounded-xl bg-gray-100 p-6 dark:bg-slate-800/50">
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                            <Building2 className="size-5 text-amber-300" />
                            Fournisseur
                        </h2>
                        <div className="space-y-2 text-sm">
                            <div>
                                <span className="font-semibold text-slate-900 dark:text-white">{purchase.supplier.name}</span>
                            </div>
                            {purchase.supplier.company_name && (
                                <div className="text-slate-500 dark:text-slate-400">{purchase.supplier.company_name}</div>
                            )}
                            {purchase.supplier.email && (
                                <div className="text-slate-600 dark:text-slate-300">📧 {purchase.supplier.email}</div>
                            )}
                            {purchase.supplier.phone && (
                                <div className="text-slate-600 dark:text-slate-300">📞 {purchase.supplier.phone}</div>
                            )}
                        </div>
                    </div>

                    {/* Dates et infos */}
                    <div className="rounded-xl bg-gray-100 p-6 dark:bg-slate-800/50">
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                            <Calendar className="size-5 text-amber-300" />
                            Informations
                        </h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-400">Date de commande:</span>
                                <span className="font-medium text-slate-900 dark:text-white">
                                    {formatDate(purchase.order_date)}
                                </span>
                            </div>
                            {purchase.expected_date && (
                                <div className="flex justify-between">
                                    <span className="text-slate-500 dark:text-slate-400">Livraison prévue:</span>
                                    <span className="font-medium text-slate-900 dark:text-white">
                                        {formatDate(purchase.expected_date)}
                                    </span>
                                </div>
                            )}
                            {purchase.received_date && (
                                <div className="flex justify-between">
                                    <span className="text-slate-500 dark:text-slate-400">Date de réception:</span>
                                    <span className="font-medium text-green-400">
                                        {formatDate(purchase.received_date)}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between border-t border-white/10 pt-3">
                                <span className="text-slate-500 dark:text-slate-400">Créé par:</span>
                                <span className="font-medium text-slate-900 dark:text-white">{purchase.user.name}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Articles */}
                <div className="rounded-xl bg-gray-100 p-6 dark:bg-slate-800/50">
                    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                        <Package className="size-5 text-amber-300" />
                        Articles commandés
                    </h2>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b border-white/10 text-slate-300">
                                <tr>
                                    <th className="pb-3 text-left font-medium">Produit</th>
                                    <th className="pb-3 text-center font-medium">Commandé</th>
                                    <th className="pb-3 text-center font-medium">Reçu</th>
                                    <th className="pb-3 text-right font-medium">Prix unitaire</th>
                                    <th className="pb-3 text-right font-medium">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {purchase.items.map((item) => (
                                    <tr key={item.id} className="text-slate-700 dark:text-slate-200">
                                        <td className="py-3">
                                            <div>
                                                <div className="font-medium text-slate-900 dark:text-white">
                                                    {item.product_name}
                                                </div>
                                                {item.product_sku && (
                                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                                        SKU: {item.product_sku}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 text-center font-medium">
                                            {item.quantity_ordered}
                                        </td>
                                        <td className="py-3 text-center">
                                            <span
                                                className={
                                                    item.quantity_received >= item.quantity_ordered
                                                        ? 'text-green-400'
                                                        : item.quantity_received > 0
                                                        ? 'text-yellow-400'
                                                        : 'text-slate-500 dark:text-slate-400'
                                                }
                                            >
                                                {item.quantity_received}
                                            </span>
                                        </td>
                                        <td className="py-3 text-right">
                                            {formatCurrency(item.unit_price)}
                                        </td>
                                        
                                        <td className="py-3 text-right font-semibold text-white">
                                            {formatCurrency(item.total)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Totaux */}
                <div className="rounded-xl bg-gray-100 p-6 dark:bg-slate-800/50">
                    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                        <DollarSign className="size-5 text-amber-300" />
                        Récapitulatif financier
                    </h2>

                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400">Sous-total:</span>
                            <span className="font-medium text-slate-900 dark:text-white">
                                {formatCurrency(purchase.subtotal)}
                            </span>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400">Remise totale:</span>
                            <span className="font-medium text-slate-900 dark:text-white">
                                -{formatCurrency(purchase.discount_amount)}
                            </span>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400">Taxes totales:</span>
                            <span className="font-medium text-slate-900 dark:text-white">
                                {formatCurrency(purchase.tax_amount)}
                            </span>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400">Frais de port:</span>
                            <span className="font-medium text-slate-900 dark:text-white">
                                {formatCurrency(purchase.shipping_cost)}
                            </span>
                        </div>

                        <div className="border-t border-gray-200 dark:border-white/10 pt-3">
                            <div className="flex justify-between">
                                <span className="text-lg font-semibold text-slate-900 dark:text-white">Total:</span>
                                <span className="text-2xl font-bold text-amber-300">
                                    {formatCurrency(purchase.total)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {(purchase.notes || purchase.internal_notes) && (
                    <div className="rounded-xl bg-gray-100 p-6 dark:bg-slate-800/50">
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                            <FileText className="size-5 text-amber-300" />
                            Notes
                        </h2>

                        <div className="space-y-4">
                            {purchase.notes && (
                                <div>
                                    <h3 className="mb-2 text-sm font-medium text-slate-300">
                                        Notes (visibles)
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{purchase.notes}</p>
                                </div>
                            )}

                            {purchase.internal_notes && (
                                <div>
                                    <h3 className="mb-2 text-sm font-medium text-slate-300">
                                        Notes internes
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{purchase.internal_notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de confirmation */}
            <Modal show={showConfirmModal} onClose={() => setShowConfirmModal(false)} maxWidth="lg">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="rounded-full bg-blue-500 p-3">
                            <CheckCircle className="size-7 text-blue-400" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-slate-500">Confirmer le bon de commande</h2>
                            <p className="text-sm text-slate-600">
                                Vous êtes sur le point de confirmer le bon de commande <span className="font-bold text-slate-900 dark:text-white">{purchase.reference}</span>
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 rounded-lg border border-white/20 bg-slate-900 p-5">
                        <h3 className="mb-4 text-base font-bold text-slate-900 dark:text-white">Récapitulatif</h3>
                        <div className="space-y-3 text-base">
                            <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-300">Fournisseur:</span>
                                <span className="font-semibold text-slate-900 dark:text-white">{purchase.supplier.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-300">Nombre d'articles:</span>
                                <span className="font-semibold text-slate-900 dark:text-white">{purchase.items.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-300">Quantité totale:</span>
                                <span className="font-semibold text-slate-900 dark:text-white">
                                    {purchase.items.reduce((sum, item) => sum + item.quantity_ordered, 0)} unités
                                </span>
                            </div>
                            <div className="flex justify-between border-t border-white/20 pt-3 mt-2">
                                <span className="text-slate-700 dark:text-slate-200 font-medium">Montant total:</span>
                                <span className="text-xl font-bold text-amber-400">{formatCurrency(purchase.total)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 rounded-lg border border-blue-400/40 bg-blue-500 p-4">
                        <p className="text-sm text-blue-200 leading-relaxed">
                            <span className="text-base">ℹ️</span> Cette action marquera la commande comme envoyée au fournisseur. Le statut passera à "Confirmé" et vous pourrez ensuite réceptionner la marchandise.
                        </p>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={() => setShowConfirmModal(false)}
                            disabled={processing}
                            className="rounded-lg border border-white/20 px-5 py-2.5 text-base font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
                        >
                            Annuler
                        </button>
                        <PrimaryButton onClick={handleConfirm} disabled={processing}>
                            {processing ? 'Confirmation en cours...' : 'Confirmer la commande'}
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>

            {/* Modal de réception */}
            <Modal show={showReceiveModal} onClose={() => setShowReceiveModal(false)} maxWidth="2xl">
                <div className="p-6">
                    
                    <div className='w-full mb-2'>
                        <div className='flex flex-col'>
                            <p className="text-base text-slate-600">
                                Bon de commande <span className="font-bold text-gray-500">{purchase.reference}</span>
                            </p>
                            <p className="text-base text-slate-600">
                                Fournisseur: <span className="font-bold text-gray-500">{purchase.supplier.name}</span>
                            </p>
                        </div>
                    </div>

                    {/* Résumé de réception */}
                    <div className=" grid grid-cols-3 gap-4">
                        <div className="rounded-lg border border-blue-400/30 bg-blue-500/20 p-4">
                            <div className="text-sm font-medium text-blue-600">Total commandé</div>
                            <div className="mt-2 text-3xl font-bold text-blue-600">
                                {purchase.items.reduce((sum, item) => sum + item.quantity_ordered, 0)}
                            </div>
                        </div>
                        <div className="rounded-lg border border-green-400/30 bg-green-500/20 p-4">
                            <div className="text-sm font-medium text-green-600">Déjà reçu</div>
                            <div className="mt-2 text-3xl font-bold text-green-600">
                                {purchase.items.reduce((sum, item) => sum + item.quantity_received, 0)}
                            </div>
                        </div>
                        <div className="rounded-lg border border-amber-400/30 bg-amber-500/20 p-4">
                            <div className="text-sm font-medium text-amber-600">Restant</div>
                            <div className="mt-2 text-3xl font-bold text-amber-600">
                                {purchase.items.reduce((sum, item) => sum + (item.quantity_ordered - item.quantity_received), 0)}
                            </div>
                        </div>
                    </div>

                    {/* Liste des articles */}
                    <div className="space-y-3">
                        <h3 className="text-base font-bold text-white">Articles à réceptionner</h3>
                        {purchase.items.map((item) => {
                            const remaining = item.quantity_ordered - item.quantity_received;
                            const percentReceived = Math.round((item.quantity_received / item.quantity_ordered) * 100);
                            
                            return (
                                <div
                                    key={item.id}
                                    className="rounded-lg border border-white/20 bg-slate-900/90 p-4 transition hover:border-white/30"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="text-base font-semibold text-slate-900 dark:text-white">
                                                {item.product_name}
                                            </div>
                                            {item.product_sku && (
                                                <div className="text-sm text-slate-300 mt-0.5">
                                                    SKU: {item.product_sku}
                                                </div>
                                            )}
                                            
                                            {/* Barre de progression */}
                                            <div className="mt-3">
                                                <div className="flex items-center justify-between text-sm text-slate-300">
                                                    <span className="font-medium">Progression</span>
                                                    <span className="font-bold">{percentReceived}%</span>
                                                </div>
                                                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-700">
                                                    <div
                                                        className={`h-full transition-all ${
                                                            percentReceived === 100
                                                                ? 'bg-green-500'
                                                                : percentReceived > 0
                                                                ? 'bg-yellow-500'
                                                                : 'bg-slate-600'
                                                        }`}
                                                        style={{ width: `${percentReceived}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="mt-3 flex gap-5 text-sm">
                                                <span className="text-slate-600 dark:text-slate-300">
                                                    Commandé: <span className="font-bold text-slate-900 dark:text-white">{item.quantity_ordered}</span>
                                                </span>
                                                <span className="text-slate-600 dark:text-slate-300">
                                                    Reçu: <span className="font-bold text-green-400">{item.quantity_received}</span>
                                                </span>
                                                <span className="text-slate-600 dark:text-slate-300">
                                                    Restant: <span className="font-bold text-amber-400">{remaining}</span>
                                                </span>
                                            </div>
                                        </div>

                                        <div className="w-32">
                                            <InputLabel value="Quantité" className="text-sm font-semibold text-slate-900 dark:text-white" />
                                            <TextInput
                                                type="number"
                                                min="0"
                                                max={remaining}
                                                value={receivingQuantities[item.id]}
                                                onChange={(e) =>
                                                    setReceivingQuantities({
                                                        ...receivingQuantities,
                                                        [item.id]: parseInt(e.target.value) || 0,
                                                    })
                                                }
                                                className="mt-1 block w-full text-center text-base font-semibold text-white"
                                                disabled={remaining === 0}
                                            />
                                            {remaining === 0 && (
                                                <div className="mt-1.5 text-sm font-semibold text-green-400">✓ Complet</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-4 rounded-lg border border-green-400/40 bg-green-500/20 p-4">
                        <p className="text-sm text-green-500 leading-relaxed">
                            <span className="text-base font-bold">💡 Astuce:</span> Vous pouvez réceptionner partiellement. Les articles reçus seront ajoutés au stock immédiatement. Le statut du bon de commande sera mis à jour automatiquement.
                        </p>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={() => setShowReceiveModal(false)}
                            disabled={processing}
                            className="rounded-lg border border-white/20 px-5 py-2.5 text-base font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
                        >
                            Annuler
                        </button>
                        <PrimaryButton 
                            onClick={handleReceive} 
                            disabled={processing || Object.values(receivingQuantities).every(q => q === 0)}
                        >
                            {processing ? 'Réception en cours...' : 'Valider la réception'}
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>

            {/* Modal d'annulation */}
            <Modal show={showCancelModal} onClose={() => setShowCancelModal(false)} maxWidth="lg">
                <div className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="rounded-full bg-red-500/20 w-12 h-12 flex items-center justify-center">
                            <XCircle className="size-6 text-red-600" />
                        </div>
                        <div className="flex-1 flex flex-col ">
                            <h2 className="text-lg font-bold text-slate-500">Annuler le bon de commande</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Vous êtes sur le point d'annuler le bon de commande <span className="font-semibold text-slate-900 dark:text-white">{purchase.reference}</span>
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 rounded-lg bg-slate-900 p-4">
                        <h3 className="mb-3 text-sm font-semibold text-white">Informations de la commande</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-400">Fournisseur:</span>
                                <span className="font-medium text-slate-900 dark:text-white">{purchase.supplier.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-400">Date de commande:</span>
                                <span className="font-medium text-slate-900 dark:text-white">{formatDate(purchase.order_date)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-400">Montant:</span>
                                <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(purchase.total)}</span>
                            </div>
                            {purchase.status === 'partial' && (
                                <div className="flex justify-between">
                                    <span className="text-slate-500 dark:text-slate-400">Articles reçus:</span>
                                    <span className="font-medium text-yellow-400">
                                        {purchase.items.reduce((sum, item) => sum + item.quantity_received, 0)} / {purchase.items.reduce((sum, item) => sum + item.quantity_ordered, 0)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 rounded-lg border border-red-500 bg-red-500 p-4">
                        <div className="flex gap-3">
                            <div className="text-red-400">⚠️</div>
                            <div>
                                <p className="text-md font-semibold text-red-300">Attention</p>
                                <ul className="mt-2 space-y-1 text-sm text-red-200">
                                    <li>• Cette action est <strong>irréversible</strong></li>
                                    <li>• Le bon de commande sera marqué comme annulé</li>
                                    {purchase.status === 'partial' && (
                                        <li>• Les quantités déjà reçues resteront en stock</li>
                                    )}
                                    <li>• Vous ne pourrez plus réceptionner de marchandise</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={() => setShowCancelModal(false)}
                            disabled={processing}
                            className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/5 disabled:opacity-50"
                        >
                            Non, garder la commande
                        </button>
                        <button
                            onClick={handleCancel}
                            disabled={processing}
                            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
                        >
                            {processing ? 'Annulation en cours...' : 'Oui, annuler définitivement'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal de suppression */}
            <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} maxWidth="lg">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="rounded-full bg-red-500/30 p-3">
                            <Trash2 className="size-7 text-red-400" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-slate-600">Supprimer le bon de commande</h2>
                            <p className="text-sm text-slate-700">
                                Vous êtes sur le point de supprimer définitivement le bon de commande <span className="font-bold text-slate-900 dark:text-white">{purchase.reference}</span>
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 rounded-lg border border-white/20 bg-slate-900 p-5">
                        <h3 className="mb-4 text-base font-bold text-slate-900 dark:text-white">Informations</h3>
                        <div className="space-y-3 text-base">
                            <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-300">Fournisseur:</span>
                                <span className="font-semibold text-slate-900 dark:text-white">{purchase.supplier.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-300">Date de commande:</span>
                                <span className="font-semibold text-slate-900 dark:text-white">{formatDate(purchase.order_date)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-300">Statut:</span>
                                <span className="font-semibold text-slate-900 dark:text-white">
                                    {purchase.status === 'draft' ? 'Brouillon' : 'Annulé'}
                                </span>
                            </div>
                            <div className="flex justify-between border-t border-white/20 pt-3 mt-2">
                                <span className="text-slate-700 dark:text-slate-200 font-medium">Montant:</span>
                                <span className="text-xl font-bold text-amber-400">{formatCurrency(purchase.total)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 rounded-lg border border-red-500 bg-red-500 p-4">
                        <div className="flex gap-3">
                            <div className="text-xl">⚠️</div>
                            <div className="flex-1">
                                <p className="text-base font-bold text-red-200">Attention : Action irréversible</p>
                                <ul className="mt-2 space-y-1.5 text-sm text-red-100">
                                    <li>• Le bon de commande sera <strong>définitivement supprimé</strong></li>
                                    <li>• Tous les articles associés seront supprimés</li>
                                    <li>• Cette action ne peut pas être annulée</li>
                                    <li>• Aucun mouvement de stock ne sera créé</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={() => setShowDeleteModal(false)}
                            disabled={processing}
                            className="rounded-lg border border-white/20 px-5 py-2.5 text-base font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={processing}
                            className="rounded-lg bg-red-600 px-5 py-2.5 text-base font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                        >
                            {processing ? 'Suppression en cours...' : 'Oui, supprimer définitivement'}
                        </button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
