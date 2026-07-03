import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, KeyboardEvent as ReactKeyboardEvent, useEffect, useMemo, useState } from 'react';
import { Calculator, FileText, Plus, Search, Trash2, UserRound, X } from 'lucide-react';
import Currency, { useShopSettings } from '@/Components/Currency';
import { useRoute } from '@/utils/route';
import Modal from '@/Components/Modal';
import { useLocale } from '@/contexts/LocaleContext';
import InputError from '@/Components/InputError';

interface Customer {
    id: number;
    name: string;
    shop_id: number;
}

interface Shop {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    selling_price: string;
    shop_id: number;
    has_variations: boolean;
    variations: Array<{
        id: number;
        name: string;
        selling_price: string;
        shop_id: number;
        has_variations: boolean;
        variations: [];
    }>;
}

interface InvoiceItem {
    product_id: number | string;
    product_name: string;
    description: string;
    quantity: number | string;
    unit_price: number | string;
    tax_rate: number | string;
}

interface Props {
    customers: Customer[];
    shops: Shop[];
    products: Product[];
}

export default function InvoicesCreate({ customers, shops, products }: Props) {
    const { t } = useLocale();
    const route = useRoute();
    const { props } = usePage();
    const activeShop = props.activeShop as { id: number; name: string } | null;
    const { currencySymbol } = useShopSettings();

    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [activeCustomerIndex, setActiveCustomerIndex] = useState(-1);
    const [productSearch, setProductSearch] = useState('');
    const [showProductModal, setShowProductModal] = useState(false);
    const [activeProductIndex, setActiveProductIndex] = useState(-1);
    const [productTargetLine, setProductTargetLine] = useState<number | null>(null);
    const [items, setItems] = useState<InvoiceItem[]>([
        {
            product_id: '',
            product_name: '',
            description: '',
            quantity: 1,
            unit_price: 0,
            tax_rate: 0,
        },
    ]);

    const { data, setData, post, processing, errors } = useForm({
        shop_id: activeShop?.id || shops[0]?.id || 0,
        customer_id: 0,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: '',
        status: 'draft',
        payment_method: '',
        discount_amount: 0,
        notes: '',
        items: items,
    });

    const filteredCustomers = useMemo(() => {
        const scoped = customers.filter((customer) => customer.shop_id === Number(data.shop_id));
        const term = customerSearch.trim().toLowerCase();
        if (!term) return scoped;
        return scoped.filter((customer) => customer.name.toLowerCase().includes(term));
    }, [customers, data.shop_id, customerSearch]);

    const selectedCustomer = useMemo(() => {
        return customers.find((customer) => customer.id === Number(data.customer_id)) || null;
    }, [customers, data.customer_id]);

    const filteredProducts = useMemo(() => {
        return products.filter((product) => product.shop_id === Number(data.shop_id));
    }, [products, data.shop_id]);

    const subtotal = useMemo(() => {
        return items.reduce((sum, item) => {
            const qty = Number(item.quantity) || 0;
            const price = Number(item.unit_price) || 0;
            return sum + Math.max(qty * price, 0);
        }, 0);
    }, [items]);

    const discountAmount = Math.max(Number(data.discount_amount) || 0, 0);
    const total = Math.max(subtotal - discountAmount, 0);

    const addItem = () => {
        setItems((prev) => [
            ...prev,
            {
                product_id: '',
                product_name: '',
                description: '',
                quantity: 1,
                unit_price: 0,
                tax_rate: 0,
            },
        ]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems((prev) => prev.filter((_, i) => i !== index));
        }
    };

    const updateItem = (index: number, field: keyof InvoiceItem, value: string) => {
        setItems((prev) =>
            prev.map((item, i) => {
                if (i !== index) return item;

                const updated = { ...item, [field]: value };

                if (field === 'product_id' && value) {
                    // Chercher d'abord dans les produits directs, puis dans les variations
                    let product = filteredProducts.find((p) => p.id === Number(value));
                    let parentProduct: typeof product | undefined;
                    if (!product) {
                        for (const p of filteredProducts) {
                            const v = p.variations?.find((v) => v.id === Number(value));
                            if (v) { product = v as any; parentProduct = p; break; }
                        }
                    }
                    if (product) {
                        updated.product_name = parentProduct
                            ? `${parentProduct.name} › ${product.name}`
                            : product.name;
                        updated.unit_price = product.selling_price;
                    }
                }

                return updated;
            }),
        );
    };

    const handleShopChange = (value: string) => {
        const shopId = Number(value);
        setData('shop_id', shopId);
        setData('customer_id', 0);
        setCustomerSearch('');

        // Reset product selection if switching shop
        setItems((prev) =>
            prev.map((item) => ({
                ...item,
                product_id: '',
                product_name: '',
                unit_price: 0,
            })),
        );
    };

    const selectCustomer = (customer: Customer) => {
        setData('customer_id', customer.id);
        setShowCustomerModal(false);
    };

    const openProductModal = (lineIndex: number) => {
        setProductTargetLine(lineIndex);
        setProductSearch('');
        setShowProductModal(true);
    };

    const selectProduct = (product: Product, parent?: Product) => {
        if (productTargetLine === null) return;
        setItems((prev) =>
            prev.map((item, i) => {
                if (i !== productTargetLine) return item;
                return {
                    ...item,
                    product_id: product.id,
                    product_name: parent ? `${parent.name} › ${product.name}` : product.name,
                    unit_price: product.selling_price,
                };
            }),
        );
        setShowProductModal(false);
    };

    useEffect(() => {
        if (!showCustomerModal) {
            setActiveCustomerIndex(-1);
            return;
        }

        if (filteredCustomers.length === 0) {
            setActiveCustomerIndex(-1);
            return;
        }

        setActiveCustomerIndex(0);
    }, [showCustomerModal, filteredCustomers.length, customerSearch]);

    const filteredProductsBySearch = useMemo(() => {
        const term = productSearch.trim().toLowerCase();
        if (!term) return filteredProducts;
        return filteredProducts.filter((product) => product.name.toLowerCase().includes(term));
    }, [filteredProducts, productSearch]);

    useEffect(() => {
        if (!showProductModal) {
            setActiveProductIndex(-1);
            return;
        }

        if (filteredProductsBySearch.length === 0) {
            setActiveProductIndex(-1);
            return;
        }

        setActiveProductIndex(0);
    }, [showProductModal, filteredProductsBySearch.length, productSearch]);

    const handleSearchKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
        if (!showCustomerModal || filteredCustomers.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveCustomerIndex((prev) =>
                prev < filteredCustomers.length - 1 ? prev + 1 : 0,
            );
            return;
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveCustomerIndex((prev) =>
                prev > 0 ? prev - 1 : filteredCustomers.length - 1,
            );
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
        if (!showProductModal || filteredProductsBySearch.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveProductIndex((prev) =>
                prev < filteredProductsBySearch.length - 1 ? prev + 1 : 0,
            );
            return;
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveProductIndex((prev) =>
                prev > 0 ? prev - 1 : filteredProductsBySearch.length - 1,
            );
            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            if (activeProductIndex >= 0) {
                selectProduct(filteredProductsBySearch[activeProductIndex]);
            }
            return;
        }

        if (e.key === 'Escape') {
            e.preventDefault();
            setShowProductModal(false);
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        data.items = items;
        post(route('invoices.store'));
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">Nouvelle facture</h1>}>
            <Head title="Nouvelle facture" />

            <form onSubmit={submit} className="grid gap-4 xl:grid-cols-3">
                <section className="space-y-4 xl:col-span-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <div className="mb-4 flex items-center gap-2 text-white">
                            <FileText className="size-5 text-amber-200" />
                            <h2 className="text-lg font-semibold">Informations facture</h2>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label htmlFor="shop_id" className="block text-sm font-medium text-slate-200">
                                    {t.invoices.form.shop} *
                                </label>
                                <select
                                    id="shop_id"
                                    value={data.shop_id}
                                    onChange={(e) => handleShopChange(e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                >
                                    <option value="">{t.invoices.form.selectShop}</option>
                                    {shops.map((shop) => (
                                        <option key={shop.id} value={shop.id}>
                                            {shop.name}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.shop_id} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-200">
                                    {t.invoices.form.customer} *
                                </label>
                                <div className="mt-1 space-y-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowCustomerModal(true)}
                                        className="flex w-full items-center justify-between rounded-xl border border-white/15 bg-gradient-to-r from-slate-900 to-slate-800 px-3 py-2.5 text-left text-slate-200 transition hover:border-amber-300/40"
                                    >
                                        <span className="inline-flex items-center gap-2">
                                            <UserRound className="size-4 text-amber-300" />
                                            {selectedCustomer ? selectedCustomer.name : t.invoices.form.selectCustomer}
                                        </span>
                                        <span className="text-xs text-slate-400">{t.common.actions.open}</span>
                                    </button>

                                    {selectedCustomer && (
                                        <button
                                            type="button"
                                            onClick={() => setData('customer_id', 0)}
                                            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
                                        >
                                            <X className="size-3.5" />
                                            {t.invoices.form.removeCustomer}
                                        </button>
                                    )}
                                </div>
                                <InputError message={errors.customer_id} />
                            </div>

                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-slate-200">
                                    {t.invoices.form.status} *
                                </label>
                                <select
                                    id="status"
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                >
                                    <option value="draft">Brouillon</option>
                                    <option value="sent">Envoyée</option>
                                    <option value="paid">Payée</option>
                                    <option value="cancelled">Annulée</option>
                                </select>
                                <InputError message={errors.status} />
                            </div>

                            <div>
                                <label htmlFor="payment_method" className="block text-sm font-medium text-slate-200">
                                    {t.invoices.form.paymentMethod}
                                </label>
                                <select
                                    id="payment_method"
                                    value={data.payment_method}
                                    onChange={(e) => setData('payment_method', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                >
                                    <option value="">Non payée</option>
                                    <option value="cash">Espèces</option>
                                    <option value="card">Carte bancaire</option>
                                    <option value="check">Chèque</option>
                                    <option value="transfer">Virement</option>
                                    <option value="mobile">Mobile</option>
                                </select>
                                <InputError message={errors.payment_method} />
                            </div>

                            <div>
                                <label htmlFor="invoice_date" className="block text-sm font-medium text-slate-200">
                                    {t.invoices.form.invoiceDate} *
                                </label>
                                <input
                                    type="date"
                                    id="invoice_date"
                                    value={data.invoice_date}
                                    onChange={(e) => setData('invoice_date', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                />
                                <InputError message={errors.invoice_date} />
                            </div>

                            <div>
                                <label htmlFor="due_date" className="block text-sm font-medium text-slate-200">
                                    {t.invoices.form.dueDate}
                                </label>
                                <input
                                    type="date"
                                    id="due_date"
                                    value={data.due_date}
                                    onChange={(e) => setData('due_date', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                />
                                <InputError message={errors.due_date} />
                            </div>

                            <div>
                                <label htmlFor="discount_amount" className="block text-sm font-medium text-slate-200">
                                    {t.invoices.form.discount}
                                </label>
                                <input
                                    type="number"
                                    id="discount_amount"
                                    min="0"
                                    step="0.01"
                                    value={data.discount_amount}
                                    onChange={(e) => setData('discount_amount', Math.max(Number(e.target.value) || 0, 0))}
                                    className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                />
                                <InputError message={errors.discount_amount} />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white">{t.invoices.form.invoiceLines}</h2>
                            <button
                                type="button"
                                onClick={addItem}
                                className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-white/10"
                            >
                                <Plus className="size-3.5" />
                                {t.invoices.form.addLine}
                            </button>
                        </div>

                        <div className="space-y-3">
                            {items.map((item, index) => (
                                <div key={index} className="rounded-xl border border-white/10 bg-slate-900/60 p-3 space-y-3">
                                    <div className="grid items-end gap-2 md:grid-cols-12">
                                        <div className="md:col-span-7 space-y-1">
                                            <label className="text-xs text-slate-300">{t.invoices.form.product} #{index + 1}</label>
                                            <button
                                                type="button"
                                                onClick={() => openProductModal(index)}
                                                className="flex h-10 w-full items-center justify-between rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-left text-sm text-slate-200 transition hover:border-amber-300/40"
                                            >
                                                <span>{item.product_name || t.invoices.form.selectProduct}</span>
                                                <span className="text-xs text-slate-400">{t.common.actions.open}</span>
                                            </button>
                                        </div>

                                        <div className="md:col-span-1 space-y-1">
                                            <label className="text-xs text-slate-300">Qté</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                                className="h-10 w-full rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-slate-200"
                                            />
                                        </div>

                                        <div className="md:col-span-2 space-y-1">
                                            <label className="text-xs text-slate-300">Prix U. ({currencySymbol})</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={item.unit_price}
                                                readOnly
                                                className="h-10 w-full cursor-not-allowed rounded-lg border border-white/10 bg-slate-800/70 px-3 py-2 text-sm text-slate-400"
                                            />
                                        </div>

                                        <div className="md:col-span-2 flex items-end">
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                disabled={items.length === 1}
                                                className="ml-auto flex h-10 w-10 items-center justify-center rounded-lg border border-rose-300/30 text-rose-200 transition hover:bg-rose-300/10 disabled:cursor-not-allowed disabled:opacity-30"
                                            >
                                                <Trash2 className="size-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-300">Description</label>
                                        <input
                                            type="text"
                                            value={item.description}
                                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                                            placeholder="Description optionnelle"
                                            className="w-full rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-slate-200"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <InputError message={errors.items} />
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <label className="space-y-1 text-sm text-slate-200">
                            <span>Note interne</span>
                            <textarea
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                rows={4}
                                className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                                placeholder="{t.invoices.form.additionalInfo}..."
                            />
                        </label>
                    </div>
                </section>

                <aside className="h-fit rounded-2xl border border-amber-200/25 bg-gradient-to-br from-amber-300/15 via-orange-300/10 to-transparent p-5 xl:sticky xl:top-24">
                    <div className="mb-4 flex items-center gap-2 text-amber-100">
                        <Calculator className="size-5" />
                        <h2 className="text-lg font-semibold">Résumé</h2>
                    </div>

                    <div className="space-y-2 text-sm text-slate-200">
                        <div className="flex justify-between">
                            <span>Sous-total</span>
                            <span>
                                <Currency amount={subtotal} />
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>Remise</span>
                            <span className="text-red-300">
                                -<Currency amount={discountAmount} />
                            </span>
                        </div>
                        <div className="mt-3 border-t border-white/15 pt-3 text-base font-semibold text-white">
                            <div className="flex justify-between">
                                <span>Total</span>
                                <span>
                                    <Currency amount={total} />
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 space-y-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full rounded-lg bg-amber-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:opacity-50"
                        >
                            {processing ? t.common.actions.saving : t.invoices.form.createButton}
                        </button>
                        <Link
                            href={route('invoices.index')}
                            className="block w-full rounded-lg border border-white/15 px-4 py-2.5 text-center text-sm text-slate-200 transition hover:bg-white/10"
                        >
                            {t.common.actions.cancel}
                        </Link>
                    </div>
                </aside>
            </form>

            <Modal show={showCustomerModal} onClose={() => setShowCustomerModal(false)} maxWidth="md">
                <div className="flex max-h-[80vh] flex-col bg-slate-950 p-5 text-slate-100">
                    <div className="mb-4 flex shrink-0 items-center justify-between">
                        <h3 className="text-base font-semibold">{t.invoices.form.selectCustomer}</h3>
                        <button
                            type="button"
                            onClick={() => setShowCustomerModal(false)}
                            className="rounded-md border border-white/15 p-1 text-slate-300 hover:bg-white/10"
                        >
                            <X className="size-4" />
                        </button>
                    </div>

                    <div className="mb-3 shrink-0 rounded-xl border border-amber-300/20 bg-gradient-to-r from-slate-900 to-slate-800 p-2">
                        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-900 px-3 py-2">
                            <Search className="size-4 text-amber-300" />
                            <input
                                value={customerSearch}
                                onChange={(e) => setCustomerSearch(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                placeholder={t.invoices.form.searchCustomer}
                                className="w-full !bg-transparent !text-slate-100 text-sm caret-amber-300 placeholder:text-slate-400 focus:outline-none"
                            />
                            {customerSearch && (
                                <button
                                    type="button"
                                    onClick={() => setCustomerSearch('')}
                                    className="rounded-md p-1 text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
                                >
                                    <X className="size-3.5" />
                                </button>
                            )}
                        </div>
                        <div className="mt-2 flex items-center justify-between px-1 text-xs text-slate-400">
                            <span>{t.invoices.form.useArrowKeys}</span>
                            <span>{filteredCustomers.length} {t.invoices.form.results}</span>
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 space-y-1 overflow-y-auto rounded-lg border border-white/10 bg-slate-900/40 p-2">
                        {filteredCustomers.length > 0 ? (
                            filteredCustomers.map((customer, index) => (
                                <button
                                    key={customer.id}
                                    type="button"
                                    onClick={() => selectCustomer(customer)}
                                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition ${
                                        activeCustomerIndex === index
                                            ? 'bg-amber-300/25 text-amber-100 ring-1 ring-amber-300/40'
                                            : Number(data.customer_id) === customer.id
                                            ? 'bg-amber-300/20 text-amber-200'
                                            : 'text-slate-200 hover:bg-white/10'
                                    }`}
                                >
                                    <span>{customer.name}</span>
                                    {Number(data.customer_id) === customer.id && <span className="text-xs">{t.common.misc.selected}</span>}
                                </button>
                            ))
                        ) : (
                            <p className="px-3 py-2 text-sm text-slate-400">
                                {t.invoices.form.noCustomers}
                            </p>
                        )}
                    </div>
                </div>
            </Modal>

            <Modal show={showProductModal} onClose={() => setShowProductModal(false)} maxWidth="md">
                <div className="h-[560px] bg-slate-950 p-5 text-slate-100">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-base font-semibold">{t.invoices.form.selectProduct}</h3>
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
                                placeholder={t.invoices.form.searchProduct}
                                className="w-full !bg-transparent !text-slate-100 text-sm caret-amber-300 placeholder:text-slate-400 focus:outline-none"
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
                            <span>{t.invoices.form.useArrowKeys}</span>
                            <span>{filteredProductsBySearch.length} {t.invoices.form.results}</span>
                        </div>
                    </div>

                    <div className="h-[420px] space-y-1 overflow-y-auto rounded-lg border border-white/10 bg-slate-900/40 p-2">
                        {filteredProductsBySearch.length > 0 ? (
                            filteredProductsBySearch.map((product, index) => (
                                <div key={product.id}>
                                    {/* Produit parent avec déclinaisons — non-cliquable directement */}
                                    {product.has_variations && product.variations?.length > 0 ? (
                                        <div>
                                            <div className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-400">
                                                <span className="font-medium text-slate-300">{product.name}</span>
                                                <span className="rounded-full bg-amber-300/15 px-1.5 py-0.5 text-xs text-amber-400">
                                                    {product.variations.length} {t.invoices.form.variations}
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
                                        </button>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="px-3 py-2 text-sm text-slate-400">
                                {t.invoices.form.noProducts}
                            </p>
                        )}
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
