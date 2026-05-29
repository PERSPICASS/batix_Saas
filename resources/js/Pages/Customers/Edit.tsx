import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { useRoute } from '@/utils/route';
import { useLocale } from '@/contexts/LocaleContext';

interface Shop { id: number; name: string }
interface Customer {
    id: number; shop_id: number; name: string; email: string;
    phone: string; address: string; notes: string; is_active: boolean;
}
interface Props { customer: Customer; shops: Shop[] }

export default function CustomersEdit({ customer, shops }: Props) {
    const { t } = useLocale();
    const route = useRoute();

    const { data, setData, put, processing, errors } = useForm({
        shop_id: customer.shop_id.toString(),
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        notes: customer.notes || '',
        is_active: customer.is_active,
    });

    const onSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('customers.update', { customer: customer.id }));
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">{t.customers.actions.edit}</h1>}>
            <Head title={t.customers.actions.edit} />
            <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <label className="block space-y-1 text-sm text-slate-200 md:col-span-2">
                        <span>{t.common.form.shopField}</span>
                        <select
                            value={data.shop_id}
                            disabled
                            className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2 text-slate-400 cursor-not-allowed"
                        >
                            {shops.map((shop) => (
                                <option key={shop.id} value={shop.id}>{shop.name}</option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-400">{t.categories.form.shopNoChange}</p>
                        {errors.shop_id && <span className="text-xs text-red-400">{errors.shop_id}</span>}
                    </label>

                    <label className="block space-y-1 text-sm text-slate-200">
                        <span>{t.common.form.name}</span>
                        <input value={data.name} onChange={(e) => setData('name', e.target.value)}
                            className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2" />
                        {errors.name && <span className="text-xs text-red-400">{errors.name}</span>}
                    </label>

                    <label className="block space-y-1 text-sm text-slate-200">
                        <span>{t.common.form.email}</span>
                        <input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)}
                            className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2" />
                        {errors.email && <span className="text-xs text-red-400">{errors.email}</span>}
                    </label>

                    <label className="block space-y-1 text-sm text-slate-200">
                        <span>{t.common.form.phone}</span>
                        <input value={data.phone} onChange={(e) => setData('phone', e.target.value)}
                            className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2" />
                        {errors.phone && <span className="text-xs text-red-400">{errors.phone}</span>}
                    </label>

                    <label className="block space-y-1 text-sm text-slate-200 md:col-span-2">
                        <span>{t.common.form.address}</span>
                        <input value={data.address} onChange={(e) => setData('address', e.target.value)}
                            className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2" />
                        {errors.address && <span className="text-xs text-red-400">{errors.address}</span>}
                    </label>

                    <label className="block space-y-1 text-sm text-slate-200 md:col-span-2">
                        <span>{t.common.form.notes}</span>
                        <textarea value={data.notes} onChange={(e) => setData('notes', e.target.value)}
                            rows={3} className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2" />
                        {errors.notes && <span className="text-xs text-red-400">{errors.notes}</span>}
                    </label>

                    <label className="flex items-center gap-2 text-sm text-slate-200 md:col-span-2">
                        <input type="checkbox" checked={data.is_active}
                            onChange={(e) => setData('is_active', e.target.checked)}
                            className="rounded border-white/15 bg-slate-900/70" />
                        <span>{t.common.form.activeCustomer}</span>
                    </label>
                </div>

                <div className="flex justify-end gap-2">
                    <Link href={route('customers.index')}
                        className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/10">
                        {t.common.form.cancel}
                    </Link>
                    <button type="submit" disabled={processing}
                        className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50">
                        {processing ? t.common.form.saving : t.common.form.save}
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
