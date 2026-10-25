import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { ReactNode } from 'react';
import { AlertTriangle, ArrowLeft, Layers, Pencil } from 'lucide-react';
import { useRoute } from '@/utils/route';
import { useLocale } from '@/contexts/LocaleContext';
import ProductImage from '@/Components/ProductImage';
import StockMovementTypeBadge from '@/Components/StockMovementTypeBadge';

interface Props {
    product: {
        id: number;
        name: string;
        sku: string | null;
        brand: string | null;
        image: string | null;
        description: string | null;
        unit: string | null;
        selling_price: string;
        purchase_price: string | null;
        tax_rate: string | null;
        min_stock_alert: number | null;
        track_stock: boolean;
        has_variations: boolean;
        variations_count: number;
        // nullable : catégorie ou parent supprimés depuis.
        category: { name: string } | null;
        subcategory: { name: string } | null;
        parent: { id: number; name: string } | null;
    };
    pricing: { unit_cost: number; price_with_tax: number; tax_rate: number; unit_margin: number; margin_rate: number | null };
    stock: { counter: number; depots: { depot: string | null; quantity: number }[]; total: number; value: number; low: boolean };
    elsewhere: { shop: string; stock: number; min: number | null }[];
    sales30: { quantity: number; revenue: number; margin: number };
    movements: { id: number; type: string; quantity: number; reason: string | null; movement_date: string; user: { name: string } | null }[];
    canEdit: boolean;
    currencySymbol: string;
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
            <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
            {children}
        </section>
    );
}

function Row({ label, children, strong }: { label: string; children: ReactNode; strong?: boolean }) {
    return (
        <div className="flex items-baseline justify-between gap-3 border-b border-gray-100 py-2 text-sm last:border-0 dark:border-white/5">
            <span className="text-slate-500 dark:text-slate-400">{label}</span>
            <span className={`text-right ${strong ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-200'}`}>{children}</span>
        </div>
    );
}

