import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import React from 'react';
import { useRoute } from '@/utils/route';
import { usePage } from '@inertiajs/react';
import { Warehouse, Package, AlertTriangle, Plus, ArrowRight, Pencil, Trash2, ArrowUpRight, Upload, Download, X, CheckCircle, AlertCircle, TrendingUp, Search } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import ProductImage from '@/Components/ProductImage';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';

interface DepotProductItem {
    id: number;
    product_id: number;
    product_name: string;
    product_sku: string | null;
    product_category: string | null;
    product_image: string | null;
    quantity: number;
    min_stock_alert: number;
    purchase_price: number;
    is_low_stock: boolean;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedProducts {
    data: DepotProductItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
}

interface RecentTransfer {
    id: number;
    reference: string;
    shop_name: string;
    product_name: string;
    product_image: string | null;
    quantity: number;
    user_name: string;
    transferred_at: string;
}

interface Stats {
    total_products: number;
    total_stock: number;
    low_stock_count: number;
    total_value: number;
}

interface DepotInfo {
    id: number;
    name: string;
    address: string | null;
    city: string | null;
    phone: string | null;
    description: string | null;
    is_active: boolean;
}

interface Props {
    depot: DepotInfo;
    products: PaginatedProducts;
    recentTransfers: RecentTransfer[];
    stats: Stats;
    otherDepots: Array<{ id: number; name: string }>;
    filters: { search?: string };
}

interface AddStockForm {
    name: string;
    sku: string;
    quantity: string;
    min_stock_alert: string;
    purchase_price: string;
    image: File | null;
}

interface TransferItem {
    product_id: string;
    quantity: string;
}

interface TransferForm {
    shop_id: string;
    notes: string;
    items: TransferItem[];
}

export default function Show({ depot, products, recentTransfers, stats, otherDepots, filters }: Props) {
    const buildRoute = useRoute();
    const page = usePage<any>();
    const shops = page.props.shops as Array<{ id: number; name: string; slug: string }> || [];
    const allProducts = page.props.allProducts as Array<{ id: number; name: string; sku: string | null }> || [];

    const [showAddStock, setShowAddStock] = useState(false);
    const [showTransfer, setShowTransfer] = useState(false);
    const [showTransferDepot, setShowTransferDepot] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [editingProduct, setEditingProduct] = useState<DepotProductItem | null>(null);
    const [removeProductId, setRemoveProductId] = useState<number | null>(null);
    const [search, setSearch] = useState(filters.search ?? '');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const editImageInputRef = useRef<HTMLInputElement>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Debounce search: trigger router.get 400ms after last keystroke
    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                buildRoute('depots.show', { depot: depot.id }),
                search ? { search } : {},
                { preserveState: true, preserveScroll: true, replace: true }
            );
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    // Flash messages from page props
    const flash = (page.props as any).flash as { success?: string; warning?: string; error?: string } | undefined;
    const importErrors = (page.props as any).import_errors as string[] | undefined;

    const addStockForm = useForm<AddStockForm>({
        name: '',
        sku: '',
        quantity: '',
        min_stock_alert: '0',
        purchase_price: '0',
        image: null,
    });

    const transferForm = useForm<TransferForm>({
        shop_id: '',
        notes: '',
        items: [{ product_id: '', quantity: '1' }],
    });

    const transferDepotForm = useForm({
        target_depot_id: '',
        notes: '',
        items: [{ product_id: '', quantity: '1' }] as TransferItem[],
    });

    const editForm = useForm({
        quantity: 0,
        min_stock_alert: 0,
        purchase_price: 0,
        name: '',
        sku: '',
        image: null as File | null,
    });

    const handleAddStock = (e: React.FormEvent) => {
        e.preventDefault();
        addStockForm.post(buildRoute('depots.stock.add', { depot: depot.id }), {
            forceFormData: true,
            onSuccess: () => {
                setShowAddStock(false);
                setImagePreview(null);
                addStockForm.reset();
            },
        });
    };

    const handleTransfer = (e: React.FormEvent) => {
        e.preventDefault();
        transferForm.post(buildRoute('depots.transfer', { depot: depot.id }), {
            onSuccess: () => {
                setShowTransfer(false);
                transferForm.reset();
            },
        });
    };

