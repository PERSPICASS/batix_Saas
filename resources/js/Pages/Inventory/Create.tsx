import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface Shop {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    sku: string | null;
    stock_quantity: number;
    shop: Shop;
}

interface InventoryItem {
    product_id: number | string;
    counted_quantity: number | string;
}

interface Props {
    shops: Shop[];
    products: Product[];
}

export default function InventoryCreate({ shops, products }: Props) {
    const [items, setItems] = useState<InventoryItem[]>([
        { product_id: '', counted_quantity: '' },
    ]);

    const { data, setData, post, processing, errors } = useForm({
        shop_id: '',
        inventory_date: new Date().toISOString().split('T')[0],
        notes: '',
        items: items,
    });

    const addItem = () => {
        setItems([...items, { product_id: '', counted_quantity: '' }]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const updateItem = (index: number, field: keyof InventoryItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        data.items = items;
        post(route('inventory.store'));
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">Nouvel inventaire</h1>}>
            <Head title="Nouvel inventaire" />

            <div className="mx-auto max-w-4xl">
                <form onSubmit={submit} className="space-y-6">
                    {/* Info section */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                        <h2 className="mb-4 text-lg font-semibold text-white">Informations générales</h2>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div>
                                <label htmlFor="shop_id" className="block text-sm font-medium text-slate-200">
                                    Boutique *
                                </label>
                                <select
                                    id="shop_id"
                                    value={data.shop_id}
                                    onChange={(e) => setData('shop_id', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200"
                                >
                                    <option value="">Sélectionner une boutique</option>
                                    {shops.map((shop) => (
                                        <option key={shop.id} value={shop.id}>
                                            {shop.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.shop_id && <p className="mt-1 text-sm text-red-400">{errors.shop_id}</p>}
                            </div>

                            <div>
                                <label htmlFor="inventory_date" className="block text-sm font-medium text-slate-200">
                                    Date de l'inventaire *
                                </label>
                                <input
                                    type="date"
                                    id="inventory_date"
                                    value={data.inventory_date}
                                    onChange={(e) => setData('inventory_date', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200"
                                />
                                {errors.inventory_date && (
                                    <p className="mt-1 text-sm text-red-400">{errors.inventory_date}</p>
                                )}
                            </div>

                            <div className="md:col-span-2">
                                <label htmlFor="notes" className="block text-sm font-medium text-slate-200">
                                    Notes
                                </label>
                                <textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={3}
                                    className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200"
                                    placeholder="Raison de l'inventaire, observations..."
                                />
                                {errors.notes && <p className="mt-1 text-sm text-red-400">{errors.notes}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Items section */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white">Produits comptés</h2>
                            <button
                                type="button"
                                onClick={addItem}
                                className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10"
                            >
                                <Plus className="size-3.5" />
                                Ajouter un produit
                            </button>
                        </div>

                        <div className="space-y-4">
                            {items.map((item, index) => {
                                const selectedProduct = products.find((p) => p.id === Number(item.product_id));
                                
                                return (
                                    <div
                                        key={index}
                                        className="rounded-xl border border-white/10 bg-slate-900/60 p-4 space-y-3"
                                    >
                                        <div className="grid gap-3 md:grid-cols-12 items-end">
                                            <div className="md:col-span-6">
                                                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                                    Produit #{index + 1} *
                                                </label>
                                                <select
                                                    value={item.product_id}
                                                    onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                                                    className="block w-full rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                                >
                                                    <option value="">Sélectionner un produit</option>
                                                    {products.map((product) => (
                                                        <option key={product.id} value={product.id}>
                                                            {product.name} {product.sku && `(${product.sku})`} - Stock: {product.stock_quantity}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="md:col-span-5">
                                                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                                    Quantité comptée *
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={item.counted_quantity}
                                                    onChange={(e) => updateItem(index, 'counted_quantity', e.target.value)}
                                                    className="block w-full rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                                    placeholder="0"
                                                />
                                            </div>

                                            <div className="md:col-span-1">
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    disabled={items.length === 1}
                                                    className="w-full rounded-lg border border-rose-300/30 px-3 py-2 text-rose-200 transition hover:bg-rose-300/10 disabled:opacity-30 disabled:cursor-not-allowed"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 className="mx-auto size-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {selectedProduct && (
                                            <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
                                                <div className="grid grid-cols-3 gap-4 text-sm">
                                                    <div>
                                                        <p className="text-xs text-slate-400 mb-0.5">Stock système</p>
                                                        <p className="font-semibold text-blue-300">
                                                            {selectedProduct.stock_quantity}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-400 mb-0.5">Compté</p>
                                                        <p className="font-semibold text-blue-300">
                                                            {item.counted_quantity || 0}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-400 mb-0.5">Écart</p>
                                                        <p
                                                            className={`font-semibold ${
                                                                Number(item.counted_quantity || 0) - selectedProduct.stock_quantity > 0
                                                                    ? 'text-green-400'
                                                                    : Number(item.counted_quantity || 0) - selectedProduct.stock_quantity < 0
                                                                    ? 'text-red-400'
                                                                    : 'text-slate-400'
                                                            }`}
                                                        >
                                                            {Number(item.counted_quantity || 0) - selectedProduct.stock_quantity > 0 ? '+' : ''}
                                                            {Number(item.counted_quantity || 0) - selectedProduct.stock_quantity}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {errors.items && <p className="mt-2 text-sm text-red-400">{errors.items}</p>}
                    </div>

                    <div className="flex items-center justify-end gap-3">
                        <Link
                            href={route('inventory.index')}
                            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/5"
                        >
                            Annuler
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-amber-300 px-6 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50"
                        >
                            {processing ? 'Création...' : 'Créer l\'inventaire'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
