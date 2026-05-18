import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Trash2, AlertTriangle, Search, Upload, Download, FileSpreadsheet, X, Layers, LogOut, RotateCcw, ScanLine } from 'lucide-react';
import { PageProps } from '@/types';
import Table, { TableActions, TableActionButton, TableBadge } from '@/Components/Table';
import Currency from '@/Components/Currency';
import { useRoute } from '@/utils/route';
import { useState, useRef, useEffect, FormEvent } from 'react';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';
import ProductImage from '@/Components/ProductImage';
import BarcodeScanner from '@/Components/BarcodeScanner';

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
    min_stock_alert: number | null;
    is_active: boolean;
    track_stock: boolean;
    has_variations: boolean;
    category: {
        id: number;
        name: string;
    } | null;
    subcategory: {
        id: number;
        name: string;
    } | null;
    shop: {
        id: number;
        name: string;
    };
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
    const [showImportModal, setShowImportModal] = useState(false);
    const [search, setSearch] = useState(filters.search || '');
    const [categoryId, setCategoryId] = useState(filters.category_id || '');
    const [status, setStatus] = useState(filters.status || '');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [deleteModal, setDeleteModal] = useState<{ show: boolean; product: Product | null }>({ show: false, product: null });
    const [removeModal, setRemoveModal] = useState<{ show: boolean; product: Product | null }>({ show: false, product: null });
    const [deleting, setDeleting] = useState(false);
    const [showScanner, setShowScanner] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        file: null as File | null,
    });

    const handleDelete = (product: Product) => {
        setDeleteModal({ show: true, product });
    };

    const handleRemoveFromShop = (product: Product) => {
        setRemoveModal({ show: true, product });
    };

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
            onSuccess: () => {
                setDeleteModal({ show: false, product: null });
                setDeleting(false);
            },
            onError: () => setDeleting(false),
        });
    };

    const isLowStock = (product: Product) => {
        if (!product.track_stock || !product.min_stock_alert) return false;
        return product.stock_quantity <= product.min_stock_alert;
    };

    const clearFilters = () => {
        setSearch('');
        setCategoryId('');
        setStatus('');
    };

    const handleImport = (e: FormEvent) => {
        e.preventDefault();
        if (!data.file) return;

        post(route('products.import'), {
            forceFormData: true,
            onSuccess: () => {
                setShowImportModal(false);
                reset();
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
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

    // Debounce : déclenche la recherche 400ms après la fin de saisie
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const timer = setTimeout(() => {
            router.get(route('products.index'), {
                search: search || undefined,
                category_id: categoryId || undefined,
                status: status || undefined,
            }, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 400);
        return () => clearTimeout(timer);
    }, [search, categoryId, status]);

    const columns = [
        {
            key: 'barcode',
            label: 'Code-barres',
            render: (product: Product) => (
                product.barcode ? (
                    <div className="flex flex-col items-center gap-0.5">
                        <div className="flex w-full h-6 justify-center">
                            {product.barcode.split('').map((digit, i) => {
                                const d = parseInt(digit);
                                return (
                                    <div key={i} className="flex h-full">
                                        <div
                                            className="h-full bg-slate-700"
                                            style={{ width: d % 2 === 0 ? '1px' : '2px' }}
                                        />
                                        <div
                                            className="h-full"
                                            style={{ width: d % 3 === 0 ? '2px' : '1px' }}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                        <span className="font-mono text-[10px] text-slate-500 tracking-wider">
                            {product.barcode}
                        </span>
                    </div>
                ) : (
                    <span className="text-slate-500">-</span>
                )
            ),
        },
        {
            key: 'name',
            label: 'Nom',
            render: (product: Product) => (
                <div className="flex items-center gap-3">
                    <ProductImage src={product.image} name={product.name} thumbnailClass="size-10" />
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            {isLowStock(product) && (
                                <span title="Stock faible">
                                    <AlertTriangle className="size-3.5 shrink-0 text-amber-400" />
                                </span>
                            )}
                            <span className="font-medium text-white truncate">{product.name}</span>
                        </div>
                        {product.sku && (
                            <span className="text-xs text-slate-500 font-mono">{product.sku}</span>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'category',
            label: 'Catégorie',
            render: (product: Product) => product.category?.name || '-',
        },
        {
            key: 'selling_price',
            label: 'Prix',
            align: 'right' as const,
            render: (product: Product) => <Currency amount={product.selling_price} />,
        },
        {
            key: 'stock_quantity',
            label: 'Stock',
            align: 'center' as const,
            render: (product: Product) => (
                <span className={isLowStock(product) ? 'text-amber-300 font-semibold' : ''}>
                    {product.stock_quantity}
                </span>
            ),
        },
        {
            key: 'is_active',
            label: 'Statut',
            align: 'center' as const,
            render: (product: Product) => (
                <TableBadge variant={product.is_active ? 'success' : 'danger'}>
                    {product.is_active ? 'Actif' : 'Inactif'}
                </TableBadge>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            align: 'right' as const,
            render: (product: Product) => (
                <TableActions>
                    <Link href={route('products.variations.index', { product: product.id })}>
                        <TableActionButton>
                            <Layers className="size-3.5" /> Déclinaisons
                        </TableActionButton>
                    </Link>
                    <Link href={route('products.edit', { product: product.id })}>
                        <TableActionButton>
                            <Pencil className="size-3.5" /> Modifier
                        </TableActionButton>
                    </Link>
                    {product.is_active && (
                        <TableActionButton
                            onClick={() => handleRemoveFromShop(product)}
                        >
                            <LogOut className="size-3.5" /> Retirer boutique
                        </TableActionButton>
                    )}
                    {!product.is_active && (
                        <TableActionButton
                            variant="success"
                            onClick={() => router.patch(route('products.restore-to-shop', { product: product.id }))}
                        >
                            <RotateCcw className="size-3.5" /> Remettre en boutique
                        </TableActionButton>
                    )}
                    <TableActionButton
                        variant="danger"
                        onClick={() => handleDelete(product)}
                    >
                        <Trash2 className="size-3.5" /> Supprimer
                    </TableActionButton>
                </TableActions>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            header={<h1 className="text-xl font-semibold text-white">Produits</h1>}
        >
            <Head title="Produits" />

            <section className="space-y-4">
                {/* Barre d'actions */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-300">
                        Gérez votre catalogue de produits.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Bouton Import/Export/Scanner */}
                        <div className="flex items-center gap-1">
                            {/* <button
                                onClick={() => setShowScanner(true)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-sm text-amber-300 transition hover:bg-amber-300/20"
                            >
                                <ScanLine className="size-4" />
                                Scanner
                            </button> */}
                            <button
                                onClick={() => setShowImportModal(true)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10"
                            >
                                <Upload className="size-4" />
                                Importer
                            </button>
                            <a
                                href={route('products.export')}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10"
                            >
                                <Download className="size-4" />
                                Exporter
                            </a>
                        </div>
                        
                        {/* Bouton Nouveau */}
                        {canCreateProduct ? (
                            <Link
                                href={route('products.create')}
                                className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
                            >
                                <Plus className="size-4" />
                                Nouveau produit
                            </Link>
                        ) : (
                            <div className="group relative">
                                <button
                                    disabled
                                    className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-slate-600 px-4 py-2 text-sm font-semibold text-slate-400 opacity-60"
                                >
                                    <Plus className="size-4" />
                                    Nouveau produit
                                </button>
                                <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                                    Limite de produits atteinte. Passez à un plan supérieur.
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Barre de recherche et filtres */}
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        {/* Recherche */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Rechercher par nom, SKU ou code-barres..."
                                className="w-full rounded-lg border border-white/15 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:border-amber-300/50 focus:outline-none focus:ring-1 focus:ring-amber-300/50"
                            />
                        </div>

                        {/* Filtre catégorie */}
                        <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className="rounded-lg border border-white/15 bg-slate-800 px-3 py-2 text-sm text-white focus:border-amber-300/50 focus:outline-none focus:ring-1 focus:ring-amber-300/50"
                        >
                            <option value="">Toutes les catégories</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>

                        {/* Filtre statut */}
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="rounded-lg border border-white/15 bg-slate-800 px-3 py-2 text-sm text-white focus:border-amber-300/50 focus:outline-none focus:ring-1 focus:ring-amber-300/50"
                        >
                            <option value="">Tous les actifs</option>
                            <option value="active">Actifs</option>
                            <option value="inactive">Retirés de la boutique</option>
                            <option value="low_stock">Stock faible</option>
                        </select>

                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10"
                            >
                                <X className="size-4" />
                                Effacer
                            </button>
                        )}
                    </div>
                </div>

                {/* Indicateur filtres actifs */}
                {hasActiveFilters && (
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="text-slate-400">Filtres actifs :</span>
                        {search && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-300/20 px-2 py-0.5 text-amber-300">
                                Recherche: "{search}"
                                <button onClick={() => setSearch('')}>
                                    <X className="size-3" />
                                </button>
                            </span>
                        )}
                        {categoryId && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-300/20 px-2 py-0.5 text-amber-300">
                                {categories.find(c => c.id.toString() === categoryId)?.name}
                                <button onClick={() => setCategoryId('')}>
                                    <X className="size-3" />
                                </button>
                            </span>
                        )}
                        {status && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-300/20 px-2 py-0.5 text-amber-300">
                                {status === 'active' ? 'Actifs' : status === 'inactive' ? 'Inactifs' : 'Stock faible'}
                                <button onClick={() => setStatus('')}>
                                    <X className="size-3" />
                                </button>
                            </span>
                        )}
                    </div>
                )}

                {/* Table */}
                <Table
                    columns={columns}
                    data={products.data}
                    emptyMessage="Aucun produit trouvé. Créez-en un pour commencer."
                />

                {/* Pagination */}
                {products.last_page > 1 && (
                    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                        <div>
                            Page {products.current_page} sur {products.last_page} • Total: {products.total} produits
                        </div>
                        <div className="flex gap-2">
                            {products.current_page > 1 && (
                                <Link
                                    href={route('products.index', { 
                                        page: products.current_page - 1,
                                        search: search || undefined,
                                        category_id: categoryId || undefined,
                                        status: status || undefined,
                                    })}
                                    className="rounded-lg border border-white/15 px-3 py-1.5 hover:bg-white/10"
                                >
                                    Précédent
                                </Link>
                            )}
                            {products.current_page < products.last_page && (
                                <Link
                                    href={route('products.index', { 
                                        page: products.current_page + 1,
                                        search: search || undefined,
                                        category_id: categoryId || undefined,
                                        status: status || undefined,
                                    })}
                                    className="rounded-lg border border-white/15 px-3 py-1.5 hover:bg-white/10"
                                >
                                    Suivant
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </section>

            {showScanner && (
                <BarcodeScanner
                    onScan={handleScan}
                    onClose={() => setShowScanner(false)}
                />
            )}

            {/* Modal Import */}
            {showImportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                    <div className="w-full max-w-lg rounded-xl border border-white/10 bg-slate-900 p-6">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white">Importer des produits</h2>
                            <button
                                onClick={() => setShowImportModal(false)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <form onSubmit={handleImport} className="space-y-6">
                            {/* Instructions */}
                            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                                <h3 className="mb-2 flex items-center gap-2 font-medium text-white">
                                    <FileSpreadsheet className="size-5 text-amber-300" />
                                    Instructions
                                </h3>
                                <ul className="space-y-1 text-sm text-slate-300">
                                    <li>• Téléchargez d'abord le modèle Excel</li>
                                    <li>• Remplissez vos produits en suivant le format</li>
                                    <li>• Les colonnes obligatoires sont : Nom et Prix de vente</li>
                                    <li>• Les produits existants (même SKU/code-barres) seront mis à jour</li>
                                </ul>
                                <a
                                    href={route('products.template')}
                                    className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-amber-300 hover:text-amber-200"
                                >
                                    <Download className="size-4" />
                                    Télécharger le modèle Excel
                                </a>
                            </div>

                            {/* Upload */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-300">
                                    Fichier Excel (.xlsx, .xls, .csv)
                                </label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={(e) => setData('file', e.target.files?.[0] || null)}
                                    className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-amber-300 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-950 hover:file:bg-amber-200"
                                />
                                {errors.file && (
                                    <p className="mt-1 text-sm text-red-400">{errors.file}</p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowImportModal(false)}
                                    className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-300 hover:bg-white/10"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={!data.file || processing}
                                    className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:opacity-50"
                                >
                                    <Upload className="size-4" />
                                    {processing ? 'Importation...' : 'Importer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de suppression */}
            <ConfirmDeleteModal
                show={deleteModal.show}
                onClose={() => setDeleteModal({ show: false, product: null })}
                onConfirm={confirmDelete}
                message={`Êtes-vous sûr de vouloir supprimer le produit "${deleteModal.product?.name}" ?`}
                processing={deleting}
            />

            {/* Modal retirer de la boutique */}
            {removeModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-400/10">
                                <LogOut className="size-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white">Retirer de la boutique</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{removeModal.product?.name}</p>
                            </div>
                        </div>
                        <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">
                            Ce produit sera <strong>désactivé</strong> dans la boutique (stock remis à 0) mais restera disponible dans les dépôts. Il pourra être réactivé depuis la fiche produit.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={confirmRemoveFromShop}
                                className="flex-1 rounded-xl bg-amber-300 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-200"
                            >
                                Confirmer
                            </button>
                            <button
                                onClick={() => setRemoveModal({ show: false, product: null })}
                                className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-medium text-slate-700 dark:border-white/10 dark:text-slate-300"
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
