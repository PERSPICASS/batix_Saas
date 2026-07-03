import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, Plus, Search, Trash2, X } from 'lucide-react';
import { FormEventHandler, KeyboardEvent as ReactKeyboardEvent, useEffect, useMemo, useState } from 'react';
import Modal from '@/Components/Modal';
import { useLocale } from '@/contexts/LocaleContext';
import InputError from '@/Components/InputError';

interface Shop {
    id: number;
    name: string;
}

interface Customer {
    id: number;
    name: string;
    email: string;
    phone: string;
}

interface Product {
    id: number;
    name: string;
    sku: string;
    selling_price: string;
    has_variations: boolean;
    variations: Array<{
        id: number;
        name: string;
        sku: string;
        selling_price: string;
        has_variations: boolean;
        variations: [];
    }>;
}

interface Props {
    shops: Shop[];
    customers: Customer[];
    products: Product[];
}

interface PreorderItem {
    product_id: number | string;
    product_name: string;
    quantity_ordered: number;
    unit_price: number;
    expected_delivery_date: string;
    deposit_amount: number;
}

const emptyItem = (): PreorderItem => ({
    product_id: '',
    product_name: '',
    quantity_ordered: 1,
    unit_price: 0,
    expected_delivery_date: '',
    deposit_amount: 0,
});

