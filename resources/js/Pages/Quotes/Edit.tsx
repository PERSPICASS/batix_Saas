import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { FileText, Plus, Trash2, ArrowLeft, Calculator, Search, X } from 'lucide-react';
import { useState, useMemo, useEffect, KeyboardEvent as ReactKeyboardEvent, FormEventHandler } from 'react';
import { useRoute } from '@/utils/route';
import { useLocale } from '@/contexts/LocaleContext';
import Modal from '@/Components/Modal';
import Currency, { useShopSettings } from '@/Components/Currency';

interface Customer {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    selling_price: number;
}

interface QuoteItem {
    product_id: string | number;
    product_name: string;
    quantity: number;
    unit_price: number;
}

export default function EditQuote({ quote, customers, products }: { quote: any; customers: Customer[]; products: Product[] }) {
    const route = useRoute();
    const { currencySymbol } = useShopSettings();
    const [loading, setLoading] = useState(false);

    // Modal states
    const [showProductModal, setShowProductModal] = useState(false);
    const [productSearch, setProductSearch] = useState('');
    const [activeProductIndex, setActiveProductIndex] = useState(-1);
    const { t } = useLocale();
    const [productTargetLine, setProductTargetLine] = useState<number | null>(null);

    // Form states
    const [items, setItems] = useState<QuoteItem[]>(
        quote.items.map((item: any) => ({
            product_id: item.product_id,
            product_name: item.product.name,
            quantity: item.quantity,
            unit_price: parseFloat(item.unit_price),
        }))
    );

    const [formData, setFormData] = useState({
        quote_date: quote.quote_date,
        expiry_date: quote.expiry_date,
        notes: quote.notes || '',
        terms: quote.terms || '',
    });

    const filteredProducts = useMemo(() => {
        const term = productSearch.trim().toLowerCase();
        if (!term) return products;
        return products.filter((p) => p.name.toLowerCase().includes(term));
    }, [products, productSearch]);

    // Modal navigation
    useEffect(() => {
        if (!showProductModal) {
            setActiveProductIndex(-1);
            return;
        }
        setActiveProductIndex(filteredProducts.length > 0 ? 0 : -1);
    }, [showProductModal, filteredProducts.length, productSearch]);

    const selectProduct = (product: Product) => {
        if (productTargetLine === null) return;
        const newItems = [...items];
        newItems[productTargetLine] = {
            ...newItems[productTargetLine],
            product_id: product.id,
            product_name: product.name,
            unit_price: parseFloat(String(product.selling_price)),
        };
        setItems(newItems);
        setShowProductModal(false);
    };

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

    const handleAddItem = () => {
        setItems([...items, { product_id: '', product_name: '', quantity: 1, unit_price: 0 }]);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const tax = subtotal * 0.18;
    const total = subtotal + tax;

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        setLoading(true);

        const submitData: any = {
            ...formData,
            items: items.filter((item) => item.product_id),
        };

        router.put(route('quotes.update', { quote: quote.id }), submitData);
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">{t.quotes.actions.edit}</h1>}>
            <Head title={t.quotes.form.editTitle} />

            <form onSubmit={handleSubmit} className="grid gap-4 xl:grid-cols-3">
                <section className="space-y-4 xl:col-span-2">
                    {/* Informations */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <div className="mb-4 flex items-center gap-2 text-white">
                            <FileText className="size-5 text-amber-300" />
                            <h2 className="text-lg font-semibold">{t.quotes.form.quoteInfo}</h2>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-slate-200 mb-2">{t.quotes.form.customer}</label>
                                <div className="rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200">
                                    {quote.customer.name}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-200 mb-2">{t.quotes.form.quoteDate} *</label>
                                <input
                                    type="date"
                                    value={formData.quote_date}
                                    onChange={(e) => setFormData({ ...formData, quote_date: e.target.value })}
                                    className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-200 mb-2">{t.quotes.form.expiryDate} *</label>
                                <input
                                    type="date"
                                    value={formData.expiry_date}
                                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                                    className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Articles */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-white">
                                <Plus className="size-5 text-amber-300" />
                                <h2 className="text-lg font-semibold">{t.quotes.form.items}</h2>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-sm text-slate-200 transition-colors hover:bg-white/5"
                            >
                                <Plus className="size-3.5" />
                                {t.common.actions.add}
                            </button>
                        </div>

                        <div className="space-y-3">
                            {items.map((item, index) => (
                                <div key={index} className="flex gap-2 items-end">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setProductTargetLine(index);
                                            setShowProductModal(true);
                                        }}
                                        className="flex-1 rounded-lg border border-white/15 bg-gradient-to-r from-slate-900 to-slate-800 px-3 py-2 text-left text-slate-200 text-sm transition hover:border-amber-300/40"
                                    >
                                        {item.product_name || t.quotes.form.selectProduct}
                                    </button>

                                    <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                                        className="w-20 rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 text-sm focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                    />

                                    <input
                                        type="number"
                                        step="0.01"
                                        value={item.unit_price}
                                        onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value))}
                                        className="w-24 rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 text-sm focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                    />

                                    <div className="text-right w-28">
                                        <p className="font-semibold text-slate-200 text-sm">
                                            <Currency amount={item.quantity * item.unit_price} />
                                        </p>
                                    </div>

                                    {items.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem(index)}
                                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <h2 className="mb-4 text-lg font-semibold text-white">{t.quotes.form.notesAndTerms}</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-200 mb-2">{t.quotes.form.notes}</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows={2}
                                    className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 text-sm focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                    placeholder={t.quotes.form.notesPlaceholder}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-200 mb-2">{t.quotes.form.terms}</label>
                                <textarea
                                    value={formData.terms}
                                    onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                                    rows={2}
                                    className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 text-sm focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                    placeholder={t.quotes.form.termsPlaceholder}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Sidebar */}
                <aside className="xl:col-span-1">
                    <div className="sticky top-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                        <div className="mb-4 flex items-center gap-2 text-white">
                            <Calculator className="size-5 text-amber-300" />
                            <h2 className="text-lg font-semibold">{t.quotes.form.summary}</h2>
                        </div>

                        <div className="space-y-3 border-b border-white/10 pb-4 mb-4">
                            <div className="flex justify-between text-slate-200">
                                <span className="text-sm">{t.common.form.subtotal}:</span>
                                <span className="font-semibold"><Currency amount={subtotal} /></span>
                            </div>
                            <div className="flex justify-between text-slate-200">
                                <span className="text-sm">{t.quotes.form.taxLabel}:</span>
                                <span className="font-semibold"><Currency amount={tax} /></span>
                            </div>
                        </div>

                        <div className="flex justify-between mb-6">
                            <span className="font-semibold text-white">{t.common.form.total}:</span>
                            <span className="text-2xl font-bold text-amber-300"><Currency amount={total} /></span>
                        </div>

                        <div className="space-y-3">
                            <button
                                type="submit"
                                disabled={loading || items.every((i) => !i.product_id)}
                                className="w-full rounded-lg bg-amber-300 px-4 py-2.5 font-semibold text-slate-950 transition-colors hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? t.quotes.form.updating : t.quotes.form.updateButton}
                            </button>
                            <a
                                href={route('quotes.index')}
                                className="flex items-center justify-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5"
                            >
                                <ArrowLeft className="size-4" />
                                {t.common.actions.back}
                            </a>
                        </div>
                    </div>
                </aside>
            </form>

            {/* Modal Produit */}
            <Modal show={showProductModal} onClose={() => setShowProductModal(false)} maxWidth="md">
                <div className="h-[560px] bg-slate-950 p-5 text-slate-100">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-base font-semibold">{t.quotes.form.selectProduct}</h3>
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
                                placeholder={t.quotes.form.searchProduct}
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
                            <span>{t.quotes.form.useArrowKeys}</span>
                            <span>{filteredProducts.length} {t.quotes.form.results}</span>
                        </div>
                    </div>

                    <div className="h-[420px] space-y-1 overflow-y-auto rounded-lg border border-white/10 bg-slate-900/40 p-2">
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map((product, index) => (
                                <button
                                    key={product.id}
                                    type="button"
                                    onClick={() => selectProduct(product)}
                                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition ${
                                        activeProductIndex === index
                                            ? 'bg-amber-300/25 text-amber-100 ring-1 ring-amber-300/40'
                                            : 'text-slate-200 hover:bg-white/10'
                                    }`}
                                >
                                    <span>{product.name}</span>
                                    <span className="text-xs text-amber-300"><Currency amount={product.selling_price} /></span>
                                </button>
                            ))
                        ) : (
                            <p className="px-3 py-2 text-sm text-slate-400">{t.quotes.form.noProducts}</p>
                        )}
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
