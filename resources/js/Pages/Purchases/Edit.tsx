import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState, useMemo, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Trash2, Save, ShoppingCart, Package, Search, X, ChevronDown } from 'lucide-react';
import { useRoute } from '@/utils/route';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import { useLocale } from '@/contexts/LocaleContext';

interface Supplier {
    id: number;
    name: string;
    company_name: string | null;
}

interface Category {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    sku: string | null;
    purchase_price: string;
    category: Category | null;
}

interface PurchaseItem {
    product_id: number | string;
    quantity: number | string;
    unit_price: number | string;
    notes: string;
}

interface ExistingPurchaseItem {
    id: number;
    product_id: number;
    quantity_ordered: number;
    unit_price: string;
    tax_rate: string;
    discount_rate: string;
    notes: string | null;
}

interface Purchase {
    id: number;
    supplier_id: number;
    order_date: string;
    expected_date: string | null;
    shipping_cost: string;
    notes: string | null;
    internal_notes: string | null;
    items: ExistingPurchaseItem[];
}

interface Props {
    code_user: string;
    suppliers: Supplier[];
    products: Product[];
    currency: string;
    purchase: Purchase;
}

// ── Combobox produit réutilisable par ligne ───────────────────────────────────
function PurchaseProductCombobox({
    products,
    value,
    onChange,
    usedIds = [],
}: {
    products: Product[];
    value: number | string;
    onChange: (id: string) => void;
    usedIds?: (number | string)[];
}) {
    const [search, setSearch] = useState('');
    const [open, setOpen]     = useState(false);
    const ref                 = useRef<HTMLDivElement>(null);

    const selected = products.find((p) => p.id === Number(value));

    const filtered = products.filter((p) => {
        const q = search.toLowerCase();
        return (
            p.name.toLowerCase().includes(q) ||
            (p.sku ?? '').toLowerCase().includes(q) ||
            (p.category?.name ?? '').toLowerCase().includes(q)
        );
    });

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const select = (product: Product) => {
        onChange(product.id.toString());
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
                <div className="mt-1 flex items-center justify-between rounded-lg border border-amber-300/40 bg-slate-900 px-3 py-2">
                    <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-white">{selected.name}</span>
                        {selected.sku && (
                            <span className="ml-2 text-xs text-slate-400">({selected.sku})</span>
                        )}
                        {selected.category && (
                            <span className="ml-2 text-xs text-slate-500">{selected.category.name}</span>
                        )}
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
                <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
                        onFocus={() => setOpen(true)}
                        placeholder="Rechercher par nom, SKU ou catégorie..."
                        className="w-full rounded-lg border-slate-700 bg-slate-900 pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                        autoComplete="off"
                    />
                </div>
            )}

            {/* Dropdown */}
            {open && (
                <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-white/10 bg-slate-900 shadow-2xl">
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
                                    className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm border-b border-white/5 last:border-0 transition-colors ${
                                        product.id === Number(value)
                                            ? 'bg-amber-300/10 text-amber-300'
                                            : isUsed
                                            ? 'opacity-40 cursor-not-allowed text-slate-400'
                                            : 'text-white hover:bg-white/5'
                                    }`}
                                >
                                    <div>
                                        <span className="font-medium">{product.name}</span>
                                        {product.sku && (
                                            <span className="ml-2 text-xs text-slate-400">{product.sku}</span>
                                        )}
                                        {product.category && (
                                            <span className="ml-2 text-xs text-slate-500">
                                                — {product.category.name}
                                            </span>
                                        )}
                                        {isUsed && (
                                            <span className="ml-2 text-xs text-slate-500 italic">déjà ajouté</span>
                                        )}
                                    </div>
                                    <span className="ml-3 shrink-0 text-xs text-slate-400">
                                        {parseFloat(product.purchase_price) > 0
                                            ? `${parseFloat(product.purchase_price).toFixed(2)}`
                                            : '—'}
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

export default function PurchasesEdit({ code_user, suppliers, products, currency, purchase }: Props) {
    const { t } = useLocale();
    const route = useRoute();

    // Initialiser les items à partir du bon de commande existant
    const initialItems: PurchaseItem[] = purchase.items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity_ordered,
        unit_price: parseFloat(item.unit_price),
        notes: item.notes || '',
    }));

    const [items, setItems] = useState<PurchaseItem[]>(initialItems);

    const { data, setData, put, processing, errors} = useForm({
        supplier_id: purchase.supplier_id.toString(),
        order_date: purchase.order_date,
        expected_date: purchase.expected_date || '',
        shipping_cost: parseFloat(purchase.shipping_cost),
        tax_rate: parseFloat(purchase.items[0]?.tax_rate || '0'),
        discount_rate: parseFloat(purchase.items[0]?.discount_rate || '0'),
        notes: purchase.notes || '',
        internal_notes: purchase.internal_notes || '',
        items: items,
    });

    const addItem = () => {
        setItems((prev) => [
            ...prev,
            {
                product_id: '',
                quantity: 1,
                unit_price: 0,
                notes: '',
            },
        ]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems((prev) => prev.filter((_, i) => i !== index));
        }
    };

    const updateItem = (index: number, field: keyof PurchaseItem, value: string | number) => {
        setItems((prev) =>
            prev.map((item, i) => {
                if (i !== index) return item;

                const updated = { ...item, [field]: value };

                // Auto-remplir le prix si un produit est sélectionné
                if (field === 'product_id' && value) {
                    const product = products.find((p) => p.id === Number(value));
                    if (product) {
                        updated.unit_price = parseFloat(product.purchase_price);
                    }
                }

                return updated;
            })
        );
    };

    // Calculer le total d'une ligne
    const calculateLineTotal = (item: PurchaseItem): number => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.unit_price) || 0;
        return qty * price;
    };

    // Calculer les totaux globaux
    const totals = useMemo(() => {
        const subtotal = items.reduce((sum, item) => {
            const qty = Number(item.quantity) || 0;
            const price = Number(item.unit_price) || 0;
            return sum + qty * price;
        }, 0);

        const discountRate = Number(data.discount_rate) || 0;
        const totalDiscount = subtotal * (discountRate / 100);

        const subtotalAfterDiscount = subtotal - totalDiscount;

        const taxRate = Number(data.tax_rate) || 0;
        const totalTax = subtotalAfterDiscount * (taxRate / 100);

        const shipping = Number(data.shipping_cost) || 0;
        const grandTotal = subtotalAfterDiscount + totalTax + shipping;

        return {
            subtotal,
            totalDiscount,
            totalTax,
            shipping,
            grandTotal,
        };
    }, [items, data.shipping_cost, data.tax_rate, data.discount_rate]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        
        // Mettre à jour les items dans data avant de soumettre
        data.items = items;
        
        put(route('purchases.update', { code_user, purchase: purchase.id }));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Modifier le bon de commande" />

            <div className="space-y-6">
                {/* En-tête */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('purchases.show', { code_user, purchase: purchase.id })}
                            className="rounded-lg p-2 transition hover:bg-white/5"
                        >
                            <ArrowLeft className="size-5 text-slate-400" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Modifier le bon de commande</h1>
                            <p className="mt-1 text-sm text-slate-400">
                                Modifiez les informations du bon de commande
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    {/* Section 1: Informations générales */}
                    <div className="rounded-xl bg-slate-800/50 p-6">
                        <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-white">
                            <ShoppingCart className="size-5 text-amber-300" />
                            Informations générales
                        </h2>

                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Fournisseur */}
                            <div>
                                <InputLabel htmlFor="supplier_id" value={t.purchases.form.supplier} />
                                <select
                                    id="supplier_id"
                                    value={data.supplier_id}
                                    onChange={(e) => setData('supplier_id', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border-white/10 bg-slate-900/50 text-white shadow-sm focus:border-amber-300 focus:ring-amber-300"
                                >
                                    <option value="">Sélectionnez un fournisseur</option>
                                    {suppliers.map((supplier) => (
                                        <option key={supplier.id} value={supplier.id}>
                                            {supplier.name}
                                            {supplier.company_name && ` - ${supplier.company_name}`}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.supplier_id} className="mt-2" />
                            </div>

                            {/* Date de commande */}
                            <div>
                                <InputLabel htmlFor="order_date" value={t.purchases.form.orderDate} />
                                <TextInput
                                    id="order_date"
                                    type="date"
                                    value={data.order_date}
                                    onChange={(e) => setData('order_date', e.target.value)}
                                    className="mt-1 block w-full"
                                />
                                <InputError message={errors.order_date} className="mt-2" />
                            </div>

                            {/* Date de livraison prévue */}
                            <div>
                                <InputLabel htmlFor="expected_date" value={t.purchases.form.expectedDate} />
                                <TextInput
                                    id="expected_date"
                                    type="date"
                                    value={data.expected_date}
                                    onChange={(e) => setData('expected_date', e.target.value)}
                                    className="mt-1 block w-full"
                                />
                                <InputError message={errors.expected_date} className="mt-2" />
                            </div>

                            {/* Frais de port */}
                            <div>
                                <InputLabel htmlFor="shipping_cost" value="Frais de port" />
                                <TextInput
                                    id="shipping_cost"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.shipping_cost}
                                    onChange={(e) =>
                                        setData('shipping_cost', parseFloat(e.target.value) || 0)
                                    }
                                    className="mt-1 block w-full"
                                />
                                <InputError message={errors.shipping_cost} className="mt-2" />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Articles */}
                    <div className="rounded-xl bg-slate-800/50 p-6">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                                <Package className="size-5 text-amber-300" />
                                Articles
                            </h2>
                            <button
                                type="button"
                                onClick={addItem}
                                className="inline-flex items-center gap-2 rounded-lg bg-amber-300/10 px-4 py-2 text-sm font-semibold text-amber-300 transition hover:bg-amber-300/20"
                            >
                                <Plus className="size-4" />
                                Ajouter un article
                            </button>
                        </div>

                        <div className="space-y-4">
                            {items.map((item, index) => (
                                <div
                                    key={index}
                                    className="rounded-lg border border-white/10 bg-slate-900/50 p-4"
                                >
                                    <div className="mb-3 flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-300">
                                            Article {index + 1}
                                        </span>
                                        {items.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="rounded-lg p-1.5 text-red-400 transition hover:bg-red-500/10"
                                            >
                                                <Trash2 className="size-4" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-6">
                                        {/* Produit */}
                                        <div className="md:col-span-2">
                                            <InputLabel value="Produit *" />
                                            <PurchaseProductCombobox
                                                products={products}
                                                value={item.product_id}
                                                onChange={(id) => updateItem(index, 'product_id', id)}
                                                usedIds={items.map((it) => Number(it.product_id)).filter(Boolean)}
                                            />
                                            <InputError
                                                message={errors[`items.${index}.product_id`]}
                                                className="mt-2"
                                            />
                                        </div>

                                        {/* Quantité */}
                                        <div>
                                            <InputLabel value="Qté *" />
                                            <TextInput
                                                type="number"
                                                min="1"
                                                step="1"
                                                value={item.quantity}
                                                onChange={(e) =>
                                                    updateItem(index, 'quantity', e.target.value)
                                                }
                                                className="mt-1 block w-full"
                                            />
                                            <InputError
                                                message={errors[`items.${index}.quantity`]}
                                                className="mt-2"
                                            />
                                        </div>

                                        {/* Prix unitaire */}
                                        <div>
                                            <InputLabel value="Prix unitaire *" />
                                            <TextInput
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.unit_price}
                                                onChange={(e) =>
                                                    updateItem(index, 'unit_price', e.target.value)
                                                }
                                                className="mt-1 block w-full"
                                            />
                                            <InputError
                                                message={errors[`items.${index}.unit_price`]}
                                                className="mt-2"
                                            />
                                        </div>
                                    </div>

                                    {/* Notes de ligne */}
                                    <div className="mt-3">
                                        <InputLabel value="Notes (optionnel)" />
                                        <textarea
                                            value={item.notes}
                                            onChange={(e) => updateItem(index, 'notes', e.target.value)}
                                            rows={2}
                                            className="mt-1 block w-full rounded-lg border-white/10 bg-slate-900/50 text-white shadow-sm focus:border-amber-300 focus:ring-amber-300"
                                        />
                                    </div>

                                    {/* Total de la ligne */}
                                    <div className="mt-3 flex justify-end">
                                        <div className="text-right">
                                            <span className="text-xs text-slate-400">Total ligne:</span>
                                            <div className="text-lg font-semibold text-amber-300">
                                                {formatCurrency(calculateLineTotal(item))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section 3: Récapitulatif */}
                    <div className="rounded-xl bg-slate-800/50 p-6">
                        <h2 className="mb-6 text-lg font-semibold text-white">Récapitulatif</h2>

                        <div className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Sous-total:</span>
                                <span className="font-medium text-white">
                                    {formatCurrency(totals.subtotal)}
                                </span>
                            </div>

                            {/* Remise globale */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <InputLabel htmlFor="discount_rate" value="Remise globale (%)" />
                                    <TextInput
                                        id="discount_rate"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        value={data.discount_rate}
                                        onChange={(e) => setData('discount_rate', parseFloat(e.target.value) || 0)}
                                        className="mt-1 block w-full"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Montant remise:</span>
                                <span className="font-medium text-white">
                                    -{formatCurrency(totals.totalDiscount)}
                                </span>
                            </div>

                            {/* Taxe globale */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <InputLabel htmlFor="tax_rate" value="Taxe globale (%)" />
                                    <TextInput
                                        id="tax_rate"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        value={data.tax_rate}
                                        onChange={(e) => setData('tax_rate', parseFloat(e.target.value) || 0)}
                                        className="mt-1 block w-full"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Montant taxes:</span>
                                <span className="font-medium text-white">
                                    {formatCurrency(totals.totalTax)}
                                </span>
                            </div>

                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Frais de port:</span>
                                <span className="font-medium text-white">
                                    {formatCurrency(totals.shipping)}
                                </span>
                            </div>

                            <div className="border-t border-white/10 pt-3">
                                <div className="flex justify-between">
                                    <span className="text-lg font-semibold text-white">Total général:</span>
                                    <span className="text-2xl font-bold text-amber-300">
                                        {formatCurrency(totals.grandTotal)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Notes */}
                    <div className="rounded-xl bg-slate-800/50 p-6">
                        <h2 className="mb-6 text-lg font-semibold text-white">Notes</h2>

                        <div className="space-y-6">
                            {/* Notes publiques */}
                            <div>
                                <InputLabel htmlFor="notes" value="Notes (visibles sur le document)" />
                                <textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={3}
                                    className="mt-1 block w-full rounded-lg border-white/10 bg-slate-900/50 text-white shadow-sm focus:border-amber-300 focus:ring-amber-300"
                                    placeholder="Notes qui apparaîtront sur le bon de commande..."
                                />
                            </div>

                            {/* Notes internes */}
                            <div>
                                <InputLabel
                                    htmlFor="internal_notes"
                                    value="Notes internes (usage interne uniquement)"
                                />
                                <textarea
                                    id="internal_notes"
                                    value={data.internal_notes}
                                    onChange={(e) => setData('internal_notes', e.target.value)}
                                    rows={3}
                                    className="mt-1 block w-full rounded-lg border-white/10 bg-slate-900/50 text-white shadow-sm focus:border-amber-300 focus:ring-amber-300"
                                    placeholder="Notes privées, non visibles sur le document..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <Link
                            href={route('purchases.show', { code_user, purchase: purchase.id })}
                            className="inline-flex items-center rounded-lg border border-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
                        >
                            Annuler
                        </Link>
                        <PrimaryButton disabled={processing} className="gap-2">
                            <Save className="size-4" />
                            {processing ? 'Enregistrement...' : 'Enregistrer les modifications'}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
