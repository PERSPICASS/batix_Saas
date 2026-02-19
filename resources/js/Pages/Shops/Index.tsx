import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { Store, MapPin, Phone, Mail, Pencil, Eye, Trash2, Plus, Building2 } from 'lucide-react';

interface Shop {
    id: number;
    name: string;
    slug: string;
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
    created_at: string;
}

export default function Index({ shops }: PageProps<{ shops: Shop[] }>) {
    const handleDelete = (shop: Shop) => {
        if (confirm(`Êtes-vous sûr de vouloir supprimer la boutique "${shop.name}" ?`)) {
            router.delete(route('shops.destroy', shop.id));
        }
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">Mes Boutiques</h1>}>
            <Head title="Mes Boutiques" />

            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-300">Gérez vos boutiques et points de vente</p>
                    <Link
                        href={route('shops.create')}
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200"
                    >
                        <Plus className="size-4" /> Nouvelle boutique
                    </Link>
                </div>

                {shops.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
                        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-amber-300/20">
                            <Store className="size-8 text-amber-300" />
                        </div>
                        <h3 className="mb-2 text-lg font-semibold text-white">Aucune boutique</h3>
                        <p className="mb-6 text-sm text-slate-400">
                            Commencez par créer votre première boutique pour gérer vos produits et ventes.
                        </p>
                        <Link
                            href={route('shops.create')}
                            className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-200"
                        >
                            <Plus className="size-4" /> Créer ma première boutique
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {shops.map((shop) => (
                            <div
                                key={shop.id}
                                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-all hover:border-amber-300/30 hover:bg-white/10"
                            >
                                {/* Badge statut */}
                                <div className="absolute right-4 top-4">
                                    {shop.is_active ? (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2.5 py-1 text-xs font-medium text-green-400">
                                            <span className="size-1.5 rounded-full bg-green-400"></span>
                                            Active
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2.5 py-1 text-xs font-medium text-red-400">
                                            <span className="size-1.5 rounded-full bg-red-400"></span>
                                            Inactive
                                        </span>
                                    )}
                                </div>

                                <div className="p-6">
                                    {/* En-tête */}
                                    <div className="mb-4">
                                        <div className="mb-3 flex items-center gap-3">
                                            <div className="flex size-12 items-center justify-center rounded-lg bg-amber-300/20">
                                                <Building2 className="size-6 text-amber-300" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-white">{shop.name}</h3>
                                                {shop.description && (
                                                    <p className="mt-1 line-clamp-1 text-xs text-slate-400">
                                                        {shop.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Informations */}
                                    <div className="space-y-2 border-t border-white/10 pt-4">
                                        {shop.address && (
                                            <div className="flex items-start gap-2 text-sm text-slate-300">
                                                <MapPin className="mt-0.5 size-4 flex-shrink-0 text-purple-400" />
                                                <div className="flex-1">
                                                    <p className="line-clamp-2">
                                                        {shop.address}
                                                        {shop.city && `, ${shop.city}`}
                                                        {shop.postal_code && ` ${shop.postal_code}`}
                                                    </p>
                                                    <p className="text-xs text-slate-400">{shop.country}</p>
                                                </div>
                                            </div>
                                        )}

                                        {shop.phone && (
                                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                                <Phone className="size-4 text-green-400" />
                                                <span>{shop.phone}</span>
                                            </div>
                                        )}

                                        {shop.email && (
                                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                                <Mail className="size-4 text-blue-400" />
                                                <span className="truncate">{shop.email}</span>
                                            </div>
                                        )}

                                        {/* Infos complémentaires */}
                                        <div className="flex items-center gap-3 border-t border-white/10 pt-3">
                                            {shop.tax_id && (
                                                <div className="text-xs">
                                                    <span className="text-slate-400">ICE: </span>
                                                    <span className="font-mono text-slate-300">
                                                        {shop.tax_id.slice(0, 8)}...
                                                    </span>
                                                </div>
                                            )}
                                            <div className="text-xs">
                                                <span className="inline-flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 font-medium text-slate-300">
                                                    {shop.currency}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-4">
                                        <Link
                                            href={route('shops.show', shop.id)}
                                            className="flex-1 rounded-lg border border-white/15 py-2 text-center text-xs font-medium text-slate-200 transition-colors hover:bg-white/10"
                                        >
                                            <Eye className="mx-auto size-4" />
                                        </Link>
                                        <Link
                                            href={route('shops.edit', shop.id)}
                                            className="flex-1 rounded-lg border border-white/15 py-2 text-center text-xs font-medium text-slate-200 transition-colors hover:bg-white/10"
                                        >
                                            <Pencil className="mx-auto size-4" />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(shop)}
                                            className="flex-1 rounded-lg border border-rose-300/30 py-2 text-center text-xs font-medium text-rose-200 transition-colors hover:bg-rose-300/10"
                                        >
                                            <Trash2 className="mx-auto size-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </AuthenticatedLayout>
    );
}
