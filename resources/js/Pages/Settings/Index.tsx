import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { useRoute } from '@/utils/route';
import { 
    Store, 
    MapPin, 
    Phone, 
    Mail, 
    Globe, 
    FileText, 
    DollarSign, 
    Percent,
    Hash,
    Save,
    AlertCircle
} from 'lucide-react';

interface Currency {
    code: string;
    name: string;
    symbol: string;
}

interface Shop {
    id: number;
    name: string;
    description?: string;
    address?: string;
    city?: string;
    postal_code?: string;
    country?: string;
    phone?: string;
    email?: string;
    website?: string;
    tax_id?: string;
    currency: string;
    default_tax_rate?: number;
    invoice_prefix?: string;
    invoice_footer?: string;
}

interface Props {
    shop: Shop | null;
    currencies: Currency[];
    countries: string[];
    error?: string;
}

export default function Settings({ shop, currencies, countries, error }: Props) {
    const route = useRoute();

    const { data, setData, patch, processing, errors, recentlySuccessful } = useForm({
        name: shop?.name || '',
        description: shop?.description || '',
        address: shop?.address || '',
        city: shop?.city || '',
        postal_code: shop?.postal_code || '',
        country: shop?.country || 'Maroc',
        phone: shop?.phone || '',
        email: shop?.email || '',
        website: shop?.website || '',
        tax_id: shop?.tax_id || '',
        currency: shop?.currency || 'USD',
        default_tax_rate: shop?.default_tax_rate || '',
        invoice_prefix: shop?.invoice_prefix || '',
        invoice_footer: shop?.invoice_footer || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('settings.update'));
    };

    if (error || !shop) {
        return (
            <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">Paramètres</h1>}>
                <Head title="Paramètres" />
                <div className="mx-auto max-w-4xl">
                    <div className="rounded-2xl border border-red-500/20 bg-red-900/10 p-6">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-6 w-6 text-red-400" />
                            <p className="text-red-200">{error || 'Aucune boutique associée'}</p>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">Paramètres de la Boutique</h1>}>
            <Head title="Paramètres" />

            <div className="mx-auto max-w-4xl">
                <form onSubmit={submit} className="space-y-6">
                    {/* Informations générales */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                        <div className="mb-6 flex items-center gap-2">
                            <Store className="size-5 text-amber-300" />
                            <h2 className="text-lg font-semibold text-white">Informations générales</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-200">
                                    Nom de la boutique *
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                    required
                                />
                                {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-slate-200">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                    className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                />
                                {errors.description && <p className="mt-1 text-sm text-red-400">{errors.description}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Coordonnées */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                        <div className="mb-6 flex items-center gap-2">
                            <Phone className="size-5 text-amber-300" />
                            <h2 className="text-lg font-semibold text-white">Coordonnées</h2>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-slate-200">
                                    Téléphone
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                />
                                {errors.phone && <p className="mt-1 text-sm text-red-400">{errors.phone}</p>}
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-200">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                />
                                {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
                            </div>

                            <div className="md:col-span-2">
                                <label htmlFor="website" className="block text-sm font-medium text-slate-200">
                                    Site web
                                </label>
                                <input
                                    type="url"
                                    id="website"
                                    value={data.website}
                                    onChange={(e) => setData('website', e.target.value)}
                                    placeholder="https://example.com"
                                    className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                />
                                {errors.website && <p className="mt-1 text-sm text-red-400">{errors.website}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Adresse */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                        <div className="mb-6 flex items-center gap-2">
                            <MapPin className="size-5 text-amber-300" />
                            <h2 className="text-lg font-semibold text-white">Adresse</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="address" className="block text-sm font-medium text-slate-200">
                                    Adresse
                                </label>
                                <input
                                    type="text"
                                    id="address"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                />
                                {errors.address && <p className="mt-1 text-sm text-red-400">{errors.address}</p>}
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div>
                                    <label htmlFor="city" className="block text-sm font-medium text-slate-200">
                                        Ville
                                    </label>
                                    <input
                                        type="text"
                                        id="city"
                                        value={data.city}
                                        onChange={(e) => setData('city', e.target.value)}
                                        className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                    />
                                    {errors.city && <p className="mt-1 text-sm text-red-400">{errors.city}</p>}
                                </div>

                                <div>
                                    <label htmlFor="postal_code" className="block text-sm font-medium text-slate-200">
                                        Code postal
                                    </label>
                                    <input
                                        type="text"
                                        id="postal_code"
                                        value={data.postal_code}
                                        onChange={(e) => setData('postal_code', e.target.value)}
                                        className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                    />
                                    {errors.postal_code && <p className="mt-1 text-sm text-red-400">{errors.postal_code}</p>}
                                </div>

                                <div>
                                    <label htmlFor="country" className="block text-sm font-medium text-slate-200">
                                        Pays
                                    </label>
                                    <select
                                        id="country"
                                        value={data.country}
                                        onChange={(e) => setData('country', e.target.value)}
                                        className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                    >
                                        {countries.map((country) => (
                                            <option key={country} value={country}>
                                                {country}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.country && <p className="mt-1 text-sm text-red-400">{errors.country}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Fiscalité et devise */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                        <div className="mb-6 flex items-center gap-2">
                            <DollarSign className="size-5 text-amber-300" />
                            <h2 className="text-lg font-semibold text-white">Fiscalité et devise</h2>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label htmlFor="tax_id" className="block text-sm font-medium text-slate-200">
                                    Numéro fiscal (ICE/NIF)
                                </label>
                                <input
                                    type="text"
                                    id="tax_id"
                                    value={data.tax_id}
                                    onChange={(e) => setData('tax_id', e.target.value)}
                                    placeholder="Ex: 002345678000023"
                                    className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                />
                                {errors.tax_id && <p className="mt-1 text-sm text-red-400">{errors.tax_id}</p>}
                            </div>

                            <div>
                                <label htmlFor="currency" className="block text-sm font-medium text-slate-200">
                                    Devise *
                                </label>
                                <select
                                    id="currency"
                                    value={data.currency}
                                    onChange={(e) => setData('currency', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                    required
                                >
                                    {currencies.map((currency) => (
                                        <option key={currency.code} value={currency.code}>
                                            {currency.code} - {currency.name} ({currency.symbol})
                                        </option>
                                    ))}
                                </select>
                                {errors.currency && <p className="mt-1 text-sm text-red-400">{errors.currency}</p>}
                            </div>

                            <div className="md:col-span-2">
                                <label htmlFor="default_tax_rate" className="block text-sm font-medium text-slate-200">
                                    Taux de TVA par défaut (%)
                                </label>
                                <div className="relative mt-1">
                                    <input
                                        type="number"
                                        id="default_tax_rate"
                                        value={data.default_tax_rate}
                                        onChange={(e) => setData('default_tax_rate', e.target.value)}
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        placeholder="Ex: 20.00"
                                        className="block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 pr-10 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                    />
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                        <Percent className="h-5 w-5 text-slate-400" />
                                    </div>
                                </div>
                                {errors.default_tax_rate && <p className="mt-1 text-sm text-red-400">{errors.default_tax_rate}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Configuration des factures */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                        <div className="mb-6 flex items-center gap-2">
                            <FileText className="size-5 text-amber-300" />
                            <h2 className="text-lg font-semibold text-white">Configuration des factures</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="invoice_prefix" className="block text-sm font-medium text-slate-200">
                                    Préfixe des factures
                                </label>
                                <div className="relative mt-1">
                                    <input
                                        type="text"
                                        id="invoice_prefix"
                                        value={data.invoice_prefix}
                                        onChange={(e) => setData('invoice_prefix', e.target.value)}
                                        placeholder="Ex: INV, FAC"
                                        maxLength={10}
                                        className="block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 pl-10 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                    />
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <Hash className="h-5 w-5 text-slate-400" />
                                    </div>
                                </div>
                                <p className="mt-1 text-xs text-slate-400">
                                    Les factures seront numérotées: {data.invoice_prefix || 'INV'}-0001, {data.invoice_prefix || 'INV'}-0002, etc.
                                </p>
                                {errors.invoice_prefix && <p className="mt-1 text-sm text-red-400">{errors.invoice_prefix}</p>}
                            </div>

                            <div>
                                <label htmlFor="invoice_footer" className="block text-sm font-medium text-slate-200">
                                    Pied de page des factures
                                </label>
                                <textarea
                                    id="invoice_footer"
                                    value={data.invoice_footer}
                                    onChange={(e) => setData('invoice_footer', e.target.value)}
                                    rows={3}
                                    placeholder="Ex: Merci de votre confiance. Conditions de paiement: 30 jours"
                                    className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                />
                                {errors.invoice_footer && <p className="mt-1 text-sm text-red-400">{errors.invoice_footer}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Bouton de sauvegarde */}
                    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-6">
                        <div className="flex items-center gap-2">
                            {recentlySuccessful && (
                                <span className="text-sm text-green-400">✓ Paramètres enregistrés</span>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex items-center gap-2 rounded-lg bg-amber-300 px-6 py-2.5 text-sm font-semibold text-slate-900 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {processing ? 'Enregistrement...' : 'Enregistrer les paramètres'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
