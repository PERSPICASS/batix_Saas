import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Search, Package, ArrowLeft } from 'lucide-react';
import Table, { TableBadge } from '@/Components/Table';
import { useState } from 'react';

interface Owner {
    id: number;
    name: string;
    email: string;
    code_user: string;
}

interface Shop {
    id: number;
    name: string;
    slug: string;
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
    price: number;
    cost_price: number | null;
    stock_quantity: number;
    min_stock_alert: number | null;
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

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fr-FR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(price);
    };

    const columns = [
        {
            key: 'name',
            label: 'Produit',
            render: (product: Product) => (
                <div>
                    <p className="font-medium text-white">{product.name}</p>
                    {product.sku && (
                        <p className="text-xs text-slate-400">SKU: {product.sku}</p>
                    )}
                    {product.barcode && (
                        <p className="text-xs text-slate-500">Code-barres: {product.barcode}</p>
                    )}
                </div>
            ),
        },
        {
            key: 'category',
            label: 'Catégorie',
            render: (product: Product) => (
                <div>
                    {product.category ? (
                        <>
                            <p className="text-sm text-white">{product.category.name}</p>
                            {product.subcategory && (
                                <p className="text-xs text-slate-400">{product.subcategory.name}</p>
                            )}
                        </>
                    ) : (
                        <span className="text-sm text-slate-500">Sans catégorie</span>
                    )}
                </div>
            ),
        },
        {
            key: 'price',
            label: 'Prix',
            render: (product: Product) => (
                <div>
                    <p className="font-medium text-white">{formatPrice(product.price)}</p>
                    {product.cost_price && (
                        <p className="text-xs text-slate-400">Coût: {formatPrice(product.cost_price)}</p>
                    )}
                </div>
            ),
        },
        {
            key: 'stock',
            label: 'Stock',
            render: (product: Product) => {
                if (!product.track_stock) {
                    return <span className="text-sm text-slate-400">Non suivi</span>;
                }

                const isLowStock = product.min_stock_alert && product.stock_quantity <= product.min_stock_alert;

                return (
                    <div>
                        <p className={`font-medium ${isLowStock ? 'text-red-400' : 'text-white'}`}>
                            {product.stock_quantity}
                        </p>
                        {product.min_stock_alert && (
                            <p className="text-xs text-slate-400">
                                Alerte: {product.min_stock_alert}
                            </p>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'status',
            label: 'Statut',
            render: (product: Product) => (
                <TableBadge variant={product.is_active ? 'success' : 'danger'}>
                    {product.is_active ? 'Actif' : 'Inactif'}
                </TableBadge>
            ),
        },
        {
            key: 'created_at',
            label: 'Créé le',
            render: (product: Product) => (
                <span className="text-sm text-slate-400">
                    {new Date(product.created_at).toLocaleDateString('fr-FR')}
                </span>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-white">Produits de {shop.name}</h1>
                        <p className="mt-1 text-sm text-slate-400">
                            Propriétaire: {shop.owner.name} ({shop.owner.email})
                        </p>
                    </div>
                    <Link
                        href={route('platform.shops')}
                        className="flex items-center gap-2 text-sm text-amber-300 hover:text-amber-200"
                    >
                        <ArrowLeft className="size-4" />
                        Retour aux boutiques
                    </Link>
                </div>
            }
        >
            <Head title={`Produits - ${shop.name} - Admin Plateforme`} />

            <div className="space-y-6">
                {/* Filtres et recherche */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                    <div className="flex flex-col gap-4">
                        <form onSubmit={handleSearch} className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Rechercher par nom, SKU ou code-barres..."
                                    className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-300/20"
                                />
                            </div>
                        </form>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            {/* Filtre par catégorie */}
                            <div className="flex-1">
                                <select
                                    value={filters.category_id || ''}
                                    onChange={(e) => handleCategoryFilter(e.target.value)}
                                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-300/20"
                                >
                                    <option value="">Toutes les catégories</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Filtre par statut */}
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleStatusFilter('')}
                                    className={`rounded-lg px-3 py-2 text-sm transition ${
                                        !filters.status
                                            ? 'bg-amber-300 text-slate-950'
                                            : 'border border-white/10 text-slate-300 hover:bg-white/5'
                                    }`}
                                >
                                    Tous
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleStatusFilter('active')}
                                    className={`rounded-lg px-3 py-2 text-sm transition ${
                                        filters.status === 'active'
                                            ? 'bg-amber-300 text-slate-950'
                                            : 'border border-white/10 text-slate-300 hover:bg-white/5'
                                    }`}
                                >
                                    Actifs
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleStatusFilter('inactive')}
                                    className={`rounded-lg px-3 py-2 text-sm transition ${
                                        filters.status === 'inactive'
                                            ? 'bg-amber-300 text-slate-950'
                                            : 'border border-white/10 text-slate-300 hover:bg-white/5'
                                    }`}
                                >
                                    Inactifs
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleStatusFilter('low_stock')}
                                    className={`rounded-lg px-3 py-2 text-sm transition ${
                                        filters.status === 'low_stock'
                                            ? 'bg-amber-300 text-slate-950'
                                            : 'border border-white/10 text-slate-300 hover:bg-white/5'
                                    }`}
                                >
                                    Stock bas
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Statistiques */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                        <p className="text-sm text-slate-400">Total produits</p>
                        <p className="mt-1 text-2xl font-bold text-white">{products.total}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                        <p className="text-sm text-slate-400">Sur cette page</p>
                        <p className="mt-1 text-2xl font-bold text-white">{products.data.length}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                        <p className="text-sm text-slate-400">Page actuelle</p>
                        <p className="mt-1 text-2xl font-bold text-white">
                            {products.current_page} / {products.last_page}
                        </p>
                    </div>
                </div>

                {/* Tableau des produits */}
                <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl">
                    {products.data.length === 0 ? (
                        <div className="p-8 text-center">
                            <Package className="mx-auto size-12 text-slate-600" />
                            <p className="mt-4 text-slate-400">
                                {filters.search || filters.category_id || filters.status
                                    ? 'Aucun produit ne correspond aux critères de recherche.'
                                    : 'Cette boutique n\'a pas encore de produits.'}
                            </p>
                        </div>
                    ) : (
                        <Table
                            columns={columns}
                            data={products.data}
                            emptyMessage="Aucun produit trouvé."
                        />
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
