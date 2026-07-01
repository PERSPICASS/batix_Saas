import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState, useRef, useCallback } from 'react';
import { ArrowLeft, Plus, Trash2, Search, ScanLine, CheckCircle, AlertCircle } from 'lucide-react';
import { useRoute } from '@/utils/route';
import Currency from '@/Components/Currency';
import BarcodeScanner from '@/Components/BarcodeScanner';
import { useLocale } from '@/contexts/LocaleContext';

interface Shop {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    sku: string;
    barcode: string | null;
    stock_quantity: number;
    defective_stock_quantity: number;
    purchase_price: number;
    sold_since_last_inventory: number;
    purchased_since_last_inventory: number;
    shop: Shop;
}

interface InventoryItem {
    id: number;
    product_id: number;
    product: Product;
    expected_quantity: number;
    counted_quantity: number | null;
    defective_quantity: number;
}

interface Inventory {
    id: number;
    shop_id: number;
    inventory_number: string;
    inventory_date: string;
    status: string;
    notes: string | null;
    items: InventoryItem[];
}

interface Props {
    inventory: Inventory;
    shops: Shop[];
    products: Product[];
}

interface FormItem {
    product_id: number;
    counted_quantity: number | null;
    defective_quantity: number;
    product_name: string;
    product_sku: string;
    expected_quantity: number;
}

type ScanFeedback = { type: 'success' | 'added' | 'error'; message: string } | null;

