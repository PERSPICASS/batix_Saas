import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useLocale } from '@/contexts/LocaleContext';

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
    selling_price: number;
}

interface Props {
    shops: Shop[];
    customers: Customer[];
    products: Product[];
}

export default function Create({ shops, customers, products }: Props) {
    const { t } = useLocale();
    const { data, setData, post, processing, errors } = useForm({
        shop_id: shops[0]?.id || '',
        customer_id: '',
        product_id: '',
        quantity_ordered: 1,
        unit_price: 0,
        expected_delivery_date: '',
        deposit_amount: 0,
        notes: '',
    });

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const handleProductChange = (productId: string) => {
        setData('product_id', productId);
        const product = products.find(p => p.id === parseInt(productId));
        if (product) {
            setSelectedProduct(product);
            setData('unit_price', product.selling_price);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
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
                    <h2 className="text-xl font-semibold text-white">Nouvelle pré-commande</h2>
                </div>
            }
        >
            <Head title="Créer une pré-commande" />

            <div className="max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Boutique */}
                    <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Boutique *
                        </label>
                        <select
                            value={data.shop_id}
                            onChange={(e) => setData('shop_id', e.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                            required
                        >
                            <option value="">Sélectionner une boutique</option>
                            {shops.map((shop) => (
                                <option key={shop.id} value={shop.id}>
                                    {shop.name}
                                </option>
                            ))}
                        </select>
                        {errors.shop_id && <p className="mt-1 text-xs text-red-400">{errors.shop_id}</p>}
                    </div>

                    {/* Client */}
                    <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Client *
                        </label>
                        <select
                            value={data.customer_id}
                            onChange={(e) => setData('customer_id', e.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                            required
                        >
                            <option value="">Sélectionner un client</option>
                            {customers.map((customer) => (
                                <option key={customer.id} value={customer.id}>
                                    {customer.name} ({customer.phone || customer.email})
                                </option>
                            ))}
                        </select>
                        {errors.customer_id && <p className="mt-1 text-xs text-red-400">{errors.customer_id}</p>}
                    </div>

                    {/* Produit */}
                    <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Produit *
                        </label>
                        <select
                            value={data.product_id}
                            onChange={(e) => handleProductChange(e.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                            required
                        >
                            <option value="">Sélectionner un produit</option>
                            {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                    {product.name} ({product.sku})
                                </option>
                            ))}
                        </select>
                        {errors.product_id && <p className="mt-1 text-xs text-red-400">{errors.product_id}</p>}
                    </div>

                    {/* Détails de la commande */}
                    <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Quantité *
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={data.quantity_ordered}
                                    onChange={(e) => setData('quantity_ordered', parseInt(e.target.value))}
                                    className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                    required
                                />
                                {errors.quantity_ordered && <p className="mt-1 text-xs text-red-400">{errors.quantity_ordered}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Prix unitaire *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.unit_price}
                                    onChange={(e) => setData('unit_price', parseFloat(e.target.value))}
                                    className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                    required
                                />
                                {errors.unit_price && <p className="mt-1 text-xs text-red-400">{errors.unit_price}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Date de livraison prévue *
                            </label>
                            <input
                                type="date"
                                value={data.expected_delivery_date}
                                onChange={(e) => setData('expected_delivery_date', e.target.value)}
                                className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                required
                            />
                            {errors.expected_delivery_date && <p className="mt-1 text-xs text-red-400">{errors.expected_delivery_date}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Montant d'acompte
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.deposit_amount}
                                onChange={(e) => setData('deposit_amount', parseFloat(e.target.value))}
                                className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                            />
                            {errors.deposit_amount && <p className="mt-1 text-xs text-red-400">{errors.deposit_amount}</p>}
                        </div>

                        {/* Résumé */}
                        {data.quantity_ordered > 0 && data.unit_price > 0 && (
                            <div className="border-t border-white/10 pt-4 mt-4">
                                <div className="flex justify-between text-sm text-slate-300 mb-2">
                                    <span>Montant total:</span>
                                    <span className="font-semibold text-white">{(data.quantity_ordered * data.unit_price).toFixed(2)} FCFA</span>
                                </div>
                                <div className="flex justify-between text-sm text-slate-300">
                                    <span>Reste à payer:</span>
                                    <span className="font-semibold text-amber-300">{((data.quantity_ordered * data.unit_price) - data.deposit_amount).toFixed(2)} FCFA</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Notes
                        </label>
                        <textarea
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            rows={3}
                            className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                            placeholder="Ajouter des notes sur cette pré-commande..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <a
                            href={route('preorders.index')}
                            className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-center text-sm font-medium text-slate-300 hover:bg-white/5 transition"
                        >
                            Annuler
                        </a>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50 transition"
                        >
                            {processing ? 'Création en cours...' : 'Créer la pré-commande'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
