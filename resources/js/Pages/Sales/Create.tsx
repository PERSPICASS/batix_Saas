import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { Plus, Minus, Trash2, CreditCard } from 'lucide-react';
import Currency from '@/Components/Currency';
import ProductImage from '@/Components/ProductImage';
import { useRoute } from '@/utils/route';
import { useLocale } from '@/contexts/LocaleContext';

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
    image: string | null;
    selling_price: string;
    tax_rate: string;
    stock_quantity: number;
    has_variations: boolean;
    variations: Array<{
        id: number;
        name: string;
        sku: string;
        image: string | null;
        selling_price: string;
        tax_rate: string;
        stock_quantity: number;
        has_variations: boolean;
        variations: [];
    }>;
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
    const { t } = useLocale();
    const route = useRoute();

    const { props } = usePage();
    const activeShop = props.activeShop as { id: number; name: string } | null;
    
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchProduct, setSearchProduct] = useState('');
    const [searchCustomer, setSearchCustomer] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        shop_id: activeShop?.id.toString() || shops[0]?.id.toString() || '',
        customer_id: '',
        payment_method: 'cash' as string,
        amount_paid: '',
        discount_amount: '0',
        credit_due_date: '',
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

    const isCredit = () => data.payment_method === 'credit';

    const calculateRemaining = () => {
        const total = calculateTotal();
        const amountPaid = parseFloat(data.amount_paid || '0');
        return Math.max(0, total - amountPaid);
    };

    const calculateChange = () => {
        if (isCredit()) return 0;
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
            product.sku?.toLowerCase().includes(searchProduct.toLowerCase()) ||
            product.variations?.some(
                (v) =>
                    v.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
                    v.sku?.toLowerCase().includes(searchProduct.toLowerCase())
            )
    );

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">Caisse</h1>}>
            <Head title={t.sales.form.createTitle} />

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
                                    <div key={product.id}>
                                        {/* Produit parent — cliquable seulement s'il n'a pas de déclinaisons */}
                                        {product.has_variations && product.variations.length > 0 ? (
                                            <div className="rounded-lg border border-white/10 bg-slate-900/50 p-3">
                                                <div className="flex items-center gap-3">
                                                    <ProductImage src={product.image} name={product.name} thumbnailClass="size-10" />
                                                    <div>
                                                        <p className="font-medium text-white">{product.name}</p>
                                                        <p className="text-xs text-slate-400">
                                                            SKU: {product.sku} • <span className="text-amber-400">{product.variations.length} déclinaison{product.variations.length > 1 ? 's' : ''}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                {/* Déclinaisons */}
                                                <div className="mt-2 ml-4 space-y-1 border-l-2 border-amber-300/30 pl-3">
                                                    {product.variations.map((variation) => (
                                                        <button
                                                            key={variation.id}
                                                            type="button"
                                                            onClick={() => addToCart(variation)}
                                                            className="flex w-full items-center justify-between rounded-lg border border-white/5 bg-slate-800/60 px-3 py-2 text-left hover:bg-white/10 transition"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <ProductImage src={variation.image ?? product.image} name={variation.name} thumbnailClass="size-7" />
                                                                <div>
                                                                    <p className="text-sm font-medium text-white">{variation.name}</p>
                                                                    <p className="text-xs text-slate-400">
                                                                        SKU: {variation.sku} • Stock: {variation.stock_quantity}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <p className="ml-3 shrink-0 font-semibold text-amber-300 text-sm">
                                                                <Currency amount={parseFloat(variation.selling_price)} />
                                                            </p>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => addToCart(product)}
                                                className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-slate-900/50 p-3 text-left hover:bg-white/10 transition"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <ProductImage src={product.image} name={product.name} thumbnailClass="size-10" />
                                                    <div>
                                                        <p className="font-medium text-white">{product.name}</p>
                                                        <p className="text-xs text-slate-400">
                                                            SKU: {product.sku} • Stock: {product.stock_quantity}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0 ml-3">
                                                    <p className="font-semibold text-amber-300">
                                                        <Currency amount={parseFloat(product.selling_price)} />
                                                    </p>
                                                </div>
                                            </button>
                                        )}
                                    </div>
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

                                            <div className="grid grid-cols-2 gap-2 items-center mb-3">
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
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                updateQuantity(
                                                                    item.product_id,
                                                                    item.quantity - 1
                                                                )
                                                            }
                                                            className="flex items-center justify-center rounded border border-white/15 bg-slate-900/70 p-2 text-white hover:bg-white/10 transition"
                                                        >
                                                            <Minus className="size-4" />
                                                        </button>
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
                                                            className="w-full rounded border border-white/15 bg-slate-900/70 px-2 py-2 text-center text-sm text-white"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                updateQuantity(
                                                                    item.product_id,
                                                                    item.quantity + 1
                                                                )
                                                            }
                                                            className="flex items-center justify-center rounded border border-white/15 bg-slate-900/70 p-2 text-white hover:bg-white/10 transition"
                                                        >
                                                            <Plus className="size-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                            </div>
                                            <div>
                                                <label className="block text-xs text-slate-400 ">Total</label>
                                                <p className="text-sm font-semibold text-amber-300 py-1.5">
                                                    <Currency amount={item.subtotal} />
                                                </p>
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
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Rechercher ou sélectionner un client..."
                                        value={searchCustomer}
                                        onChange={(e) => {
                                            setSearchCustomer(e.target.value);
                                            setShowCustomerDropdown(true);
                                        }}
                                        onFocus={() => setShowCustomerDropdown(true)}
                                        className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                                    />
                                    {showCustomerDropdown && (
                                        <div className="absolute top-full left-0 right-0 z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-white/15 bg-slate-800 shadow-lg">
                                            <button
                                                type="button"
                                                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-700"
                                                onClick={() => {
                                                    setData('customer_id', '');
                                                    setSearchCustomer('');
                                                    setShowCustomerDropdown(false);
                                                }}
                                            >
                                                Anonyme
                                            </button>
                                            {customers
                                                .filter((customer) =>
                                                    customer.name.toLowerCase().includes(searchCustomer.toLowerCase())
                                                )
                                                .map((customer) => (
                                                    <button
                                                        key={customer.id}
                                                        type="button"
                                                        className="w-full px-3 py-2 text-left text-sm hover:bg-slate-700"
                                                        onClick={() => {
                                                            setData('customer_id', customer.id.toString());
                                                            setSearchCustomer(customer.name);
                                                            setShowCustomerDropdown(false);
                                                        }}
                                                    >
                                                        {customer.name}
                                                    </button>
                                                ))}
                                        </div>
                                    )}
                                    {data.customer_id && (
                                        <input type="hidden" name="customer_id" value={data.customer_id} />
                                    )}
                                </div>
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
                                    <option value="credit">Crédit (avec acompte)</option>
                                </select>
                            </label>

                            <label className="block space-y-1 text-sm text-slate-200">
                                <span>{isCredit() ? 'Acompte versé *' : 'Montant payé *'}</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max={isCredit() ? calculateTotal() : undefined}
                                    value={data.amount_paid}
                                    onChange={(e) => setData('amount_paid', e.target.value)}
                                    className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                                />
                                {errors.amount_paid && (
                                    <span className="text-xs text-red-400">{errors.amount_paid}</span>
                                )}
                            </label>

                            {/* Reste à payer — vente à crédit */}
                            {isCredit() && data.amount_paid !== '' && (
                                <div className="rounded-lg bg-amber-500/15 border border-amber-400/30 p-3 space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-300">Acompte</span>
                                        <span className="font-semibold text-amber-300">
                                            <Currency amount={parseFloat(data.amount_paid || '0')} />
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-rose-300 font-medium">Reste à payer</span>
                                        <span className="font-bold text-rose-300">
                                            <Currency amount={calculateRemaining()} />
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Échéance crédit */}
                            {isCredit() && (
                                <label className="block space-y-1 text-sm text-slate-200">
                                    <span className="flex items-center gap-1.5">
                                        <CreditCard className="size-3.5" />
                                        Date d'échéance (optionnel)
                                    </span>
                                    <input
                                        type="date"
                                        value={data.credit_due_date}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => setData('credit_due_date', e.target.value)}
                                        className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                                    />
                                    {errors.credit_due_date && (
                                        <span className="text-xs text-red-400">{errors.credit_due_date}</span>
                                    )}
                                </label>
                            )}

                            {/* Monnaie rendue — vente comptant */}
                            {!isCredit() && data.amount_paid && (
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