/** La fiche d'un produit, en lecture : ce qu'on cherche avant de vendre, commander ou transférer. */
export default function ProductShow({ product, pricing, stock, elsewhere, sales30, movements, canEdit, currencySymbol }: Props) {
    const route = useRoute();
    const { t, locale } = useLocale();
    const s = t.products.show;
    const money = (n: number | string | null) => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(n ?? 0))} ${currencySymbol}`;
    const count = (n: number) => new Intl.NumberFormat('fr-FR').format(n);

    return (
        <AuthenticatedLayout header={<h1 className="truncate text-xl font-semibold text-slate-900 dark:text-white">{product.name}</h1>}>
            <Head title={product.name} />

            <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link href={route('products.index')} className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                        <ArrowLeft className="size-4" /> {t.nav.products}
                    </Link>
                    <div className="flex flex-wrap gap-2">
                        {product.has_variations && (
                            <Link href={route('products.variations.index', { product: product.id })}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10">
                                <Layers className="size-4" /> {s.variations} ({product.variations_count})
                            </Link>
                        )}
                        {canEdit && (
                            <Link href={route('products.edit', { product: product.id })}
                                className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-amber-200">
                                <Pencil className="size-4" /> {s.edit}
                            </Link>
                        )}
                    </div>
                </div>

                {/* En-tête : qui est ce produit */}
                <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
                    <ProductImage src={product.image} name={product.name} thumbnailClass="size-16" />
                    <div className="min-w-0 flex-1">
                        <p className="text-lg font-semibold text-slate-900 dark:text-white">{product.name}</p>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs">
                            {product.sku && <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-slate-700 dark:bg-white/10 dark:text-slate-200">{product.sku}</span>}
                            {product.brand && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700 dark:bg-white/10 dark:text-slate-200">{product.brand}</span>}
                            {product.category && <span className="rounded-full bg-amber-300/15 px-2 py-0.5 text-amber-700 dark:text-amber-300">{product.category.name}{product.subcategory ? ` › ${product.subcategory.name}` : ''}</span>}
                            {product.parent && (
                                <Link href={route('products.show', { product: product.parent.id })} className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700 underline-offset-2 hover:underline dark:bg-white/10 dark:text-slate-200">
                                    {s.variationOf(product.parent.name)}
                                </Link>
                            )}
                        </div>
                        {product.description && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{product.description}</p>}
                    </div>
                </section>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <Panel title={s.pricing}>
                        <Row label={s.sellingPrice} strong>{money(product.selling_price)}</Row>
                        <Row label={s.priceWithTax}>{money(pricing.price_with_tax)}</Row>
                        <Row label={s.unitCost}>{money(pricing.unit_cost)}</Row>
                        <Row label={s.purchasePrice}>{product.purchase_price !== null ? money(product.purchase_price) : s.unknown}</Row>
                        <Row label={s.unitMargin} strong>
                            <span className={pricing.unit_margin < 0 ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}>{money(pricing.unit_margin)}</span>
                            {pricing.margin_rate !== null && <span className="block text-xs font-normal text-slate-500 dark:text-slate-400">{s.marginRate(String(pricing.margin_rate).replace('.', ','))}</span>}
                        </Row>
                        <Row label={s.taxRate}>{`${String(pricing.tax_rate).replace('.', ',')} %`}</Row>
                    </Panel>

                    <Panel title={s.stock}>
                        {!product.track_stock ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400">{s.notTracked}</p>
                        ) : (
                            <>
                                <Row label={s.counter} strong>
                                    {count(stock.counter)}{product.unit ? ` ${product.unit}` : ''}
                                    {stock.low && <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-300"><AlertTriangle className="size-3.5" /> {s.lowStock}</span>}
                                </Row>
                                {stock.depots.map((row, i) => <Row key={i} label={row.depot ?? s.unknown}>{count(row.quantity)}</Row>)}
                                {stock.depots.length > 0 && <Row label={s.total} strong>{count(stock.total)}</Row>}
                                <Row label={s.value}>{money(stock.value)}</Row>
                                <Row label={s.threshold}>{product.min_stock_alert ?? s.noThreshold}</Row>
                            </>
                        )}
                    </Panel>

                    <Panel title={s.sales30}>
                        <Row label={s.soldQuantity} strong>{count(sales30.quantity)}</Row>
                        <Row label={s.revenue}>{money(sales30.revenue)}</Row>
                        <Row label={s.margin}><span className={sales30.margin < 0 ? 'text-rose-500' : ''}>{money(sales30.margin)}</span></Row>
                    </Panel>

                    <Panel title={s.elsewhere}>
                        {elsewhere.length === 0 ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400">{s.elsewhereNone}</p>
                        ) : (
                            elsewhere.map((row) => (
                                <Row key={row.shop} label={row.shop}>
                                    <span className={row.min !== null && row.stock <= row.min ? 'text-amber-600 dark:text-amber-300' : ''}>{count(row.stock)}</span>
                                </Row>
                            ))
                        )}
                    </Panel>
                </div>

                <Panel title={s.history}>
                    {movements.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">{s.noHistory}</p>
                    ) : (
                        <ul className="divide-y divide-gray-100 dark:divide-white/5">
                            {movements.map((movement) => (
                                <li key={movement.id}>
                                    <Link href={route('stocks.show', { stockMovement: movement.id })} className="flex items-center justify-between gap-3 py-2.5 hover:opacity-80">
                                        <div className="min-w-0">
                                            <StockMovementTypeBadge type={movement.type} reason={movement.reason} />
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                {new Date(movement.movement_date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB')} · {movement.user?.name ?? s.unknown}
                                            </p>
                                        </div>
                                        <span className={`shrink-0 font-semibold ${movement.quantity > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                                            {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                    <Link href={`${route('stocks.index')}?product_id=${product.id}`} className="mt-3 inline-block text-sm font-medium text-amber-600 hover:underline dark:text-amber-300">
                        {s.seeAll}
                    </Link>
                </Panel>
            </div>
        </AuthenticatedLayout>
    );
}
