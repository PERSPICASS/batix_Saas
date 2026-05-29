import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Calendar, Package, User, DollarSign, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useLocale } from '@/contexts/LocaleContext';

interface Preorder {
    id: number;
    product: { id: number; name: string; sku: string };
    customer: { id: number; name: string; email: string; phone: string };
    shop: { id: number; name: string };
    user: { id: number; name: string };
    quantity_ordered: number;
    unit_price: number;
    expected_delivery_date: string;
    deposit_amount: number | null;
    status: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

interface Props {
    preorder: Preorder;
}

export default function Show({ preorder }: Props) {
    const { t } = useLocale();
    const [showStatusModal, setShowStatusModal] = useState(false);
    const { data, setData, patch, processing, errors } = useForm({
        status: preorder.status,
    });

    const total = preorder.quantity_ordered * preorder.unit_price;
    const remaining = total - (preorder.deposit_amount || 0);
    const isOverdue = new Date(preorder.expected_delivery_date) < new Date() && preorder.status !== 'completed' && preorder.status !== 'cancelled';

    const getStatusColor = (status: string) => {
        const colors: Record<string, { bg: string; text: string }> = {
            'pending': { bg: 'bg-yellow-500/10', text: 'text-yellow-300' },
            'confirmed': { bg: 'bg-blue-500/10', text: 'text-blue-300' },
            'ready': { bg: 'bg-green-500/10', text: 'text-green-300' },
            'completed': { bg: 'bg-slate-500/10', text: 'text-slate-300' },
            'cancelled': { bg: 'bg-red-500/10', text: 'text-red-300' },
        };
        return colors[status] || { bg: 'bg-slate-500/10', text: 'text-slate-300' };
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            'pending': 'En attente',
            'confirmed': 'Confirmée',
            'ready': 'Prête',
            'completed': 'Complétée',
            'cancelled': 'Annulée',
        };
        return labels[status] || status;
    };

    const handleStatusChange = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('preorders.update-status', preorder.id));
        setShowStatusModal(false);
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('preorders.index')}
                            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition"
                        >
                            <ArrowLeft className="size-4" />
                        </Link>
                        <div>
                            <h2 className="text-xl font-semibold text-white">Pré-commande</h2>
                            <p className="text-sm text-slate-400">{preorder.product.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {preorder.status === 'ready' && (
                            <Link
                                href={route('preorders.convert', preorder.id)}
                                method="post"
                                as="button"
                                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition"
                            >
                                <CheckCircle className="size-4" /> Convertir en vente
                            </Link>
                        )}
                        <button
                            onClick={() => setShowStatusModal(true)}
                            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 transition"
                        >
                            Changer le statut
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Pré-commande" />

            <div className="space-y-6">
                {/* Statut et alertes */}
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-400 mb-2">Statut actuel</p>
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(preorder.status).bg} ${getStatusColor(preorder.status).text}`}>
                                {getStatusLabel(preorder.status)}
                            </span>
                        </div>
                        {isOverdue && (
                            <div className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                                <p className="text-sm font-medium text-red-300">
                                    ⚠️ Dépassement de la date de livraison prévue
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Informations produit */}
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
                        <Package className="size-5 text-purple-400" />
                        Produit
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-400">Nom</span>
                            <span className="text-sm text-white font-medium">{preorder.product.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-400">SKU</span>
                            <span className="text-sm text-white font-mono">{preorder.product.sku}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-400">Quantité commandée</span>
                            <span className="text-sm text-white font-medium">{preorder.quantity_ordered}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-400">Prix unitaire</span>
                            <span className="text-sm text-white font-medium">{preorder.unit_price.toFixed(2)} FCFA</span>
                        </div>
                    </div>
                </div>

                {/* Informations client */}
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
                        <User className="size-5 text-blue-400" />
                        Client
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-400">Nom</span>
                            <span className="text-sm text-white font-medium">{preorder.customer.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-400">Email</span>
                            <span className="text-sm text-white">{preorder.customer.email || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-400">Téléphone</span>
                            <span className="text-sm text-white">{preorder.customer.phone || '-'}</span>
                        </div>
                    </div>
                </div>

                {/* Résumé financier */}
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
                        <DollarSign className="size-5 text-green-400" />
                        Résumé financier
                    </h3>
                    <div className="space-y-3 border-b border-white/10 pb-4 mb-4">
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-400">Montant total</span>
                            <span className="text-sm text-white font-semibold">{total.toFixed(2)} FCFA</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-400">Acompte versé</span>
                            <span className="text-sm text-white font-semibold">{(preorder.deposit_amount || 0).toFixed(2)} FCFA</span>
                        </div>
                        <div className="flex justify-between text-lg">
                            <span className="text-slate-300 font-semibold">Reste à payer</span>
                            <span className={`font-bold ${remaining > 0 ? 'text-amber-300' : 'text-green-300'}`}>
                                {remaining.toFixed(2)} FCFA
                            </span>
                        </div>
                    </div>
                </div>

                {/* Dates */}
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
                        <Calendar className="size-5 text-amber-400" />
                        Dates
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-400">Date de livraison prévue</span>
                            <span className="text-sm text-white font-medium">
                                {new Date(preorder.expected_delivery_date).toLocaleDateString('fr-FR')}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-400">Créée le</span>
                            <span className="text-sm text-white">
                                {new Date(preorder.created_at).toLocaleDateString('fr-FR')} à {new Date(preorder.created_at).toLocaleTimeString('fr-FR')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {preorder.notes && (
                    <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6">
                        <h3 className="text-sm font-semibold text-slate-300 mb-3">Notes</h3>
                        <p className="text-sm text-slate-300 whitespace-pre-wrap">{preorder.notes}</p>
                    </div>
                )}

                {/* Informations système */}
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6">
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-xs text-slate-400">Créée par</span>
                            <span className="text-xs text-slate-300">{preorder.user.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-xs text-slate-400">Boutique</span>
                            <span className="text-xs text-slate-300">{preorder.shop.name}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de changement de statut */}
            {showStatusModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="rounded-xl border border-white/10 bg-slate-900 p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-white mb-4">Changer le statut</h3>

                        <form onSubmit={handleStatusChange} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Nouveau statut
                                </label>
                                <select
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                                >
                                    <option value="pending">En attente</option>
                                    <option value="confirmed">Confirmée</option>
                                    <option value="ready">Prête</option>
                                    <option value="completed">Complétée</option>
                                    <option value="cancelled">Annulée</option>
                                </select>
                                {errors.status && <p className="mt-1 text-xs text-red-400">{errors.status}</p>}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowStatusModal(false)}
                                    className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 transition"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50 transition"
                                >
                                    {processing ? 'Mise à jour...' : 'Confirmer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
