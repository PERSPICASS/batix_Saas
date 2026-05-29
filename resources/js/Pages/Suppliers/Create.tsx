import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { useRoute } from '@/utils/route';
import { Check } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';

interface Shop { id: number; name: string }
interface Props { shops: Shop[] }

export default function SuppliersCreate({ shops }: Props) {
    const { t } = useLocale();
    const route = useRoute();

    const { props } = usePage();
    const activeShop = props.activeShop as { id: number; name: string } | null;

    const { data, setData, post, processing, errors } = useForm({
        shop_ids: activeShop ? [activeShop.id] : (shops.length > 0 ? [shops[0].id] : []) as number[],
        name: '',
        company_name: '',
        email: '',
        phone: '',
        mobile: '',
        address: '',
        city: '',
        postal_code: '',
        country: '',
        tax_id: '',
        website: '',
        notes: '',
        is_active: true,
    });

    const toggleShop = (shopId: number) => {
        const current = data.shop_ids;
        if (current.includes(shopId)) {
            if (current.length > 1) setData('shop_ids', current.filter(id => id !== shopId));
        } else {
            setData('shop_ids', [...current, shopId]);
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('suppliers.store'));
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">{t.suppliers.form.newTitle}</h1>}>
            <Head title={t.suppliers.form.newTitle} />

            <div className="mx-auto max-w-4xl">
                <form onSubmit={submit} className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6">
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-white">{t.common.form.generalInfo}</h2>

                        <div>
                            <label className="block text-sm font-medium text-slate-200">{t.suppliers.form.shopsLabel}</label>
                            <p className="mt-1 text-xs text-slate-400">{t.suppliers.form.shopsHint}</p>
                            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                                {shops.map((shop) => (
                                    <button key={shop.id} type="button" onClick={() => toggleShop(shop.id)}
                                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                                            data.shop_ids.includes(shop.id)
                                                ? 'border-amber-300 bg-amber-300/20 text-amber-300'
                                                : 'border-white/15 bg-slate-900/50 text-slate-400 hover:border-white/30'
                                        }`}>
                                        <div className={`flex h-4 w-4 items-center justify-center rounded border ${
                                            data.shop_ids.includes(shop.id) ? 'border-amber-300 bg-amber-300' : 'border-white/30'
                                        }`}>
                                            {data.shop_ids.includes(shop.id) && <Check className="h-3 w-3 text-slate-900" />}
                                        </div>
                                        {shop.name}
                                    </button>
                                ))}
                            </div>
                            {errors.shop_ids && <p className="mt-1 text-sm text-red-400">{errors.shop_ids}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-200">
                                    {t.suppliers.form.contactName}
                                </label>
                                <input type="text" id="name" value={data.name} autoFocus
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300" />
                                {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
                            </div>

                            <div>
                                <label htmlFor="company_name" className="block text-sm font-medium text-slate-200">
                                    {t.suppliers.form.companyName}
                                </label>
                                <input type="text" id="company_name" value={data.company_name}
                                    onChange={(e) => setData('company_name', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300" />
                                {errors.company_name && <p className="mt-1 text-sm text-red-400">{errors.company_name}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-200">
                                    {t.common.form.email}
                                </label>
                                <input type="email" id="email" value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300" />
                                {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-slate-200">
                                    {t.suppliers.form.landline}
                                </label>
                                <input type="text" id="phone" value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300" />
                                {errors.phone && <p className="mt-1 text-sm text-red-400">{errors.phone}</p>}
                            </div>
                            <div>
                                <label htmlFor="mobile" className="block text-sm font-medium text-slate-200">
                                    {t.suppliers.form.mobile}
                                </label>
                                <input type="text" id="mobile" value={data.mobile}
                                    onChange={(e) => setData('mobile', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300" />
                                {errors.mobile && <p className="mt-1 text-sm text-red-400">{errors.mobile}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 border-t border-white/10 pt-6">
                        <h2 className="text-lg font-semibold text-white">{t.suppliers.form.addressSection}</h2>

                        <div>
                            <label htmlFor="address" className="block text-sm font-medium text-slate-200">
                                {t.suppliers.form.fullAddress}
                            </label>
                            <textarea id="address" value={data.address} rows={3}
                                onChange={(e) => setData('address', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300" />
                            {errors.address && <p className="mt-1 text-sm text-red-400">{errors.address}</p>}
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label htmlFor="city" className="block text-sm font-medium text-slate-200">
                                    {t.common.form.city}
                                </label>
                                <input type="text" id="city" value={data.city}
                                    onChange={(e) => setData('city', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300" />
                                {errors.city && <p className="mt-1 text-sm text-red-400">{errors.city}</p>}
                            </div>
                            <div>
                                <label htmlFor="postal_code" className="block text-sm font-medium text-slate-200">
                                    {t.common.form.postalCode}
                                </label>
                                <input type="text" id="postal_code" value={data.postal_code}
                                    onChange={(e) => setData('postal_code', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300" />
                                {errors.postal_code && <p className="mt-1 text-sm text-red-400">{errors.postal_code}</p>}
                            </div>
                            <div>
                                <label htmlFor="country" className="block text-sm font-medium text-slate-200">
                                    {t.common.form.country}
                                </label>
                                <input type="text" id="country" value={data.country}
                                    onChange={(e) => setData('country', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300" />
                                {errors.country && <p className="mt-1 text-sm text-red-400">{errors.country}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 border-t border-white/10 pt-6">
                        <h2 className="text-lg font-semibold text-white">{t.suppliers.form.otherInfo}</h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="tax_id" className="block text-sm font-medium text-slate-200">
                                    {t.shops.form.taxIdLabel}
                                </label>
                                <input type="text" id="tax_id" value={data.tax_id}
                                    onChange={(e) => setData('tax_id', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300" />
                                {errors.tax_id && <p className="mt-1 text-sm text-red-400">{errors.tax_id}</p>}
                            </div>
                            <div>
                                <label htmlFor="website" className="block text-sm font-medium text-slate-200">
                                    {t.common.form.website}
                                </label>
                                <input type="url" id="website" value={data.website}
                                    onChange={(e) => setData('website', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300" />
                                {errors.website && <p className="mt-1 text-sm text-red-400">{errors.website}</p>}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-slate-200">
                                {t.common.form.notes}
                            </label>
                            <textarea id="notes" value={data.notes} rows={3}
                                onChange={(e) => setData('notes', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300" />
                            {errors.notes && <p className="mt-1 text-sm text-red-400">{errors.notes}</p>}
                        </div>

                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="is_active" checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="size-4 rounded border-white/15 bg-slate-900/70 text-amber-300 focus:ring-amber-300 focus:ring-offset-slate-950" />
                            <label htmlFor="is_active" className="text-sm font-medium text-slate-200">
                                {t.suppliers.form.activeSupplier}
                            </label>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
                        <Link href={route('suppliers.index')}
                            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5">
                            {t.common.form.cancel}
                        </Link>
                        <button type="submit" disabled={processing}
                            className="rounded-lg bg-amber-300 px-6 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-200 disabled:opacity-50">
                            {processing ? t.common.form.creating : t.suppliers.form.createSupplier}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
