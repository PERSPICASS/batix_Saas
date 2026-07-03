import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Eye, Pencil, Trash2, ClipboardCheck, CheckCircle } from 'lucide-react';
import Table, { TableActions, TableActionButton } from '@/Components/Table';
import { useState } from 'react';
import axios from 'axios';
import { useRoute } from '@/utils/route';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';
import Modal from '@/Components/Modal';
import InventoryCompletionPreview, { CompletionPreviewRow } from '@/Components/InventoryCompletionPreview';
import { useLocale } from '@/contexts/LocaleContext';

interface Shop {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
}

interface Inventory {
    id: number;
    inventory_number: string;
    inventory_date: string;
    status: string;
    total_items: number;
    total_discrepancies: number;
    shop: Shop;
    user: User;
}

interface PaginatedInventories {
    data: Inventory[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    inventories: PaginatedInventories;
    filters: {
        status?: string;
    };
}

export default function InventoryIndex({ inventories, filters }: Props) {
    const route = useRoute();
    const { t, locale } = useLocale();

    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [deleteModal, setDeleteModal] = useState<{ show: boolean; inventory: Inventory | null }>({ show: false, inventory: null });
    const [completeModal, setCompleteModal] = useState<{ show: boolean; inventory: Inventory | null }>({ show: false, inventory: null });
    const [completePreview, setCompletePreview] = useState<CompletionPreviewRow[]>([]);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [processing, setProcessing] = useState(false);

    const handleSearch = () => {
        router.get(route('inventory.index'), { status: statusFilter }, { preserveState: true });
    };

    const handleDelete = (inventory: Inventory) => {
        setDeleteModal({ show: true, inventory });
    };

    const confirmDelete = () => {
        if (!deleteModal.inventory) return;
        setProcessing(true);
        router.delete(route('inventory.destroy', { inventory: deleteModal.inventory.id }), {
            onSuccess: () => {
                setDeleteModal({ show: false, inventory: null });
                setProcessing(false);
            },
            onError: () => setProcessing(false),
        });
    };

    const handleComplete = (inventory: Inventory) => {
        setCompleteModal({ show: true, inventory });
        setCompletePreview([]);
        setPreviewLoading(true);
        axios.get(route('inventory.completion-preview', { inventory: inventory.id }))
            .then(({ data }) => {
                const rows: CompletionPreviewRow[] = data.items
                    .map((item: {
                        id: number;
                        product_name: string;
                        good_before: number;
                        good_after: number;
                        defective_before: number;
                        defective_after: number;
                    }) => ({
                        id: item.id,
                        productName: item.product_name,
                        goodBefore: item.good_before,
                        goodAfter: item.good_after,
                        goodChanged: item.good_after !== item.good_before,
                        defectiveBefore: item.defective_before,
                        defectiveAfter: item.defective_after,
                        defectiveChanged: item.defective_after !== item.defective_before,
                    }))
                    .filter((row: CompletionPreviewRow) => row.goodChanged || row.defectiveChanged);
                setCompletePreview(rows);
            })
            .finally(() => setPreviewLoading(false));
    };

    const confirmComplete = () => {
        if (!completeModal.inventory) return;
        setProcessing(true);
        router.post(route('inventory.complete', { inventory: completeModal.inventory.id }), {}, {
            onSuccess: () => {
                setCompleteModal({ show: false, inventory: null });
                setProcessing(false);
            },
            onError: () => setProcessing(false),
        });
    };

    const getStatusBadge = (status: string) => {
        const statusLabels: Record<string, string> = {
            draft: t.inventory.status.draft,
            in_progress: t.inventory.status.in_progress,
            completed: t.inventory.status.completed,
            cancelled: t.inventory.status.cancelled,
        };
        const statuses: Record<string, { label: string; bg: string; text: string }> = {
            draft: { label: statusLabels.draft, bg: 'bg-slate-500/20', text: 'text-slate-300' },
            in_progress: { label: statusLabels.in_progress, bg: 'bg-blue-500/20', text: 'text-blue-300' },
            completed: { label: statusLabels.completed, bg: 'bg-green-500/20', text: 'text-green-300' },
            cancelled: { label: statusLabels.cancelled, bg: 'bg-red-500/20', text: 'text-red-300' },
        };

        const statusInfo = statuses[status] || statuses.draft;

        return (
            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}>
                {statusInfo.label}
            </span>
        );
    };

