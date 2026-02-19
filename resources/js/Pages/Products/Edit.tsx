import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useMemo } from 'react';

interface Shop {
    id: number;
    name: string;
}

interface Category {
    id: number;
    name: string;
}

interface Subcategory {
    id: number;
    category_id: number;
    name: string;
}

interface Product {
    id: number;
    shop_id: number;
    category_id: number;
    subcategory_id: number | null;
    name: string;
    description: string | null;
    sku: string | null;
    barcode: string | null;
    unit: string;
    purchase_price: string;
    sale_price: string;
    wholesale_price: string | null;
    tax_rate: string;
    stock_quantity: number;
    min_stock_level: number | null;
    max_stock_level: number | null;
    image: string | null;
    is_active: boolean;
}

interface Props {
    product: Product;
    shops: Shop[];
    categories: Category[];
    subcategories: Subcategory[];
}

export default function ProductsEdit({ product, shops, categories, subcategories }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        shop_id: product.shop_id,
        category_id: product.category_id,
        subcategory_id: product.subcategory_id || '',
        name: product.name,
        description: product.description || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        unit: product.unit,
        purchase_price: product.purchase_price,
        sale_price: product.sale_price,
        wholesale_price: product.wholesale_price || '',
        tax_rate: product.tax_rate,
        stock_quantity: product.stock_quantity,
        min_stock_level: product.min_stock_level || '',
        max_stock_level: product.max_stock_level || '',
        image: null as File | null,
        is_active: product.is_active,
        _method: 'PUT',
    });

    // Filter subcategories based on selected category
    const filteredSubcategories = useMemo(() => {
        if (!data.category_id) return [];
        return subcategories.filter(sub => sub.category_id === Number(data.category_id));
    }, [data.category_id, subcategories]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('products.update', product.id));
    };

    return (
        <AuthenticatedLayout
            header={<h1 className="text-xl font-semibold text-white">Modifier produit</h1>}
        >
            <Head title="Modifier produit" />

            <div className="mx-auto max-w-4xl">
                <form onSubmit={submit} className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <label htmlFor="shop_id" className="block text-sm font-medium text-slate-200">
                                Boutique *
                            </label>
                            <select
                                id="shop_id"
                                value={data.shop_id}
                                onChange={(e) => setData('shop_id', Number(e.target.value))}
                                className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
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
                            <label htmlFor="category_id" className="block text-sm font-medium text-slate-200">
                                Catégorie *
                            </label>
                            <select
                                id="category_id"
                                value={data.category_id}
                                onChange={(e) => {
                                    setData('category_id', Number(e.target.value));
                                    setData('subcategory_id', ''); // Reset subcategory when category changes
                                }}
                                className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                            >
                                <option value="">Sélectionner une catégorie</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                            {errors.category_id && <p className="mt-1 text-sm text-red-400">{errors.category_id}</p>}
                        </div>

                        <div>
                            <label htmlFor="subcategory_id" className="block text-sm font-medium text-slate-200">
                                Sous-catégorie
                            </label>
                            <select
                                id="subcategory_id"
                                value={data.subcategory_id}
                                onChange={(e) => setData('subcategory_id', e.target.value ? Number(e.target.value) : '')}
                                disabled={!data.category_id || filteredSubcategories.length === 0}
                                className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 disabled:opacity-50"
                            >
                                <option value="">Aucune</option>
                                {filteredSubcategories.map((subcategory) => (
                                    <option key={subcategory.id} value={subcategory.id}>
                                        {subcategory.name}
                                    </option>
                                ))}
                            </select>
                            {errors.subcategory_id && <p className="mt-1 text-sm text-red-400">{errors.subcategory_id}</p>}
                        </div>

                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-200">
                                Nom du produit *
                            </label>
                            <input
                                type="text"
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                placeholder="Ex: Marteau"
                            />
                            {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
                        </div>

                        <div>
                            <label htmlFor="sku" className="block text-sm font-medium text-slate-200">
                                SKU
                            </label>
                            <input
                                type="text"
                                id="sku"
                                value={data.sku}
                                onChange={(e) => setData('sku', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                placeholder="Ex: MAR-001"
                            />
                            {errors.sku && <p className="mt-1 text-sm text-red-400">{errors.sku}</p>}
                        </div>

                        <div>
                            <label htmlFor="barcode" className="block text-sm font-medium text-slate-200">
                                Code-barres
                            </label>
                            <input
                                type="text"
                                id="barcode"
                                value={data.barcode}
                                onChange={(e) => setData('barcode', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                placeholder="Ex: 1234567890123"
                            />
                            {errors.barcode && <p className="mt-1 text-sm text-red-400">{errors.barcode}</p>}
                        </div>

                        <div>
                            <label htmlFor="unit" className="block text-sm font-medium text-slate-200">
                                Unité *
                            </label>
                            <select
                                id="unit"
                                value={data.unit}
                                onChange={(e) => setData('unit', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                            >
                                <option value="piece">Pièce</option>
                                <option value="kg">Kilogramme</option>
                                <option value="liter">Litre</option>
                                <option value="meter">Mètre</option>
                                <option value="box">Boîte</option>
                                <option value="pack">Pack</option>
                            </select>
                            {errors.unit && <p className="mt-1 text-sm text-red-400">{errors.unit}</p>}
                        </div>

                        <div>
                            <label htmlFor="purchase_price" className="block text-sm font-medium text-slate-200">
                                Prix d'achat *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                id="purchase_price"
                                value={data.purchase_price}
                                onChange={(e) => setData('purchase_price', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                placeholder="0.00"
                            />
                            {errors.purchase_price && <p className="mt-1 text-sm text-red-400">{errors.purchase_price}</p>}
                        </div>

                        <div>
                            <label htmlFor="sale_price" className="block text-sm font-medium text-slate-200">
                                Prix de vente *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                id="sale_price"
                                value={data.sale_price}
                                onChange={(e) => setData('sale_price', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                placeholder="0.00"
                            />
                            {errors.sale_price && <p className="mt-1 text-sm text-red-400">{errors.sale_price}</p>}
                        </div>

                        <div>
                            <label htmlFor="wholesale_price" className="block text-sm font-medium text-slate-200">
                                Prix de gros
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                id="wholesale_price"
                                value={data.wholesale_price}
                                onChange={(e) => setData('wholesale_price', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                placeholder="0.00"
                            />
                            {errors.wholesale_price && <p className="mt-1 text-sm text-red-400">{errors.wholesale_price}</p>}
                        </div>

                        <div>
                            <label htmlFor="tax_rate" className="block text-sm font-medium text-slate-200">
                                Taux de TVA (%) *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                id="tax_rate"
                                value={data.tax_rate}
                                onChange={(e) => setData('tax_rate', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                placeholder="20.00"
                            />
                            {errors.tax_rate && <p className="mt-1 text-sm text-red-400">{errors.tax_rate}</p>}
                        </div>

                        <div>
                            <label htmlFor="stock_quantity" className="block text-sm font-medium text-slate-200">
                                Quantité en stock *
                            </label>
                            <input
                                type="number"
                                id="stock_quantity"
                                value={data.stock_quantity}
                                onChange={(e) => setData('stock_quantity', Number(e.target.value))}
                                className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                placeholder="0"
                            />
                            {errors.stock_quantity && <p className="mt-1 text-sm text-red-400">{errors.stock_quantity}</p>}
                        </div>

                        <div>
                            <label htmlFor="min_stock_level" className="block text-sm font-medium text-slate-200">
                                Stock minimum
                            </label>
                            <input
                                type="number"
                                id="min_stock_level"
                                value={data.min_stock_level}
                                onChange={(e) => setData('min_stock_level', e.target.value ? Number(e.target.value) : '')}
                                className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                placeholder="10"
                            />
                            {errors.min_stock_level && <p className="mt-1 text-sm text-red-400">{errors.min_stock_level}</p>}
                        </div>

                        <div>
                            <label htmlFor="max_stock_level" className="block text-sm font-medium text-slate-200">
                                Stock maximum
                            </label>
                            <input
                                type="number"
                                id="max_stock_level"
                                value={data.max_stock_level}
                                onChange={(e) => setData('max_stock_level', e.target.value ? Number(e.target.value) : '')}
                                className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                placeholder="100"
                            />
                            {errors.max_stock_level && <p className="mt-1 text-sm text-red-400">{errors.max_stock_level}</p>}
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="description" className="block text-sm font-medium text-slate-200">
                                Description
                            </label>
                            <textarea
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                rows={3}
                                className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                placeholder="Description du produit"
                            />
                            {errors.description && <p className="mt-1 text-sm text-red-400">{errors.description}</p>}
                        </div>

                        <div>
                            <label htmlFor="image" className="block text-sm font-medium text-slate-200">
                                Image du produit
                            </label>
                            {product.image && (
                                <div className="mt-2 mb-2">
                                    <img 
                                        src={`/storage/${product.image}`} 
                                        alt={product.name}
                                        className="h-20 w-20 rounded-lg object-cover border border-white/15"
                                    />
                                    <p className="mt-1 text-xs text-slate-400">Image actuelle</p>
                                </div>
                            )}
                            <input
                                type="file"
                                id="image"
                                accept="image/*"
                                onChange={(e) => setData('image', e.target.files?.[0] || null)}
                                className="mt-1 block w-full text-sm text-slate-200 file:mr-4 file:rounded-lg file:border-0 file:bg-amber-300 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-950 hover:file:bg-amber-200"
                            />
                            {errors.image && <p className="mt-1 text-sm text-red-400">{errors.image}</p>}
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="h-4 w-4 rounded border-white/15 bg-slate-900/70 text-amber-300 focus:ring-amber-300 focus:ring-offset-0"
                            />
                            <label htmlFor="is_active" className="ml-2 block text-sm text-slate-200">
                                Produit actif
                            </label>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
                        <Link
                            href={route('products.index')}
                            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5"
                        >
                            Annuler
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-amber-300 px-6 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-200 disabled:opacity-50"
                        >
                            {processing ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
