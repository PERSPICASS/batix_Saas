import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { useRoute } from '@/utils/route';

interface Shop {
    id: number;
    name: string;
}

interface Props {
    shops: Shop[];
}

export default function CustomersCreate({ shops }: Props) {
    const route = useRoute();

    const { props } = usePage();
    const activeShop = props.activeShop as { id: number; name: string } | null;

    const { data, setData, post, processing, errors } = useForm({
        shop_id: activeShop?.id.toString() || shops[0]?.id.toString() || '',
        name: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
        is_active: true,
    });

    const onSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('customers.store'));
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">Nouveau client</h1>}>
            <Head title="Nouveau client" />
            <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <label className="block space-y-1 text-sm text-slate-200 md:col-span-2">
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
                        <p className="text-xs text-slate-400">Boutique sélectionnée via le switcher</p>
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

                    <label className="block space-y-1 text-sm text-slate-200 md:col-span-2">
                        <span>Adresse</span>
                        <input
                            value={data.address}
                            onChange={(e) => setData('address', e.target.value)}
                            className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                        />
                        {errors.address && <span className="text-xs text-red-400">{errors.address}</span>}
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
                            className="rounded border border-white/15 bg-slate-900/70"
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
                        {processing ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
