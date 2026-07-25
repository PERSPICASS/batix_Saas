import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useMemo, useState } from 'react';
import { Calculator, FilePenLine, Plus, Trash2 } from 'lucide-react';
import { useRoute } from '@/utils/route';
import Currency, { useShopSettings } from '@/Components/Currency';
import { useLocale } from '@/contexts/LocaleContext';
import InputError from '@/Components/InputError';

interface Customer {
    id: number;
    name: string;
}

interface Shop {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    sale_price: string;
}

interface InvoiceItem {
    id?: number;
    product_id: number | string;
    product_name: string;
    description: string;
    quantity: number | string;
    unit_price: number | string;
    tax_rate: number | string;
}

interface Invoice {
    id: number;
    shop_id: number;
    customer_id: number;
    invoice_number: string;
    invoice_date: string;
    due_date: string;
    status: string;
    payment_method: string | null;
    discount_amount: number | string;
    notes: string | null;
    items: InvoiceItem[];
}

interface Props {
    invoice: Invoice;
    customers: Customer[];
    shops: Shop[];
    products: Product[];
}

export default function InvoicesEdit({ invoice, customers, shops, products }: Props) {
    const { t } = useLocale();
    const route = useRoute();
    const { currencySymbol } = useShopSettings();

    const [items, setItems] = useState<InvoiceItem[]>(
        invoice.items.map((item) => ({
            id: item.id,
            product_id: item.product_id || '',
            product_name: item.product_name,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            tax_rate: item.tax_rate,
        }))
    );

    const { data, setData, put, processing, errors } = useForm({
        shop_id: invoice.shop_id,
        customer_id: invoice.customer_id,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date,
        status: invoice.status,
        payment_method: invoice.payment_method || '',
        discount_amount: invoice.discount_amount || 0,
        notes: invoice.notes || '',
        items: items,
    });

    const subtotal = useMemo(() => {
        return items.reduce((sum, item) => {
            const qty = Number(item.quantity) || 0;
            const price = Number(item.unit_price) || 0;
            return sum + qty * price;
        }, 0);
    }, [items]);

    const totalTax = useMemo(() => {
        return items.reduce((sum, item) => {
            const qty = Number(item.quantity) || 0;
            const price = Number(item.unit_price) || 0;
            const taxRate = Number(item.tax_rate) || 0;
            return sum + (qty * price * taxRate) / 100;
        }, 0);
    }, [items]);

    const discountAmount = Math.max(Number(data.discount_amount) || 0, 0);
    const total = Math.max(subtotal + totalTax - discountAmount, 0);

    const addItem = () => {
        const newItem: InvoiceItem = {
            product_id: '',
            product_name: '',
            description: '',
            quantity: 1,
            unit_price: 0,
            tax_rate: 20,
        };
        setItems((prev) => [...prev, newItem]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems((prev) => prev.filter((_, i) => i !== index));
        }
    };

    const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
        setItems((prev) =>
            prev.map((item, i) => {
                if (i === index) {
                    const updated = { ...item, [field]: value };
                    
                    // If product is selected, auto-fill price and name
                    if (field === 'product_id' && value) {
                        const product = products.find((p) => p.id === Number(value));
                        if (product) {
                            updated.product_name = product.name;
                            updated.unit_price = product.sale_price;
                        }
                    }
                    
                    return updated;
                }
                return item;
            })
        );
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        // Set items in data before submitting
        data.items = items;
        put(route('invoices.update', { invoice: invoice.id }));
    };

    return (
        <AuthenticatedLayout
            header={<h1 className="text-xl font-semibold text-slate-900 dark:text-white">Modifier facture</h1>}
        >
            <Head title="Modifier facture" />

            <form onSubmit={submit} className="grid gap-4 xl:grid-cols-3">
                <section className="space-y-4 xl:col-span-2">
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                                <FilePenLine className="size-5 text-amber-200" />
                                <h2 className="text-lg font-semibold">Informations facture</h2>
                            </div>
                            <span className="rounded-full border border-white/15 bg-slate-900/70 px-2.5 py-1 text-xs text-amber-300 font-medium">
                                {invoice.invoice_number}
                            </span>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label htmlFor="shop_id" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                    {t.invoices.form.shop} *
                                </label>
                                <select
                                    id="shop_id"
                                    value={data.shop_id}
                                    onChange={(e) => setData('shop_id', Number(e.target.value))}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
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
                                <label htmlFor="customer_id" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                    {t.invoices.form.customer} *
                                </label>
                                <select
                                    id="customer_id"
                                    value={data.customer_id}
                                    onChange={(e) => setData('customer_id', Number(e.target.value))}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                                >
                                    <option value="">Sélectionner un client</option>
                                    {customers.map((customer) => (
                                        <option key={customer.id} value={customer.id}>
                                            {customer.name}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.customer_id} />
                            </div>

                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                    {t.invoices.form.status} *
                                </label>
                                <select
                                    id="status"
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                                >
                                    {/* Seuls les deux statuts qu'un brouillon peut prendre :
                                        l'encaissement et l'annulation passent par l'action
                                        dédiée de la page de la facture, une fois émise.
                                        (« En retard » figurait ici alors que le serveur ne
                                        l'a jamais accepté.) */}
                                    <option value="draft">{t.invoices.status.draft}</option>
                                    <option value="sent">{t.invoices.status.sent}</option>
                                </select>
                                <InputError message={errors.status} />
                            </div>

                            <div>
                                <label htmlFor="payment_method" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                    {t.invoices.form.paymentMethod}
                                </label>
                                <select
                                    id="payment_method"
                                    value={data.payment_method}
                                    onChange={(e) => setData('payment_method', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                                >
                                    <option value="">Non payée</option>
                                    <option value="cash">Espèces</option>
                                    <option value="card">Carte bancaire</option>
                                    <option value="check">Chèque</option>
                                    <option value="transfer">Virement</option>
                                </select>
                                <InputError message={errors.payment_method} />
                            </div>

                            <div>
                                <label htmlFor="invoice_date" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                    {t.invoices.form.invoiceDate} *
                                </label>
                                <input
                                    type="date"
                                    id="invoice_date"
                                    value={data.invoice_date}
                                    onChange={(e) => setData('invoice_date', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                                />
                                <InputError message={errors.invoice_date} />
                            </div>

                            <div>
                                <label htmlFor="due_date" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                    {t.invoices.form.dueDate} *
                                </label>
                                <input
                                    type="date"
                                    id="due_date"
                                    value={data.due_date}
                                    onChange={(e) => setData('due_date', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                                />
                                <InputError message={errors.due_date} />
                            </div>

                            <div>
                                <label htmlFor="discount_amount" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                    {t.invoices.form.discount}
                                </label>
                                <input
                                    type="number"
                                    id="discount_amount"
                                    min="0"
                                    step="0.01"
                                    value={data.discount_amount}
                                    onChange={(e) => setData('discount_amount', Math.max(Number(e.target.value) || 0, 0))}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                                />
                                <InputError message={errors.discount_amount} />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Lignes de facture</h2>
                            <button
                                type="button"
                                onClick={addItem}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-slate-700 transition hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
                            >
                                <Plus className="size-3.5" />
                                {t.invoices.form.addLine}
                            </button>
                        </div>

                        <div className="space-y-3">
                            {items.map((item, index) => (
                                <div key={index} className="rounded-xl border border-white/10 bg-slate-900/60 p-3 space-y-3">
                                    <div className="grid gap-2 md:grid-cols-12">
                                        <div className="md:col-span-5 space-y-1">
                                            <label className="text-xs text-slate-600 dark:text-slate-300">Produit #{index + 1}</label>
                                            <select
                                                value={item.product_id}
                                                onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/15 dark:bg-slate-950/70 dark:text-slate-200"
                                            >
                                                <option value="">Sélectionner un produit</option>
                                                {products.map((product) => (
                                                    <option key={product.id} value={product.id}>
                                                        {product.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="md:col-span-2 space-y-1">
                                            <label className="text-xs text-slate-600 dark:text-slate-300">Qté</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/15 dark:bg-slate-950/70 dark:text-slate-200"
                                            />
                                        </div>

                                        <div className="md:col-span-2 space-y-1">
                                            <label className="text-xs text-slate-600 dark:text-slate-300">Prix U. ({currencySymbol})</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={item.unit_price}
                                                onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/15 dark:bg-slate-950/70 dark:text-slate-200"
                                            />
                                        </div>

                                        <div className="md:col-span-2 space-y-1">
                                            <label className="text-xs text-slate-600 dark:text-slate-300">TVA (%)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={item.tax_rate}
                                                onChange={(e) => updateItem(index, 'tax_rate', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/15 dark:bg-slate-950/70 dark:text-slate-200"
                                            />
                                        </div>

                                        <div className="flex items-end md:col-span-1">
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                disabled={items.length === 1}
                                                className="w-full rounded-lg border border-rose-300/30 px-3 py-2 text-rose-200 transition hover:bg-rose-300/10 disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <Trash2 className="mx-auto size-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-600 dark:text-slate-300">Description</label>
                                        <input
                                            type="text"
                                            value={item.description}
                                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                                            placeholder="Description optionnelle"
                                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/15 dark:bg-slate-950/70 dark:text-slate-200"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <InputError message={errors.items} />
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
                        <label htmlFor="notes" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                            {t.invoices.form.notes}
                        </label>
                        <textarea
                            id="notes"
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            rows={4}
                            className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                            placeholder="Notes internes..."
                        />
                        <InputError message={errors.notes} />
                    </div>
                </section>

                <aside className="h-fit rounded-2xl border border-amber-200/25 bg-gradient-to-br from-amber-300/15 via-orange-300/10 to-transparent p-5 xl:sticky xl:top-24">
                    <div className="mb-4 flex items-center gap-2 text-amber-100">
                        <Calculator className="size-5" />
                        <h2 className="text-lg font-semibold">Résumé</h2>
                    </div>

                    <div className="space-y-2 text-sm text-slate-200">
                        <div className="flex justify-between">
                            <span>Sous-total HT</span>
                            <span>
                                <Currency amount={subtotal} />
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>TVA</span>
                            <span>
                                <Currency amount={totalTax} />
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>Remise</span>
                            <span className="text-red-300">
                                -<Currency amount={discountAmount} />
                            </span>
                        </div>
                        <div className="mt-3 border-t border-gray-200 dark:border-white/15 pt-3 text-base font-semibold text-slate-900 dark:text-white">
                            <div className="flex justify-between">
                                <span>Total TTC</span>
                                <span className="text-amber-300">
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
                            {processing ? t.common.actions.saving : t.invoices.form.updateButton}
                        </button>
                        <Link
                            href={route('invoices.index')}
                            className="block w-full rounded-lg border border-white/15 px-4 py-2.5 text-center text-sm text-slate-200 transition hover:bg-white/10"
                        >
                            {t.common.actions.back}
                        </Link>
                    </div>
                </aside>
            </form>
        </AuthenticatedLayout>
    );
}
