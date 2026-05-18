import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState, useMemo } from 'react';
import { RefreshCw, TrendingUp, AlertTriangle } from 'lucide-react';
import { useRoute } from '@/utils/route';

interface Shop {
    id: number;
    name: string;
}

interface Category {
    id: number;
    name: string;
    color?: string;
    icon?: string;
}

interface Subcategory {
    id: number;
    name: string;
    category_id: number;
}

interface Props {
    shops: Shop[];
    categories: Category[];
    subcategories: Subcategory[];
}

export default function ProductsCreate({ shops, categories, subcategories }: Props) {
    const route = useRoute();

    const { props } = usePage();
    const activeShop = props.activeShop as { id: number; name: string } | null;
    
    const scannedBarcode = new URLSearchParams(window.location.search).get('barcode') ?? '';

    const { data, setData, post, processing, errors } = useForm({
        shop_id: activeShop?.id.toString() || shops[0]?.id.toString() || '',
        category_id: '',
        subcategory_id: '',
        name: '',
        sku: '',
        barcode: scannedBarcode,
        brand: '',
        description: '',
        purchase_price: '',
        selling_price: '',
        tax_rate: '',
        stock_quantity: '0',
        min_stock_alert: '',
        unit: 'piece',
        image: null as File | null,
        track_stock: true,
    });

    const onSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('products.store'));
    };

    // Générer un code-barres temporaire (sera régénéré côté serveur)
    const generateTempBarcode = () => {
        const prefix = '2';
        const company = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        const product = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const barcode12 = prefix + company + product;
        
        // Calculer le checksum EAN-13
        let sum = 0;
        for (let i = 0; i < 12; i++) {
            const digit = parseInt(barcode12[i]);
            sum += (i % 2 === 0) ? digit : digit * 3;
        }
        const checksum = (10 - (sum % 10)) % 10;
        
        setData('barcode', barcode12 + checksum);
    };

    // Les catégories sont globales (prédéfinies par la plateforme)
    const filteredCategories = categories;

    // Filtrer les sous-catégories par catégorie sélectionnée (mémorisé)
    const filteredSubcategories = useMemo(() => {
        return data.category_id
            ? subcategories.filter((sub) => sub.category_id === Number(data.category_id))
            : [];
    }, [data.category_id, subcategories]);

    // Calcul de la marge bénéficiaire
    const profitMargin = useMemo(() => {
        const purchase = parseFloat(data.purchase_price) || 0;
        const selling = parseFloat(data.selling_price) || 0;
        if (purchase === 0) return { amount: selling, percentage: 100 };
        const amount = selling - purchase;
        const percentage = ((amount / purchase) * 100);
        return { amount, percentage };
    }, [data.purchase_price, data.selling_price]);

    // Preview de l'image
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('image', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <AuthenticatedLayout
            header={<h1 className="text-xl font-semibold text-white">Nouveau produit</h1>}
        >
            <Head title="Nouveau produit" />

            <form
                onSubmit={onSubmit}
                className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6"
            >
                <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-1 text-sm text-slate-200 md:col-span-2">
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
                        {errors.shop_id && <span className="text-xs text-red-400">{errors.shop_id}</span>}
                    </label>

                    <label className="space-y-1 text-sm text-slate-200">
                        <span>Nom *</span>
                        <input
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                        />
                        {errors.name && <span className="text-xs text-red-400">{errors.name}</span>}
                    </label>

                    <label className="space-y-1 text-sm text-slate-200">
                        <span>SKU (généré automatiquement)</span>
                        <input
                            value={data.sku}
                            onChange={(e) => setData('sku', e.target.value)}
                            placeholder="Sera généré automatiquement"
                            className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-400"
                        />
                        <p className="text-xs text-slate-400">
                            Laissez vide pour générer automatiquement
                        </p>
                        {errors.sku && <span className="text-xs text-red-400">{errors.sku}</span>}
                    </label>

                    <label className="space-y-1 text-sm text-slate-200">
                        <span>Code-barres (généré automatiquement)</span>
                        <div className="flex gap-2">
                            <input
                                value={data.barcode}
                                onChange={(e) => setData('barcode', e.target.value)}
                                placeholder="Sera généré automatiquement"
                                className="flex-1 rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-400"
                            />
                            <button
                                type="button"
                                onClick={generateTempBarcode}
                                className="flex items-center gap-2 rounded-lg border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-amber-300 hover:bg-amber-300/20"
                                title="Générer un aperçu"
                            >
                                <RefreshCw className="size-4" />
                                Aperçu
                            </button>
                        </div>
                        <p className="text-xs text-slate-400">
                            {scannedBarcode
                                ? 'Code scanné — complétez les informations puis enregistrez'
                                : 'Le code-barres final sera généré automatiquement lors de la sauvegarde'}
                        </p>
                        {errors.barcode && <span className="text-xs text-red-400">{errors.barcode}</span>}
                    </label>

                    <label className="space-y-1 text-sm text-slate-200">
                        <span>Catégorie</span>
                        <select
                            value={data.category_id}
                            onChange={(e) => setData('category_id', e.target.value)}
                            className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                        >
                            <option value="">Sélectionner une catégorie</option>
                            {filteredCategories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                        {errors.category_id && <span className="text-xs text-red-400">{errors.category_id}</span>}
                    </label>

                    <label className="space-y-1 text-sm text-slate-200">
                        <span>Sous-catégorie</span>
                        <select
                            value={data.subcategory_id}
                            onChange={(e) => setData('subcategory_id', e.target.value)}
                            className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                            disabled={!data.category_id}
                        >
                            <option value="">Sélectionner une sous-catégorie</option>
                            {filteredSubcategories.map((subcategory) => (
                                <option key={subcategory.id} value={subcategory.id}>
                                    {subcategory.name}
                                </option>
                            ))}
                        </select>
                        {errors.subcategory_id && <span className="text-xs text-red-400">{errors.subcategory_id}</span>}
                    </label>

                    <label className="space-y-1 text-sm text-slate-200">
                        <span>Marque</span>
                        <input
                            value={data.brand}
                            onChange={(e) => setData('brand', e.target.value)}
                            placeholder="Ex: Bosch, Stanley, Makita..."
                            className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                        />
                        {errors.brand && <span className="text-xs text-red-400">{errors.brand}</span>}
                    </label>

                    <label className="space-y-1 text-sm text-slate-200">
                        <span>Unité</span>
                        <select
                            value={data.unit}
                            onChange={(e) => setData('unit', e.target.value)}
                            className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                        >
                            <option value="piece">Pièce</option>
                            <option value="kg">Kilogramme</option>
                            <option value="g">Gramme</option>
                            <option value="l">Litre</option>
                            <option value="ml">Millilitre</option>
                            <option value="m">Mètre</option>
                            <option value="m2">Mètre carré</option>
                            <option value="pack">Pack</option>
                        </select>
                        {errors.unit && <span className="text-xs text-red-400">{errors.unit}</span>}
                    </label>

                    <label className="space-y-1 text-sm text-slate-200">
                        <span>Prix d'achat *</span>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={data.purchase_price}
                            onChange={(e) => setData('purchase_price', e.target.value)}
                            className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                        />
                        {errors.purchase_price && <span className="text-xs text-red-400">{errors.purchase_price}</span>}
                    </label>

                    <label className="space-y-1 text-sm text-slate-200">
                        <span>Prix de vente *</span>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={data.selling_price}
                            onChange={(e) => setData('selling_price', e.target.value)}
                            className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                        />
                        {errors.selling_price && <span className="text-xs text-red-400">{errors.selling_price}</span>}
                    </label>

                    {/* Indicateur de marge bénéficiaire */}
                    <div className="space-y-1 text-sm text-slate-200 md:col-span-2">
                        <span>Marge bénéficiaire</span>
                        <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
                            profitMargin.percentage >= 20 
                                ? 'border-green-500/30 bg-green-500/10' 
                                : profitMargin.percentage >= 10 
                                    ? 'border-amber-500/30 bg-amber-500/10'
                                    : 'border-red-500/30 bg-red-500/10'
                        }`}>
                            {profitMargin.percentage >= 20 ? (
                                <TrendingUp className="size-5 text-green-400" />
                            ) : (
                                <AlertTriangle className={`size-5 ${profitMargin.percentage >= 10 ? 'text-amber-400' : 'text-red-400'}`} />
                            )}
                            <div className="flex-1">
                                <p className={`font-medium ${
                                    profitMargin.percentage >= 20 ? 'text-green-400' : profitMargin.percentage >= 10 ? 'text-amber-400' : 'text-red-400'
                                }`}>
                                    {profitMargin.amount.toFixed(2)} FCFA ({profitMargin.percentage.toFixed(1)}%)
                                </p>
                                <p className="text-xs text-slate-400">
                                    {profitMargin.percentage >= 20 
                                        ? 'Bonne marge' 
                                        : profitMargin.percentage >= 10 
                                            ? 'Marge moyenne' 
                                            : 'Marge faible - Vérifiez vos prix'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <label className="space-y-1 text-sm text-slate-200">
                        <span>Taux de TVA (%)</span>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={data.tax_rate}
                            onChange={(e) => setData('tax_rate', e.target.value)}
                            className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                        />
                        {errors.tax_rate && <span className="text-xs text-red-400">{errors.tax_rate}</span>}
                    </label>

                    <label className="space-y-1 text-sm text-slate-200">
                        <span>Stock initial</span>
                        <input
                            type="number"
                            value={data.stock_quantity}
                            onChange={(e) => setData('stock_quantity', e.target.value)}
                            className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                        />
                        {errors.stock_quantity && <span className="text-xs text-red-400">{errors.stock_quantity}</span>}
                    </label>

                    <label className="space-y-1 text-sm text-slate-200">
                        <span>Alerte stock minimum</span>
                        <input
                            type="number"
                            value={data.min_stock_alert}
                            onChange={(e) => setData('min_stock_alert', e.target.value)}
                            className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                        />
                        {errors.min_stock_alert && <span className="text-xs text-red-400">{errors.min_stock_alert}</span>}
                    </label>

                    <label className="space-y-1 text-sm text-slate-200 md:col-span-2">
                        <span>Description</span>
                        <textarea
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={3}
                            className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                        />
                        {errors.description && <span className="text-xs text-red-400">{errors.description}</span>}
                    </label>

                    <label className="space-y-1 text-sm text-slate-200 md:col-span-2">
                        <span>Image</span>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                        />
                        {imagePreview && (
                            <div className="mt-2">
                                <img 
                                    src={imagePreview} 
                                    alt="Aperçu" 
                                    className="h-32 w-32 rounded-lg object-cover border border-white/15"
                                />
                            </div>
                        )}
                        <p className="text-xs text-slate-400">
                            Formats acceptés: JPG, PNG, GIF (max 2 Mo)
                        </p>
                        {errors.image && <span className="text-xs text-red-400">{errors.image}</span>}
                    </label>

                    <label className="flex items-center gap-2 text-sm text-slate-200 md:col-span-2">
                        <input
                            type="checkbox"
                            checked={data.track_stock}
                            onChange={(e) => setData('track_stock', e.target.checked)}
                            className="rounded border-white/15 bg-slate-900/70"
                        />
                        <span>Suivre le stock</span>
                    </label>
                </div>

                <div className="flex items-center justify-end gap-2">
                    <Link
                        href={route('products.index')}
                        className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
                    >
                        Annuler
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:opacity-50"
                    >
                        {processing ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
