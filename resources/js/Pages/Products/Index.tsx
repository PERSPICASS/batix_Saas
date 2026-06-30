import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Trash2, AlertTriangle, Search, Upload, Download, FileSpreadsheet, X, Layers, LogOut, RotateCcw, Tag } from 'lucide-react';
import { PageProps } from '@/types';
import Table, { TableActions, TableActionButton, TableBadge } from '@/Components/Table';
import Currency from '@/Components/Currency';
import { useRoute } from '@/utils/route';
import { useState, useRef, useEffect, FormEvent } from 'react';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';
import ProductImage from '@/Components/ProductImage';
import BarcodeScanner from '@/Components/BarcodeScanner';
import ProductArticleModal from '@/Components/ProductArticleModal';
import { useLocale } from '@/contexts/LocaleContext';

interface Category {
    id: number;
    name: string;
}

interface Shop {
    id: number;
    name: string;
    slug: string;
}

interface Product {
    id: number;
    name: string;
    sku: string | null;
    barcode: string | null;
    brand: string | null;
    image: string | null;
    selling_price: number;
    purchase_price: number;
    stock_quantity: number;
    defective_stock_quantity: number;
    min_stock_alert: number | null;
    is_active: boolean;
    track_stock: boolean;
    has_variations: boolean;
    category: { id: number; name: string } | null;
    subcategory: { id: number; name: string } | null;
    shop: { id: number; name: string };
}

interface PaginatedProducts {
    data: Product[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Filters {
    search?: string;
    category_id?: string;
    shop_id?: string;
    status?: string;
}

interface Props extends PageProps {
    products: PaginatedProducts;
    categories: Category[];
    shops: Shop[];
    filters: Filters;
    canCreateProduct: boolean;
    remainingProducts: number;
}

export default function ProductsIndex({ products, categories = [], shops = [], filters = {}, canCreateProduct = true, remainingProducts = -1 }: Props) {
    const route = useRoute();
    const { t } = useLocale();
    const [showImportModal, setShowImportModal] = useState(false);
    const [search, setSearch] = useState(filters.search || '');
    const [categoryId, setCategoryId] = useState(filters.category_id || '');
    const [status, setStatus] = useState(filters.status || '');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [deleteModal, setDeleteModal] = useState<{ show: boolean; product: Product | null }>({ show: false, product: null });
    const [removeModal, setRemoveModal] = useState<{ show: boolean; product: Product | null }>({ show: false, product: null });
    const [articleModal, setArticleModal] = useState<{ isOpen: boolean; product: Product | null }>({ isOpen: false, product: null });
    const [deleting, setDeleting] = useState(false);
    const [showScanner, setShowScanner] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        file: null as File | null,
    });

    const handleDelete = (product: Product) => setDeleteModal({ show: true, product });

    const handleRemoveFromShop = (product: Product) => setRemoveModal({ show: true, product });

    const confirmRemoveFromShop = () => {
        if (!removeModal.product) return;
        router.patch(route('products.remove-from-shop', { product: removeModal.product.id }), {}, {
            onSuccess: () => setRemoveModal({ show: false, product: null }),
        });
    };

    const confirmDelete = () => {
        if (!deleteModal.product) return;
        setDeleting(true);
        router.delete(route('products.destroy', { product: deleteModal.product.id }), {
            onSuccess: () => { setDeleteModal({ show: false, product: null }); setDeleting(false); },
            onError: () => setDeleting(false),
        });
    };

    const isLowStock = (product: Product) => {
        if (!product.track_stock || !product.min_stock_alert) return false;
        return product.stock_quantity <= product.min_stock_alert;
    };

    const clearFilters = () => { setSearch(''); setCategoryId(''); setStatus(''); };

    const handleImport = (e: FormEvent) => {
        e.preventDefault();
        if (!data.file) return;
        post(route('products.import'), {
            forceFormData: true,
            onSuccess: () => {
                setShowImportModal(false);
                reset();
                if (fileInputRef.current) fileInputRef.current.value = '';
            },
        });
    };

