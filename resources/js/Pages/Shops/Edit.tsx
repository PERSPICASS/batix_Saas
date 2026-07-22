import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Store, MapPin, Phone, FileText } from 'lucide-react';
import { useRoute } from '@/utils/route';
import { useLocale } from '@/contexts/LocaleContext';
import { countriesI18n } from '@/i18n/countries';
import InputError from '@/Components/InputError';

interface Shop {
    id: number; name: string; description: string | null;
    address: string | null; city: string | null; postal_code: string | null;
    country: string | null;
    phone: string | null; email: string | null; tax_id: string | null; is_active: boolean;
}
interface Props { shop: Shop }

export default function Edit({ shop }: Props) {
    const { t, locale } = useLocale();
    const route = useRoute();
    const countries = countriesI18n[locale];

    const { data, setData, put, processing, errors } = useForm({
        name: shop.name,
        description: shop.description || '',
        address: shop.address || '',
        city: shop.city || '',
        postal_code: shop.postal_code || '',
        country: shop.country || '',
        phone: shop.phone || '',
        email: shop.email || '',
        tax_id: shop.tax_id || '',
        is_active: shop.is_active,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('shops.update', { shop: shop.id }));
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-slate-900 dark:text-white">{t.shops.form.editTitle}</h1>}>
            <Head title={t.shops.form.editTitle} />

            <div className="mx-auto max-w-4xl">
                <form onSubmit={submit} className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-white/5">
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <Store className="size-5 text-amber-300" />
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t.common.form.generalInfo}</h2>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-200">{t.settings.fields.name}</label>
                                <input type="text" id="name" value={data.name} autoFocus required
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200" />
                                <InputError message={errors.name} />
                            </div>
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-200">{t.common.form.description}</label>
                                <textarea id="description" value={data.description} rows={3}
                                    onChange={(e) => setData('description', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200" />
                                <InputError message={errors.description} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 border-t border-gray-200 dark:border-white/10 pt-6">
                        <div className="flex items-center gap-2">
                            <Phone className="size-5 text-green-400" />
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t.shops.form.contactSection}</h2>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-200">{t.common.form.phone}</label>
                                <input type="tel" id="phone" value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200" />
                                <InputError message={errors.phone} />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-200">{t.common.form.email}</label>
                                <input type="email" id="email" value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200" />
                                <InputError message={errors.email} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 border-t border-gray-200 dark:border-white/10 pt-6">
                        <div className="flex items-center gap-2">
                            <MapPin className="size-5 text-purple-400" />
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t.shops.form.location}</h2>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="address" className="block text-sm font-medium text-slate-700 dark:text-slate-200">{t.shops.form.fullAddress}</label>
                                <textarea id="address" value={data.address} rows={2}
                                    onChange={(e) => setData('address', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200" />
                                <InputError message={errors.address} />
                            </div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label htmlFor="city" className="block text-sm font-medium text-slate-700 dark:text-slate-200">{t.common.form.city}</label>
                                    <input type="text" id="city" value={data.city}
                                        onChange={(e) => setData('city', e.target.value)}
                                        className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200" />
                                    <InputError message={errors.city} />
                                </div>
                                <div>
                                    <label htmlFor="postal_code" className="block text-sm font-medium text-slate-700 dark:text-slate-200">{t.common.form.postalCode}</label>
                                    <input type="text" id="postal_code" value={data.postal_code}
                                        onChange={(e) => setData('postal_code', e.target.value)}
                                        className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200" />
                                    <InputError message={errors.postal_code} />
                                </div>
                                <div>
                                    <label htmlFor="country" className="block text-sm font-medium text-slate-700 dark:text-slate-200">{countries.label}</label>
                                    <select id="country" value={data.country}
                                        onChange={(e) => setData('country', e.target.value)}
                                        className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200">
                                        <option value="">{countries.placeholder}</option>
                                        {countries.list.map((name) => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.country} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 border-t border-gray-200 dark:border-white/10 pt-6">
                        <div className="flex items-center gap-2">
                            <FileText className="size-5 text-blue-400" />
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t.shops.form.additionalInfo}</h2>
                        </div>
                        <div>
                            <label htmlFor="tax_id" className="block text-sm font-medium text-slate-700 dark:text-slate-200">{t.shops.form.taxIdLabel}</label>
                            <input type="text" id="tax_id" value={data.tax_id}
                                onChange={(e) => setData('tax_id', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200" />
                            <InputError message={errors.tax_id} />
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="is_active" checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="size-4 rounded border-gray-300 bg-white text-amber-300 focus:ring-amber-300 focus:ring-offset-white dark:border-white/15 dark:bg-slate-900/70 dark:focus:ring-offset-slate-950" />
                            <label htmlFor="is_active" className="text-sm font-medium text-slate-700 dark:text-slate-200">{t.common.form.activeShop}</label>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-gray-200 dark:border-white/10 pt-4">
                        <Link href={route('shops.index')}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5">
                            {t.common.form.cancel}
                        </Link>
                        <button type="submit" disabled={processing}
                            className="rounded-lg bg-amber-300 px-6 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-200 disabled:opacity-50">
                            {processing ? t.common.form.updating : t.common.form.save}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
