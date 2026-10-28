import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import Currency from '@/Components/Currency';
import { FormEventHandler } from 'react';
import { useRoute } from '@/utils/route';
import { useLocale } from '@/contexts/LocaleContext';
import InputError from '@/Components/InputError';
import FneCustomerFields, { FneTemplate, isCoteDIvoire } from '@/Components/FneCustomerFields';

interface Shop { id: number; name: string; country?: string | null }
interface Customer {
    id: number; shop_id: number; name: string; email: string;
    phone: string; address: string; notes: string; is_active: boolean;
    ncc?: string | null; fne_template?: FneTemplate | null;
}
interface CreditMovement { id: number; amount: number; type: string; notes: string | null; date: string; sale: { id: number; ticket_number: string } | null }
interface Props { customer: Customer; shops: Shop[]; credit: { balance: number; movements: CreditMovement[] } }

export default function CustomersEdit({ customer, shops, credit }: Props) {
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
        ncc: customer.ncc || '',
        fne_template: (customer.fne_template || 'B2C') as FneTemplate,
    });

    const showFne = isCoteDIvoire(shops.find((shop) => shop.id === customer.shop_id)?.country);

    const onSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('customers.update', { customer: customer.id }));
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-slate-900 dark:text-white">{t.customers.actions.edit}</h1>}>
            <Head title={t.customers.actions.edit} />
            <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-white/5">
                <div className="grid gap-4 md:grid-cols-2">
                    <label className="block space-y-1 text-sm text-slate-700 dark:text-slate-200 md:col-span-2">
                        <span>{t.common.form.shopField}</span>
                        <select
                            value={data.shop_id}
                            disabled
                            className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-slate-500 cursor-not-allowed dark:border-white/10 dark:bg-slate-800/50 dark:text-slate-400"
                        >
                            {shops.map((shop) => (
                                <option key={shop.id} value={shop.id}>{shop.name}</option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{t.categories.form.shopNoChange}</p>
                        <InputError message={errors.shop_id} />
                    </label>

                    <label className="block space-y-1 text-sm text-slate-700 dark:text-slate-200">
                        <span>{t.common.form.name}</span>
                        <input value={data.name} onChange={(e) => setData('name', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 dark:border-white/15 dark:bg-slate-900/70 dark:text-white" />
                        <InputError message={errors.name} />
                    </label>

                    <label className="block space-y-1 text-sm text-slate-700 dark:text-slate-200">
                        <span>{t.common.form.email}</span>
                        <input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 dark:border-white/15 dark:bg-slate-900/70 dark:text-white" />
                        <InputError message={errors.email} />
                    </label>

                    <label className="block space-y-1 text-sm text-slate-700 dark:text-slate-200">
                        <span>{t.common.form.phone}</span>
                        <input value={data.phone} onChange={(e) => setData('phone', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 dark:border-white/15 dark:bg-slate-900/70 dark:text-white" />
                        <InputError message={errors.phone} />
                    </label>

                    {showFne && (
                        <FneCustomerFields
                            template={data.fne_template}
                            ncc={data.ncc}
                            onTemplateChange={(value) => setData('fne_template', value)}
                            onNccChange={(value) => setData('ncc', value)}
                            errors={errors}
                        />
                    )}

                    <label className="block space-y-1 text-sm text-slate-700 dark:text-slate-200 md:col-span-2">
                        <span>{t.common.form.address}</span>
                        <input value={data.address} onChange={(e) => setData('address', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 dark:border-white/15 dark:bg-slate-900/70 dark:text-white" />
                        <InputError message={errors.address} />
                    </label>

                    <label className="block space-y-1 text-sm text-slate-700 dark:text-slate-200 md:col-span-2">
                        <span>{t.common.form.notes}</span>
                        <textarea value={data.notes} onChange={(e) => setData('notes', e.target.value)}
                            rows={3} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 dark:border-white/15 dark:bg-slate-900/70 dark:text-white" />
                        <InputError message={errors.notes} />
                    </label>

                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 md:col-span-2">
                        <input type="checkbox" checked={data.is_active}
                            onChange={(e) => setData('is_active', e.target.checked)}
                            className="rounded border-gray-300 bg-white dark:border-white/15 dark:bg-slate-900/70" />
                        <span>{t.common.form.activeCustomer}</span>
                    </label>
                </div>

                <div className="flex justify-end gap-2">
                    <Link href={route('customers.index')}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10">
                        {t.common.form.cancel}
                    </Link>
                    <button type="submit" disabled={processing}
                        className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50">
                        {processing ? t.common.form.saving : t.common.form.save}
                    </button>
                </div>
            </form>

            <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-white/5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t.customers.credit.title}</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        {t.customers.credit.balance} :{' '}
                        <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400"><Currency amount={credit.balance} /></span>
                    </p>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t.customers.credit.hint}</p>
                {credit.movements.length === 0 ? (
                    <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{t.customers.credit.empty}</p>
                ) : (
                    <ul className="mt-4 divide-y divide-gray-100 text-sm dark:divide-white/5">
                        {credit.movements.map((m) => (
                            <li key={m.id} className="flex items-center justify-between gap-3 py-2">
                                <div className="min-w-0">
                                    <p className="truncate text-slate-700 dark:text-slate-200">
                                        {m.sale ? (
                                            <Link href={route('sales.show', { sale: m.sale.id })} className="underline">{m.notes ?? m.sale.ticket_number}</Link>
                                        ) : m.notes}
                                    </p>
                                    <p className="text-xs text-slate-500">{new Date(m.date).toLocaleString()}</p>
                                </div>
                                <span className={`shrink-0 font-semibold ${m.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                    {m.amount >= 0 ? '+' : '-'}<Currency amount={Math.abs(m.amount)} />
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </AuthenticatedLayout>
    );
}
