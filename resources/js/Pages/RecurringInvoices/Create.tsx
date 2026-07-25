import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { FileText, Plus, Trash2, ArrowLeft, Calculator, Search, X, UserRound } from 'lucide-react';
import { useState, useMemo, useEffect, KeyboardEvent as ReactKeyboardEvent, FormEventHandler } from 'react';
import { useRoute } from '@/utils/route';
import Modal from '@/Components/Modal';
import Currency, { useShopSettings } from '@/Components/Currency';
import { useLocale } from '@/contexts/LocaleContext';

interface Customer {
    id: number;
    name: string;
    email?: string;
}

interface Product {
    id: number;
    name: string;
    selling_price: number;
    tax_rate?: number | string | null;
}

interface RecurringItem {
    product_id: string | number;
    product_name: string;
    quantity: number;
    unit_price: number;
}

// Le taux d'une ligne vient du produit, sinon du taux configuré de la boutique — exactement
// ce que résout ResolvesTaxRate côté serveur. Cet aperçu affichait 18 % en dur : il
// annonçait un montant que le serveur n'a jamais calculé.
function lineTaxRate(
    productId: string | number,
    products: Array<{ id: number; tax_rate?: number | string | null }>,
    shopDefault: number,
): number {
    const product = products.find((p) => p.id === Number(productId));
    const rate = product?.tax_rate;

    return rate === null || rate === undefined ? shopDefault : Number(rate);
}