    const columns = [
        {
            key: 'inventory_number',
            label: t.inventory.columns.number,
            render: (inventory: Inventory) => (
                <span className="font-medium text-amber-300">{inventory.inventory_number}</span>
            ),
        },
        {
            key: 'inventory_date',
            label: t.inventory.columns.date,
            render: (inventory: Inventory) => new Date(inventory.inventory_date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB'),
        },
        {
            key: 'shop',
            label: t.inventory.columns.shop,
            render: (inventory: Inventory) => inventory.shop.name,
        },
        {
            key: 'total_items',
            label: t.inventory.columns.items,
            align: 'center' as const,
            render: (inventory: Inventory) => (
                <span className="font-semibold text-slate-200">{inventory.total_items}</span>
            ),
        },
        {
            key: 'total_discrepancies',
            label: t.inventory.columns.discrepancies,
            align: 'center' as const,
            render: (inventory: Inventory) => (
                <span className={`font-semibold ${inventory.total_discrepancies > 0 ? 'text-amber-400' : 'text-green-400'}`}>
                    {inventory.total_discrepancies}
                </span>
            ),
        },
        {
            key: 'status',
            label: t.inventory.columns.status,
            render: (inventory: Inventory) => getStatusBadge(inventory.status),
        },
        {
            key: 'user',
            label: t.inventory.createdBy,
            render: (inventory: Inventory) => (
                <span className="text-sm text-slate-300">{inventory.user.name}</span>
            ),
        },
        {
            key: 'actions',
            label: t.inventory.columns.actions,
            align: 'right' as const,
            render: (inventory: Inventory) => (
                <TableActions>
                    <Link
                        href={route('inventory.show', { inventory: inventory.id })}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/10"
                    >
                        <Eye className="size-3.5" /> {t.inventory.actions.view}
                    </Link>
                    {inventory.status !== 'completed' && (
                        <>
                            <Link
                                href={route('inventory.edit', { inventory: inventory.id })}
                                className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/10"
                            >
                                <Pencil className="size-3.5" /> {t.inventory.actions.edit}
                            </Link>
                            <TableActionButton variant="success" onClick={() => handleComplete(inventory)}>
                                <ClipboardCheck className="size-3.5" /> {t.inventory.actions.validate}
                            </TableActionButton>
                            <TableActionButton variant="danger" onClick={() => handleDelete(inventory)}>
                                <Trash2 className="size-3.5" /> {t.inventory.actions.delete}
                            </TableActionButton>
                        </>
                    )}
                </TableActions>
            ),
        },
    ];

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">{t.inventory.title}</h1>}>
            <Head title={t.inventory.title} />

            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex gap-4">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="rounded-lg border border-white/15 bg-slate-900/70 px-4 py-2 text-sm text-slate-200"
                        >
                            <option value="">{t.inventory.filters.allStatuses}</option>
                            <option value="draft">{t.inventory.status.draft}</option>
                            <option value="in_progress">{t.inventory.status.in_progress}</option>
                            <option value="completed">{t.inventory.status.completed}</option>
                            <option value="cancelled">{t.inventory.status.cancelled}</option>
                        </select>
                        <button
                            onClick={handleSearch}
                            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/5"
                        >
                            {t.inventory.filters.filter}
                        </button>
                    </div>
                    <Link
                        href={route('inventory.create')}
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200"
                    >
                        <Plus className="size-4" /> {t.inventory.actions.new}
                    </Link>
                </div>

                {/* Table */}
                <Table columns={columns} data={inventories.data} />

                {/* Pagination */}
                {inventories.links && (
                    <div className="flex items-center justify-center gap-1">
                        {inventories.links.map((link, index) => (
                            <Link
                                key={index}
                                href={link.url || '#'}
                                className={`rounded-lg px-3 py-2 text-sm ${
                                    link.active
                                        ? 'bg-amber-300 text-slate-950 font-semibold'
                                        : 'border border-white/15 text-slate-200 hover:bg-white/10'
                                } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}

                {/* Modal de suppression */}
                <ConfirmDeleteModal
                    show={deleteModal.show}
                    onClose={() => setDeleteModal({ show: false, inventory: null })}
                    onConfirm={confirmDelete}
                    message={t.inventory.deleteMessage(deleteModal.inventory?.inventory_number ?? '')}
                    processing={processing}
                />

                <Modal show={completeModal.show} onClose={() => setCompleteModal({ show: false, inventory: null })} maxWidth="2xl">
                    <div className="bg-slate-900 p-6">
                        <div className="flex items-start gap-4">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-green-500/20">
                                <CheckCircle className="size-6 text-green-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-lg font-semibold text-white">{t.inventory.completeModal.title}</h3>
                                <p className="mt-2 text-sm text-slate-300">{t.inventory.completeModal.previewIntro}</p>

                                {previewLoading ? (
                                    <p className="mt-4 text-sm text-slate-400">{t.common.misc.loading}</p>
                                ) : (
                                    <InventoryCompletionPreview rows={completePreview} />
                                )}
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setCompleteModal({ show: false, inventory: null })}
                                disabled={processing}
                                className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
                            >
                                {t.common.actions.cancel}
                            </button>
                            <button
                                type="button"
                                onClick={confirmComplete}
                                disabled={processing || previewLoading}
                                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-500 disabled:opacity-50"
                            >
                                {processing ? t.common.actions.processing : t.inventory.completeModal.confirmText}
                            </button>
                        </div>
                    </div>
                </Modal>
            </section>
        </AuthenticatedLayout>
    );
}