    const handleScan = (code: string) => {
        setShowScanner(false);
        const existing = products.data.find((p) => p.barcode === code || p.sku === code);
        if (existing) {
            router.visit(route('products.edit', { product: existing.id }));
        } else {
            router.visit(route('products.create') + '?barcode=' + encodeURIComponent(code));
        }
    };

    const hasActiveFilters = search || categoryId || status;

    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return; }
        const timer = setTimeout(() => {
            router.get(route('products.index'), {
                search: search || undefined,
                category_id: categoryId || undefined,
                status: status || undefined,
            }, { preserveState: true, preserveScroll: true, replace: true });
        }, 400);
        return () => clearTimeout(timer);
    }, [search, categoryId, status]);

    const columns = [
        {
            key: 'barcode',
            label: t.products.columns.barcode,
            render: (product: Product) => (
                product.barcode ? (
                    <div className="flex flex-col items-center gap-0.5">
                        <div className="flex w-full h-6 justify-center">
                            {product.barcode.split('').map((digit, i) => {
                                const d = parseInt(digit);
                                return (
                                    <div key={i} className="flex h-full">
                                        <div className="h-full bg-slate-700" style={{ width: d % 2 === 0 ? '1px' : '2px' }} />
                                        <div className="h-full" style={{ width: d % 3 === 0 ? '2px' : '1px' }} />
                                    </div>
                                );
                            })}
                        </div>
                        <span className="font-mono text-[10px] text-slate-500 tracking-wider">{product.barcode}</span>
                    </div>
                ) : (
                    <span className="text-slate-500">-</span>
                )
            ),
        },
        {
            key: 'name',
            label: t.products.columns.name,
            render: (product: Product) => (
                <div className="flex items-center gap-3">
                    <ProductImage src={product.image} name={product.name} thumbnailClass="size-10" />
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            {isLowStock(product) && (
                                <span title={t.products.lowStockTitle}>
                                    <AlertTriangle className="size-3.5 shrink-0 text-amber-400" />
                                </span>
                            )}
                            <span className="font-medium text-white truncate">{product.name}</span>
                        </div>
                        {product.sku && <span className="text-xs text-slate-500 font-mono">{product.sku}</span>}
                    </div>
                </div>
            ),
        },
        {
            key: 'category',
            label: t.products.columns.category,
            render: (product: Product) => product.category?.name || '-',
        },
        {
            key: 'selling_price',
            label: t.products.columns.price,
            align: 'right' as const,
            render: (product: Product) => <Currency amount={product.selling_price} />,
        },
        {
            key: 'stock_quantity',
            label: t.products.columns.stock,
            align: 'center' as const,
            render: (product: Product) => (
                <span className={isLowStock(product) ? 'text-amber-300 font-semibold' : ''}>
                    {product.stock_quantity}
                </span>
            ),
        },
        {
            key: 'defective_stock_quantity',
            label: t.products.columns.defective,
            align: 'center' as const,
            render: (product: Product) => (
                <span className={product.defective_stock_quantity > 0 ? 'text-red-400 font-semibold' : 'text-slate-500'}>
                    {product.defective_stock_quantity}
                </span>
            ),
        },
        {
            key: 'is_active',
            label: t.products.columns.status,
            align: 'center' as const,
            render: (product: Product) => (
                <TableBadge variant={product.is_active ? 'success' : 'danger'}>
                    {product.is_active ? t.common.status.active : t.common.status.inactive}
                </TableBadge>
            ),
        },
        {
            key: 'actions',
            label: t.products.columns.actions,
            align: 'right' as const,
            render: (product: Product) => (
                <TableActions>
                    <Link href={route('products.variations.index', { product: product.id })}>
                        <TableActionButton>
                            <Layers className="size-3.5" /> {t.products.actions.variations}
                        </TableActionButton>
                    </Link>
                    <TableActionButton onClick={() => setArticleModal({ isOpen: true, product })}>
                        <Tag className="size-3.5" /> Gérer les articles
                    </TableActionButton>
                    <Link href={route('products.edit', { product: product.id })}>
                        <TableActionButton>
                            <Pencil className="size-3.5" /> {t.products.actions.edit}
                        </TableActionButton>
                    </Link>
                    {product.is_active && (
                        <TableActionButton onClick={() => handleRemoveFromShop(product)}>
                            <LogOut className="size-3.5" /> {t.products.actions.removeFromShop}
                        </TableActionButton>
                    )}
                    {!product.is_active && (
                        <TableActionButton
                            variant="success"
                            onClick={() => router.patch(route('products.restore-to-shop', { product: product.id }))}
                        >
                            <RotateCcw className="size-3.5" /> {t.products.actions.restoreToShop}
                        </TableActionButton>
                    )}
                    <TableActionButton variant="danger" onClick={() => handleDelete(product)}>
                        <Trash2 className="size-3.5" /> {t.products.actions.delete}
                    </TableActionButton>
                </TableActions>
            ),
        },
    ];

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">{t.products.title}</h1>}>
            <Head title={t.products.title} />

            <section className="space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-300">{t.products.description}</p>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setShowImportModal(true)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10"
                            >
                                <Upload className="size-4" />
                                {t.products.actions.import}
                            </button>
                            <a
                                href={route('products.export')}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10"
                            >
                                <Download className="size-4" />
                                {t.products.actions.export}
                            </a>
                        </div>

                        {canCreateProduct ? (
                            <Link
                                href={route('products.create')}
                                className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
                            >
                                <Plus className="size-4" />
                                {t.products.actions.new}
                            </Link>
                        ) : (
                            <div className="group relative">
                                <button
                                    disabled
                                    className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-slate-600 px-4 py-2 text-sm font-semibold text-slate-400 opacity-60"
                                >
                                    <Plus className="size-4" />
                                    {t.products.actions.new}
                                </button>
                                <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                                    {t.products.limitTooltip}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={t.products.filters.searchPlaceholder}
                                className="w-full rounded-lg border border-white/15 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:border-amber-300/50 focus:outline-none focus:ring-1 focus:ring-amber-300/50"
                            />
                        </div>

                        <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className="rounded-lg border border-white/15 bg-slate-800 px-3 py-2 text-sm text-white focus:border-amber-300/50 focus:outline-none focus:ring-1 focus:ring-amber-300/50"
                        >
                            <option value="">{t.products.filters.allCategories}</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>{category.name}</option>
                            ))}
                        </select>

                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="rounded-lg border border-white/15 bg-slate-800 px-3 py-2 text-sm text-white focus:border-amber-300/50 focus:outline-none focus:ring-1 focus:ring-amber-300/50"
                        >
                            <option value="">{t.products.filters.allStatuses}</option>
                            <option value="active">{t.products.filters.active}</option>
                            <option value="inactive">{t.products.filters.inactive}</option>
                            <option value="low_stock">{t.products.filters.lowStock}</option>
                        </select>

                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10"
                            >
                                <X className="size-4" />
                                {t.products.filters.clear}
                            </button>
                        )}
                    </div>
                </div>

                {hasActiveFilters && (
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="text-slate-400">{t.products.filters.activeLabel} :</span>
                        {search && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-300/20 px-2 py-0.5 text-amber-300">
                                {t.products.filters.searchLabel}: "{search}"
                                <button onClick={() => setSearch('')}><X className="size-3" /></button>
                            </span>
                        )}
                        {categoryId && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-300/20 px-2 py-0.5 text-amber-300">
                                {categories.find(c => c.id.toString() === categoryId)?.name}
                                <button onClick={() => setCategoryId('')}><X className="size-3" /></button>
                            </span>
                        )}
                        {status && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-300/20 px-2 py-0.5 text-amber-300">
                                {status === 'active' ? t.products.filters.active : status === 'inactive' ? t.products.filters.inactive : t.products.filters.lowStock}
                                <button onClick={() => setStatus('')}><X className="size-3" /></button>
                            </span>
                        )}
                    </div>
                )}

                <Table columns={columns} data={products.data} emptyMessage={t.products.emptyMessage} />

                {products.last_page > 1 && (
                    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                        <div>
                            {t.products.pagination.page(products.current_page, products.last_page, products.total)}
                        </div>
                        <div className="flex gap-2">
                            {products.current_page > 1 && (
                                <Link
                                    href={route('products.index', { page: products.current_page - 1, search: search || undefined, category_id: categoryId || undefined, status: status || undefined })}
                                    className="rounded-lg border border-white/15 px-3 py-1.5 hover:bg-white/10"
                                >
                                    {t.common.table.previous}
                                </Link>
                            )}
                            {products.current_page < products.last_page && (
                                <Link
                                    href={route('products.index', { page: products.current_page + 1, search: search || undefined, category_id: categoryId || undefined, status: status || undefined })}
                                    className="rounded-lg border border-white/15 px-3 py-1.5 hover:bg-white/10"
                                >
                                    {t.common.table.next}
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </section>

            {showScanner && <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}

            {showImportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                    <div className="w-full max-w-lg rounded-xl border border-white/10 bg-slate-900 p-6">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white">{t.products.importModal.title}</h2>
                            <button onClick={() => setShowImportModal(false)} className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white">
                                <X className="size-5" />
                            </button>
                        </div>

                        <form onSubmit={handleImport} className="space-y-6">
                            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                                <h3 className="mb-2 flex items-center gap-2 font-medium text-white">
                                    <FileSpreadsheet className="size-5 text-amber-300" />
                                    {t.products.importModal.instructionsTitle}
                                </h3>
                                <ul className="space-y-1 text-sm text-slate-300">
                                    <li>• {t.products.importModal.instruction1}</li>
                                    <li>• {t.products.importModal.instruction2}</li>
                                    <li>• {t.products.importModal.instruction3}</li>
                                    <li>• {t.products.importModal.instruction4}</li>
                                </ul>
                                <a href={route('products.template')} className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-amber-300 hover:text-amber-200">
                                    <Download className="size-4" />
                                    {t.products.importModal.templateLink}
                                </a>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-300">
                                    {t.products.importModal.fileLabel}
                                </label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={(e) => setData('file', e.target.files?.[0] || null)}
                                    className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-amber-300 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-950 hover:file:bg-amber-200"
                                />
                                {errors.file && <p className="mt-1 text-sm text-red-400">{errors.file}</p>}
                            </div>

                            <div className="flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowImportModal(false)}
                                    className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-300 hover:bg-white/10"
                                >
                                    {t.products.importModal.cancel}
                                </button>
                                <button
                                    type="submit"
                                    disabled={!data.file || processing}
                                    className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:opacity-50"
                                >
                                    <Upload className="size-4" />
                                    {processing ? t.products.importModal.importing : t.products.importModal.import}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDeleteModal
                show={deleteModal.show}
                onClose={() => setDeleteModal({ show: false, product: null })}
                onConfirm={confirmDelete}
                message={`Êtes-vous sûr de vouloir supprimer le produit "${deleteModal.product?.name}" ?`}
                processing={deleting}
            />

            {removeModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-400/10">
                                <LogOut className="size-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white">{t.products.removeModal.title}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{removeModal.product?.name}</p>
                            </div>
                        </div>
                        <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">
                            {t.products.removeModal.description}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={confirmRemoveFromShop}
                                className="flex-1 rounded-xl bg-amber-300 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-200"
                            >
                                {t.products.removeModal.confirm}
                            </button>
                            <button
                                onClick={() => setRemoveModal({ show: false, product: null })}
                                className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-medium text-slate-700 dark:border-white/10 dark:text-slate-300"
                            >
                                {t.products.removeModal.cancel}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {articleModal.product && (
                <ProductArticleModal
                    productId={articleModal.product.id}
                    productName={articleModal.product.name}
                    isOpen={articleModal.isOpen}
                    onClose={() => setArticleModal({ isOpen: false, product: null })}
                />
            )}
        </AuthenticatedLayout>
    );
}
