import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { FileText, Plus, Trash2, ArrowLeft, Calculator } from 'lucide-react';
import { useState } from 'react';
import { useRoute } from '@/utils/route';

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
    product_id: number;
    quantity: number;
    unit_price: number;
}

export default function EditQuote({ quote, customers, products }: { quote: any; customers: Customer[]; products: Product[] }) {
    const route = useRoute();
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState(
        quote.items.map((item: any) => ({
            product_id: item.product_id,
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

    const handleAddItem = () => {
        setItems([...items, { product_id: '', quantity: 1, unit_price: 0 }]);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_: any, i: number) => i !== index));
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems: any[] = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const handleProductChange = (index: number, productId: string) => {
        const product = products.find((p: any) => p.id === parseInt(productId));
        if (product) {
            handleItemChange(index, 'product_id', parseInt(productId));
            handleItemChange(index, 'unit_price', product.selling_price);
        }
    };

    const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0);
    const tax = subtotal * 0.18;
    const total = subtotal + tax;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        router.put(route('quotes.update', { quote: quote.id }), {
            ...formData,
            items: items.filter((item: any) => item.product_id),
        });
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">Modifier le devis</h1>}>
            <Head title="Modifier le devis" />

            <form onSubmit={handleSubmit} className="grid gap-4 xl:grid-cols-3">
                <section className="space-y-4 xl:col-span-2">
                    {/* Client et Dates */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <div className="mb-4 flex items-center gap-2 text-white">
                            <FileText className="size-5 text-amber-300" />
                            <h2 className="text-lg font-semibold">Informations devis</h2>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-slate-200 mb-2">Client</label>
                                <div className="rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200">
                                    {quote.customer.name}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-200 mb-2">Date du devis *</label>
                                <input
                                    type="date"
                                    value={formData.quote_date}
                                    onChange={(e) => setFormData({ ...formData, quote_date: e.target.value })}
                                    className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-200 mb-2">Date d'expiration *</label>
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
                                <h2 className="text-lg font-semibold">Articles</h2>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-sm text-slate-200 transition-colors hover:bg-white/5"
                            >
                                <Plus className="size-3.5" />
                                Ajouter
                            </button>
                        </div>

                        <div className="space-y-3">
                            {items.map((item: any, index: number) => (
                                <div key={index} className="flex gap-2 items-end">
                                    <select
                                        value={item.product_id}
                                        onChange={(e) => handleProductChange(index, e.target.value)}
                                        className="flex-1 rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 text-sm focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                    >
                                        <option value="">Sélectionner produit</option>
                                        {products.map((p: any) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </select>

                                    <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                                        placeholder="Qté"
                                        className="w-20 rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 text-sm focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                    />

                                    <input
                                        type="number"
                                        step="0.01"
                                        value={item.unit_price}
                                        onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value))}
                                        placeholder="Prix"
                                        className="w-24 rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 text-sm focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                    />

                                    <div className="text-right w-28">
                                        <p className="font-semibold text-slate-200 text-sm">
                                            {(item.quantity * item.unit_price).toFixed(2)}€
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

                    {/* Notes et Conditions */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <h2 className="mb-4 text-lg font-semibold text-white">Notes et conditions</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-200 mb-2">Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows={2}
                                    className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 text-sm focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                    placeholder="Notes internes..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-200 mb-2">Conditions de paiement</label>
                                <textarea
                                    value={formData.terms}
                                    onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                                    rows={2}
                                    className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 text-sm focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                    placeholder="Conditions commerciales..."
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Résumé */}
                <aside className="xl:col-span-1">
                    <div className="sticky top-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                        <div className="mb-4 flex items-center gap-2 text-white">
                            <Calculator className="size-5 text-amber-300" />
                            <h2 className="text-lg font-semibold">Résumé</h2>
                        </div>

                        <div className="space-y-3 border-b border-white/10 pb-4 mb-4">
                            <div className="flex justify-between text-slate-200">
                                <span className="text-sm">Sous-total:</span>
                                <span className="font-semibold">{subtotal.toFixed(2)}€</span>
                            </div>
                            <div className="flex justify-between text-slate-200">
                                <span className="text-sm">TVA (18%):</span>
                                <span className="font-semibold">{tax.toFixed(2)}€</span>
                            </div>
                        </div>

                        <div className="flex justify-between mb-6">
                            <span className="font-semibold text-white">Total:</span>
                            <span className="text-2xl font-bold text-amber-300">{total.toFixed(2)}€</span>
                        </div>

                        <div className="space-y-3">
                            <button
                                type="submit"
                                disabled={loading || items.every((i: any) => !i.product_id)}
                                className="w-full rounded-lg bg-amber-300 px-4 py-2.5 font-semibold text-slate-950 transition-colors hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Mise à jour...' : 'Mettre à jour'}
                            </button>
                            <a
                                href={route('quotes.index')}
                                className="flex items-center justify-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5"
                            >
                                <ArrowLeft className="size-4" />
                                Retour
                            </a>
                        </div>
                    </div>
                </aside>
            </form>
        </AuthenticatedLayout>
    );
}
