import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Pencil, CheckCircle, Package, AlertTriangle, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { useRoute } from '@/utils/route';
import Currency from '@/Components/Currency';
import { useState } from 'react';
import Modal from '@/Components/Modal';
import InventoryCompletionPreview from '@/Components/InventoryCompletionPreview';
import ProductImage from '@/Components/ProductImage';
import { useLocale } from '@/contexts/LocaleContext';
import { inventoryDiscrepancyValue, inventoryTotalValue } from '@/utils/inventoryValue';

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
    stock_quantity: number;
    defective_stock_quantity: number;
}

interface InventoryItem {
    id: number;
    product: Product;
    expected_quantity: number;
    expected_defective_quantity: number;
    counted_quantity: number | null;
    defective_quantity: number;
    difference: number;
    defective_difference: number;
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
    const { t, locale } = useLocale();
    const route = useRoute();
    const [completeModal, setCompleteModal] = useState(false);
    const [processing, setProcessing] = useState(false);

    const getStatusBadge = (status: string) => {
        const statuses: Record<string, { label: string; bg: string; text: string }> = {
            draft: { label: t.inventory.status.draft, bg: 'bg-slate-500/20', text: 'text-slate-600 dark:text-slate-300' },
            in_progress: { label: t.inventory.status.in_progress, bg: 'bg-blue-500/20', text: 'text-blue-300' },
            completed: { label: t.inventory.status.completed, bg: 'bg-green-500/20', text: 'text-green-300' },
            cancelled: { label: t.inventory.status.cancelled, bg: 'bg-red-500/20', text: 'text-red-300' },
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

    const totalDefective = inventory.items.reduce((sum, item) => sum + item.defective_quantity, 0);
    const totalGoodDifference = inventory.items.reduce((sum, item) => sum + item.difference, 0);
    const totalDefectiveDifference = inventory.items.reduce((sum, item) => sum + item.defective_difference, 0);
    // Les défectueuses valent zéro : seul l'écart de stock bon a un coût. Voir
    // utils/inventoryValue.ts pour la règle et ce qu'elle corrige.
    const totalValue = inventoryTotalValue(inventory.items);

    // Preview of what "Terminer l'inventaire" will actually change, computed against the
    // product's LIVE stock (loaded with the page) — this is exactly what
    // StockMovementService::recordInventoryAdjustmentWithDefective compares against, which can
    // differ from expected_quantity if stock moved since the item was counted.
    const completionPreview = inventory.items
        .map((item) => {
            const countedGood = item.counted_quantity ?? 0;
            const goodBefore = item.product.stock_quantity;
            const goodAfter = countedGood;
            const defectiveBefore = item.product.defective_stock_quantity;
            const defectiveAfter = item.defective_quantity;
            return {
                item,
                goodBefore,
                goodAfter,
                goodChanged: goodAfter !== goodBefore,
                defectiveBefore,
                defectiveAfter,
                defectiveChanged: defectiveAfter !== defectiveBefore,
            };
        })
        .filter((row) => row.goodChanged || row.defectiveChanged);

    return (
        <AuthenticatedLayout
            header={
                <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                    {t.inventory.title} {inventory.inventory_number}
                </h1>
            }
        >
            <Head title={`${t.inventory.title} ${inventory.inventory_number}`} />

            <div className="space-y-6">
                {inventory.status !== 'completed' && inventory.status !== 'cancelled' && (
                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href={route('inventory.edit', { inventory: inventory.id })}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-gray-100 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                        >
                            <Pencil className="size-4" />
                            {t.inventory.actions.edit}
                        </Link>
                        <button
                            onClick={handleComplete}
                            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-500"
                        >
                            <CheckCircle className="size-4" />
                            {t.inventory.completeModal.title}
                        </button>
                    </div>
                )}

                {/* Informations générales */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t.common.form.generalInfo}</h2>
                            <div className="mt-4 grid grid-cols-2 gap-6 md:grid-cols-4">
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{t.common.misc.shop}</p>
                                    <p className="font-medium text-slate-900 dark:text-white">{inventory.shop.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{t.common.misc.date}</p>
                                    <p className="font-medium text-slate-900 dark:text-white">
                                        {new Date(inventory.inventory_date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{t.inventory.show.performedBy}</p>
                                    <p className="font-medium text-slate-900 dark:text-white">{inventory.user.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{t.common.misc.status}</p>
                                    <div className="mt-1">{getStatusBadge(inventory.status)}</div>
                                </div>
                            </div>
                            {inventory.notes && (
                                <div className="mt-4">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{t.common.form.notes}</p>
                                    <p className="text-slate-900 dark:text-white">{inventory.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Statistiques */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-blue-500/20 p-2">
                                <Package className="size-5 text-blue-300" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{t.inventory.columns.items}</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">{inventory.total_items}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-amber-500/20 p-2">
                                <AlertTriangle className="size-5 text-amber-300" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{t.inventory.columns.discrepancies}</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">{inventory.total_discrepancies}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-red-500/20 p-2">
                                <AlertTriangle className="size-5 text-red-300" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{t.inventory.show.defective}</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">{totalDefective}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-center gap-3">
                            <div className={`rounded-lg p-2 ${totalGoodDifference >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                {totalGoodDifference >= 0 ? (
                                    <TrendingUp className="size-5 text-green-300" />
                                ) : (
                                    <TrendingDown className="size-5 text-red-300" />
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{t.inventory.show.difference}</p>
                                <p className={`text-xl font-bold ${totalGoodDifference >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                                    {totalGoodDifference > 0 ? '+' : ''}{totalGoodDifference}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-center gap-3">
                            <div className={`rounded-lg p-2 ${totalDefectiveDifference >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                {totalDefectiveDifference >= 0 ? (
                                    <TrendingUp className="size-5 text-green-300" />
                                ) : (
                                    <TrendingDown className="size-5 text-red-300" />
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{t.inventory.show.defectiveDifference}</p>
                                <p className={`text-xl font-bold ${totalDefectiveDifference >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                                    {totalDefectiveDifference > 0 ? '+' : ''}{totalDefectiveDifference}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-center gap-3">
                            <div className={`rounded-lg p-2 ${totalValue >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                {totalValue >= 0 ? (
                                    <TrendingUp className="size-5 text-green-300" />
                                ) : (
                                    <TrendingDown className="size-5 text-red-300" />
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{t.inventory.show.differenceValue}</p>
                                {/*
                                  Le signe est écrit, et non seulement suggéré par la couleur :
                                  un excédent et un manque de même montant s'affichaient au
                                  chiffre près de la même façon. La couleur ne survit ni à une
                                  capture d'écran, ni à une impression, ni au daltonisme.
                                  Le moins vient du formatage ; seul le plus doit être ajouté.
                                */}
                                <p className={`text-xl font-bold ${totalValue >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                                    {totalValue > 0 && '+'}
                                    <Currency amount={totalValue} />
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Liste des articles */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-white/5">
                    <h2 className="mb-4 flex items-center gap-1.5 text-lg font-semibold text-slate-900 dark:text-white">
                        {t.inventory.show.itemsTitle}
                        <span title={t.inventory.show.helpText}>
                            <Info className="size-4 text-slate-500 dark:text-slate-400" />
                        </span>
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10 text-left text-sm text-slate-400">
                                    <th className="pb-3 pr-4">{t.inventory.form.product}</th>
                                    <th className="pb-3 pr-4 text-right">{t.inventory.show.expectedStock}</th>
                                    <th className="pb-3 pr-4 text-right">{t.inventory.show.goodQuantity}</th>
                                    <th className="pb-3 pr-4 text-right">{t.inventory.show.defective}</th>
                                    <th className="pb-3 pr-4 text-right">{t.inventory.show.difference}</th>
                                    <th className="pb-3 pr-4 text-right">{t.inventory.show.defectiveDifference}</th>
                                    <th className="pb-3 text-right">{t.inventory.show.differenceValue}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {inventory.items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="py-3 pr-4">
                                            <div className="flex items-center gap-3">
                                                <ProductImage src={item.product.image} name={item.product.name} thumbnailClass="size-9" />
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white">{item.product.name}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">SKU: {item.product.sku}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 pr-4 text-right text-slate-300">
                                            {item.expected_quantity}
                                        </td>
                                        <td className="py-3 pr-4 text-right text-slate-900 dark:text-white">
                                            {item.counted_quantity ?? '-'}
                                        </td>
                                        <td className="py-3 pr-4 text-right text-slate-900 dark:text-white">
                                            {item.defective_quantity}
                                        </td>
                                        <td className="py-3 pr-4 text-right">
                                            <span className={`font-medium ${
                                                item.difference === 0
                                                    ? 'text-slate-500 dark:text-slate-400'
                                                    : item.difference > 0
                                                        ? 'text-green-300'
                                                        : 'text-red-300'
                                            }`}>
                                                {item.difference > 0 ? '+' : ''}{item.difference}
                                            </span>
                                        </td>
                                        <td className="py-3 pr-4 text-right">
                                            <span className={`font-medium ${
                                                item.defective_difference === 0
                                                    ? 'text-slate-500 dark:text-slate-400'
                                                    : item.defective_difference > 0
                                                        ? 'text-green-300'
                                                        : 'text-red-300'
                                            }`}>
                                                {item.defective_difference > 0 ? '+' : ''}{item.defective_difference}
                                            </span>
                                        </td>
                                        <td className="py-3 text-right">
                                            {(() => {
                                                // Calculé une fois, au lieu de trois appels pour
                                                // décider d'une couleur puis afficher un montant.
                                                const value = inventoryDiscrepancyValue(item.difference, item.unit_cost);

                                                return (
                                                    <span className={`font-medium ${
                                                        value === 0
                                                            ? 'text-slate-500 dark:text-slate-400'
                                                            : value > 0
                                                                ? 'text-green-300'
                                                                : 'text-red-300'
                                                    }`}>
                                                        {value > 0 && '+'}
                                                        <Currency amount={value} />
                                                    </span>
                                                );
                                            })()}
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
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-gray-100 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                    >
                        <ArrowLeft className="size-4" />
                        {t.inventory.show.backToList}
                    </Link>
                </div>

                {/* Modal de confirmation pour terminer l'inventaire */}
                <Modal show={completeModal} onClose={() => setCompleteModal(false)} maxWidth="2xl">
                    <div className="bg-white p-6 dark:bg-slate-900">
                        <div className="flex items-start gap-4">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-green-500/20">
                                <CheckCircle className="size-6 text-green-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t.inventory.completeModal.title}</h3>
                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t.inventory.completeModal.previewIntro}</p>

                                <InventoryCompletionPreview
                                    rows={completionPreview.map(({ item, ...rest }) => ({
                                        id: item.id,
                                        productName: item.product.name,
                                        ...rest,
                                    }))}
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setCompleteModal(false)}
                                disabled={processing}
                                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-gray-100 disabled:opacity-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                            >
                                {t.common.actions.cancel}
                            </button>
                            <button
                                type="button"
                                onClick={confirmComplete}
                                disabled={processing}
                                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-500 disabled:opacity-50"
                            >
                                {processing ? t.common.actions.processing : t.inventory.completeModal.confirmText}
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        </AuthenticatedLayout>
    );
}
