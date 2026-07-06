import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Package, Plus, Pencil, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import Table, { TableActions, TableActionButton } from '@/Components/Table';
import { useState } from 'react';
import { useRoute } from '@/utils/route';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';
import ProductImage from '@/Components/ProductImage';
import { useLocale } from '@/contexts/LocaleContext';

interface Shop {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    sku: string | null;
    image: string | null;
}

interface User {
    id: number;
    name: string;
}

interface StockMovement {
    id: number;
    type: string;
    quantity: number;
    unit_cost: string | null;
    movement_date: string;
    notes: string | null;
    shop: Shop;
    product: Product;
    user: User;
}

interface PaginatedMovements {
    data: StockMovement[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    movements: PaginatedMovements;
    shops: Shop[];
    filters: {
        search?: string;
        type?: string;
        shop_id?: number;
        date_from?: string;
        date_to?: string;
    };
}

export default function StocksIndex({ movements, shops, filters }: Props) {
    const route = useRoute();
    const { t, locale } = useLocale();

    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || '');
    const [shopFilter, setShopFilter] = useState(filters.shop_id || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [deleteModal, setDeleteModal] = useState<{ show: boolean; movement: StockMovement | null }>({ show: false, movement: null });
    const [deleting, setDeleting] = useState(false);

    const handleSearch = () => {
        router.get(
            route('stocks.index'),
            { search: searchTerm, type: typeFilter, shop_id: shopFilter, date_from: dateFrom, date_to: dateTo },
            { preserveState: true }
        );
    };

    const handleDelete = (movement: StockMovement) => {
        setDeleteModal({ show: true, movement });
    };

    const confirmDelete = () => {
        if (!deleteModal.movement) return;
        setDeleting(true);
        router.delete(route('stocks.destroy', { stockMovement: deleteModal.movement.id }), {
            onSuccess: () => {
                setDeleteModal({ show: false, movement: null });
                setDeleting(false);
            },
            onError: () => setDeleting(false),
        });
    };

    const getTypeBadge = (type: string) => {
        const typeLabels: Record<string, string> = {
            in: t.stocks.types.in,
            out: t.stocks.types.out,
            transfer: t.stocks.types.transfer,
            adjustment: t.stocks.types.adjustment,
            sale: t.stocks.types.sale,
            return: t.stocks.types.return,
        };
        const types: Record<string, { label: string; bg: string; text: string; icon: any }> = {
            in: { label: typeLabels.in, bg: 'bg-green-500/20', text: 'text-green-300', icon: TrendingUp },
            out: { label: typeLabels.out, bg: 'bg-red-500/20', text: 'text-red-300', icon: TrendingDown },
            transfer: { label: typeLabels.transfer, bg: 'bg-blue-500/20', text: 'text-blue-300', icon: Package },
            adjustment: { label: typeLabels.adjustment, bg: 'bg-amber-500/20', text: 'text-amber-300', icon: Package },
            sale: { label: typeLabels.sale, bg: 'bg-purple-500/20', text: 'text-purple-300', icon: TrendingDown },
            return: { label: typeLabels.return, bg: 'bg-cyan-500/20', text: 'text-cyan-300', icon: TrendingUp },
        };

        const typeInfo = types[type] || types.adjustment;
        const Icon = typeInfo.icon;

        return (
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${typeInfo.bg} ${typeInfo.text}`}>
                <Icon className="size-3" />
                {typeInfo.label}
            </span>
        );
    };

    const columns = [
        {
            key: 'movement_date',
            label: t.stocks.columns.date,
            render: (movement: StockMovement) => new Date(movement.movement_date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB'),
        },
        {
            key: 'product',
            label: t.stocks.columns.product,
            render: (movement: StockMovement) => (
                <div className="flex items-center gap-3">
                    <ProductImage src={movement.product.image} name={movement.product.name} thumbnailClass="size-9" />
                    <div>
                        <p className="font-medium text-slate-700 dark:text-slate-200">{movement.product.name}</p>
                        {movement.product.sku && <p className="text-xs text-slate-500 dark:text-slate-400">SKU: {movement.product.sku}</p>}
                    </div>
                </div>
            ),
        },
        {
            key: 'type',
            label: t.stocks.columns.type,
            render: (movement: StockMovement) => getTypeBadge(movement.type),
        },
        {
            key: 'quantity',
            label: t.stocks.columns.quantity,
            align: 'center' as const,
            render: (movement: StockMovement) => (
                <span className={`font-semibold ${movement.quantity > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                </span>
            ),
        },
        {
            key: 'shop',
            label: t.stocks.columns.shop,
            render: (movement: StockMovement) => movement.shop.name,
        },
        {
            key: 'user',
            label: t.stocks.columns.user,
            render: (movement: StockMovement) => (
                <span className="text-sm text-slate-600 dark:text-slate-300">{movement.user.name}</span>
            ),
        },
        {
            key: 'actions',
            label: t.stocks.columns.actions,
            align: 'right' as const,
            render: (movement: StockMovement) => (
                <TableActions>
                    <Link
                        href={route('stocks.show', { stockMovement: movement.id })}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
                    >
                        {t.stocks.actions.view}
                    </Link>
                    <TableActionButton variant="danger" onClick={() => handleDelete(movement)}>
                        <Trash2 className="size-3.5" /> {t.stocks.actions.delete}
                    </TableActionButton>
                </TableActions>
            ),
        },
    ];

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-slate-900 dark:text-white">{t.stocks.titleMovements}</h1>}>
            <Head title={t.stocks.titleMovements} />

            <section className="space-y-6">
                {/* Filters */}
                <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="grid gap-4 md:grid-cols-6">
                        <input
                            type="text"
                            placeholder={t.stocks.filters.searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            className="md:col-span-2 rounded-lg border border-white/15 bg-slate-900/70 px-4 py-2 text-sm text-slate-200 placeholder-slate-500"
                        />
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-slate-900 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                        >
                            <option value="">{t.stocks.filters.allTypes}</option>
                            <option value="in">{t.stocks.types.in}</option>
                            <option value="out">{t.stocks.types.out}</option>
                            <option value="transfer">{t.stocks.types.transfer}</option>
                            <option value="adjustment">{t.stocks.types.adjustment}</option>
                        </select>
                        <select
                            value={shopFilter}
                            onChange={(e) => setShopFilter(e.target.value)}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-slate-900 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                        >
                            <option value="">{t.stocks.filters.allShops}</option>
                            {shops.map((shop) => (
                                <option key={shop.id} value={shop.id}>
                                    {shop.name}
                                </option>
                            ))}
                        </select>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-slate-900 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                            placeholder="Date début"
                        />
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-slate-900 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                            placeholder="Date fin"
                        />
                    </div>
                    <div className="mt-4 flex justify-between">
                        <button
                            onClick={handleSearch}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5"
                        >
                            {t.common.actions.search}
                        </button>
                        <Link
                            href={route('stocks.create')}
                            className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200"
                        >
                            <Plus className="size-4" /> {t.stocks.actions.new}
                        </Link>
                    </div>
                </div>

                {/* Table */}
                <Table columns={columns} data={movements.data} />

                {/* Pagination */}
                {movements.links && (
                    <div className="flex items-center justify-center gap-1">
                        {movements.links.map((link, index) => (
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
                    onClose={() => setDeleteModal({ show: false, movement: null })}
                    onConfirm={confirmDelete}
                    message={t.stocks.deleteMessage(String(deleteModal.movement?.id ?? ''))}
                    processing={deleting}
                />
            </section>
        </AuthenticatedLayout>
    );
}
