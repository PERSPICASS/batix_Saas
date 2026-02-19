import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { PageProps } from '@/types';
import Table, { TableActions, TableActionButton, TableBadge } from '@/Components/Table';
import Currency from '@/Components/Currency';

interface Product {
    id: number;
    name: string;
    sku: string | null;
    barcode: string | null;
    selling_price: number;
    purchase_price: number;
    stock_quantity: number;
    min_stock_alert: number | null;
    is_active: boolean;
    track_stock: boolean;
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

export default function ProductsIndex({ products }: PageProps<{ products: PaginatedProducts }>) {
    const handleDelete = (id: number) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
            router.delete(route('products.destroy', id));
        }
    };

    const isLowStock = (product: Product) => {
        if (!product.track_stock || !product.min_stock_alert) return false;
        return product.stock_quantity <= product.min_stock_alert;
    };

    const columns = [
        {
            key: 'name',
            label: 'Nom',
            render: (product: Product) => (
                <div className="flex items-center gap-2">
                    {isLowStock(product) && (
                        <span title="Stock faible">
                            <AlertTriangle className="size-4 text-amber-400" />
                        </span>
                    )}
                    <span>{product.name}</span>
                </div>
            ),
        },
        {
            key: 'sku',
            label: 'SKU',
            render: (product: Product) => product.sku || '-',
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
                    <Link href={route('products.edit', product.id)}>
                        <TableActionButton>
                            <Pencil className="size-3.5" /> Modifier
                        </TableActionButton>
                    </Link>
                    <TableActionButton
                        variant="danger"
                        onClick={() => handleDelete(product.id)}
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
                <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-300">
                        Gérez votre catalogue de produits.
                    </p>
                    <Link
                        href={route('products.create')}
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
                    >
                        <Plus className="size-4" />
                        Nouveau produit
                    </Link>
                </div>

                <Table
                    columns={columns}
                    data={products.data}
                    emptyMessage="Aucun produit. Créez-en un pour commencer."
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
                                    href={route('products.index', { page: products.current_page - 1 })}
                                    className="rounded-lg border border-white/15 px-3 py-1.5 hover:bg-white/10"
                                >
                                    Précédent
                                </Link>
                            )}
                            {products.current_page < products.last_page && (
                                <Link
                                    href={route('products.index', { page: products.current_page + 1 })}
                                    className="rounded-lg border border-white/15 px-3 py-1.5 hover:bg-white/10"
                                >
                                    Suivant
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </section>
        </AuthenticatedLayout>
    );
}
