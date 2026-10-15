import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Search, Package, ArrowLeft } from 'lucide-react';
import Table, { TableBadge } from '@/Components/Table';
import { useState } from 'react';
import PaginationLinks from '@/Components/PaginationLinks';
import { useLocale } from '@/contexts/LocaleContext';
import { fmtDate, intlLocale } from '@/utils/platformFormat';

interface Owner {
    id: number | null;
    name: string | null;
    email: string | null;
    code_user: string | null;
}

interface Shop {
    id: number;
    name: string;
    slug: string;
    currency: string | null;
    owner: Owner;
}

interface Category {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    sku: string | null;
    barcode: string | null;
    // Les décimaux arrivent en chaînes (« 0.00 ») : toujours passer par Number().
    price: number | string;
    cost_price: number | string | null;
    stock_quantity: number | string;
    min_stock_alert: number | string | null;
    track_stock: boolean;
    is_active: boolean;
    category: Category | null;
    subcategory: Category | null;
    created_at: string;
}

interface PaginatedProducts {
    data: Product[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    shop: Shop;
    products: PaginatedProducts;
    categories: Category[];
    filters: {
        search?: string;
        category_id?: number;
        status?: string;
    };
}

export default function ShopProducts({ shop, products, categories, filters }: Props) {
    const { t, locale } = useLocale();
    const tr = t.platformAdmin.shopProducts;
    const common = t.platformAdmin.common;
    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('platform.shops.products', shop.id),
            { search: searchTerm, category_id: filters.category_id, status: filters.status },
            { preserveState: true }
        );
    };

    const handleCategoryFilter = (categoryId: number | string) => {
        router.get(
            route('platform.shops.products', shop.id),
            { search: filters.search, category_id: categoryId === '' ? undefined : categoryId, status: filters.status },
            { preserveState: true }
        );
    };

    const handleStatusFilter = (status: string) => {
        router.get(
            route('platform.shops.products', shop.id),
            { search: filters.search, category_id: filters.category_id, status },
            { preserveState: true }
        );
    };

    // Prix dans la devise de LA boutique consultée (pas celle d'une boutique active :
    // l'admin plateforme n'en a pas).
    const formatPrice = (price: number | string) => {
        const value = Number(price);
        try {
            if (shop.currency) {
                return new Intl.NumberFormat(intlLocale(locale), { style: 'currency', currency: shop.currency }).format(value);
            }
        } catch {
            // code devise inconnu d'Intl : format simple ci-dessous
        }
        return `${value.toLocaleString(intlLocale(locale), { maximumFractionDigits: 2 })}${shop.currency ? ` ${shop.currency}` : ''}`;
    };

    const filterButton = (value: string, label: string) => (
        <button
            type="button"
            onClick={() => handleStatusFilter(value)}
            className={`rounded-lg px-3 py-2 text-sm transition ${
                (filters.status || '') === value
                    ? 'bg-amber-300 text-slate-950'
                    : 'border border-gray-300 text-slate-600 hover:bg-gray-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5'
            }`}
        >
            {label}
        </button>
    );

    const columns = [
        {
            key: 'name',
            label: tr.columns.product,
            render: (product: Product) => (
                <div>
                    <p className="font-medium text-slate-900 dark:text-white">{product.name}</p>
                    {product.sku && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">{tr.sku}: {product.sku}</p>
                    )}
                    {product.barcode && (
                        <p className="text-xs text-slate-500">{tr.barcode}: {product.barcode}</p>
                    )}
                </div>
            ),
        },
        {
            key: 'category',
            label: tr.columns.category,
            render: (product: Product) => (
                <div>
                    {product.category ? (
                        <>
                            <p className="text-sm text-slate-900 dark:text-white">{product.category.name}</p>
                            {product.subcategory && (
                                <p className="text-xs text-slate-500 dark:text-slate-400">{product.subcategory.name}</p>
                            )}
                        </>
                    ) : (
                        <span className="text-sm text-slate-500">{tr.noCategory}</span>
                    )}
                </div>
            ),
        },
        {
            key: 'price',
            label: tr.columns.price,
            render: (product: Product) => (
                <div>
                    <p className="font-medium text-slate-900 dark:text-white">{formatPrice(product.price)}</p>
                    {Number(product.cost_price) > 0 && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">{tr.cost}: {formatPrice(product.cost_price!)}</p>
                    )}
                </div>
            ),
        },
        {
            key: 'stock',
            label: tr.columns.stock,
            render: (product: Product) => {
                if (!product.track_stock) {
                    return <span className="text-sm text-slate-500 dark:text-slate-400">{tr.notTracked}</span>;
                }

                const alert = Number(product.min_stock_alert);
                const isLowStock = alert > 0 && Number(product.stock_quantity) <= alert;

                return (
                    <div>
                        <p className={`font-medium ${isLowStock ? 'text-red-500 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                            {Number(product.stock_quantity)}
                        </p>
                        {alert > 0 && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {tr.alert}: {alert}
                            </p>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'status',
            label: common.status,
            render: (product: Product) => (
                <TableBadge variant={product.is_active ? 'success' : 'danger'}>
                    {product.is_active ? common.active : common.inactive}
                </TableBadge>
            ),
        },
        {
            key: 'created_at',
            label: common.createdAt,
            render: (product: Product) => (
                <span className="text-sm text-slate-500 dark:text-slate-400">{fmtDate(product.created_at, locale)}</span>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{tr.title(shop.name)}</h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {tr.owner(shop.owner.name ?? common.unknown, shop.owner.email ?? '')}
                        </p>
                    </div>
                    <Link
                        href={route('platform.shops')}
                        className="flex items-center gap-2 text-sm text-amber-600 hover:text-amber-500 dark:text-amber-300 dark:hover:text-amber-200"
                    >
                        <ArrowLeft className="size-4" />
                        {tr.back}
                    </Link>
                </div>
            }
        >
            <Head title={tr.headTitle(shop.name)} />

            <div className="space-y-6">
                <div className="rounded-xl border border-gray-200 bg-white p-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                    <div className="flex flex-col gap-4">
                        <form onSubmit={handleSearch} className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={tr.searchPlaceholder}
                                    className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-300/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-slate-500"
                                />
                            </div>
                        </form>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="flex-1">
                                <select
                                    value={filters.category_id || ''}
                                    onChange={(e) => handleCategoryFilter(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-300/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                >
                                    <option value="">{tr.allCategories}</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {filterButton('', common.all)}
                                {filterButton('active', tr.filterActive)}
                                {filterButton('inactive', tr.filterInactive)}
                                {filterButton('low_stock', tr.filterLowStock)}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                        <p className="text-sm text-slate-500 dark:text-slate-400">{tr.total}</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{products.total}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                        <p className="text-sm text-slate-500 dark:text-slate-400">{common.onThisPage}</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{products.data.length}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                        <p className="text-sm text-slate-500 dark:text-slate-400">{common.currentPage}</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                            {products.current_page} / {products.last_page}
                        </p>
                    </div>
                </div>

                {products.data.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-white/10 dark:bg-white/5">
                        <Package className="mx-auto size-12 text-slate-400 dark:text-slate-600" />
                        <p className="mt-4 text-slate-500 dark:text-slate-400">
                            {filters.search || filters.category_id || filters.status ? tr.emptyFiltered : tr.empty}
                        </p>
                    </div>
                ) : (
                    <Table columns={columns} data={products.data} emptyMessage={tr.emptyFiltered} />
                )}

                <PaginationLinks links={products.links} />
            </div>
        </AuthenticatedLayout>
    );
}
