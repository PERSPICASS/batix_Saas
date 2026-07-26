import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import { useRoute } from '@/utils/route';
import { PageProps } from '@/types';
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
    AlertCircle,
    Info,
    Image as ImageIcon,
    Upload,
    X
} from 'lucide-react';
import InputError from '@/Components/InputError';

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
    phone?: string;
    email?: string;
    website?: string;
    logo?: string;
    tax_id?: string;
    currency: string;
    locale?: string;
    default_tax_rate?: number;
    invoice_prefix?: string;
    invoice_footer?: string;
}

interface Props {
    shop: Shop | null;
    currencies: Currency[];
    error?: string;
}

export default function Settings({ shop, currencies, error }: Props) {
    const route = useRoute();
    const { t } = useLocale();
    const { auth } = usePage<PageProps>().props;
    const isSuperAdmin = auth.user?.role === 'super_admin';
    const [logoPreview, setLogoPreview] = useState<string | null>(
        shop?.logo ? `/storage/${shop.logo}` : null
    );

    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        name: shop?.name || '',
        description: shop?.description || '',
        address: shop?.address || '',
        city: shop?.city || '',
        postal_code: shop?.postal_code || '',
        phone: shop?.phone || '',
        email: shop?.email || '',
        website: shop?.website || '',
        logo: null as File | null,
        tax_id: shop?.tax_id || '',
        currency: shop?.currency || 'USD',
        locale: shop?.locale || 'fr',
        default_tax_rate: shop?.default_tax_rate || '',
        invoice_prefix: shop?.invoice_prefix || '',
        invoice_footer: shop?.invoice_footer || '',
        _method: 'PATCH',
    });

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('logo', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeLogo = () => {
        setData('logo', null);
        setLogoPreview(null);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('settings.update'), {
            forceFormData: true,
        });
    };

    if (error || !shop) {
        return (
            <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-slate-900 dark:text-white">{t.settings.title}</h1>}>
                <Head title={t.settings.title} />
                <div className="mx-auto max-w-4xl">
                    <div className="rounded-2xl border border-red-500/20 bg-red-900/10 p-6">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-6 w-6 text-red-400" />
                            <p className="text-red-200">{error || t.settings.error}</p>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-slate-900 dark:text-white">{t.settings.title}</h1>}>
            <Head title={t.settings.title} />

            <div className="mx-auto max-w-4xl">
                {/* Bannière d'information pour super_admin */}
                {isSuperAdmin && (
                    <div className="mb-6 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
                        <div className="flex items-start gap-3">
                            <div className="rounded-lg bg-blue-500/20 p-2">
                                <Info className="size-5 text-blue-300" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-blue-200">
                                    {t.settings.globalConfig.title}
                                </h3>
                                <p className="mt-1 text-sm text-blue-300">
                                    {t.settings.globalConfig.description}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={submit} className="space-y-6">
                    {/* Informations générales */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-white/5">
                        <div className="mb-6 flex items-center gap-2">
                            <Store className="size-5 text-amber-300" />
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t.settings.sections.general}</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                    {t.settings.fields.name} {t.settings.required}
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                    {t.settings.fields.description}
                                </label>
                                <textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                                />
                                <InputError message={errors.description} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                                    <div className="flex items-center gap-2">
                                        <ImageIcon className="size-4" />
                                        {t.settings.fields.logo}
                                    </div>
                                </label>
                                
                                {logoPreview ? (
                                    <div className="relative inline-block">
                                        <img
                                            src={logoPreview}
                                            alt="Logo preview"
                                            className="h-32 w-auto rounded-lg border-2 border-white/15 bg-white p-2"
                                        />
                                        <button
                                            type="button"
                                            onClick={removeLogo}
                                            className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center w-full">
                                        <label
                                            htmlFor="logo-upload"
                                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/15 rounded-lg cursor-pointer bg-slate-900/50 hover:bg-slate-900/70"
                                        >
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <Upload className="w-8 h-8 mb-2 text-slate-400" />
                                                <p className="mb-1 text-sm text-slate-300">
                                                    <span className="font-semibold">{t.settings.hints.clickToUpload}</span>
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{t.settings.hints.logo}</p>
                                            </div>
                                            <input
                                                id="logo-upload"
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleLogoChange}
                                            />
                                        </label>
                                    </div>
                                )}
                                <InputError message={errors.logo} />
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    {t.settings.hints.logoDescription}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Coordonnées */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-white/5">
                        <div className="mb-6 flex items-center gap-2">
                            <Phone className="size-5 text-amber-300" />
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t.settings.sections.contact}</h2>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                    {t.settings.fields.phone}
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                                />
                                <InputError message={errors.phone} />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                    {t.settings.fields.email}
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="md:col-span-2">
                                <label htmlFor="website" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                    {t.settings.fields.website}
                                </label>
                                <input
                                    type="url"
                                    id="website"
                                    value={data.website}
                                    onChange={(e) => setData('website', e.target.value)}
                                    placeholder="https://example.com"
                                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                                />
                                <InputError message={errors.website} />
                            </div>
                        </div>
                    </div>

                    {/* Adresse */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-white/5">
                        <div className="mb-6 flex items-center gap-2">
                            <MapPin className="size-5 text-amber-300" />
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t.settings.sections.address}</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="address" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                    {t.settings.fields.address}
                                </label>
                                <input
                                    type="text"
                                    id="address"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                                />
                                <InputError message={errors.address} />
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label htmlFor="city" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                        {t.settings.fields.city}
                                    </label>
                                    <input
                                        type="text"
                                        id="city"
                                        value={data.city}
                                        onChange={(e) => setData('city', e.target.value)}
                                        className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                                    />
                                    <InputError message={errors.city} />
                                </div>

                                <div>
                                    <label htmlFor="postal_code" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                        {t.settings.fields.postalCode}
                                    </label>
                                    <input
                                        type="text"
                                        id="postal_code"
                                        value={data.postal_code}
                                        onChange={(e) => setData('postal_code', e.target.value)}
                                        className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                                    />
                                    <InputError message={errors.postal_code} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Fiscalité et devise */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-white/5">
                        <div className="mb-6 flex items-center gap-2">
                            <DollarSign className="size-5 text-amber-300" />
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t.settings.sections.fiscal}</h2>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label htmlFor="tax_id" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                    {t.settings.fields.taxId}
                                </label>
                                <input
                                    type="text"
                                    id="tax_id"
                                    value={data.tax_id}
                                    onChange={(e) => setData('tax_id', e.target.value)}
                                    placeholder={t.settings.hints.taxIdPlaceholder}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                                />
                                <InputError message={errors.tax_id} />
                            </div>

                            <div>
                                <label htmlFor="currency" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                    {t.settings.fields.currency} {t.settings.required}
                                </label>
                                <select
                                    id="currency"
                                    value={data.currency}
                                    onChange={(e) => setData('currency', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                                    required
                                >
                                    {currencies.map((currency) => (
                                        <option key={currency.code} value={currency.code}>
                                            {currency.code} - {currency.name} ({currency.symbol})
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.currency} />
                            </div>

                            <div>
                                <label htmlFor="locale" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                    {t.settings.fields.documentLocale}
                                </label>
                                <select
                                    id="locale"
                                    value={data.locale}
                                    onChange={(e) => setData('locale', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                                >
                                    <option value="fr">Français</option>
                                    <option value="en">English</option>
                                </select>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    {t.settings.fields.documentLocaleHelp}
                                </p>
                                <InputError message={errors.locale} />
                            </div>

                            <div className="md:col-span-2">
                                <label htmlFor="default_tax_rate" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                    {t.settings.fields.defaultTaxRate}
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
                                        <Percent className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                                    </div>
                                </div>
                                <InputError message={errors.default_tax_rate} />
                            </div>
                        </div>
                    </div>

                    {/* Configuration des factures */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-white/5">
                        <div className="mb-6 flex items-center gap-2">
                            <FileText className="size-5 text-amber-300" />
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t.settings.sections.invoices}</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="invoice_prefix" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                    {t.settings.fields.invoicePrefix}
                                </label>
                                <div className="relative mt-1">
                                    <input
                                        type="text"
                                        id="invoice_prefix"
                                        value={data.invoice_prefix}
                                        onChange={(e) => setData('invoice_prefix', e.target.value)}
                                        placeholder="INV, FAC"
                                        maxLength={10}
                                        className="block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 pl-10 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                    />
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <Hash className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                                    </div>
                                </div>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    {t.settings.numbersFormat(data.invoice_prefix)}
                                </p>
                                <InputError message={errors.invoice_prefix} />
                            </div>

                            <div>
                                <label htmlFor="invoice_footer" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                    {t.settings.fields.invoiceFooter}
                                </label>
                                <textarea
                                    id="invoice_footer"
                                    value={data.invoice_footer}
                                    onChange={(e) => setData('invoice_footer', e.target.value)}
                                    rows={3}
                                    placeholder={t.settings.hints.invoiceFooterPlaceholder}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                                />
                                <InputError message={errors.invoice_footer} />
                            </div>
                        </div>
                    </div>

                    {/* Bouton de sauvegarde */}
                    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-6">
                        <div className="flex items-center gap-2">
                            {recentlySuccessful && (
                                <span className="text-sm text-green-400">✓ {t.settings.saveSuccess}</span>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex items-center gap-2 rounded-lg bg-amber-300 px-6 py-2.5 text-sm font-semibold text-slate-900 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {processing ? t.settings.saving : t.settings.save}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
