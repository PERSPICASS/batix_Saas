import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState, useRef, useEffect } from 'react';
import { useRoute } from '@/utils/route';
import { Search, X, ChevronDown } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';

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

interface Props {
    shops: Shop[];
    products: Product[];
}

export default function StocksCreate({ shops, products }: Props) {
    const { t } = useLocale();
    const route = useRoute();

    const { props } = usePage();
    const activeShop = props.activeShop as { id: number; name: string } | null;
    
    const { data, setData, post, processing, errors } = useForm({
        shop_id: activeShop?.id.toString() || shops[0]?.id.toString() || '',
        product_id: '',
        type: 'in',
        quantity: 1,
        unit_cost: '',
        notes: '',
        movement_date: new Date().toISOString().split('T')[0],
    });

    // ── Combobox produit ──────────────────────────────────────────────────────
    const [productSearch, setProductSearch] = useState('');
    const [dropdownOpen, setDropdownOpen]   = useState(false);
    const comboRef = useRef<HTMLDivElement>(null);

    const selectedProduct = products.find((p) => p.id === Number(data.product_id));

    const filteredProducts = products.filter((p) => {
        const q = productSearch.toLowerCase();
        return (
            p.name.toLowerCase().includes(q) ||
            (p.sku ?? '').toLowerCase().includes(q)
        );
    });

    // Fermer le dropdown si clic en dehors
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const selectProduct = (product: Product) => {
        setData('product_id', product.id.toString());
        setProductSearch('');
        setDropdownOpen(false);
    };

    const clearProduct = () => {
        setData('product_id', '');
        setProductSearch('');
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('stocks.store'));
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">Nouveau mouvement de stock</h1>}>
            <Head title="Nouveau mouvement de stock" />

            <div className="mx-auto max-w-2xl">
                <form onSubmit={submit} className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <label htmlFor="shop_id" className="block text-sm font-medium text-slate-200">
                                Boutique *
                            </label>
                            <select
                                id="shop_id"
                                value={data.shop_id}
                                disabled
                                className="mt-1 block w-full rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2 text-slate-400 cursor-not-allowed"
                            >
                                {shops.map((shop) => (
                                    <option key={shop.id} value={shop.id}>
                                        {shop.name}
                                    </option>
                                ))}
                            </select>
                            <p className="mt-1 text-xs text-slate-400">
                                Boutique sélectionnée via le switcher
                            </p>
                            {errors.shop_id && <p className="mt-1 text-sm text-red-400">{errors.shop_id}</p>}
                        </div>

                        <div>
                            <label htmlFor="type" className="block text-sm font-medium text-slate-200">
                                Type de mouvement *
                            </label>
                            <select
                                id="type"
                                value={data.type}
                                onChange={(e) => setData('type', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200"
                            >
                                <option value="in">Entrée (+)</option>
                                <option value="out">Sortie (-)</option>
                                <option value="transfer">Transfert</option>
                                <option value="adjustment">Ajustement</option>
                            </select>
                            {errors.type && <p className="mt-1 text-sm text-red-400">{errors.type}</p>}
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-200">
                                Produit *
                            </label>

                            {/* Combobox recherche produit */}
                            <div ref={comboRef} className="relative mt-1">

                                {/* Produit sélectionné */}
                                {selectedProduct && !dropdownOpen ? (
                                    <div className="flex items-center justify-between rounded-lg border border-amber-500/50 bg-slate-900/70 px-3 py-2">
                                        <div>
                                            <span className="text-sm font-medium text-slate-200">
                                                {selectedProduct.name}
                                            </span>
                                            {selectedProduct.sku && (
                                                <span className="ml-2 text-xs text-slate-400">
                                                    ({selectedProduct.sku})
                                                </span>
                                            )}
                                            <span className="ml-2 text-xs text-slate-500">
                                                — Stock : {selectedProduct.stock_quantity} u.
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => setDropdownOpen(true)}
                                                className="rounded p-1 text-slate-400 hover:text-white transition-colors"
                                                title="Changer de produit"
                                            >
                                                <ChevronDown className="h-4 w-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={clearProduct}
                                                className="rounded p-1 text-slate-400 hover:text-red-400 transition-colors"
                                                title="Supprimer"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* Champ de recherche */
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        <input
                                            type="text"
                                            value={productSearch}
                                            onChange={(e) => {
                                                setProductSearch(e.target.value);
                                                setDropdownOpen(true);
                                            }}
                                            onFocus={() => setDropdownOpen(true)}
                                            placeholder="Rechercher par nom ou SKU..."
                                            className="w-full rounded-lg border border-white/15 bg-slate-900/70 pl-9 pr-3 py-2 text-slate-200 placeholder-slate-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                                            autoComplete="off"
                                        />
                                    </div>
                                )}

                                {/* Liste déroulante */}
                                {dropdownOpen && (
                                    <div className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-white/15 bg-slate-900 shadow-2xl">
                                        {filteredProducts.length === 0 ? (
                                            <div className="px-4 py-3 text-sm text-slate-500 text-center">
                                                Aucun produit trouvé
                                            </div>
                                        ) : (
                                            filteredProducts.map((product) => (
                                                <button
                                                    key={product.id}
                                                    type="button"
                                                    onClick={() => selectProduct(product)}
                                                    className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 ${
                                                        data.product_id === product.id.toString()
                                                            ? 'bg-amber-500/10 text-amber-300'
                                                            : 'text-slate-200'
                                                    }`}
                                                >
                                                    <div>
                                                        <span className="font-medium">{product.name}</span>
                                                        {product.sku && (
                                                            <span className="ml-2 text-xs text-slate-400">
                                                                {product.sku}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                                        product.stock_quantity <= 0
                                                            ? 'bg-red-500/15 text-red-400'
                                                            : product.stock_quantity <= 5
                                                            ? 'bg-orange-500/15 text-orange-400'
                                                            : 'bg-emerald-500/15 text-emerald-400'
                                                    }`}>
                                                        {product.stock_quantity} u.
                                                    </span>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            {errors.product_id && (
                                <p className="mt-1 text-sm text-red-400">{errors.product_id}</p>
                            )}

                            {selectedProduct && (
                                <div className="mt-2 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
                                    <p className="text-sm text-blue-300">
                                        <span className="font-medium">Stock actuel :</span>{' '}
                                        {selectedProduct.stock_quantity} unités
                                    </p>
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="quantity" className="block text-sm font-medium text-slate-200">
                                Quantité * {data.type === 'out' ? '(sera soustraite)' : '(sera ajoutée)'}
                            </label>
                            <input
                                type="number"
                                id="quantity"
                                value={data.quantity}
                                onChange={(e) => setData('quantity', Number(e.target.value))}
                                className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200"
                                min="1"
                            />
                            {errors.quantity && <p className="mt-1 text-sm text-red-400">{errors.quantity}</p>}
                        </div>

                        <div>
                            <label htmlFor="unit_cost" className="block text-sm font-medium text-slate-200">
                                Coût unitaire (DH)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                id="unit_cost"
                                value={data.unit_cost}
                                onChange={(e) => setData('unit_cost', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200"
                                placeholder="0.00"
                            />
                            {errors.unit_cost && <p className="mt-1 text-sm text-red-400">{errors.unit_cost}</p>}
                        </div>

                        <div>
                            <label htmlFor="movement_date" className="block text-sm font-medium text-slate-200">
                                Date du mouvement *
                            </label>
                            <input
                                type="date"
                                id="movement_date"
                                value={data.movement_date}
                                onChange={(e) => setData('movement_date', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200"
                            />
                            {errors.movement_date && <p className="mt-1 text-sm text-red-400">{errors.movement_date}</p>}
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
                                placeholder="Raison du mouvement, détails..."
                            />
                            {errors.notes && <p className="mt-1 text-sm text-red-400">{errors.notes}</p>}
                        </div>
                    </div>

                    {selectedProduct && (
                        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                            <p className="text-sm font-medium text-amber-300">
                                Nouveau stock prévisionnel: {' '}
                                <span className="text-lg font-bold">
                                    {data.type === 'in' || data.type === 'adjustment' 
                                        ? selectedProduct.stock_quantity + (data.quantity || 0)
                                        : selectedProduct.stock_quantity - (data.quantity || 0)
                                    } unités
                                </span>
                            </p>
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
                        <Link
                            href={route('stocks.index')}
                            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/5"
                        >
                            Annuler
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-amber-300 px-6 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50"
                        >
                            {processing ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
