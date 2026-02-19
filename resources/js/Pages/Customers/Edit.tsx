import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface Shop {
    id: number;
    name: string;
}

interface Customer {
    id: number;
    shop_id: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postal_code: string;
    country: string;
    tax_number: string;
    notes: string;
    is_active: boolean;
}

interface Props {
    customer: Customer;
    shops: Shop[];
}

export default function CustomersEdit({ customer, shops }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        shop_id: customer.shop_id.toString(),
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        city: customer.city || '',
        postal_code: customer.postal_code || '',
        country: customer.country || 'France',
        tax_number: customer.tax_number || '',
        notes: customer.notes || '',
        is_active: customer.is_active,
    });

    const onSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('customers.update', customer.id));
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">Modifier client</h1>}>
            <Head title="Modifier client" />
            <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <label className="block space-y-1 text-sm text-slate-200 md:col-span-2">
                        <span>Boutique *</span>
                        <select
                            value={data.shop_id}
                            onChange={(e) => setData('shop_id', e.target.value)}
                            className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                        >
                            <option value="">Sélectionner une boutique</option>
                            {shops.map((shop) => (
                                <option key={shop.id} value={shop.id}>
                                    {shop.name}
                                </option>
                            ))}
                        </select>
                        {errors.shop_id && <span className="text-xs text-red-400">{errors.shop_id}</span>}
                    </label>

                    <label className="block space-y-1 text-sm text-slate-200">
                        <span>Nom *</span>
                        <input
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                        />
                        {errors.name && <span className="text-xs text-red-400">{errors.name}</span>}
                    </label>

                    <label className="block space-y-1 text-sm text-slate-200">
                        <span>Email</span>
                        <input
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                        />
                        {errors.email && <span className="text-xs text-red-400">{errors.email}</span>}
                    </label>

                    <label className="block space-y-1 text-sm text-slate-200">
                        <span>Téléphone</span>
                        <input
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                        />
                        {errors.phone && <span className="text-xs text-red-400">{errors.phone}</span>}
                    </label>

                    <label className="block space-y-1 text-sm text-slate-200">
                        <span>Numéro de TVA</span>
                        <input
                            value={data.tax_number}
                            onChange={(e) => setData('tax_number', e.target.value)}
                            className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                        />
                        {errors.tax_number && <span className="text-xs text-red-400">{errors.tax_number}</span>}
                    </label>

                    <label className="block space-y-1 text-sm text-slate-200 md:col-span-2">
                        <span>Adresse</span>
                        <input
                            value={data.address}
                            onChange={(e) => setData('address', e.target.value)}
                            className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                        />
                        {errors.address && <span className="text-xs text-red-400">{errors.address}</span>}
                    </label>

                    <label className="block space-y-1 text-sm text-slate-200">
                        <span>Ville</span>
                        <input
                            value={data.city}
                            onChange={(e) => setData('city', e.target.value)}
                            className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                        />
                        {errors.city && <span className="text-xs text-red-400">{errors.city}</span>}
                    </label>

                    <label className="block space-y-1 text-sm text-slate-200">
                        <span>Code postal</span>
                        <input
                            value={data.postal_code}
                            onChange={(e) => setData('postal_code', e.target.value)}
                            className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                        />
                        {errors.postal_code && <span className="text-xs text-red-400">{errors.postal_code}</span>}
                    </label>

                    <label className="block space-y-1 text-sm text-slate-200">
                        <span>Pays</span>
                        <input
                            value={data.country}
                            onChange={(e) => setData('country', e.target.value)}
                            className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                        />
                        {errors.country && <span className="text-xs text-red-400">{errors.country}</span>}
                    </label>

                    <label className="block space-y-1 text-sm text-slate-200 md:col-span-2">
                        <span>Notes</span>
                        <textarea
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            rows={3}
                            className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                        />
                        {errors.notes && <span className="text-xs text-red-400">{errors.notes}</span>}
                    </label>

                    <label className="flex items-center gap-2 text-sm text-slate-200 md:col-span-2">
                        <input
                            type="checkbox"
                            checked={data.is_active}
                            onChange={(e) => setData('is_active', e.target.checked)}
                            className="rounded border-white/15 bg-slate-900/70"
                        />
                        <span>Client actif</span>
                    </label>
                </div>

                <div className="flex justify-end gap-2">
                    <Link
                        href={route('customers.index')}
                        className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
                    >
                        Annuler
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50"
                    >
                        {processing ? 'Enregistrement...' : 'Sauvegarder'}
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
