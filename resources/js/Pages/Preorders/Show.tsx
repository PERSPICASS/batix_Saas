import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Calendar, Package, User, DollarSign, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import InputError from '@/Components/InputError';
import { useShopSettings } from '@/Components/Currency';

interface Preorder {
    id: number;
    product: { id: number; name: string; sku: string };
    customer: { id: number; name: string; email: string; phone: string };
    shop: { id: number; name: string };
    user: { id: number; name: string };
    quantity_ordered: number;
    unit_price: string;
    expected_delivery_date: string;
    deposit_amount: string | null;
    status: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

interface Props {
    preorder: Preorder;
}

export default function Show({ preorder }: Props) {
    const { t, locale } = useLocale();
    const { formatCurrency } = useShopSettings();
    const dateLocale = locale === 'fr' ? 'fr-FR' : 'en-GB';
    const [showStatusModal, setShowStatusModal] = useState(false);
    const { data, setData, patch, processing, errors } = useForm({
        status: preorder.status,
    });

    const unitPrice = parseFloat(preorder.unit_price) || 0;
    const depositAmount = parseFloat(preorder.deposit_amount || '0') || 0;
    const total = preorder.quantity_ordered * unitPrice;
    const remaining = total - depositAmount;
    const isOverdue = new Date(preorder.expected_delivery_date) < new Date() && preorder.status !== 'completed' && preorder.status !== 'cancelled';

    const getStatusColor = (status: string) => {
        const colors: Record<string, { bg: string; text: string }> = {
            'pending': { bg: 'bg-yellow-500/10', text: 'text-yellow-300' },
            'confirmed': { bg: 'bg-blue-500/10', text: 'text-blue-300' },
            'ready': { bg: 'bg-green-500/10', text: 'text-green-300' },
            'completed': { bg: 'bg-slate-500/10', text: 'text-slate-600 dark:text-slate-300' },
            'cancelled': { bg: 'bg-red-500/10', text: 'text-red-300' },
        };
        return colors[status] || { bg: 'bg-slate-500/10', text: 'text-slate-600 dark:text-slate-300' };
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            'pending': t.preorders.status.pending,
            'confirmed': t.preorders.status.confirmed,
            'ready': t.preorders.status.ready,
            'completed': t.preorders.status.completed,
            'cancelled': t.preorders.status.cancelled,
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
                            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition"
                        >
                            <ArrowLeft className="size-4" />
                        </Link>
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t.preorders.headTitle}</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{preorder.product.name}</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={t.preorders.headTitle} />

            <div className="space-y-6">
                {/* Statut et alertes */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-white/10 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{t.preorders.show.currentStatus}</p>
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(preorder.status).bg} ${getStatusColor(preorder.status).text}`}>
                                {getStatusLabel(preorder.status)}
                            </span>
                        </div>
                        {isOverdue && (
                            <div className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                                <p className="text-sm font-medium text-red-300">
                                    ⚠️ {t.preorders.show.overdueWarning}
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                        <button
                            onClick={() => setShowStatusModal(true)}
                            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 transition"
                        >
                            {t.preorders.actions.changeStatus}
                        </button>
                        {preorder.status === 'ready' && (
                            <Link
                                href={route('preorders.convert', preorder.id)}
                                method="post"
                                as="button"
                                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition"
                            >
                                <CheckCircle className="size-4" /> {t.preorders.actions.convertToSale}
                            </Link>
                        )}
                    </div>
                </div>

                {/* Informations produit */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-white/10 dark:bg-slate-900/50">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-4">
                        <Package className="size-5 text-amber-300" />
                        {t.preorders.show.productSection}
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-500 dark:text-slate-400">{t.preorders.show.name}</span>
                            <span className="text-sm text-slate-900 dark:text-white font-medium">{preorder.product.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-500 dark:text-slate-400">{t.preorders.show.sku}</span>
                            <span className="text-sm text-slate-900 dark:text-white font-mono">{preorder.product.sku}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-500 dark:text-slate-400">{t.preorders.show.quantityOrdered}</span>
                            <span className="text-sm text-slate-900 dark:text-white font-medium">{preorder.quantity_ordered}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-500 dark:text-slate-400">{t.preorders.show.unitPrice}</span>
                            <span className="text-sm text-slate-900 dark:text-white font-medium">{formatCurrency(unitPrice)}</span>
                        </div>
                    </div>
                </div>

                {/* Informations client */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-white/10 dark:bg-slate-900/50">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-4">
                        <User className="size-5 text-blue-400" />
                        {t.preorders.show.customerSection}
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-500 dark:text-slate-400">{t.preorders.show.name}</span>
                            <span className="text-sm text-slate-900 dark:text-white font-medium">{preorder.customer.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-500 dark:text-slate-400">{t.preorders.show.email}</span>
                            <span className="text-sm text-slate-900 dark:text-white">{preorder.customer.email || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-500 dark:text-slate-400">{t.preorders.show.phone}</span>
                            <span className="text-sm text-slate-900 dark:text-white">{preorder.customer.phone || '-'}</span>
                        </div>
                    </div>
                </div>

                {/* Résumé financier */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-white/10 dark:bg-slate-900/50">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-4">
                        <DollarSign className="size-5 text-green-400" />
                        {t.preorders.show.financialSection}
                    </h3>
                    <div className="space-y-3 border-b border-gray-200 dark:border-white/10 pb-4 mb-4">
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-500 dark:text-slate-400">{t.preorders.show.totalAmount}</span>
                            <span className="text-sm text-slate-900 dark:text-white font-semibold">{formatCurrency(total)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-500 dark:text-slate-400">{t.preorders.show.depositPaid}</span>
                            <span className="text-sm text-slate-900 dark:text-white font-semibold">{formatCurrency(depositAmount)}</span>
                        </div>
                        <div className="flex justify-between text-lg">
                            <span className="text-slate-300 font-semibold">{t.preorders.show.remaining}</span>
                            <span className={`font-bold ${remaining > 0 ? 'text-amber-300' : 'text-green-300'}`}>
                                {formatCurrency(remaining)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Dates */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-white/10 dark:bg-slate-900/50">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-4">
                        <Calendar className="size-5 text-amber-400" />
                        {t.preorders.show.datesSection}
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-500 dark:text-slate-400">{t.preorders.show.deliveryDate}</span>
                            <span className="text-sm text-slate-900 dark:text-white font-medium">
                                {new Date(preorder.expected_delivery_date).toLocaleDateString(dateLocale)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-500 dark:text-slate-400">{t.preorders.show.createdAt}</span>
                            <span className="text-sm text-slate-900 dark:text-white">
                                {new Date(preorder.created_at).toLocaleDateString(dateLocale)} {new Date(preorder.created_at).toLocaleTimeString(dateLocale)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {preorder.notes && (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-white/10 dark:bg-slate-900/50">
                        <h3 className="text-sm font-semibold text-slate-300 mb-3">{t.preorders.show.notesSection}</h3>
                        <p className="text-sm text-slate-300 whitespace-pre-wrap">{preorder.notes}</p>
                    </div>
                )}

                {/* Informations système */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-white/10 dark:bg-slate-900/50">
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-xs text-slate-500 dark:text-slate-400">{t.preorders.show.createdBy}</span>
                            <span className="text-xs text-slate-600 dark:text-slate-300">{preorder.user.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-xs text-slate-500 dark:text-slate-400">{t.preorders.show.shop}</span>
                            <span className="text-xs text-slate-600 dark:text-slate-300">{preorder.shop.name}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de changement de statut */}
            {showStatusModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="rounded-xl border border-white/10 bg-slate-900 p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{t.preorders.show.statusModal.title}</h3>

                        <form onSubmit={handleStatusChange} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    {t.preorders.show.statusModal.newStatus}
                                </label>
                                <select
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/10 dark:bg-slate-800/50 dark:text-white"
                                >
                                    <option value="pending">{t.preorders.status.pending}</option>
                                    <option value="confirmed">{t.preorders.status.confirmed}</option>
                                    <option value="ready">{t.preorders.status.ready}</option>
                                    <option value="completed">{t.preorders.status.completed}</option>
                                    <option value="cancelled">{t.preorders.status.cancelled}</option>
                                </select>
                                <InputError message={errors.status} />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowStatusModal(false)}
                                    className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 transition"
                                >
                                    {t.preorders.show.statusModal.cancel}
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50 transition"
                                >
                                    {processing ? t.preorders.show.statusModal.updating : t.preorders.show.statusModal.confirm}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
