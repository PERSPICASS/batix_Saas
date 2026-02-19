import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Store, MapPin, Phone, Mail, FileText } from 'lucide-react';

interface Shop {
    id: number;
    name: string;
    description: string | null;
    address: string | null;
    city: string | null;
    postal_code: string | null;
    country: string;
    phone: string | null;
    email: string | null;
    tax_id: string | null;
    currency: string;
    is_active: boolean;
}

interface Props {
    shop: Shop;
}

export default function Edit({ shop }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: shop.name,
        description: shop.description || '',
        address: shop.address || '',
        city: shop.city || '',
        postal_code: shop.postal_code || '',
        country: shop.country,
        phone: shop.phone || '',
        email: shop.email || '',
        tax_id: shop.tax_id || '',
        currency: shop.currency,
        is_active: shop.is_active,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('shops.update', shop.id));
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">Modifier la boutique</h1>}>
            <Head title="Modifier la boutique" />

            <div className="mx-auto max-w-4xl">
                <form onSubmit={submit} className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6">
                    {/* Informations générales */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <Store className="size-5 text-amber-300" />
                            <h2 className="text-lg font-semibold text-white">Informations générales</h2>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
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
                                    autoFocus
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
                                {errors.description && (
                                    <p className="mt-1 text-sm text-red-400">{errors.description}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Coordonnées */}
                    <div className="space-y-6 border-t border-white/10 pt-6">
                        <div className="flex items-center gap-2">
                            <Phone className="size-5 text-green-400" />
                            <h2 className="text-lg font-semibold text-white">Contact</h2>
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
                        </div>
                    </div>

                    {/* Adresse */}
                    <div className="space-y-6 border-t border-white/10 pt-6">
                        <div className="flex items-center gap-2">
                            <MapPin className="size-5 text-purple-400" />
                            <h2 className="text-lg font-semibold text-white">Localisation</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="address" className="block text-sm font-medium text-slate-200">
                                    Adresse complète
                                </label>
                                <textarea
                                    id="address"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    rows={2}
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
                                    {errors.postal_code && (
                                        <p className="mt-1 text-sm text-red-400">{errors.postal_code}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="country" className="block text-sm font-medium text-slate-200">
                                        Pays
                                    </label>
                                    <input
                                        type="text"
                                        id="country"
                                        value={data.country}
                                        onChange={(e) => setData('country', e.target.value)}
                                        className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                    />
                                    {errors.country && <p className="mt-1 text-sm text-red-400">{errors.country}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Informations fiscales */}
                    <div className="space-y-6 border-t border-white/10 pt-6">
                        <div className="flex items-center gap-2">
                            <FileText className="size-5 text-blue-400" />
                            <h2 className="text-lg font-semibold text-white">Informations complémentaires</h2>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label htmlFor="tax_id" className="block text-sm font-medium text-slate-200">
                                    ICE / N° Fiscal
                                </label>
                                <input
                                    type="text"
                                    id="tax_id"
                                    value={data.tax_id}
                                    onChange={(e) => setData('tax_id', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                />
                                {errors.tax_id && <p className="mt-1 text-sm text-red-400">{errors.tax_id}</p>}
                            </div>

                            <div>
                                <label htmlFor="currency" className="block text-sm font-medium text-slate-200">
                                    Devise
                                </label>
                                <select
                                    id="currency"
                                    value={data.currency}
                                    onChange={(e) => setData('currency', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                >
                                    <option value="MAD">Dirham Marocain (MAD)</option>
                                    <option value="EUR">Euro (EUR)</option>
                                    <option value="USD">Dollar US (USD)</option>
                                    <option value="GBP">Livre Sterling (GBP)</option>
                                </select>
                                {errors.currency && <p className="mt-1 text-sm text-red-400">{errors.currency}</p>}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="size-4 rounded border-white/15 bg-slate-900/70 text-amber-300 focus:ring-amber-300 focus:ring-offset-slate-950"
                            />
                            <label htmlFor="is_active" className="text-sm font-medium text-slate-200">
                                Boutique active
                            </label>
                        </div>
                    </div>

                    {/* Boutons */}
                    <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
                        <Link
                            href={route('shops.index')}
                            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5"
                        >
                            Annuler
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-amber-300 px-6 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-200 disabled:opacity-50"
                        >
                            {processing ? 'Mise à jour...' : 'Enregistrer'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