export default function CreateRecurringInvoice({ customers, products }: { customers: Customer[]; products: Product[] }) {
    const route = useRoute();
    const { t } = useLocale();
    const { currencySymbol, defaultTaxRate } = useShopSettings();
    const [loading, setLoading] = useState(false);

    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [customerSearch, setCustomerSearch] = useState('');
    const [activeCustomerIndex, setActiveCustomerIndex] = useState(-1);

    const [showProductModal, setShowProductModal] = useState(false);
    const [productSearch, setProductSearch] = useState('');
    const [activeProductIndex, setActiveProductIndex] = useState(-1);
    const [productTargetLine, setProductTargetLine] = useState<number | null>(null);

    const [items, setItems] = useState<RecurringItem[]>([
        { product_id: '', product_name: '', quantity: 1, unit_price: 0 },
    ]);

    const [formData, setFormData] = useState({
        customer_id: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        frequency: 'monthly',
        notes: '',
    });

    const selectedCustomer = useMemo(() => {
        return customers.find((c) => c.id === Number(formData.customer_id)) || null;
    }, [customers, formData.customer_id]);

    const filteredCustomers = useMemo(() => {
        const term = customerSearch.trim().toLowerCase();
        if (!term) return customers;
        return customers.filter((c) => c.name.toLowerCase().includes(term));
    }, [customers, customerSearch]);

    const filteredProducts = useMemo(() => {
        const term = productSearch.trim().toLowerCase();
        if (!term) return products;
        return products.filter((p) => p.name.toLowerCase().includes(term));
    }, [products, productSearch]);

    useEffect(() => {
        if (!showCustomerModal) {
            setActiveCustomerIndex(-1);
            return;
        }
        setActiveCustomerIndex(filteredCustomers.length > 0 ? 0 : -1);
    }, [showCustomerModal, filteredCustomers.length, customerSearch]);

    useEffect(() => {
        if (!showProductModal) {
            setActiveProductIndex(-1);
            return;
        }
        setActiveProductIndex(filteredProducts.length > 0 ? 0 : -1);
    }, [showProductModal, filteredProducts.length, productSearch]);

    const selectCustomer = (customer: Customer) => {
        setFormData({ ...formData, customer_id: String(customer.id) });
        setShowCustomerModal(false);
    };

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

    const handleSearchKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
        if (!showCustomerModal || filteredCustomers.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveCustomerIndex((prev) => (prev < filteredCustomers.length - 1 ? prev + 1 : 0));
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveCustomerIndex((prev) => (prev > 0 ? prev - 1 : filteredCustomers.length - 1));
            return;
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            if (activeCustomerIndex >= 0) {
                selectCustomer(filteredCustomers[activeCustomerIndex]);
            }
            return;
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            setShowCustomerModal(false);
        }
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
    const tax = items.reduce(
        (sum, item) => sum + item.quantity * item.unit_price * lineTaxRate(item.product_id, products, defaultTaxRate) / 100,
        0,
    );
    const total = subtotal + tax;

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        setLoading(true);

        const submitData: any = {
            ...formData,
            items: items.filter((item) => item.product_id),
        };

        router.post(route('recurring-invoices.store'), submitData);
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-slate-900 dark:text-white">{t.recurringInvoices.form.createTitle}</h1>}>
            <Head title={t.recurringInvoices.form.createTitle} />

            <form onSubmit={handleSubmit} className="grid gap-4 xl:grid-cols-3">
                <section className="space-y-4 xl:col-span-2">
                    {/* Informations */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
                        <div className="mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                            <FileText className="size-5 text-amber-300" />
                            <h2 className="text-lg font-semibold">{t.recurringInvoices.form.createTitle}</h2>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            {/* Client Modal */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">{t.recurringInvoices.form.customer} *</label>
                                <button
                                    type="button"
                                    onClick={() => setShowCustomerModal(true)}
                                    className="flex w-full items-center justify-between rounded-xl border border-white/15 bg-gradient-to-r from-slate-900 to-slate-800 px-3 py-2.5 text-left text-slate-200 transition hover:border-amber-300/40"
                                >
                                    <span className="inline-flex items-center gap-2">
                                        <UserRound className="size-4 text-amber-300" />
                                        {selectedCustomer ? selectedCustomer.name : t.recurringInvoices.form.selectCustomer}
                                    </span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Ouvrir</span>
                                </button>
                                {selectedCustomer && (
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, customer_id: '' })}
                                        className="mt-2 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
                                    >
                                        <X className="size-3.5" />
                                        Retirer
                                    </button>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">{t.recurringInvoices.form.startDate} *</label>
                                <input
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">{t.recurringInvoices.form.nextInvoiceDate} <span className="text-xs text-slate-500 dark:text-slate-400">(optional)</span></label>
                                <input
                                    type="date"
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">{t.recurringInvoices.form.frequency} *</label>
                                <select
                                    value={formData.frequency}
                                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                                    required
                                >
                                    <option value="monthly">{t.recurringInvoices.frequency.monthly}</option>
                                    <option value="quarterly">{t.recurringInvoices.frequency.quarterly}</option>
                                    <option value="semi-annual">{t.recurringInvoices.frequency['semi-annual']}</option>
                                    <option value="annual">{t.recurringInvoices.frequency.annual}</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Articles */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                                <Plus className="size-5 text-amber-300" />
                                <h2 className="text-lg font-semibold">{t.invoices.form.invoiceLines}</h2>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-slate-700 transition-colors hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5"
                            >
                                <Plus className="size-3.5" />
                                {t.invoices.form.addLine}
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
                                        {item.product_name || t.invoices.form.selectProduct}
                                    </button>

                                    <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                                        className="w-20 rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 text-sm focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                                    />

                                    <input
                                        type="number"
                                        step="0.01"
                                        value={item.unit_price}
                                        onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value))}
                                        className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 text-sm focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                                    />

                                    <div className="text-right w-28">
                                        <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
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
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
                        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">{t.invoices.form.notes}</h2>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 text-sm focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                            placeholder={t.recurringInvoices.form.createTitle}
                        />
                    </div>
                </section>

                {/* Sidebar */}
                <aside className="xl:col-span-1">
                    <div className="sticky top-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
                        <div className="mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                            <Calculator className="size-5 text-amber-300" />
                            <h2 className="text-lg font-semibold">{t.invoices.form.summary}</h2>
                        </div>

                        <div className="space-y-3 border-b border-gray-200 dark:border-white/10 pb-4 mb-4">
                            <div className="flex justify-between text-slate-700 dark:text-slate-200">
                                <span className="text-sm">{t.invoices.form.subtotal}:</span>
                                <span className="font-semibold"><Currency amount={subtotal} /></span>
                            </div>
                            <div className="flex justify-between text-slate-700 dark:text-slate-200">
                                <span className="text-sm">{t.invoices.form.taxAmount} (18%):</span>
                                <span className="font-semibold"><Currency amount={tax} /></span>
                            </div>
                        </div>

                        <div className="flex justify-between mb-6">
                            <span className="font-semibold text-slate-900 dark:text-white">{t.invoices.form.total}:</span>
                            <span className="text-2xl font-bold text-amber-300"><Currency amount={total} /></span>
                        </div>

                        <div className="space-y-3">
                            <button
                                type="submit"
                                disabled={loading || !formData.customer_id || items.every((i) => !i.product_id)}
                                className="w-full rounded-lg bg-amber-300 px-4 py-2.5 font-semibold text-slate-950 transition-colors hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? `${t.common.misc?.loading || 'Chargement'}...` : t.recurringInvoices.form.createButton}
                            </button>
                            <a
                                href={route('recurring-invoices.index')}
                                className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5"
                            >
                                <ArrowLeft className="size-4" />
                                {t.common.actions.cancel || 'Annuler'}
                            </a>
                        </div>
                    </div>
                </aside>
            </form>

            {/* Modal Client */}
            <Modal show={showCustomerModal} onClose={() => setShowCustomerModal(false)} maxWidth="md">
                <div className="flex max-h-[80vh] flex-col bg-slate-950 p-5 text-slate-100">
                    <div className="mb-4 flex shrink-0 items-center justify-between">
                        <h3 className="text-base font-semibold">{t.recurringInvoices.form.selectCustomer}</h3>
                        <button
                            type="button"
                            onClick={() => setShowCustomerModal(false)}
                            className="rounded-md border border-gray-300 p-1 text-slate-600 hover:bg-gray-100 dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/10"
                        >
                            <X className="size-4" />
                        </button>
                    </div>

                    <div className="mb-3 shrink-0 rounded-xl border border-amber-300/20 bg-gradient-to-r from-slate-900 to-slate-800 p-2">
                        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-900">
                            <Search className="size-4 text-amber-300" />
                            <input
                                value={customerSearch}
                                onChange={(e) => setCustomerSearch(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                placeholder={t.invoices.form.searchCustomer}
                                className="w-full !bg-transparent !text-slate-100 text-sm caret-amber-300 placeholder:text-slate-400 focus:outline-none"
                                autoFocus
                            />
                            {customerSearch && (
                                <button
                                    type="button"
                                    onClick={() => setCustomerSearch('')}
                                    className="rounded-md p-1 text-slate-500 transition hover:bg-gray-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200"
                                >
                                    <X className="size-3.5" />
                                </button>
                            )}
                        </div>
                        <div className="mt-2 flex items-center justify-between px-1 text-xs text-slate-500 dark:text-slate-400">
                            <span>{t.invoices.form.useArrowKeys}</span>
                            <span>{filteredCustomers.length} {t.invoices.form.results}</span>
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 space-y-1 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-white/10 dark:bg-slate-900/40">
                        {filteredCustomers.length > 0 ? (
                            filteredCustomers.map((customer, index) => (
                                <button
                                    key={customer.id}
                                    type="button"
                                    onClick={() => selectCustomer(customer)}
                                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition ${
                                        activeCustomerIndex === index
                                            ? 'bg-amber-300/25 text-amber-100 ring-1 ring-amber-300/40'
                                            : Number(formData.customer_id) === customer.id
                                            ? 'bg-amber-300/20 text-amber-200'
                                            : 'text-slate-200 hover:bg-white/10'
                                    }`}
                                >
                                    <span>{customer.name}</span>
                                    {Number(formData.customer_id) === customer.id && <span className="text-xs text-green-400">✓ {t.common.misc?.selected || 'Sélectionné'}</span>}
                                </button>
                            ))
                        ) : (
                            <p className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">{t.invoices.form.noCustomers}</p>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Modal Produit */}
            <Modal show={showProductModal} onClose={() => setShowProductModal(false)} maxWidth="md">
                <div className="h-[560px] bg-slate-950 p-5 text-slate-100">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-base font-semibold">{t.invoices.form.selectProduct}</h3>
                        <button
                            type="button"
                            onClick={() => setShowProductModal(false)}
                            className="rounded-md border border-gray-300 p-1 text-slate-600 hover:bg-gray-100 dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/10"
                        >
                            <X className="size-4" />
                        </button>
                    </div>

                    <div className="mb-3 rounded-xl border border-amber-300/20 bg-gradient-to-r from-slate-900 to-slate-800 p-2">
                        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-900">
                            <Search className="size-4 text-amber-300" />
                            <input
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                                onKeyDown={handleProductSearchKeyDown}
                                placeholder={t.invoices.form.searchProduct}
                                className="w-full !bg-transparent !text-slate-100 text-sm caret-amber-300 placeholder:text-slate-400 focus:outline-none"
                                autoFocus
                            />
                            {productSearch && (
                                <button
                                    type="button"
                                    onClick={() => setProductSearch('')}
                                    className="rounded-md p-1 text-slate-500 transition hover:bg-gray-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200"
                                >
                                    <X className="size-3.5" />
                                </button>
                            )}
                        </div>
                        <div className="mt-2 flex items-center justify-between px-1 text-xs text-slate-500 dark:text-slate-400">
                            <span>{t.invoices.form.useArrowKeys}</span>
                            <span>{filteredProducts.length} {t.invoices.form.results}</span>
                        </div>
                    </div>

                    <div className="h-[420px] space-y-1 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-white/10 dark:bg-slate-900/40">
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
                            <p className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">{t.invoices.form.noProducts}</p>
                        )}
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