export default function Create({ shops, customers, products }: Props) {
    const { t } = useLocale();

    const [items, setItems] = useState<PreorderItem[]>([emptyItem()]);
    const [showProductModal, setShowProductModal] = useState(false);
    const [productSearch, setProductSearch] = useState('');
    const [activeProductIndex, setActiveProductIndex] = useState(-1);
    const [productTargetLine, setProductTargetLine] = useState<number | null>(null);

    const { data, setData, post, processing, errors } = useForm({
        shop_id: shops[0]?.id || '',
        customer_id: '',
        notes: '',
        items: items as any[],
    });

    const addItem = () => setItems((prev) => [...prev, emptyItem()]);

    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems((prev) => prev.filter((_, i) => i !== index));
        }
    };

    const updateItem = (index: number, field: keyof PreorderItem, value: string | number) => {
        setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
    };

    const openProductModal = (lineIndex: number) => {
        setProductTargetLine(lineIndex);
        setProductSearch('');
        setShowProductModal(true);
    };

    const selectProduct = (product: Product, parent?: Product) => {
        if (productTargetLine === null) return;
        setItems((prev) =>
            prev.map((item, i) =>
                i === productTargetLine
                    ? {
                          ...item,
                          product_id: product.id,
                          product_name: parent ? `${parent.name} › ${product.name}` : product.name,
                          unit_price: parseFloat(product.selling_price) || 0,
                      }
                    : item,
            ),
        );
        setShowProductModal(false);
    };

    const filteredProducts = useMemo(() => {
        const term = productSearch.trim().toLowerCase();
        if (!term) return products;
        return products.filter(
            (product) =>
                product.name.toLowerCase().includes(term) ||
                product.sku?.toLowerCase().includes(term) ||
                product.variations?.some(
                    (v) => v.name.toLowerCase().includes(term) || v.sku?.toLowerCase().includes(term),
                ),
        );
    }, [products, productSearch]);

    useEffect(() => {
        if (!showProductModal) {
            setActiveProductIndex(-1);
            return;
        }
        setActiveProductIndex(filteredProducts.length > 0 ? 0 : -1);
    }, [showProductModal, filteredProducts.length, productSearch]);

    const handleProductSearchKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
        if (!showProductModal || filteredProducts.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveProductIndex((prev) => (prev < filteredProducts.length - 1 ? prev + 1 : 0));
            return;
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveProductIndex((prev) => (prev > 0 ? prev - 1 : filteredProducts.length - 1));
            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            if (activeProductIndex >= 0) {
                selectProduct(filteredProducts[activeProductIndex]);
            }
            return;
        }

        if (e.key === 'Escape') {
            e.preventDefault();
            setShowProductModal(false);
        }
    };

    const totalAmount = items.reduce((sum, item) => sum + item.quantity_ordered * item.unit_price, 0);
    const totalDeposit = items.reduce((sum, item) => sum + (item.deposit_amount || 0), 0);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        data.items = items;
        post(route('preorders.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <a
                        href={route('preorders.index')}
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition"
                    >
                        <ArrowLeft className="size-4" />
                    </a>
                    <h2 className="text-xl font-semibold text-white">{t.preorders.form.pageTitle}</h2>
                </div>
            }
        >
            <Head title={t.preorders.form.headTitle} />

            <div className="max-w-3xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Boutique et client */}
                    <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6 grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                {t.preorders.form.shop}
                            </label>
                            <select
                                value={data.shop_id}
                                onChange={(e) => setData('shop_id', e.target.value)}
                                className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-white focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                required
                            >
                                <option value="">{t.preorders.form.selectShop}</option>
                                {shops.map((shop) => (
                                    <option key={shop.id} value={shop.id}>
                                        {shop.name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.shop_id} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                {t.preorders.form.customer}
                            </label>
                            <select
                                value={data.customer_id}
                                onChange={(e) => setData('customer_id', e.target.value)}
                                className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-white focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                required
                            >
                                <option value="">{t.preorders.form.selectCustomer}</option>
                                {customers.map((customer) => (
                                    <option key={customer.id} value={customer.id}>
                                        {customer.name} ({customer.phone || customer.email})
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.customer_id} />
                        </div>
                    </div>

                    {/* Produits */}
                    <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-200">{t.preorders.form.productsSectionTitle}</h3>
                            <button
                                type="button"
                                onClick={addItem}
                                className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-white/10"
                            >
                                <Plus className="size-3.5" /> {t.preorders.form.addProduct}
                            </button>
                        </div>

                        <div className="space-y-3">
                            {items.map((item, index) => {
                                const lineTotal = item.quantity_ordered * item.unit_price;
                                const lineRemaining = lineTotal - (item.deposit_amount || 0);

                                return (
                                    <div key={index} className="rounded-xl border border-white/10 bg-slate-950/40 p-4 space-y-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 space-y-1">
                                                <label className="text-xs text-slate-400">{t.preorders.form.product(index + 1)}</label>
                                                <button
                                                    type="button"
                                                    onClick={() => openProductModal(index)}
                                                    className="flex h-10 w-full items-center justify-between rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-left text-sm text-slate-200 transition hover:border-amber-300/40"
                                                >
                                                    <span>{item.product_name || t.preorders.form.selectProduct}</span>
                                                    <span className="text-xs text-slate-400">{t.common.actions.open}</span>
                                                </button>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                disabled={items.length === 1}
                                                className="mt-6 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-rose-300/30 text-rose-200 transition hover:bg-rose-300/10 disabled:cursor-not-allowed disabled:opacity-30"
                                            >
                                                <Trash2 className="size-4" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                            <div>
                                                <label className="text-xs text-slate-400">{t.preorders.form.quantity}</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity_ordered}
                                                    onChange={(e) => updateItem(index, 'quantity_ordered', parseInt(e.target.value) || 1)}
                                                    className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-slate-800/50 px-3 text-sm text-white focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-400">{t.preorders.form.unitPrice}</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={item.unit_price}
                                                    onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                                    className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-slate-800/50 px-3 text-sm text-white focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-400">{t.preorders.form.deliveryDate}</label>
                                                <input
                                                    type="date"
                                                    value={item.expected_delivery_date}
                                                    onChange={(e) => updateItem(index, 'expected_delivery_date', e.target.value)}
                                                    className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-slate-800/50 px-3 text-sm text-white focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-400">{t.preorders.form.deposit}</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={item.deposit_amount}
                                                    onChange={(e) => updateItem(index, 'deposit_amount', parseFloat(e.target.value) || 0)}
                                                    className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-slate-800/50 px-3 text-sm text-white focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                                />
                                            </div>
                                        </div>

                                        {lineTotal > 0 && (
                                            <div className="flex justify-between border-t border-white/10 pt-2 text-xs text-slate-400">
                                                <span>{t.preorders.form.lineTotal} <span className="text-slate-200 font-medium">{lineTotal.toFixed(2)} FCFA</span></span>
                                                <span>{t.preorders.form.lineRemaining} <span className="text-amber-300 font-medium">{lineRemaining.toFixed(2)} FCFA</span></span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <InputError message={errors.items} />

                        {totalAmount > 0 && (
                            <div className="mt-4 border-t border-white/10 pt-4 space-y-1">
                                <div className="flex justify-between text-sm text-slate-300">
                                    <span>{t.preorders.form.totalAmount(items.length)}</span>
                                    <span className="font-semibold text-white">{totalAmount.toFixed(2)} FCFA</span>
                                </div>
                                <div className="flex justify-between text-sm text-slate-300">
                                    <span>{t.preorders.form.remaining}</span>
                                    <span className="font-semibold text-amber-300">{(totalAmount - totalDeposit).toFixed(2)} FCFA</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            {t.preorders.form.notes}
                        </label>
                        <textarea
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            rows={3}
                            className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-white placeholder-slate-500 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                            placeholder={t.preorders.form.notesPlaceholder}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <a
                            href={route('preorders.index')}
                            className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-center text-sm font-medium text-slate-300 hover:bg-white/5 transition"
                        >
                            {t.preorders.form.cancel}
                        </a>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50 transition"
                        >
                            {processing ? t.preorders.form.submitting : t.preorders.form.submit}
                        </button>
                    </div>
                </form>
            </div>

            {/* Sélecteur de produit — identique au formulaire de facture */}
            <Modal show={showProductModal} onClose={() => setShowProductModal(false)} maxWidth="md">
                <div className="h-[560px] bg-slate-950 p-5 text-slate-100">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-base font-semibold">{t.preorders.form.productModal.title}</h3>
                        <button
                            type="button"
                            onClick={() => setShowProductModal(false)}
                            className="rounded-md border border-white/15 p-1 text-slate-300 hover:bg-white/10"
                        >
                            <X className="size-4" />
                        </button>
                    </div>

                    <div className="mb-3 rounded-xl border border-amber-300/20 bg-gradient-to-r from-slate-900 to-slate-800 p-2">
                        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-900 px-3 py-2">
                            <Search className="size-4 text-amber-300" />
                            <input
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                                onKeyDown={handleProductSearchKeyDown}
                                placeholder={t.preorders.form.productModal.searchPlaceholder}
                                className="w-full !bg-transparent !text-slate-100 text-sm caret-amber-300 placeholder:text-slate-400 focus:outline-none"
                                autoFocus
                            />
                            {productSearch && (
                                <button
                                    type="button"
                                    onClick={() => setProductSearch('')}
                                    className="rounded-md p-1 text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
                                >
                                    <X className="size-3.5" />
                                </button>
                            )}
                        </div>
                        <div className="mt-2 flex items-center justify-between px-1 text-xs text-slate-400">
                            <span>{t.preorders.form.productModal.keyboardHint}</span>
                            <span>{t.preorders.form.productModal.results(filteredProducts.length)}</span>
                        </div>
                    </div>

                    <div className="h-[420px] space-y-1 overflow-y-auto rounded-lg border border-white/10 bg-slate-900/40 p-2">
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map((product, index) => (
                                <div key={product.id}>
                                    {product.has_variations && product.variations?.length > 0 ? (
                                        <div>
                                            <div className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-400">
                                                <span className="font-medium text-slate-300">{product.name}</span>
                                                <span className="rounded-full bg-amber-300/15 px-1.5 py-0.5 text-xs text-amber-400">
                                                    {t.preorders.form.productModal.variations(product.variations.length)}
                                                </span>
                                            </div>
                                            <div className="ml-3 space-y-0.5 border-l-2 border-amber-300/25 pl-2">
                                                {product.variations.map((variation) => (
                                                    <button
                                                        key={variation.id}
                                                        type="button"
                                                        onClick={() => selectProduct(variation as any, product)}
                                                        className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-left text-sm text-slate-200 transition hover:bg-white/10"
                                                    >
                                                        <span>{variation.name}</span>
                                                        <span className="text-xs text-amber-300">{variation.selling_price}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => selectProduct(product)}
                                            className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition ${
                                                activeProductIndex === index
                                                    ? 'bg-amber-300/25 text-amber-100 ring-1 ring-amber-300/40'
                                                    : 'text-slate-200 hover:bg-white/10'
                                            }`}
                                        >
                                            <span>{product.name}</span>
                                            <span className="text-xs text-amber-300">{product.selling_price}</span>
                                        </button>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="px-3 py-2 text-sm text-slate-400">{t.preorders.form.productModal.noResults}</p>
                        )}
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