export default function InventoryEdit({ inventory, shops, products }: Props) {
    const { t } = useLocale();
    const route = useRoute();
    const [searchProduct, setSearchProduct] = useState('');
    const [showScanner, setShowScanner] = useState(false);
    const [highlightedId, setHighlightedId] = useState<number | null>(null);
    const [scanFeedback, setScanFeedback] = useState<ScanFeedback>(null);
    const rowRefs = useRef<Record<number, HTMLTableRowElement | null>>({});

    const { data, setData, put, processing, errors } = useForm({
        shop_id: inventory.shop_id.toString(),
        inventory_date: inventory.inventory_date.split('T')[0],
        status: inventory.status,
        notes: inventory.notes || '',
        items: inventory.items.map(item => ({
            product_id: item.product_id,
            counted_quantity: item.counted_quantity,
            defective_quantity: item.defective_quantity,
            product_name: item.product.name,
            product_sku: item.product.sku,
            expected_quantity: item.expected_quantity,
        })) as FormItem[],
    });

    const filteredProducts = products.filter(
        (product) =>
            product.shop.id.toString() === data.shop_id &&
            !data.items.some((item) => item.product_id === product.id) &&
            (product.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
                product.sku.toLowerCase().includes(searchProduct.toLowerCase()))
    );

    const addProduct = (product: Product) => {
        setData('items', [
            ...data.items,
            {
                product_id: product.id,
                counted_quantity: null,
                defective_quantity: 0,
                product_name: product.name,
                product_sku: product.sku,
                expected_quantity: product.stock_quantity,
            },
        ]);
        setSearchProduct('');
    };

    const removeProduct = (productId: number) => {
        setData('items', data.items.filter((item) => item.product_id !== productId));
    };

    const updateCountedQuantity = (productId: number, quantity: number | null) => {
        setData(
            'items',
            data.items.map((item) =>
                item.product_id === productId ? { ...item, counted_quantity: quantity } : item
            )
        );
    };

    const updateDefectiveQuantity = (productId: number, quantity: number) => {
        setData(
            'items',
            data.items.map((item) =>
                item.product_id === productId ? { ...item, defective_quantity: quantity } : item
            )
        );
    };

    const showFeedback = (feedback: ScanFeedback) => {
        setScanFeedback(feedback);
        setTimeout(() => setScanFeedback(null), 3000);
    };

    const highlightRow = (productId: number) => {
        setHighlightedId(productId);
        setTimeout(() => setHighlightedId(null), 2500);
        rowRefs.current[productId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Focus the quantity input inside the row
        const input = rowRefs.current[productId]?.querySelector('input[type="number"]') as HTMLInputElement | null;
        setTimeout(() => input?.focus(), 300);
    };

    const handleScan = useCallback((code: string) => {
        setShowScanner(false);

        // 1. Already in items?
        const existingItem = data.items.find((item) => {
            const product = products.find((p) => p.id === item.product_id);
            return product?.barcode === code || product?.sku === code;
        });

        if (existingItem) {
            highlightRow(existingItem.product_id);
            showFeedback({ type: 'success', message: `Produit trouvé : ${existingItem.product_name}` });
            return;
        }

        // 2. Not yet in items — try to add from products list
        const product = products.find(
            (p) => (p.barcode === code || p.sku === code) && p.shop.id.toString() === data.shop_id
        );

        if (product) {
            addProduct(product);
            setTimeout(() => highlightRow(product.id), 100);
            showFeedback({ type: 'added', message: `"${product.name}" ajouté à l'inventaire` });
            return;
        }

        showFeedback({ type: 'error', message: `Aucun produit trouvé pour ce code : ${code}` });
    }, [data.items, data.shop_id, products]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('inventory.update', { inventory: inventory.id }));
    };

    return (
        <AuthenticatedLayout
            header={<h1 className="text-xl font-semibold text-white">Modifier l'inventaire {inventory.inventory_number}</h1>}
        >
            <Head title={`Modifier inventaire ${inventory.inventory_number}`} />

            <form onSubmit={submit} className="space-y-6">
                {/* Informations générales */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <h2 className="mb-4 text-lg font-semibold text-white">Informations générales</h2>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-200">{t.common.form.shopField}</label>
                            <select
                                value={data.shop_id}
                                onChange={(e) => {
                                    setData('shop_id', e.target.value);
                                    setData('items', []);
                                }}
                                className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200"
                                disabled={inventory.status === 'completed'}
                            >
                                {shops.map((shop) => (
                                    <option key={shop.id} value={shop.id}>
                                        {shop.name}
                                    </option>
                                ))}
                            </select>
                            {errors.shop_id && <p className="mt-1 text-sm text-red-400">{errors.shop_id}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-200">{t.inventory.form.date}</label>
                            <input
                                type="date"
                                value={data.inventory_date}
                                onChange={(e) => setData('inventory_date', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200"
                                disabled={inventory.status === 'completed'}
                            />
                            {errors.inventory_date && <p className="mt-1 text-sm text-red-400">{errors.inventory_date}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-200">Statut</label>
                            <select
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200"
                                disabled={inventory.status === 'completed'}
                            >
                                <option value="draft">Brouillon</option>
                                <option value="in_progress">En cours</option>
                                <option value="cancelled">Annulé</option>
                            </select>
                            {errors.status && <p className="mt-1 text-sm text-red-400">{errors.status}</p>}
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-200">Notes</label>
                        <textarea
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            rows={3}
                            className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200"
                            placeholder="Notes optionnelles..."
                        />
                    </div>
                </div>

                {/* Ajout de produits */}
                {inventory.status !== 'completed' && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white">Ajouter des produits</h2>
                            <button
                                type="button"
                                onClick={() => setShowScanner(true)}
                                className="flex items-center gap-2 rounded-lg border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-sm text-amber-300 transition hover:bg-amber-300/20"
                            >
                                <ScanLine className="size-4" />
                                Scanner un code
                            </button>
                        </div>

                        {/* Feedback scan */}
                        {scanFeedback && (
                            <div className={`mb-4 flex items-center gap-2 rounded-lg px-4 py-2 text-sm ${
                                scanFeedback.type === 'error'
                                    ? 'border border-red-500/30 bg-red-500/10 text-red-300'
                                    : 'border border-green-500/30 bg-green-500/10 text-green-300'
                            }`}>
                                {scanFeedback.type === 'error'
                                    ? <AlertCircle className="size-4 shrink-0" />
                                    : <CheckCircle className="size-4 shrink-0" />
                                }
                                {scanFeedback.message}
                            </div>
                        )}

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchProduct}
                                onChange={(e) => setSearchProduct(e.target.value)}
                                placeholder="Rechercher un produit par nom ou SKU..."
                                className="w-full rounded-lg border border-white/15 bg-slate-900/70 py-2 pl-10 pr-4 text-slate-200"
                            />
                        </div>

                        {searchProduct && filteredProducts.length > 0 && (
                            <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-slate-900">
                                {filteredProducts.slice(0, 10).map((product) => (
                                    <button
                                        key={product.id}
                                        type="button"
                                        onClick={() => addProduct(product)}
                                        className="flex w-full items-center justify-between px-4 py-2 text-left hover:bg-white/10"
                                    >
                                        <div>
                                            <p className="text-white">{product.name}</p>
                                            <p className="text-xs text-slate-400">SKU: {product.sku} • Stock: {product.stock_quantity}</p>
                                        </div>
                                        <Plus className="size-4 text-amber-300" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {showScanner && (
                    <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
                )}

                {/* Liste des produits à inventorier */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <h2 className="mb-4 text-lg font-semibold text-white">
                        Produits à inventorier ({data.items.length})
                    </h2>

                    {data.items.length === 0 ? (
                        <p className="text-center text-slate-400">Aucun produit ajouté</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10 text-left text-sm text-slate-400">
                                        <th className="pb-3 pr-4">Produit</th>
                                        <th className="pb-3 pr-4 text-right">Stock théorique</th>
                                        <th className="pb-3 pr-4 text-right">Bons</th>
                                        <th className="pb-3 pr-4 text-right">Défectueuses</th>
                                        <th className="pb-3 pr-4 text-right">Écart</th>
                                        <th className="pb-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {data.items.map((item) => {
                                        const difference = ((item.counted_quantity ?? 0) + item.defective_quantity) - item.expected_quantity;
                                        const isHighlighted = highlightedId === item.product_id;
                                        return (
                                            <tr
                                                key={item.product_id}
                                                ref={(el) => { rowRefs.current[item.product_id] = el; }}
                                                className={`transition-colors duration-500 ${isHighlighted ? 'bg-amber-300/10 ring-1 ring-inset ring-amber-300/30' : ''}`}
                                            >
                                                <td className="py-3 pr-4">
                                                    <div>
                                                        <p className="font-medium text-white">{item.product_name}</p>
                                                        <p className="text-xs text-slate-400">SKU: {item.product_sku}</p>
                                                        {(() => {
                                                            const product = products.find((p) => p.id === item.product_id);
                                                            if (product?.sold_since_last_inventory || product?.purchased_since_last_inventory) {
                                                                return (
                                                                    <p className="text-xs text-amber-300 mt-1">
                                                                        {product?.sold_since_last_inventory > 0 && `↓ ${product.sold_since_last_inventory} vendus`}
                                                                        {product?.sold_since_last_inventory > 0 && product?.purchased_since_last_inventory > 0 && ' • '}
                                                                        {product?.purchased_since_last_inventory > 0 && `↑ ${product.purchased_since_last_inventory} achetés`}
                                                                    </p>
                                                                );
                                                            }
                                                            return null;
                                                        })()}
                                                    </div>
                                                </td>
                                                <td className="py-3 pr-4 text-right text-slate-300">
                                                    {item.expected_quantity}
                                                </td>
                                                <td className="py-3 pr-4 text-right">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={item.counted_quantity ?? ''}
                                                        onChange={(e) =>
                                                            updateCountedQuantity(
                                                                item.product_id,
                                                                e.target.value ? parseInt(e.target.value) : null
                                                            )
                                                        }
                                                        className="w-20 rounded-lg border border-white/15 bg-slate-900/70 px-3 py-1 text-right text-white"
                                                        placeholder="-"
                                                        disabled={inventory.status === 'completed'}
                                                    />
                                                </td>
                                                <td className="py-3 pr-4 text-right">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={item.defective_quantity}
                                                        onChange={(e) =>
                                                            updateDefectiveQuantity(
                                                                item.product_id,
                                                                parseInt(e.target.value) || 0
                                                            )
                                                        }
                                                        className="w-20 rounded-lg border border-white/15 bg-slate-900/70 px-3 py-1 text-right text-white"
                                                        placeholder="0"
                                                        disabled={inventory.status === 'completed'}
                                                    />
                                                </td>
                                                <td className="py-3 pr-4 text-right">
                                                    {item.counted_quantity !== null && (
                                                        <span
                                                            className={`font-medium ${
                                                                difference === 0
                                                                    ? 'text-slate-400'
                                                                    : difference > 0
                                                                    ? 'text-green-300'
                                                                    : 'text-red-300'
                                                            }`}
                                                        >
                                                            {difference > 0 ? '+' : ''}
                                                            {difference}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 text-right">
                                                    {inventory.status !== 'completed' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeProduct(item.product_id)}
                                                            className="rounded-lg p-1 text-red-400 hover:bg-red-500/20"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {errors.items && <p className="mt-2 text-sm text-red-400">{errors.items}</p>}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                    <Link
                        href={route('inventory.index')}
                        className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                    >
                        <ArrowLeft className="size-4" />
                        Annuler
                    </Link>

                    {inventory.status !== 'completed' && (
                        <button
                            type="submit"
                            disabled={processing || data.items.length === 0}
                            className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-6 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:opacity-50"
                        >
                            {processing ? 'Enregistrement...' : 'Enregistrer les modifications'}
                        </button>
                    )}
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