    const handleTransferDepot = (e: React.FormEvent) => {
        e.preventDefault();
        transferDepotForm.post(buildRoute('depots.transfer-depot', { depot: depot.id }), {
            onSuccess: () => {
                setShowTransferDepot(false);
                transferDepotForm.reset();
            },
        });
    };

    const handleEditStock = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;
        editForm.post(buildRoute('depots.stock.update', { depot: depot.id, depotProduct: editingProduct.id }), {
            forceFormData: true,
            headers: { 'X-HTTP-Method-Override': 'PATCH' },
            onSuccess: () => {
                setEditingProduct(null);
                setEditImagePreview(null);
            },
        });
    };

    const handleRemoveProduct = (depotProductId: number) => {
        setRemoveProductId(depotProductId);
    };

    const handleConfirmRemove = () => {
        if (!removeProductId) return;
        router.delete(buildRoute('depots.stock.remove', { depot: depot.id, depotProduct: removeProductId }), {
            onFinish: () => setRemoveProductId(null),
        });
    };

    const handleImport = (e: React.FormEvent) => {
        e.preventDefault();
        const file = fileInputRef.current?.files?.[0];
        if (!file) return;

        setIsImporting(true);
        const formData = new FormData();
        formData.append('file', file);
        const url = buildRoute('depots.stock.import', { depot: depot.id });

        // Récupérer le token CSRF depuis le meta tag
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

        fetch(url, {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
                ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
            },
        })
        .then(response => response.json().then(data => ({ response, data })))
        .then(({ response, data }) => {
            if (response.ok) {
                setShowImport(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
                window.location.reload();
            } else {
                throw new Error(data.message || `Erreur HTTP ${response.status}`);
            }
        })
        .catch(error => {
            console.error('Erreur lors de l\'import:', error);
            alert('Erreur lors de l\'import : ' + error.message);
            setIsImporting(false);
        });
    };

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center gap-3">
                <Link href={buildRoute('depots.index')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">Dépôts</Link>
                <span className="text-slate-300">/</span>
                <span className="font-semibold">{depot.name}</span>
            </div>
        }>
            <Head title={depot.name} />

            <div className="space-y-6">
                {/* Flash messages */}
                {flash?.success && (
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-400">
                        <CheckCircle className="size-4 shrink-0" />
                        {flash.success}
                    </div>
                )}
                {flash?.warning && (
                    <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-400">
                        <AlertCircle className="size-4 shrink-0" />
                        <div>
                            <p>{flash.warning}</p>
                            {importErrors && importErrors.length > 0 && (
                                <ul className="mt-1 list-disc pl-4 text-xs opacity-80">
                                    {importErrors.map((err, i) => <li key={i}>{err}</li>)}
                                </ul>
                            )}
                        </div>
                    </div>
                )}
                {flash?.error && (
                    <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-400">
                        <AlertCircle className="size-4 shrink-0" />
                        {flash.error}
                    </div>
                )}

                {/* Header */}                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex size-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-300/10">
                            <Warehouse className="size-6 text-amber-600 dark:text-amber-300" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{depot.name}</h1>
                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${depot.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400' : 'bg-slate-100 text-slate-500'}`}>
                                    {depot.is_active ? 'Actif' : 'Inactif'}
                                </span>
                            </div>
                            {(depot.city || depot.address) && (
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {[depot.address, depot.city].filter(Boolean).join(', ')}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link
                            href={buildRoute('depots.transfers', { depot: depot.id })}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                        >
                            <ArrowRight className="size-4" />
                            Historique transferts
                        </Link>
                        <Link
                            href={buildRoute('depots.edit', { depot: depot.id })}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                        >
                            <Pencil className="size-4" />
                            Modifier
                        </Link>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                            <Package className="size-4" />
                            Références produits
                        </div>
                        <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{stats.total_products}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                            <Warehouse className="size-4" />
                            Unités en stock
                        </div>
                        <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{stats.total_stock}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
                        <div className="flex items-center gap-2 text-sm text-amber-500">
                            <AlertTriangle className="size-4" />
                            Stock faible
                        </div>
                        <p className={`mt-2 text-3xl font-bold ${stats.low_stock_count > 0 ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>{stats.low_stock_count}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
                        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                            <TrendingUp className="size-4" />
                            Valeur du stock
                        </div>
                        <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            {Number(stats.total_value).toLocaleString('fr-FR')} <span className="text-lg">FCFA</span>
                        </p>
                    </div>
                </div>

                {/* Actions rapides */}
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => setShowAddStock(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200"
                    >
                        <Plus className="size-4" />
                        Ajouter du stock
                    </button>
                    <button
                        onClick={() => setShowTransfer(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
                    >
                        <ArrowUpRight className="size-4" />
                        Transférer vers une boutique
                    </button>
                    {otherDepots.length > 0 && (
                        <button
                            onClick={() => setShowTransferDepot(true)}
                            className="inline-flex items-center gap-2 rounded-xl border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-300 dark:hover:bg-indigo-400/20"
                        >
                            <Warehouse className="size-4" />
                            Transférer vers un dépôt
                        </button>
                    )}
                    <button
                        onClick={() => setShowImport(true)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                    >
                        <Upload className="size-4" />
                        Importer CSV / Excel
                    </button>
                    <a
                        href={buildRoute('depots.stock.template', { depot: depot.id })}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                    >
                        <Download className="size-4" />
                        Modèle Excel
                    </a>
                </div>

                {/* Liste des produits */}
                <div className="rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900">
                    <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-900 dark:text-white">Stock du dépôt ({products.total} produit{products.total !== 1 ? 's' : ''})</h3>
                            {search && (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-400/10 dark:text-amber-400">
                                    {products.total} résultat{products.total !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                        {(products.total > 0 || search) && (
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Nom, SKU..."
                                    className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-8 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
                                />
                                {search && (
                                    <button
                                        onClick={() => setSearch('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {products.total === 0 ? (
                        <div className="flex flex-col items-center py-12">
                            <Package className="size-10 text-slate-300 dark:text-slate-600" />
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Aucun produit en stock</p>
                            <button
                                onClick={() => setShowAddStock(true)}
                                className="mt-3 inline-flex items-center gap-1.5 text-sm text-amber-500 hover:text-amber-400"
                            >
                                <Plus className="size-3.5" />
                                Ajouter des produits
                            </button>
                        </div>
                    ) : (
                        <>
                        <div className="divide-y divide-slate-100 dark:divide-white/5">
                            {products.data.map(product => (
                                <div key={product.id} className="flex items-center justify-between px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <ProductImage
                                            src={product.product_image}
                                            name={product.product_name}
                                            thumbnailClass="size-9"
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{product.product_name}</p>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                {product.product_sku && <span>SKU: {product.product_sku}</span>}
                                                {product.product_category && <span>• {product.product_category}</span>}
                                                {product.purchase_price > 0 && (
                                                    <span className="text-emerald-600 dark:text-emerald-400">• PA : {Number(product.purchase_price).toLocaleString('fr-FR')} FCFA</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className={`text-lg font-bold ${product.is_low_stock ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>
                                                {product.quantity}
                                            </p>
                                            {product.is_low_stock && (
                                                <p className="text-xs text-amber-500">Stock faible</p>
                                            )}
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => {
                                                    setEditingProduct(product);
                                                    setEditImagePreview(
                                                        product.product_image ? `/storage/${product.product_image}` : null
                                                    );
                                                    editForm.setData({
                                                        quantity: product.quantity,
                                                        min_stock_alert: product.min_stock_alert,
                                                        purchase_price: product.purchase_price,
                                                        name: product.product_name,
                                                        sku: product.product_sku ?? '',
                                                        image: null,
                                                    });
                                                }}
                                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                                            >
                                                <Pencil className="size-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleRemoveProduct(product.id)}
                                                className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-400/10"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Pagination */}
                        {products.last_page > 1 && (
                            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-white/5">
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Page {products.current_page} / {products.last_page}
                                </p>
                                <div className="flex gap-1">
                                    {products.links.map((link, i) => (
                                        link.url ? (
                                            <Link
                                                key={i}
                                                href={link.url}
                                                className={`rounded-lg px-3 py-1.5 text-sm ${link.active ? 'bg-amber-300 font-semibold text-slate-950' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5'}`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ) : (
                                            <span
                                                key={i}
                                                className="rounded-lg px-3 py-1.5 text-sm text-slate-300 dark:text-slate-600"
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        )
                                    ))}
                                </div>
                            </div>
                        )}
                        </>
                    )}
                </div>

                {/* Derniers transferts */}
                {recentTransfers.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900">
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-white/10">
                            <h3 className="font-semibold text-slate-900 dark:text-white">Derniers transferts</h3>
                            <Link
                                href={buildRoute('depots.transfers', { depot: depot.id })}
                                className="text-sm text-amber-500 hover:text-amber-400"
                            >
                                Voir tout
                            </Link>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-white/5">
                            {recentTransfers.map(t => (
                                <div key={t.id} className="flex items-center justify-between px-6 py-3">
                                    <div className="flex items-center gap-3">
                                        <ProductImage
                                            src={t.product_image}
                                            name={t.product_name}
                                            thumbnailClass="size-8"
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                {t.product_name} → {t.shop_name}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {t.reference} • {t.user_name} • {t.transferred_at}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                        {t.quantity} unités
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal: Ajouter du stock */}
            {showAddStock && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
                        <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Ajouter du stock</h3>
                        <form onSubmit={handleAddStock} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Nom du produit *</label>
                                <input
                                    type="text"
                                    value={addStockForm.data.name}
                                    onChange={e => addStockForm.setData('name', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
                                    placeholder="Ex : Ciment Portland 50kg"
                                    required
                                />
                                {addStockForm.errors.name && <p className="mt-1 text-xs text-rose-500">{addStockForm.errors.name}</p>}
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">SKU / Référence</label>
                                <input
                                    type="text"
                                    value={addStockForm.data.sku}
                                    onChange={e => addStockForm.setData('sku', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
                                    placeholder="Ex : SKU-001 (optionnel)"
                                />
                                {addStockForm.errors.sku && <p className="mt-1 text-xs text-rose-500">{addStockForm.errors.sku}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Quantité *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={addStockForm.data.quantity}
                                        onChange={e => addStockForm.setData('quantity', e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
                                        required
                                    />
                                    {addStockForm.errors.quantity && <p className="mt-1 text-xs text-rose-500">{addStockForm.errors.quantity}</p>}
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Alerte stock min</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={addStockForm.data.min_stock_alert}
                                        onChange={e => addStockForm.setData('min_stock_alert', e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Prix d'achat (FCFA)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={addStockForm.data.purchase_price}
                                    onChange={e => addStockForm.setData('purchase_price', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
                                    placeholder="0"
                                />
                                {addStockForm.errors.purchase_price && <p className="mt-1 text-xs text-rose-500">{addStockForm.errors.purchase_price}</p>}
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Photo du produit</label>
                                <div
                                    className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-center hover:border-amber-400 dark:border-white/15 dark:bg-slate-800/50 dark:hover:border-amber-400"
                                    onClick={() => imageInputRef.current?.click()}
                                >
                                    {imagePreview ? (
                                        <img src={imagePreview ?? undefined} alt="Aperçu" className="mx-auto h-20 w-20 rounded-lg object-cover" />
                                    ) : (
                                        <>
                                            <Upload className="size-6 text-slate-400" />
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Cliquer pour choisir une image</p>
                                            <p className="text-xs text-slate-400">(JPG, PNG, max 2 Mo)</p>
                                        </>
                                    )}
                                </div>
                                <input
                                    ref={imageInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={e => {
                                        const file = e.target.files?.[0] ?? null;
                                        addStockForm.setData('image', file);
                                        setImagePreview(file ? URL.createObjectURL(file) : null);
                                    }}
                                />
                                {imagePreview && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            addStockForm.setData('image', null);
                                            setImagePreview(null);
                                            if (imageInputRef.current) imageInputRef.current.value = '';
                                        }}
                                        className="mt-1 text-xs text-rose-500 hover:text-rose-600"
                                    >
                                        Supprimer l'image
                                    </button>
                                )}
                                {addStockForm.errors.image && <p className="mt-1 text-xs text-rose-500">{addStockForm.errors.image}</p>}
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" disabled={addStockForm.processing} className="flex-1 rounded-xl bg-amber-300 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50">
                                    {addStockForm.processing ? 'Ajout...' : 'Ajouter'}
                                </button>
                                <button type="button" onClick={() => setShowAddStock(false)} className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-medium text-slate-700 dark:border-white/10 dark:text-slate-300">
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Transférer vers boutique */}
            {showTransfer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Transférer vers une boutique</h3>
                            <button onClick={() => setShowTransfer(false)} className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <X className="size-5" />
                            </button>
                        </div>
                        <form onSubmit={handleTransfer} className="space-y-4">
                            {/* Boutique */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Boutique destination *</label>
                                <select
                                    value={transferForm.data.shop_id}
                                    onChange={e => transferForm.setData('shop_id', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
                                    required
                                >
                                    <option value="">-- Sélectionner une boutique --</option>
                                    {shops.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                {transferForm.errors.shop_id && <p className="mt-1 text-xs text-rose-500">{transferForm.errors.shop_id}</p>}
                            </div>

                            {/* Lignes produits */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Produits *</label>
                                    <button
                                        type="button"
                                        onClick={() => transferForm.setData('items', [...(transferForm.data.items ?? []), { product_id: '', quantity: '1' }])}
                                        className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-500 dark:text-amber-400"
                                    >
                                        <Plus className="size-3.5" />
                                        Ajouter un produit
                                    </button>
                                </div>

                                {(transferForm.data.items ?? []).map((item, index) => {
                                    const depotProd = products.data.find((p: DepotProductItem) => String(p.product_id) === item.product_id);
                                    return (
                                        <div key={index} className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-800/50">
                                            <div className="flex-1 space-y-2">
                                                <select
                                                    value={item.product_id}
                                                    onChange={e => {
                                                        const newItems = [...(transferForm.data.items ?? [])];
                                                        newItems[index] = { ...newItems[index], product_id: e.target.value };
                                                        transferForm.setData('items', newItems);
                                                    }}
                                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
                                                    required
                                                >
                                                    <option value="">-- Produit --</option>
                                                    {products.data.map((p: DepotProductItem) => (
                                                        <option key={p.product_id} value={p.product_id} disabled={p.quantity <= 0}>
                                                            {p.product_name} (stock: {p.quantity})
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max={depotProd?.quantity ?? undefined}
                                                        value={item.quantity}
                                                        onChange={e => {
                                                            const newItems = [...(transferForm.data.items ?? [])];
                                                            newItems[index] = { ...newItems[index], quantity: e.target.value };
                                                            transferForm.setData('items', newItems);
                                                        }}
                                                        className="w-24 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
                                                        placeholder="Qté"
                                                        required
                                                    />
                                                    {depotProd && (
                                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                                            / {depotProd.quantity} disponible{depotProd.quantity > 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                </div>
                                                {(transferForm.errors as any)[`items.${index}.quantity`] && (
                                                    <p className="text-xs text-rose-500">{(transferForm.errors as any)[`items.${index}.quantity`]}</p>
                                                )}
                                            </div>
                                            {(transferForm.data.items ?? []).length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newItems = (transferForm.data.items ?? []).filter((_, i) => i !== index);
                                                        transferForm.setData('items', newItems);
                                                    }}
                                                    className="mt-1 rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-400/10"
                                                >
                                                    <X className="size-4" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
                                <textarea
                                    value={transferForm.data.notes}
                                    onChange={e => transferForm.setData('notes', e.target.value)}
                                    rows={2}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
                                    placeholder="Optionnel..."
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="submit" disabled={transferForm.processing} className="flex-1 rounded-xl bg-amber-300 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50">
                                    {transferForm.processing ? 'Transfert...' : `Transférer ${(transferForm.data.items ?? []).length > 1 ? `(${(transferForm.data.items ?? []).length} produits)` : ''}`}
                                </button>
                                <button type="button" onClick={() => setShowTransfer(false)} className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-medium text-slate-700 dark:border-white/10 dark:text-slate-300">
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Modifier stock */}
            {editingProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Modifier le produit</h3>
                            <button type="button" onClick={() => { setEditingProduct(null); setEditImagePreview(null); }} className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <X className="size-5" />
                            </button>
                        </div>
                        <form onSubmit={handleEditStock} className="space-y-4">
                            {/* Infos produit */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Nom du produit</label>
                                <input
                                    type="text"
                                    value={editForm.data.name}
                                    onChange={e => editForm.setData('name', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
                                />
                                {editForm.errors.name && <p className="mt-1 text-xs text-rose-500">{editForm.errors.name}</p>}
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">SKU / Référence</label>
                                <input
                                    type="text"
                                    value={editForm.data.sku}
                                    onChange={e => editForm.setData('sku', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
                                    placeholder="Ex : SKU-001 (optionnel)"
                                />
                                {editForm.errors.sku && <p className="mt-1 text-xs text-rose-500">{editForm.errors.sku}</p>}
                            </div>
                            {/* Stock */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Quantité</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={editForm.data.quantity}
                                        onChange={e => editForm.setData('quantity', parseInt(e.target.value) || 0)}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
                                    />
                                    {editForm.errors.quantity && <p className="mt-1 text-xs text-rose-500">{editForm.errors.quantity}</p>}
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Alerte min</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={editForm.data.min_stock_alert}
                                        onChange={e => editForm.setData('min_stock_alert', parseInt(e.target.value) || 0)}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Prix d'achat (FCFA)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={editForm.data.purchase_price}
                                    onChange={e => editForm.setData('purchase_price', parseFloat(e.target.value) || 0)}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
                                    placeholder="0"
                                />
                                {editForm.errors.purchase_price && <p className="mt-1 text-xs text-rose-500">{editForm.errors.purchase_price}</p>}
                            </div>
                            {/* Image */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Photo du produit</label>
                                <div
                                    className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-center hover:border-amber-400 dark:border-white/15 dark:bg-slate-800/50 dark:hover:border-amber-400"
                                    onClick={() => editImageInputRef.current?.click()}
                                >
                                    {editImagePreview ? (
                                        <img src={editImagePreview ?? undefined} alt="Aperçu" className="mx-auto h-20 w-20 rounded-lg object-cover" />
                                    ) : (
                                        <>
                                            <Upload className="size-6 text-slate-400" />
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Cliquer pour changer l'image</p>
                                            <p className="text-xs text-slate-400">(JPG, PNG, max 2 Mo)</p>
                                        </>
                                    )}
                                </div>
                                <input
                                    ref={editImageInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={e => {
                                        const file = e.target.files?.[0] ?? null;
                                        editForm.setData('image', file);
                                        setEditImagePreview(file ? URL.createObjectURL(file) : null);
                                    }}
                                />
                                {editImagePreview && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            editForm.setData('image', null);
                                            setEditImagePreview(null);
                                            if (editImageInputRef.current) editImageInputRef.current.value = '';
                                        }}
                                        className="mt-1 text-xs text-rose-500 hover:text-rose-600"
                                    >
                                        Supprimer l'image
                                    </button>
                                )}
                                {editForm.errors.image && <p className="mt-1 text-xs text-rose-500">{editForm.errors.image}</p>}
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" disabled={editForm.processing} className="flex-1 rounded-xl bg-amber-300 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50">
                                    {editForm.processing ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                                <button type="button" onClick={() => { setEditingProduct(null); setEditImagePreview(null); }} className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-medium dark:border-white/10 dark:text-slate-300">
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Import CSV */}
            {showImport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Importer du stock (CSV / Excel)</h3>
                            <button onClick={() => setShowImport(false)} className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <X className="size-5" />
                            </button>
                        </div>

                        {/* Format info */}
                        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-white/10 dark:bg-slate-800 dark:text-slate-400">
                            <p className="mb-1 font-semibold text-slate-700 dark:text-slate-300">Colonnes attendues :</p>
                            <code className="block">sku, code_barres, nom, quantite, stock_minimum, prix_achat</code>
                            <p className="mt-2">Le produit est recherché par <strong>SKU</strong>, puis <strong>code-barres</strong>, puis <strong>nom</strong>.<br />Si le produit existe déjà dans le dépôt, la quantité est <strong>ajoutée</strong>. La colonne <strong>prix_achat</strong> est optionnelle.</p>
                            <a
                                href={buildRoute('depots.stock.template', { depot: depot.id })}
                                className="mt-2 inline-flex items-center gap-1 text-amber-500 hover:text-amber-400"
                            >
                                <Download className="size-3.5" />
                                Télécharger le modèle Excel (.xlsx)
                            </a>
                        </div>

                        <form onSubmit={handleImport} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Fichier CSV / Excel *</label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv,.xlsx,.xls"
                                    required
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-amber-100 file:px-3 file:py-1 file:text-xs file:font-medium file:text-amber-700 dark:border-white/15 dark:bg-slate-800 dark:text-slate-300"
                                />
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button
                                    type="submit"
                                    disabled={isImporting}
                                    className="flex-1 rounded-xl bg-amber-300 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isImporting ? (
                                        <>
                                            <svg className="mr-1.5 inline size-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Import en cours...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="mr-1.5 inline size-4" />
                                            Importer
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowImport(false)}
                                    className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-medium text-slate-700 dark:border-white/10 dark:text-slate-300"
                                >
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Modal: Transférer vers un autre dépôt */}
            {showTransferDepot && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Transférer vers un autre dépôt</h3>
                            <button onClick={() => setShowTransferDepot(false)} className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <X className="size-5" />
                            </button>
                        </div>
                        <form onSubmit={handleTransferDepot} className="space-y-4">
                            {/* Dépôt destination */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Dépôt destination *</label>
                                <select
                                    value={transferDepotForm.data.target_depot_id}
                                    onChange={e => transferDepotForm.setData('target_depot_id', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
                                    required
                                >
                                    <option value="">-- Sélectionner un dépôt --</option>
                                    {otherDepots.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                                {transferDepotForm.errors.target_depot_id && <p className="mt-1 text-xs text-rose-500">{transferDepotForm.errors.target_depot_id}</p>}
                            </div>

                            {/* Lignes produits */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Produits *</label>
                                    <button
                                        type="button"
                                        onClick={() => transferDepotForm.setData('items', [...transferDepotForm.data.items, { product_id: '', quantity: '1' }])}
                                        className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-500 dark:text-amber-400"
                                    >
                                        <Plus className="size-3.5" />
                                        Ajouter un produit
                                    </button>
                                </div>

                                {transferDepotForm.data.items.map((item, index) => {
                                    const depotProd = products.data.find((p: DepotProductItem) => String(p.product_id) === item.product_id);
                                    return (
                                        <div key={index} className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-800/50">
                                            <div className="flex-1 space-y-2">
                                                <select
                                                    value={item.product_id}
                                                    onChange={e => {
                                                        const newItems = [...transferDepotForm.data.items];
                                                        newItems[index] = { ...newItems[index], product_id: e.target.value };
                                                        transferDepotForm.setData('items', newItems);
                                                    }}
                                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
                                                    required
                                                >
                                                    <option value="">-- Produit --</option>
                                                    {products.data.map((p: DepotProductItem) => (
                                                        <option key={p.product_id} value={p.product_id} disabled={p.quantity <= 0}>
                                                            {p.product_name} (stock: {p.quantity})
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max={depotProd?.quantity ?? undefined}
                                                        value={item.quantity}
                                                        onChange={e => {
                                                            const newItems = [...transferDepotForm.data.items];
                                                            newItems[index] = { ...newItems[index], quantity: e.target.value };
                                                            transferDepotForm.setData('items', newItems);
                                                        }}
                                                        className="w-24 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
                                                        placeholder="Qté"
                                                        required
                                                    />
                                                    {depotProd && (
                                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                                            / {depotProd.quantity} disponible{depotProd.quantity > 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                </div>
                                                {(transferDepotForm.errors as any)[`items.${index}.quantity`] && (
                                                    <p className="text-xs text-rose-500">{(transferDepotForm.errors as any)[`items.${index}.quantity`]}</p>
                                                )}
                                            </div>
                                            {transferDepotForm.data.items.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newItems = transferDepotForm.data.items.filter((_, i) => i !== index);
                                                        transferDepotForm.setData('items', newItems);
                                                    }}
                                                    className="mt-1 rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-400/10"
                                                >
                                                    <X className="size-4" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
                                <textarea
                                    value={transferDepotForm.data.notes}
                                    onChange={e => transferDepotForm.setData('notes', e.target.value)}
                                    rows={2}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
                                    placeholder="Optionnel..."
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="submit" disabled={transferDepotForm.processing} className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
                                    {transferDepotForm.processing ? 'Transfert...' : `Transférer${transferDepotForm.data.items.length > 1 ? ` (${transferDepotForm.data.items.length} produits)` : ''}`}
                                </button>
                                <button type="button" onClick={() => setShowTransferDepot(false)} className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-medium text-slate-700 dark:border-white/10 dark:text-slate-300">
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDeleteModal
                show={removeProductId !== null}
                onClose={() => setRemoveProductId(null)}
                onConfirm={handleConfirmRemove}
                title="Retirer le produit"
                message="Voulez-vous retirer ce produit du dépôt ? Le stock associé sera supprimé."
                confirmText="Retirer"
            />
        </AuthenticatedLayout>
    );
}
