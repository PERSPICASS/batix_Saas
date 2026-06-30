import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useRoute } from '@/utils/route';

interface Customer {
    id: number;
    name: string;
    email?: string;
}

interface Product {
    id: number;
    name: string;
    price: number;
}

export default function CreateQuote({ customers, products }: { customers: Customer[]; products: Product[] }) {
    const route = useRoute();
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState([{ product_id: '', quantity: 1, unit_price: 0 }]);
    const [formData, setFormData] = useState({
        customer_id: '',
        quote_date: new Date().toISOString().split('T')[0],
        expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: '',
        terms: '',
    });

    const handleAddItem = () => {
        setItems([...items, { product_id: '', quantity: 1, unit_price: 0 }]);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const handleProductChange = (index: number, productId: string) => {
        const product = products.find((p: any) => p.id === parseInt(productId));
        if (product) {
            handleItemChange(index, 'product_id', parseInt(productId));
            handleItemChange(index, 'unit_price', product.price);
        }
    };

    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const tax = subtotal * 0.18;
    const total = subtotal + tax;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        router.post(route('quotes.store'), {
            ...formData,
            items: items.filter(item => item.product_id),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">Créer un devis</h1>
                    <a href={route('quotes.index')} className="flex items-center gap-2 text-blue-400 hover:text-blue-300">
                        <ArrowLeft size={18} />
                        Retour
                    </a>
                </div>
            }
        >
            <Head title="Créer un devis" />

            <div className="max-w-4xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Client */}
                    <div className="bg-slate-800/50 p-6 rounded-lg space-y-4">
                        <h2 className="text-lg font-semibold text-white">Informations client</h2>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Client *</label>
                            <select
                                value={formData.customer_id}
                                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                                required
                                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white"
                            >
                                <option value="">Sélectionner un client</option>
                                {customers.map((c: any) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="bg-slate-800/50 p-6 rounded-lg space-y-4">
                        <h2 className="text-lg font-semibold text-white">Dates</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Date du devis *</label>
                                <input
                                    type="date"
                                    value={formData.quote_date}
                                    onChange={(e) => setFormData({ ...formData, quote_date: e.target.value })}
                                    className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Date d'expiration *</label>
                                <input
                                    type="date"
                                    value={formData.expiry_date}
                                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                                    className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Produits */}
                    <div className="bg-slate-800/50 p-6 rounded-lg space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-white">Articles</h2>
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
                            >
                                <Plus size={18} />
                                Ajouter article
                            </button>
                        </div>

                        <div className="space-y-3">
                            {items.map((item, index) => (
                                <div key={index} className="flex gap-3 items-end">
                                    <select
                                        value={item.product_id}
                                        onChange={(e) => handleProductChange(index, e.target.value)}
                                        className="flex-1 rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white text-sm"
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
                                        className="w-24 rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white text-sm"
                                    />

                                    <input
                                        type="number"
                                        step="0.01"
                                        value={item.unit_price}
                                        onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value))}
                                        placeholder="Prix"
                                        className="w-32 rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white text-sm"
                                    />

                                    <div className="text-right w-32">
                                        <p className="font-semibold text-white">{(item.quantity * item.unit_price).toFixed(2)}€</p>
                                    </div>

                                    {items.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem(index)}
                                            className="p-2 text-red-400 hover:bg-red-500/10 rounded"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Résumé */}
                    <div className="bg-slate-800/50 p-6 rounded-lg space-y-3">
                        <div className="flex justify-between text-white">
                            <span>Sous-total:</span>
                            <span>{subtotal.toFixed(2)}€</span>
                        </div>
                        <div className="flex justify-between text-white">
                            <span>TVA (18%):</span>
                            <span>{tax.toFixed(2)}€</span>
                        </div>
                        <div className="border-t border-slate-600 pt-3 flex justify-between text-lg font-bold text-green-400">
                            <span>Total:</span>
                            <span>{total.toFixed(2)}€</span>
                        </div>
                    </div>

                    {/* Notes & Conditions */}
                    <div className="bg-slate-800/50 p-6 rounded-lg space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Notes</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows={3}
                                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white text-sm"
                                placeholder="Notes internes..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Conditions de paiement</label>
                            <textarea
                                value={formData.terms}
                                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                                rows={3}
                                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white text-sm"
                                placeholder="Conditions commerciales..."
                            />
                        </div>
                    </div>

                    {/* Boutons */}
                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={loading || !formData.customer_id || items.every(i => !i.product_id)}
                            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Création...' : 'Créer le devis'}
                        </button>
                        <a
                            href={route('quotes.index')}
                            className="flex-1 border border-slate-600 text-slate-300 px-6 py-3 rounded-lg font-medium hover:bg-slate-800 text-center"
                        >
                            Annuler
                        </a>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
