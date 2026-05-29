import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Pencil, CheckCircle, Package, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { useRoute } from '@/utils/route';
import Currency from '@/Components/Currency';
import { useState } from 'react';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';
import ProductImage from '@/Components/ProductImage';
import { useLocale } from '@/contexts/LocaleContext';

interface Shop {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    sku: string;
    barcode: string | null;
    image: string | null;
}

interface InventoryItem {
    id: number;
    product: Product;
    expected_quantity: number;
    counted_quantity: number | null;
    difference: number;
    unit_cost: number;
}

interface Inventory {
    id: number;
    inventory_number: string;
    inventory_date: string;
    status: string;
    notes: string | null;
    total_items: number;
    total_discrepancies: number;
    shop: Shop;
    user: User;
    items: InventoryItem[];
}

interface Props {
    inventory: Inventory;
}

export default function InventoryShow({ inventory }: Props) {
    const { t } = useLocale();
    const route = useRoute();
    const [completeModal, setCompleteModal] = useState(false);
    const [processing, setProcessing] = useState(false);

    const getStatusBadge = (status: string) => {
        const statuses: Record<string, { label: string; bg: string; text: string }> = {
            draft: { label: 'Brouillon', bg: 'bg-slate-500/20', text: 'text-slate-300' },
            in_progress: { label: 'En cours', bg: 'bg-blue-500/20', text: 'text-blue-300' },
            completed: { label: 'Terminé', bg: 'bg-green-500/20', text: 'text-green-300' },
            cancelled: { label: 'Annulé', bg: 'bg-red-500/20', text: 'text-red-300' },
        };

        const statusInfo = statuses[status] || statuses.draft;

        return (
            <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${statusInfo.bg} ${statusInfo.text}`}>
                {statusInfo.label}
            </span>
        );
    };

    const handleComplete = () => {
        setCompleteModal(true);
    };

    const confirmComplete = () => {
        setProcessing(true);
        router.post(route('inventory.complete', { inventory: inventory.id }), {}, {
            onSuccess: () => {
                setCompleteModal(false);
                setProcessing(false);
            },
            onError: () => setProcessing(false),
        });
    };

    const totalExpected = inventory.items.reduce((sum, item) => sum + item.expected_quantity, 0);
    const totalCounted = inventory.items.reduce((sum, item) => sum + (item.counted_quantity || 0), 0);
    const totalDifference = totalCounted - totalExpected;
    const totalValue = inventory.items.reduce((sum, item) => sum + (item.difference * item.unit_cost), 0);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-white">
                        Inventaire {inventory.inventory_number}
                    </h1>
                    <div className="flex items-center gap-2">
                        {inventory.status !== 'completed' && inventory.status !== 'cancelled' && (
                            <>
                                <Link
                                    href={route('inventory.edit', { inventory: inventory.id })}
                                    className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                                >
                                    <Pencil className="size-4" />
                                    Modifier
                                </Link>
                                <button
                                    onClick={handleComplete}
                                    className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-500"
                                >
                                    <CheckCircle className="size-4" />
                                    Terminer l'inventaire
                                </button>
                            </>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={`Inventaire ${inventory.inventory_number}`} />

            <div className="space-y-6">
                {/* Informations générales */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-white">Informations générales</h2>
                            <div className="mt-4 grid grid-cols-2 gap-6 md:grid-cols-4">
                                <div>
                                    <p className="text-sm text-slate-400">Boutique</p>
                                    <p className="font-medium text-white">{inventory.shop.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-400">Date</p>
                                    <p className="font-medium text-white">
                                        {new Date(inventory.inventory_date).toLocaleDateString('fr-FR')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-400">Effectué par</p>
                                    <p className="font-medium text-white">{inventory.user.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-400">Statut</p>
                                    <div className="mt-1">{getStatusBadge(inventory.status)}</div>
                                </div>
                            </div>
                            {inventory.notes && (
                                <div className="mt-4">
                                    <p className="text-sm text-slate-400">Notes</p>
                                    <p className="text-white">{inventory.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Statistiques */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-blue-500/20 p-2">
                                <Package className="size-5 text-blue-300" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Articles</p>
                                <p className="text-xl font-bold text-white">{inventory.total_items}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-amber-500/20 p-2">
                                <AlertTriangle className="size-5 text-amber-300" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Écarts</p>
                                <p className="text-xl font-bold text-white">{inventory.total_discrepancies}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center gap-3">
                            <div className={`rounded-lg p-2 ${totalDifference >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                {totalDifference >= 0 ? (
                                    <TrendingUp className="size-5 text-green-300" />
                                ) : (
                                    <TrendingDown className="size-5 text-red-300" />
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Différence totale</p>
                                <p className={`text-xl font-bold ${totalDifference >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                                    {totalDifference > 0 ? '+' : ''}{totalDifference}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center gap-3">
                            <div className={`rounded-lg p-2 ${totalValue >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                {totalValue >= 0 ? (
                                    <TrendingUp className="size-5 text-green-300" />
                                ) : (
                                    <TrendingDown className="size-5 text-red-300" />
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Valeur écart</p>
                                <p className={`text-xl font-bold ${totalValue >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                                    <Currency amount={Math.abs(totalValue)} />
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Liste des articles */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <h2 className="mb-4 text-lg font-semibold text-white">Articles inventoriés</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10 text-left text-sm text-slate-400">
                                    <th className="pb-3 pr-4">Produit</th>
                                    <th className="pb-3 pr-4 text-right">Stock théorique</th>
                                    <th className="pb-3 pr-4 text-right">Stock réel</th>
                                    <th className="pb-3 pr-4 text-right">Écart</th>
                                    <th className="pb-3 text-right">Valeur écart</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {inventory.items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="py-3 pr-4">
                                            <div className="flex items-center gap-3">
                                                <ProductImage src={item.product.image} name={item.product.name} thumbnailClass="size-9" />
                                                <div>
                                                    <p className="font-medium text-white">{item.product.name}</p>
                                                    <p className="text-xs text-slate-400">SKU: {item.product.sku}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 pr-4 text-right text-slate-300">
                                            {item.expected_quantity}
                                        </td>
                                        <td className="py-3 pr-4 text-right text-white">
                                            {item.counted_quantity ?? '-'}
                                        </td>
                                        <td className="py-3 pr-4 text-right">
                                            <span className={`font-medium ${
                                                item.difference === 0 
                                                    ? 'text-slate-400' 
                                                    : item.difference > 0 
                                                        ? 'text-green-300' 
                                                        : 'text-red-300'
                                            }`}>
                                                {item.difference > 0 ? '+' : ''}{item.difference}
                                            </span>
                                        </td>
                                        <td className="py-3 text-right">
                                            <span className={`font-medium ${
                                                item.difference === 0 
                                                    ? 'text-slate-400' 
                                                    : item.difference > 0 
                                                        ? 'text-green-300' 
                                                        : 'text-red-300'
                                            }`}>
                                                <Currency amount={Math.abs(item.difference * item.unit_cost)} />
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Bouton retour */}
                <div className="flex justify-start">
                    <Link
                        href={route('inventory.index')}
                        className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                    >
                        <ArrowLeft className="size-4" />
                        Retour à la liste
                    </Link>
                </div>

                {/* Modal de confirmation pour terminer l'inventaire */}
                <ConfirmDeleteModal
                    show={completeModal}
                    onClose={() => setCompleteModal(false)}
                    onConfirm={confirmComplete}
                    title="Terminer l'inventaire"
                    message={`Terminer l'inventaire "${inventory.inventory_number}" ? Les différences seront appliquées au stock.`}
                    confirmText="Terminer"
                    processing={processing}
                />
            </div>
        </AuthenticatedLayout>
    );
}
