import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Search, X, ChevronDown } from 'lucide-react';
import { useRoute } from '@/utils/route';
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
    defective_stock_quantity: number;
    purchase_price: number;
    sold_since_last_inventory: number;
    purchased_since_last_inventory: number;
    shop: Shop;
}

interface InventoryItem {
    product_id: number | string;
    counted_quantity: number | string;
    defective_quantity: number | string;
}

interface Props {
    shops: Shop[];
    products: Product[];
}

// ── Combobox produit réutilisable par ligne ───────────────────────────────────
function ProductCombobox({
    products,
    value,
    onChange,
    usedIds = [],
}: {
    products: Product[];
    value: number | string;
    onChange: (id: number | string) => void;
    usedIds?: (number | string)[];
}) {
    const [search, setSearch]       = useState('');
    const [open, setOpen]           = useState(false);
    const ref                       = useRef<HTMLDivElement>(null);

    const selected = products.find((p) => p.id === Number(value));

    const filtered = products.filter((p) => {
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q) || (p.sku ?? '').toLowerCase().includes(q);
    });

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const select = (product: Product) => {
        onChange(product.id);
        setSearch('');
        setOpen(false);
    };

    const clear = () => {
        onChange('');
        setSearch('');
    };

    return (
        <div ref={ref} className="relative">
            {selected && !open ? (
                /* Produit sélectionné */
                <div className="flex items-center justify-between rounded-lg border border-amber-500/50 bg-slate-950/70 px-3 py-2">
                    <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-slate-200">{selected.name}</span>
                        {selected.sku && (
                            <span className="ml-2 text-xs text-slate-400">({selected.sku})</span>
                        )}
                        <span className="ml-2 text-xs text-slate-500">
                            — Stock : {selected.stock_quantity} u.
                        </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 pl-2">
                        <button
                            type="button"
                            onClick={() => setOpen(true)}
                            className="rounded p-1 text-slate-400 hover:text-white transition-colors"
                            title="Changer"
                        >
                            <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={clear}
                            className="rounded p-1 text-slate-400 hover:text-red-400 transition-colors"
                            title="Effacer"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            ) : (
                /* Champ de recherche */
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
                        onFocus={() => setOpen(true)}
                        placeholder="Rechercher par nom ou SKU..."
                        className="w-full rounded-lg border border-white/15 bg-slate-950/70 pl-8 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                        autoComplete="off"
                    />
                </div>
            )}

            {/* Dropdown */}
            {open && (
                <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-white/15 bg-slate-900 shadow-2xl">
                    {filtered.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-slate-500 text-center">
                            Aucun produit trouvé
                        </div>
                    ) : (
                        filtered.map((product) => {
                            const isUsed = usedIds.includes(product.id) && product.id !== Number(value);
                            return (
                                <button
                                    key={product.id}
                                    type="button"
                                    onClick={() => !isUsed && select(product)}
                                    disabled={isUsed}
                                    className={`w-full flex items-center justify-between px-4 py-2 text-left text-sm border-b border-white/5 last:border-0 transition-colors ${
                                        product.id === Number(value)
                                            ? 'bg-amber-500/10 text-amber-300'
                                            : isUsed
                                            ? 'opacity-40 cursor-not-allowed text-slate-400'
                                            : 'text-slate-200 hover:bg-white/5'
                                    }`}
                                >
                                    <div>
                                        <span className="font-medium">{product.name}</span>
                                        {product.sku && (
                                            <span className="ml-2 text-xs text-slate-400">{product.sku}</span>
                                        )}
                                        {isUsed && (
                                            <span className="ml-2 text-xs text-slate-500 italic">déjà ajouté</span>
                                        )}
                                    </div>
                                    <span className={`ml-3 shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                                        product.stock_quantity <= 0
                                            ? 'bg-red-500/15 text-red-400'
                                            : product.stock_quantity <= 5
                                            ? 'bg-orange-500/15 text-orange-400'
                                            : 'bg-emerald-500/15 text-emerald-400'
                                    }`}>
                                        {product.stock_quantity} u.
                                    </span>
                                </button>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function InventoryCreate({ shops, products }: Props) {
    const { t } = useLocale();
    const route = useRoute();

    const { props } = usePage();
    const activeShop = props.activeShop as { id: number; name: string } | null;
    
    const [items, setItems] = useState<InventoryItem[]>([
        { product_id: '', counted_quantity: '', defective_quantity: '' },
    ]);

    const { data, setData, post, processing, errors } = useForm({
        shop_id: activeShop?.id.toString() || shops[0]?.id.toString() || '',
        inventory_date: new Date().toISOString().split('T')[0],
        notes: '',
        items: items,
    });

    const addItem = () => {
        setItems([...items, { product_id: '', counted_quantity: '', defective_quantity: '' }]);
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
                                    {t.common.form.shopField}
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
                                <label htmlFor="inventory_date" className="block text-sm font-medium text-slate-200">
                                    {t.inventory.form.date}
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
                            <div className="md:col-span-5">
                                                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                                    Produit #{index + 1} *
                                                </label>
                                                <ProductCombobox
                                                    products={products}
                                                    value={item.product_id}
                                                    onChange={(id) => updateItem(index, 'product_id', id)}
                                                    usedIds={items.map((it) => Number(it.product_id)).filter(Boolean)}
                                                />
                                            </div>

                                            <div className="md:col-span-3">
                                                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                                    Bons comptés *
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

                                            <div className="md:col-span-3">
                                                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                                    Défectueuses
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={item.defective_quantity}
                                                    onChange={(e) => updateItem(index, 'defective_quantity', e.target.value)}
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
                                                <div className="grid grid-cols-2 gap-4 md:grid-cols-5 text-sm">
                                                    <div>
                                                        <p className="text-xs text-slate-400 mb-0.5">Stock système</p>
                                                        <p className="font-semibold text-blue-300">
                                                            {selectedProduct.stock_quantity}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-400 mb-0.5">Défectueux</p>
                                                        <p className="font-semibold text-blue-300">
                                                            {selectedProduct.defective_stock_quantity}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-400 mb-0.5">Vendu</p>
                                                        <p className="font-semibold text-orange-300">
                                                            {selectedProduct.sold_since_last_inventory}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-400 mb-0.5">Acheté</p>
                                                        <p className="font-semibold text-green-300">
                                                            {selectedProduct.purchased_since_last_inventory}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-400 mb-0.5">Écart</p>
                                                        <p
                                                            className={`font-semibold ${
                                                                ((Number(item.counted_quantity || 0) + Number(item.defective_quantity || 0)) - selectedProduct.stock_quantity) > 0
                                                                    ? 'text-green-400'
                                                                    : ((Number(item.counted_quantity || 0) + Number(item.defective_quantity || 0)) - selectedProduct.stock_quantity) < 0
                                                                    ? 'text-red-400'
                                                                    : 'text-slate-400'
                                                            }`}
                                                        >
                                                            {((Number(item.counted_quantity || 0) + Number(item.defective_quantity || 0)) - selectedProduct.stock_quantity) > 0 ? '+' : ''}
                                                            {(Number(item.counted_quantity || 0) + Number(item.defective_quantity || 0)) - selectedProduct.stock_quantity}
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
