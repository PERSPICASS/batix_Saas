import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useEffect, useState } from 'react';
import { Plus, Minus, Trash2, CreditCard, CloudOff, RefreshCw, AlertTriangle } from 'lucide-react';
import Currency, { useShopSettings } from '@/Components/Currency';
import ProductImage from '@/Components/ProductImage';
import { useRoute } from '@/utils/route';
import { useLocale } from '@/contexts/LocaleContext';
import { enqueue, newClientUuid } from '@/offline/outbox';
import { useOfflineSales } from '@/offline/useOfflineSales';
import { cacheCatalog, readCatalog } from '@/offline/catalog';

/**
 * Format attendu par la validation `date` de Laravel côté synchronisation.
 * `toISOString()` produirait de l'UTC et décalerait toutes les ventes hors ligne d'un
 * fuseau — ici on transmet l'heure locale de la boutique, celle du ticket.
 */
function formatSaleDate(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');

    return (
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
        `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    );
}

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

interface PreorderPrefill {
    id: number;
    customer_id: number | null;
    product_id: number;
    quantity: number;
    unit_price: number;
    deposit_amount: number;
    remaining_balance: number;
}

interface Props {
    shops: Shop[];
    customers: Customer[];
    products: Product[];
    preorder?: PreorderPrefill | null;
}

interface CartItem {
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
    subtotal: number;
}

export default function SalesCreate({ shops, customers, products, preorder }: Props) {
    const { t } = useLocale();
    const route = useRoute();
    const { formatCurrency } = useShopSettings();

    const { props } = usePage();
    const activeShop = props.activeShop as { id: number; name: string } | null;

    const [cart, setCart] = useState<CartItem[]>([]);
    const [justQueued, setJustQueued] = useState(false);
    const {
        pendingCount,
        rejected,
        syncing,
        needsLogin,
        syncNow,
        refresh: refreshQueue,
    } = useOfflineSales(route('sales.sync-offline'));
    const [searchProduct, setSearchProduct] = useState('');
    const [searchCustomer, setSearchCustomer] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        shop_id: activeShop?.id.toString() || shops[0]?.id.toString() || '',
        customer_id: preorder?.customer_id ? preorder.customer_id.toString() : '',
        payment_method: 'cash' as string,
        amount_paid: preorder && preorder.deposit_amount > 0 ? preorder.deposit_amount.toString() : '',
        discount_amount: '0',
        credit_due_date: '',
        notes: preorder
            ? `Vente issue de la pré-commande #${preorder.id}${preorder.deposit_amount > 0 ? ` — acompte déjà versé : ${formatCurrency(preorder.deposit_amount)}` : ''}`
            : '',
        items: [] as any[],
        preorder_id: preorder?.id.toString() || '',
    });

    // Pré-remplir le panier et le client avec les infos de la pré-commande, une seule fois au montage
    useEffect(() => {
        if (!preorder) return;

        const product = products.find((p) => p.id === preorder.product_id);
        if (product) {
            setCart([
                {
                    product_id: product.id,
                    product_name: product.name,
                    quantity: preorder.quantity,
                    unit_price: preorder.unit_price,
                    tax_rate: parseFloat(product.tax_rate || '0'),
                    subtotal: preorder.quantity * preorder.unit_price,
                },
            ]);
        }

        if (preorder.customer_id) {
            const customer = customers.find((c) => c.id === preorder.customer_id);
            if (customer) {
                setSearchCustomer(customer.name);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
            alert(t.sales.form.addProductValidation);
            return;
        }

        const items = cart.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price, // Envoyer le prix négocié
        }));

        // Hors ligne : la vente part dans la file locale plutôt que dans le vide. Elle
        // sera rejouée au retour du réseau, avec son heure réelle et un identifiant
        // stable qui empêche tout double enregistrement.
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            queueOffline(items);
            return;
        }

        // Utiliser transform pour ajouter les items au moment de l'envoi
        post(route('sales.store'), {
            preserveScroll: true,
            onBefore: () => {
                data.items = items;
                return true;
            },
        });
    };

    const queueOffline = async (items: { product_id: number; quantity: number; unit_price: number }[]) => {
        const total = calculateTotal();

        await enqueue({
            client_uuid: newClientUuid(),
            shop_id: Number(data.shop_id),
            customer_id: data.customer_id ? Number(data.customer_id) : null,
            payment_method: data.payment_method,
            amount_paid: parseFloat(data.amount_paid || '0') || total,
            discount_amount: parseFloat(data.discount_amount || '0'),
            // L'heure de la vente, pas celle de la synchronisation : sans cela les
            // rapports du gérant dateraient toutes les ventes du retour du réseau.
            sale_date: formatSaleDate(new Date()),
            notes: data.notes || null,
            items,
            label: cart.map((i) => i.product_name).join(', '),
            total,
        });

        setCart([]);
        setData('amount_paid', '');
        await refreshQueue();
        setJustQueued(true);
    };

    // Le catalogue local sert de filet : si la page se charge sans produits alors que le
    // réseau est absent, le vendeur travaille sur la dernière version connue plutôt que
    // sur une liste vide.
    const [cachedProducts, setCachedProducts] = useState<Product[]>([]);
    const shopId = Number(data.shop_id);

    useEffect(() => {
        if (!shopId) return;

        if (products.length > 0) {
            // Rafraîchi à chaque affichage en ligne : c'est la seule alimentation du
            // catalogue, il n'y a pas d'appel de synchronisation dédié.
            cacheCatalog(products, shopId);
            return;
        }

        readCatalog(shopId).then(setCachedProducts);
    }, [products, shopId]);

    const availableProducts = products.length > 0 ? products : cachedProducts;

    const filteredProducts = availableProducts.filter(
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
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-slate-900 dark:text-white">{t.sales.checkout}</h1>}>
            <Head title={t.sales.form.createTitle} />

            {justQueued && (
                <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                    <CloudOff className="mt-0.5 size-5 shrink-0" />
                    <p>{t.layout.offline.savedLocally}</p>
                </div>
            )}

            {pendingCount > 0 && (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {t.layout.offline.queued(pendingCount)}
                    </p>
                    <button
                        type="button"
                        onClick={syncNow}
                        disabled={syncing}
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-slate-900"
                    >
                        <RefreshCw className={`size-4 ${syncing ? 'animate-spin' : ''}`} />
                        {syncing ? t.layout.offline.syncing : t.layout.offline.syncNow}
                    </button>
                </div>
            )}

            {needsLogin && (
                <div className="mb-4 rounded-xl border border-orange-300 bg-orange-50 px-4 py-3 text-sm text-orange-900 dark:border-orange-500/40 dark:bg-orange-500/10 dark:text-orange-200">
                    {t.layout.offline.needsLogin}
                </div>
            )}

            {/* Une vente refusée a pourtant été encaissée au comptoir : elle doit rester
                visible jusqu'à ce qu'un humain tranche, jamais disparaître en silence. */}
            {rejected.length > 0 && (
                <div className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 dark:border-red-500/40 dark:bg-red-500/10">
                    <p className="flex items-center gap-2 text-sm font-semibold text-red-900 dark:text-red-200">
                        <AlertTriangle className="size-4" />
                        {t.layout.offline.rejectedTitle}
                    </p>
                    <p className="mt-1 text-xs text-red-800 dark:text-red-300">{t.layout.offline.rejectedHelp}</p>
                    <ul className="mt-2 space-y-1 text-xs text-red-900 dark:text-red-200">
                        {rejected.map((sale) => (
                            <li key={sale.client_uuid}>
                                <span className="font-medium">{sale.label ?? sale.client_uuid}</span>
                                {sale.error ? ` — ${sale.error}` : null}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-3">
                    {/* Sélection des produits */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-white/5">
                            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">{t.common.misc.products}</h2>

                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder={t.sales.form.productSearch}
                                    value={searchProduct}
                                    onChange={(e) => setSearchProduct(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-slate-900 dark:border-white/15 dark:bg-slate-900/70 dark:text-white"
                                />
                            </div>

                            <div className="grid gap-2 max-h-96 overflow-y-auto">
                                {filteredProducts.map((product) => (
                                    <div key={product.id}>
                                        {/* Produit parent — cliquable seulement s'il n'a pas de déclinaisons */}
                                        {product.has_variations && product.variations.length > 0 ? (
                                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-slate-900/50">
                                                <div className="flex items-center gap-3">
                                                    <ProductImage src={product.image} name={product.name} thumbnailClass="size-10" />
                                                    <div>
                                                        <p className="font-medium text-slate-900 dark:text-white">{product.name}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                            SKU: {product.sku} • <span className="text-amber-600 dark:text-amber-400">{product.variations.length} {product.variations.length > 1 ? t.sales.form.variationsPlural : t.sales.form.variation}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                {/* Déclinaisons */}
                                                <div className="mt-2 ml-4 space-y-1 border-l-2 border-amber-300 dark:border-amber-300/30 pl-3">
                                                    {product.variations.map((variation) => (
                                                        <button
                                                            key={variation.id}
                                                            type="button"
                                                            onClick={() => addToCart(variation)}
                                                            className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-left hover:bg-gray-100 transition dark:border-white/5 dark:bg-slate-800/60 dark:hover:bg-white/10"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <ProductImage src={variation.image ?? product.image} name={variation.name} thumbnailClass="size-7" />
                                                                <div>
                                                                    <p className="text-sm font-medium text-slate-900 dark:text-white">{variation.name}</p>
                                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                        SKU: {variation.sku} • Stock: {variation.stock_quantity}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <p className="ml-3 shrink-0 font-semibold text-amber-600 dark:text-amber-300 text-sm">
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
                                                className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 text-left hover:bg-gray-100 transition dark:border-white/10 dark:bg-slate-900/50 dark:hover:bg-white/10"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <ProductImage src={product.image} name={product.name} thumbnailClass="size-10" />
                                                    <div>
                                                        <p className="font-medium text-slate-900 dark:text-white">{product.name}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                            SKU: {product.sku} • Stock: {product.stock_quantity}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0 ml-3">
                                                    <p className="font-semibold text-amber-600 dark:text-amber-300">
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
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-white/5">
                            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">{t.sales.form.cart}</h2>

                            {cart.length === 0 ? (
                                <p className="py-8 text-center text-slate-500 dark:text-slate-400">{t.sales.form.emptyCart}</p>
                            ) : (
                                <div className="space-y-2">
                                    {cart.map((item) => (
                                        <div
                                            key={item.product_id}
                                            className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-slate-900/50"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                        {item.product_name}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFromCart(item.product_id)}
                                                    className="rounded p-1 text-rose-600 hover:bg-rose-100 dark:text-rose-300 dark:hover:bg-rose-300/10 transition"
                                                >
                                                    <Trash2 className="size-4" />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 items-center mb-3">
                                                <div>
                                                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{t.common.form.unitPrice}</label>
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
                                                        className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-slate-900 dark:border-white/15 dark:bg-slate-900/70 dark:text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{t.common.form.quantity}</label>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                updateQuantity(
                                                                    item.product_id,
                                                                    item.quantity - 1
                                                                )
                                                            }
                                                            className="flex items-center justify-center rounded border border-gray-300 bg-white p-2 text-slate-700 hover:bg-gray-100 transition dark:border-white/15 dark:bg-slate-900/70 dark:text-white dark:hover:bg-white/10"
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
                                                            className="w-full rounded border border-gray-300 bg-white px-2 py-2 text-center text-sm text-slate-900 dark:border-white/15 dark:bg-slate-900/70 dark:text-white"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                updateQuantity(
                                                                    item.product_id,
                                                                    item.quantity + 1
                                                                )
                                                            }
                                                            className="flex items-center justify-center rounded border border-gray-300 bg-white p-2 text-slate-700 hover:bg-gray-100 transition dark:border-white/15 dark:bg-slate-900/70 dark:text-white dark:hover:bg-white/10"
                                                        >
                                                            <Plus className="size-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                            </div>
                                            <div>
                                                <label className="block text-xs text-slate-500 dark:text-slate-400 ">{t.common.form.total}</label>
                                                <p className="text-sm font-semibold text-amber-600 dark:text-amber-300 py-1.5">
                                                    <Currency amount={item.subtotal} />
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="mt-4 space-y-2 border-t border-gray-200 dark:border-white/10 pt-4">
                                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                                    <span>{t.common.form.subtotal}</span>
                                    <span>
                                        <Currency amount={cart.reduce((sum, item) => sum + item.subtotal, 0)} />
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                                    <span>{t.sales.form.tax}</span>
                                    <span>
                                        <Currency amount={cart
                                            .reduce(
                                                (sum, item) =>
                                                    sum + (item.subtotal * item.tax_rate) / 100,
                                                0
                                            )} />
                                    </span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-amber-600 dark:text-amber-300">
                                    <span>{t.common.form.total}</span>
                                    <span><Currency amount={calculateTotal()} /></span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4 dark:border-white/10 dark:bg-white/5">
                            <label className="block space-y-1 text-sm text-slate-700 dark:text-slate-200">
                                <span>{t.common.form.shopField} *</span>
                                <select
                                    value={data.shop_id}
                                    disabled
                                    className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-slate-500 cursor-not-allowed dark:border-white/10 dark:bg-slate-800/50 dark:text-slate-400"
                                >
                                    {shops.map((shop) => (
                                        <option key={shop.id} value={shop.id}>
                                            {shop.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {t.common.form.shopHint}
                                </p>
                                {errors.shop_id && (
                                    <span className="text-xs text-red-600 dark:text-red-400">{errors.shop_id}</span>
                                )}
                            </label>

                            <label className="block space-y-1 text-sm text-slate-700 dark:text-slate-200">
                                <span>{t.sales.form.customer}</span>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder={t.sales.form.searchCustomer}
                                        value={searchCustomer}
                                        onChange={(e) => {
                                            setSearchCustomer(e.target.value);
                                            setShowCustomerDropdown(true);
                                        }}
                                        onFocus={() => setShowCustomerDropdown(true)}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 dark:border-white/15 dark:bg-slate-900/70 dark:text-white"
                                    />
                                    {showCustomerDropdown && (
                                        <div className="absolute top-full left-0 right-0 z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-white/15 dark:bg-slate-800">
                                            <button
                                                type="button"
                                                className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-700"
                                                onClick={() => {
                                                    setData('customer_id', '');
                                                    setSearchCustomer('');
                                                    setShowCustomerDropdown(false);
                                                }}
                                            >
                                                {t.common.misc.anonymous}
                                            </button>
                                            {customers
                                                .filter((customer) =>
                                                    customer.name.toLowerCase().includes(searchCustomer.toLowerCase())
                                                )
                                                .map((customer) => (
                                                    <button
                                                        key={customer.id}
                                                        type="button"
                                                        className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-700"
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

                            <label className="block space-y-1 text-sm text-slate-700 dark:text-slate-200">
                                <span>{t.sales.form.paymentMethod} *</span>
                                <select
                                    value={data.payment_method}
                                    onChange={(e) => setData('payment_method', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 dark:border-white/15 dark:bg-slate-900/70 dark:text-white"
                                >
                                    <option value="cash">{t.common.payment.cash}</option>
                                    <option value="card">{t.common.payment.card}</option>
                                    <option value="transfer">{t.common.payment.transfer}</option>
                                    <option value="check">{t.common.payment.check}</option>
                                    <option value="mobile">{t.common.payment.mobile}</option>
                                    <option value="multiple">{t.common.payment.multiple}</option>
                                    <option value="credit">{t.sales.form.creditWithDeposit}</option>
                                </select>
                            </label>

                            <label className="block space-y-1 text-sm text-slate-700 dark:text-slate-200">
                                <span>{isCredit() ? t.sales.form.depositPaid : t.sales.form.amountPaid} *</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max={isCredit() ? calculateTotal() : undefined}
                                    value={data.amount_paid}
                                    onChange={(e) => setData('amount_paid', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 dark:border-white/15 dark:bg-slate-900/70 dark:text-white"
                                />
                                {errors.amount_paid && (
                                    <span className="text-xs text-red-600 dark:text-red-400">{errors.amount_paid}</span>
                                )}
                            </label>

                            {/* Reste à payer — vente à crédit */}
                            {isCredit() && data.amount_paid !== '' && (
                                <div className="rounded-lg bg-amber-50 border border-amber-300 p-3 space-y-1 dark:bg-amber-500/15 dark:border-amber-400/30">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600 dark:text-slate-300">{t.sales.form.deposit}</span>
                                        <span className="font-semibold text-amber-600 dark:text-amber-300">
                                            <Currency amount={parseFloat(data.amount_paid || '0')} />
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-rose-600 dark:text-rose-300 font-medium">{t.sales.form.amountRemaining}</span>
                                        <span className="font-bold text-rose-600 dark:text-rose-300">
                                            <Currency amount={calculateRemaining()} />
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Échéance crédit */}
                            {isCredit() && (
                                <label className="block space-y-1 text-sm text-slate-700 dark:text-slate-200">
                                    <span className="flex items-center gap-1.5">
                                        <CreditCard className="size-3.5" />
                                        {t.common.form.dueDate} {t.common.misc.optional}
                                    </span>
                                    <input
                                        type="date"
                                        value={data.credit_due_date}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => setData('credit_due_date', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 dark:border-white/15 dark:bg-slate-900/70 dark:text-white"
                                    />
                                    {errors.credit_due_date && (
                                        <span className="text-xs text-red-600 dark:text-red-400">{errors.credit_due_date}</span>
                                    )}
                                </label>
                            )}

                            {/* Monnaie rendue — vente comptant */}
                            {!isCredit() && data.amount_paid && (
                                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-500/20 p-3 text-center">
                                    <p className="text-sm text-slate-600 dark:text-slate-300">{t.sales.form.changeDisplay}</p>
                                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-300">
                                        <Currency amount={calculateChange()} />
                                    </p>
                                </div>
                            )}

                            {errors.items && (
                                <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-600 dark:border-rose-400/30 dark:bg-rose-500/15 dark:text-rose-300">
                                    {errors.items}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Link
                                    href={route('sales.index')}
                                    className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-center text-sm text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
                                >
                                    {t.common.actions.cancel}
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing || cart.length === 0}
                                    className="flex-1 rounded-lg bg-amber-300 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50"
                                >
                                    {processing ? t.common.actions.processing : t.sales.form.validateSale}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
