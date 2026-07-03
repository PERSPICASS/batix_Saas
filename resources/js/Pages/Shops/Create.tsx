import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Store, MapPin, Phone, FileText } from 'lucide-react';
import { useRoute } from '@/utils/route';
import { useLocale } from '@/contexts/LocaleContext';
import InputError from '@/Components/InputError';

export default function Create() {
    const { t } = useLocale();
    const route = useRoute();

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        address: '',
        city: '',
        postal_code: '',
        phone: '',
        email: '',
        tax_id: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('shops.store'));
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">{t.shops.actions.new}</h1>}>
            <Head title={t.shops.actions.new} />

            <div className="mx-auto max-w-4xl">
                <form onSubmit={submit} className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6">
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <Store className="size-5 text-amber-300" />
                            <h2 className="text-lg font-semibold text-white">{t.common.form.generalInfo}</h2>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-200">
                                    {t.settings.fields.name}
                                </label>
                                <input type="text" id="name" value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                    autoFocus required />
                                <InputError message={errors.name} />
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-slate-200">
                                    {t.common.form.description}
                                </label>
                                <textarea id="description" value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                    className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300" />
                                <InputError message={errors.description} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 border-t border-white/10 pt-6">
                        <div className="flex items-center gap-2">
                            <Phone className="size-5 text-green-400" />
                            <h2 className="text-lg font-semibold text-white">{t.shops.form.contactSection}</h2>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-slate-200">
                                    {t.common.form.phone}
                                </label>
                                <input type="tel" id="phone" value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300" />
                                <InputError message={errors.phone} />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-200">
                                    {t.common.form.email}
                                </label>
                                <input type="email" id="email" value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300" />
                                <InputError message={errors.email} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 border-t border-white/10 pt-6">
                        <div className="flex items-center gap-2">
                            <MapPin className="size-5 text-purple-400" />
                            <h2 className="text-lg font-semibold text-white">{t.shops.form.location}</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="address" className="block text-sm font-medium text-slate-200">
                                    {t.shops.form.fullAddress}
                                </label>
                                <textarea id="address" value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    rows={2}
                                    className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300" />
                                <InputError message={errors.address} />
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label htmlFor="city" className="block text-sm font-medium text-slate-200">
                                        {t.common.form.city}
                                    </label>
                                    <input type="text" id="city" value={data.city}
                                        onChange={(e) => setData('city', e.target.value)}
                                        className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300" />
                                    <InputError message={errors.city} />
                                </div>

                                <div>
                                    <label htmlFor="postal_code" className="block text-sm font-medium text-slate-200">
                                        {t.common.form.postalCode}
                                    </label>
                                    <input type="text" id="postal_code" value={data.postal_code}
                                        onChange={(e) => setData('postal_code', e.target.value)}
                                        className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300" />
                                    <InputError message={errors.postal_code} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 border-t border-white/10 pt-6">
                        <div className="flex items-center gap-2">
                            <FileText className="size-5 text-blue-400" />
                            <h2 className="text-lg font-semibold text-white">{t.shops.form.additionalInfo}</h2>
                        </div>

                        <div>
                            <label htmlFor="tax_id" className="block text-sm font-medium text-slate-200">
                                {t.shops.form.taxIdLabel}
                            </label>
                            <input type="text" id="tax_id" value={data.tax_id}
                                onChange={(e) => setData('tax_id', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300" />
                            <InputError message={errors.tax_id} />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
                        <Link href={route('shops.index')}
                            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5">
                            {t.common.form.cancel}
                        </Link>
                        <button type="submit" disabled={processing}
                            className="rounded-lg bg-amber-300 px-6 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-200 disabled:opacity-50">
                            {processing ? t.common.form.creating : t.shops.form.createShop}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
