import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useMemo, useState } from 'react';
import { Calculator, FilePenLine, Plus, Trash2 } from 'lucide-react';

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

    const total = subtotal + totalTax;

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
        put(route('invoices.update', invoice.id));
    };

    return (
        <AuthenticatedLayout
            header={<h1 className="text-xl font-semibold text-white">Modifier facture</h1>}
        >
            <Head title="Modifier facture" />

            <form onSubmit={submit} className="grid gap-4 xl:grid-cols-3">
                <section className="space-y-4 xl:col-span-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-white">
                                <FilePenLine className="size-5 text-amber-200" />
                                <h2 className="text-lg font-semibold">Informations facture</h2>
                            </div>
                            <span className="rounded-full border border-white/15 bg-slate-900/70 px-2.5 py-1 text-xs text-amber-300 font-medium">
                                {invoice.invoice_number}
                            </span>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
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
                                <label htmlFor="customer_id" className="block text-sm font-medium text-slate-200">
                                    Client *
                                </label>
                                <select
                                    id="customer_id"
                                    value={data.customer_id}
                                    onChange={(e) => setData('customer_id', Number(e.target.value))}
                                    className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                >
                                    <option value="">Sélectionner un client</option>
                                    {customers.map((customer) => (
                                        <option key={customer.id} value={customer.id}>
                                            {customer.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.customer_id && <p className="mt-1 text-sm text-red-400">{errors.customer_id}</p>}
                            </div>

                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-slate-200">
                                    Statut *
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
                                    <option value="overdue">En retard</option>
                                    <option value="cancelled">Annulée</option>
                                </select>
                                {errors.status && <p className="mt-1 text-sm text-red-400">{errors.status}</p>}
                            </div>

                            <div>
                                <label htmlFor="payment_method" className="block text-sm font-medium text-slate-200">
                                    Mode de paiement
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
                                </select>
                                {errors.payment_method && <p className="mt-1 text-sm text-red-400">{errors.payment_method}</p>}
                            </div>

                            <div>
                                <label htmlFor="invoice_date" className="block text-sm font-medium text-slate-200">
                                    Date de facture *
                                </label>
                                <input
                                    type="date"
                                    id="invoice_date"
                                    value={data.invoice_date}
                                    onChange={(e) => setData('invoice_date', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                />
                                {errors.invoice_date && <p className="mt-1 text-sm text-red-400">{errors.invoice_date}</p>}
                            </div>

                            <div>
                                <label htmlFor="due_date" className="block text-sm font-medium text-slate-200">
                                    Date d'échéance *
                                </label>
                                <input
                                    type="date"
                                    id="due_date"
                                    value={data.due_date}
                                    onChange={(e) => setData('due_date', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                />
                                {errors.due_date && <p className="mt-1 text-sm text-red-400">{errors.due_date}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white">Lignes de facture</h2>
                            <button
                                type="button"
                                onClick={addItem}
                                className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-white/10"
                            >
                                <Plus className="size-3.5" />
                                Ajouter ligne
                            </button>
                        </div>

                        <div className="space-y-3">
                            {items.map((item, index) => (
                                <div key={index} className="rounded-xl border border-white/10 bg-slate-900/60 p-3 space-y-3">
                                    <div className="grid gap-2 md:grid-cols-12">
                                        <div className="md:col-span-5 space-y-1">
                                            <label className="text-xs text-slate-300">Produit #{index + 1}</label>
                                            <select
                                                value={item.product_id}
                                                onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                                                className="w-full rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-slate-200"
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
                                            <label className="text-xs text-slate-300">Qté</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                                className="w-full rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-slate-200"
                                            />
                                        </div>

                                        <div className="md:col-span-2 space-y-1">
                                            <label className="text-xs text-slate-300">Prix U. (DH)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={item.unit_price}
                                                onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                                                className="w-full rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-slate-200"
                                            />
                                        </div>

                                        <div className="md:col-span-2 space-y-1">
                                            <label className="text-xs text-slate-300">TVA (%)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={item.tax_rate}
                                                onChange={(e) => updateItem(index, 'tax_rate', e.target.value)}
                                                className="w-full rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-slate-200"
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
                        {errors.items && <p className="mt-2 text-sm text-red-400">{errors.items}</p>}
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <label htmlFor="notes" className="block text-sm font-medium text-slate-200">
                            Notes
                        </label>
                        <textarea
                            id="notes"
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            rows={4}
                            className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                            placeholder="Notes internes..."
                        />
                        {errors.notes && <p className="mt-1 text-sm text-red-400">{errors.notes}</p>}
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
                                {subtotal.toLocaleString('fr-FR', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}{' '}
                                DH
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>TVA</span>
                            <span>
                                {totalTax.toLocaleString('fr-FR', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}{' '}
                                DH
                            </span>
                        </div>
                        <div className="mt-3 border-t border-white/15 pt-3 text-base font-semibold text-white">
                            <div className="flex justify-between">
                                <span>Total TTC</span>
                                <span className="text-amber-300">
                                    {total.toLocaleString('fr-FR', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}{' '}
                                    DH
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
                            {processing ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                        <Link
                            href={route('invoices.index')}
                            className="block w-full rounded-lg border border-white/15 px-4 py-2.5 text-center text-sm text-slate-200 transition hover:bg-white/10"
                        >
                            Retour
                        </Link>
                    </div>
                </aside>
            </form>
        </AuthenticatedLayout>
    );
}
