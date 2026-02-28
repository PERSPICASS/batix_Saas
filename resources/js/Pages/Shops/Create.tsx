import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Store, MapPin, Phone, Mail, FileText, Globe } from 'lucide-react';
import { useRoute } from '@/utils/route';

export default function Create() {
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
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">Nouvelle Boutique</h1>}>
            <Head title="Nouvelle Boutique" />

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
                                    placeholder="Ex: Boutique Casa Centre"
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
                                    placeholder="Décrivez votre boutique..."
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
                                    placeholder="05 22 00 00 00"
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
                                    placeholder="contact@boutique.ma"
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
                                    placeholder="Rue, numéro, quartier..."
                                />
                                {errors.address && <p className="mt-1 text-sm text-red-400">{errors.address}</p>}
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                                        placeholder="Ex: Casablanca"
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
                                        placeholder="20000"
                                    />
                                    {errors.postal_code && (
                                        <p className="mt-1 text-sm text-red-400">{errors.postal_code}</p>
                                    )}
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

                        <div className="grid grid-cols-1 gap-4">
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
                                    placeholder="000000000000000"
                                />
                                {errors.tax_id && <p className="mt-1 text-sm text-red-400">{errors.tax_id}</p>}
                            </div>
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
                            {processing ? 'Création...' : 'Créer la boutique'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
