import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRightLeft, Building2, History, Mail, MapPin, Pencil, Phone, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useRoute } from '@/utils/route';
import Currency from '@/Components/Currency';
import InputError from '@/Components/InputError';
import { useLocale } from '@/contexts/LocaleContext';

interface Shop {
    id: number;
    name: string;
    description: string | null;
    address: string | null;
    city: string | null;
    postal_code: string | null;
    country: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    tax_id: string | null;
    currency: string;
    default_tax_rate: number | string | null;
    invoice_prefix: string | null;
}

interface TransferableProduct {
    id: number;
    name: string;
    sku: string | null;
    stock_quantity: number;
}

interface Props {
    shop: Shop;
    stats: {
        products: number;
        stock_units: number;
        stock_value: number;
        low_stock: number;
    };
    otherShops: Array<{ id: number; name: string }>;
    transferableProducts: TransferableProduct[];
}

export default function ShopShow({ shop, stats, otherShops, transferableProducts }: Props) {
    const route = useRoute();
    const { t } = useLocale();

    // Recherche + panier plutôt qu'un champ par produit : une quincaillerie de plusieurs
    // centaines de références rendait le formulaire illisible.
    const [search, setSearch] = useState('');
    const [cart, setCart] = useState<number[]>([]);

    const matches = useMemo(() => {
        const needle = search.trim().toLowerCase();

        if (!needle) return [];

        return transferableProducts
            .filter((product) => !cart.includes(product.id))
            .filter(
                (product) =>
                    product.name.toLowerCase().includes(needle) ||
                    (product.sku ?? '').toLowerCase().includes(needle),
            )
            .slice(0, 8);
    }, [search, transferableProducts, cart]);

    const inCart = useMemo(
        () => transferableProducts.filter((product) => cart.includes(product.id)),
        [transferableProducts, cart],
    );

    const addToCart = (product: TransferableProduct) => {
        setCart((current) => [...current, product.id]);
        setSearch('');
    };

    const removeFromCart = (productId: number) => {
        setCart((current) => current.filter((id) => id !== productId));
    };

    // Tout le catalogue, ou une sélection. Ouvrir une boutique appelle le premier ;
    // compléter un assortiment appelle le second.
    const [copyAll, setCopyAll] = useState(false);

    const { data, setData, post, processing, errors, reset, transform } = useForm({
        target_shop_id: '',
    });

    // Une copie ne transporte pas de quantité : seuls les produits à recréer comptent.
    const selected = useMemo(() => cart, [cart]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        // Les quantités vivent dans leur propre état, chaque ligne se saisissant
        // indépendamment ; `transform` les rattache à l'envoi.
        transform((formData) =>
            copyAll
                ? { ...formData, all_products: true }
                : { ...formData, product_ids: selected },
        );

        post(route('shops.transfer', { shop: shop.id }), {
            onSuccess: () => {
                setCart([]);
                setSearch('');
                setCopyAll(false);
                reset();
            },
        });
    };

    const detail = (icon: React.ReactNode, value: string | null) =>
        value ? (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                {icon}
                <span>{value}</span>
            </div>
        ) : null;

    return (
        <AuthenticatedLayout
            header={<h1 className="text-xl font-semibold text-slate-900 dark:text-white">{shop.name}</h1>}
        >
            <Head title={shop.name} />

            <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link
                        href={route('shops.index')}
                        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                    >
                        <ArrowLeft className="size-4" /> {t.common.actions.back}
                    </Link>
                    <div className="flex items-center gap-2">
                    <Link
                        href={route('shops.transfers', { shop: shop.id })}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
                    >
                        <History className="size-4" /> {t.shops.transfer.history}
                    </Link>
                    <Link
                        href={route('shops.edit', { shop: shop.id })}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
                    >
                        <Pencil className="size-4" /> {t.common.actions.edit}
                    </Link>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    {[
                        { label: t.shops.stats.products, value: stats.products },
                        { label: t.shops.stats.stockUnits, value: stats.stock_units },
                        { label: t.shops.stats.lowStock, value: stats.low_stock },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5"
                        >
                            <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
                            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                        </div>
                    ))}
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                        <p className="text-sm text-slate-500 dark:text-slate-400">{t.shops.stats.stockValue}</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                            <Currency amount={stats.stock_value} />
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
                        <h2 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                            <Building2 className="size-5 text-amber-400" /> {t.shops.identity}
                        </h2>
                        {detail(<MapPin className="size-4" />, [shop.address, shop.postal_code, shop.city, shop.country].filter(Boolean).join(', ') || null)}
                        {detail(<Phone className="size-4" />, shop.phone)}
                        {detail(<Mail className="size-4" />, shop.email)}
                        {shop.description && (
                            <p className="text-sm text-slate-500 dark:text-slate-400">{shop.description}</p>
                        )}
                    </div>

                    <div className="space-y-2 rounded-2xl border border-gray-200 bg-white p-5 text-sm dark:border-white/10 dark:bg-white/5">
                        <h2 className="mb-2 font-semibold text-slate-900 dark:text-white">{t.shops.settings}</h2>
                        <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">{t.settings.fields.currency}</span>
                            <span className="text-slate-900 dark:text-slate-200">{shop.currency}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">{t.settings.fields.defaultTaxRate}</span>
                            <span className="text-slate-900 dark:text-slate-200">
                                {shop.default_tax_rate !== null ? `${Number(shop.default_tax_rate)} %` : '—'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">{t.settings.fields.taxId}</span>
                            <span className="text-slate-900 dark:text-slate-200">{shop.tax_id || '—'}</span>
                        </div>
                    </div>
                </div>

                {/* Transfert vers une autre boutique du compte. Un produit appartenant à
                    une seule boutique, l'opération sort le stock d'un côté et le fait
                    entrer de l'autre, sur l'homologue retrouvé par SKU ou par nom. */}
                {otherShops.length > 0 && (
                    <form onSubmit={submit} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
                        <h2 className="mb-1 flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                            <ArrowRightLeft className="size-5 text-amber-400" /> {t.shops.transfer.title}
                        </h2>
                        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">{t.shops.transfer.help}</p>

                        {transferableProducts.length === 0 ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400">{t.shops.transfer.nothingToTransfer}</p>
                        ) : (
                            <>
                                <div className="mb-4 max-w-sm">
                                    <label htmlFor="target_shop_id" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                        {t.shops.transfer.destination} *
                                    </label>
                                    <select
                                        id="target_shop_id"
                                        value={data.target_shop_id}
                                        onChange={(e) => setData('target_shop_id', e.target.value)}
                                        className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                                    >
                                        <option value="">{t.shops.transfer.selectDestination}</option>
                                        {otherShops.map((other) => (
                                            <option key={other.id} value={other.id}>
                                                {other.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.target_shop_id} className="mt-1" />
                                </div>

                                <label className="mb-4 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                                    <input
                                        type="checkbox"
                                        checked={copyAll}
                                        onChange={(e) => setCopyAll(e.target.checked)}
                                        className="rounded border-gray-300 text-amber-400 focus:ring-amber-300 dark:border-white/20 dark:bg-slate-900"
                                    />
                                    {t.shops.transfer.copyAll.replace(':count', String(transferableProducts.length))}
                                </label>

                                {/* Recherche : on ajoute au panier, on n'affiche pas
                                    tout le catalogue. */}
                                <div className={`relative mb-4 max-w-lg ${copyAll ? 'hidden' : ''}`}>
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder={t.shops.transfer.searchPlaceholder}
                                        className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200 dark:placeholder-slate-500"
                                    />

                                    {matches.length > 0 && (
                                        <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-white/10 dark:bg-slate-900">
                                            {matches.map((product) => (
                                                <li key={product.id}>
                                                    <button
                                                        type="button"
                                                        onClick={() => addToCart(product)}
                                                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-slate-700 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-white/10"
                                                    >
                                                        <span>
                                                            {product.name}
                                                            {product.sku && (
                                                                <span className="ml-2 text-xs text-slate-400">{product.sku}</span>
                                                            )}
                                                        </span>
                                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                                            {t.products.columns.stock} {product.stock_quantity}
                                                        </span>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                {copyAll ? (
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {t.shops.transfer.copyAllHelp}
                                    </p>
                                ) : inCart.length === 0 ? (
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {t.shops.transfer.emptyCart}
                                    </p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                                                <tr>
                                                    <th className="py-2">{t.products.columns.name}</th>
                                                    <th className="py-2 text-right">{t.products.columns.stock}</th>
                                                    <th className="py-2"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                                                {inCart.map((product) => (
                                                    <tr key={product.id}>
                                                        <td className="py-2 text-slate-900 dark:text-slate-200">
                                                            {product.name}
                                                            {product.sku && (
                                                                <span className="ml-2 text-xs text-slate-400">{product.sku}</span>
                                                            )}
                                                        </td>
                                                        <td className="py-2 text-right text-slate-600 dark:text-slate-300">
                                                            {product.stock_quantity}
                                                        </td>
                                                        <td className="py-2 text-right">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeFromCart(product.id)}
                                                                className="rounded p-1 text-slate-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-500/20 dark:hover:text-red-400"
                                                            >
                                                                <X className="size-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={processing || (!copyAll && selected.length === 0) || !data.target_shop_id}
                                    className="mt-4 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {t.shops.transfer.submit}
                                </button>
                            </>
                        )}
                    </form>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
