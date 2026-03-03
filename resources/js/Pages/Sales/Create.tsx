import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { Plus, Trash2, Scan } from 'lucide-react';
import Currency from '@/Components/Currency';
import { useRoute } from '@/utils/route';

interface Shop {
    id: number;
    name: string;
}

interface Customer {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    sku: string;
    selling_price: string;
    tax_rate: string;
    stock_quantity: number;
}

interface Props {
    shops: Shop[];
    customers: Customer[];
    products: Product[];
}

interface CartItem {
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
    subtotal: number;
}

export default function SalesCreate({ shops, customers, products }: Props) {
    const route = useRoute();

    const { props } = usePage();
    const activeShop = props.activeShop as { id: number; name: string } | null;
    
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchProduct, setSearchProduct] = useState('');

    const { data, setData, post, processing, errors } = useForm({
        shop_id: activeShop?.id.toString() || shops[0]?.id.toString() || '',
        customer_id: '',
        payment_method: 'cash' as string,
        amount_paid: '',
        discount_amount: '0',
        notes: '',
        items: [] as any[],
    });

    const addToCart = (product: Product) => {
        const existingItem = cart.find((item) => item.product_id === product.id);

        if (existingItem) {
            setCart(
                cart.map((item) =>
                    item.product_id === product.id
                        ? {
                              ...item,
                              quantity: item.quantity + 1,
                              subtotal: (item.quantity + 1) * item.unit_price,
                          }
                        : item
                )
            );
        } else {
            setCart([
                ...cart,
                {
                    product_id: product.id,
                    product_name: product.name,
                    quantity: 1,
                    unit_price: parseFloat(product.selling_price),
                    tax_rate: parseFloat(product.tax_rate || '0'),
                    subtotal: parseFloat(product.selling_price),
                },
            ]);
        }
    };

    const removeFromCart = (productId: number) => {
        setCart(cart.filter((item) => item.product_id !== productId));
    };

    const updateQuantity = (productId: number, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }

        setCart(
            cart.map((item) =>
                item.product_id === productId
                    ? {
                          ...item,
                          quantity,
                          subtotal: quantity * item.unit_price,
                      }
                    : item
            )
        );
    };

    const updateUnitPrice = (productId: number, newPrice: number) => {
        setCart(
            cart.map((item) =>
                item.product_id === productId
                    ? {
                          ...item,
                          unit_price: newPrice,
                          subtotal: item.quantity * newPrice,
                      }
                    : item
            )
        );
    };

    const calculateTotal = () => {
        const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
        const taxAmount = cart.reduce(
            (sum, item) => sum + (item.subtotal * item.tax_rate) / 100,
            0
        );
        const discount = parseFloat(data.discount_amount || '0');
        return subtotal + taxAmount - discount;
    };

    const calculateChange = () => {
        const amountPaid = parseFloat(data.amount_paid || '0');
        const total = calculateTotal();
        return Math.max(0, amountPaid - total);
    };

    const onSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        if (cart.length === 0) {
            alert('Veuillez ajouter au moins un produit au panier');
            return;
        }

        const items = cart.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price, // Envoyer le prix négocié
        }));

        // Utiliser transform pour ajouter les items au moment de l'envoi
        post(route('sales.store'), {
            preserveScroll: true,
            onBefore: () => {
                data.items = items;
                return true;
            },
        });
    };

    const filteredProducts = products.filter(
        (product) =>
            product.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
            product.sku?.toLowerCase().includes(searchProduct.toLowerCase())
    );

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">Caisse</h1>}>
            <Head title="Nouvelle vente" />

            <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-3">
                    {/* Sélection des produits */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                            <h2 className="mb-4 text-lg font-semibold text-white">Produits</h2>

                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder="Rechercher un produit (nom, SKU)..."
                                    value={searchProduct}
                                    onChange={(e) => setSearchProduct(e.target.value)}
                                    className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-4 py-2 text-white"
                                />
                            </div>

                            <div className="grid gap-2 max-h-96 overflow-y-auto">
                                {filteredProducts.map((product) => (
                                    <button
                                        key={product.id}
                                        type="button"
                                        onClick={() => addToCart(product)}
                                        className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900/50 p-3 text-left hover:bg-white/10 transition"
                                    >
                                        <div>
                                            <p className="font-medium text-white">{product.name}</p>
                                            <p className="text-xs text-slate-400">
                                                SKU: {product.sku} • Stock: {product.stock_quantity}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-amber-300">
                                                <Currency amount={parseFloat(product.selling_price)} />
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Panier et paiement */}
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                            <h2 className="mb-4 text-lg font-semibold text-white">Panier</h2>

                            {cart.length === 0 ? (
                                <p className="py-8 text-center text-slate-400">Panier vide</p>
                            ) : (
                                <div className="space-y-2">
                                    {cart.map((item) => (
                                        <div
                                            key={item.product_id}
                                            className="rounded-lg border border-white/10 bg-slate-900/50 p-3"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-white">
                                                        {item.product_name}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFromCart(item.product_id)}
                                                    className="rounded p-1 text-rose-300 hover:bg-rose-300/10 transition"
                                                >
                                                    <Trash2 className="size-4" />
                                                </button>
                                            </div>
                                            
                                            <div className="grid grid-cols-3 gap-2 items-center">
                                                <div>
                                                    <label className="block text-xs text-slate-400 mb-1">Prix unitaire</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.unit_price}
                                                        onChange={(e) =>
                                                            updateUnitPrice(
                                                                item.product_id,
                                                                parseFloat(e.target.value) || 0
                                                            )
                                                        }
                                                        className="w-full rounded border border-white/15 bg-slate-900/70 px-2 py-1.5 text-sm text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-slate-400 mb-1">Quantité</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) =>
                                                            updateQuantity(
                                                                item.product_id,
                                                                parseInt(e.target.value) || 0
                                                            )
                                                        }
                                                        className="w-full rounded border border-white/15 bg-slate-900/70 px-2 py-1.5 text-center text-sm text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-slate-400 mb-1">Total</label>
                                                    <p className="text-sm font-semibold text-amber-300 py-1.5">
                                                        <Currency amount={item.subtotal} />
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                                <div className="flex justify-between text-sm text-slate-300">
                                    <span>Sous-total</span>
                                    <span>
                                        <Currency amount={cart.reduce((sum, item) => sum + item.subtotal, 0)} />
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm text-slate-300">
                                    <span>TVA</span>
                                    <span>
                                        <Currency amount={cart
                                            .reduce(
                                                (sum, item) =>
                                                    sum + (item.subtotal * item.tax_rate) / 100,
                                                0
                                            )} />
                                    </span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-amber-300">
                                    <span>Total</span>
                                    <span><Currency amount={calculateTotal()} /></span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
                            <label className="block space-y-1 text-sm text-slate-200">
                                <span>Boutique *</span>
                                <select
                                    value={data.shop_id}
                                    disabled
                                    className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2 text-slate-400 cursor-not-allowed"
                                >
                                    {shops.map((shop) => (
                                        <option key={shop.id} value={shop.id}>
                                            {shop.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-400">
                                    Boutique sélectionnée via le switcher
                                </p>
                                {errors.shop_id && (
                                    <span className="text-xs text-red-400">{errors.shop_id}</span>
                                )}
                            </label>

                            <label className="block space-y-1 text-sm text-slate-200">
                                <span>Client</span>
                                <select
                                    value={data.customer_id}
                                    onChange={(e) => setData('customer_id', e.target.value)}
                                    className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                                >
                                    <option value="">Anonyme</option>
                                    {customers.map((customer) => (
                                        <option key={customer.id} value={customer.id}>
                                            {customer.name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="block space-y-1 text-sm text-slate-200">
                                <span>Mode de paiement *</span>
                                <select
                                    value={data.payment_method}
                                    onChange={(e) => setData('payment_method', e.target.value)}
                                    className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                                >
                                    <option value="cash">Espèces</option>
                                    <option value="card">Carte</option>
                                    <option value="transfer">Virement</option>
                                    <option value="check">Chèque</option>
                                    <option value="mobile">Mobile</option>
                                    <option value="multiple">Multiple</option>
                                </select>
                            </label>

                            <label className="block space-y-1 text-sm text-slate-200">
                                <span>Montant payé *</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={data.amount_paid}
                                    onChange={(e) => setData('amount_paid', e.target.value)}
                                    className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                                />
                                {errors.amount_paid && (
                                    <span className="text-xs text-red-400">{errors.amount_paid}</span>
                                )}
                            </label>

                            {data.amount_paid && (
                                <div className="rounded-lg bg-emerald-500/20 p-3 text-center">
                                    <p className="text-sm text-slate-300">Monnaie à rendre</p>
                                    <p className="text-2xl font-bold text-emerald-300">
                                        <Currency amount={calculateChange()} />
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Link
                                    href={route('sales.index')}
                                    className="flex-1 rounded-lg border border-white/15 px-4 py-3 text-center text-sm text-slate-200 hover:bg-white/10"
                                >
                                    Annuler
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing || cart.length === 0}
                                    className="flex-1 rounded-lg bg-amber-300 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50"
                                >
                                    {processing ? 'Traitement...' : 'Valider la vente'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
