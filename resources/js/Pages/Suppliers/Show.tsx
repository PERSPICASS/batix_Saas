import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Building2, Mail, Phone, MapPin, Globe, FileText, Package, ArrowLeft, Pencil } from 'lucide-react';
import Currency from '@/Components/Currency';
import ProductImage from '@/Components/ProductImage';
import { useRoute } from '@/utils/route';
import { useLocale } from '@/contexts/LocaleContext';

interface Product {
    id: number;
    name: string;
    sku: string;
    image: string | null;
    price: number;
    stock: number;
}

interface Supplier {
    id: number;
    name: string;
    company_name: string | null;
    email: string | null;
    phone: string | null;
    mobile: string | null;
    address: string | null;
    city: string | null;
    postal_code: string | null;
    country: string;
    tax_id: string | null;
    website: string | null;
    notes: string | null;
    is_active: boolean;
    created_at: string;
    products?: Product[];
}

interface Props {
    supplier: Supplier;
}

export default function SuppliersShow({ supplier }: Props) {
    const { t } = useLocale();
    const route = useRoute();

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-white">Détails du fournisseur</h1>
                    <Link
                        href={route('suppliers.edit', { supplier: supplier.id })}
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200"
                    >
                        <Pencil className="size-4" /> Modifier
                    </Link>
                </div>
            }
        >
            <Head title={`{t.suppliers.title || "Fournisseur"} - ${supplier.name}`} />

            <div className="space-y-6">
                {/* Bouton retour */}
                <Link
                    href={route('suppliers.index')}
                    className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"
                >
                    <ArrowLeft className="size-4" />
                    Retour à la liste
                </Link>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Colonne principale */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Informations générales */}
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                            <div className="mb-6 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-white">Informations générales</h2>
                                {supplier.is_active ? (
                                    <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
                                        Actif
                                    </span>
                                ) : (
                                    <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-medium text-red-400">
                                        Inactif
                                    </span>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Building2 className="mt-1 size-5 text-amber-300" />
                                    <div>
                                        <p className="text-sm text-slate-400">Nom du contact</p>
                                        <p className="font-medium text-slate-200">{supplier.name}</p>
                                        {supplier.company_name && (
                                            <p className="mt-1 text-sm text-slate-300">{supplier.company_name}</p>
                                        )}
                                    </div>
                                </div>

                                {supplier.email && (
                                    <div className="flex items-start gap-3">
                                        <Mail className="mt-1 size-5 text-blue-400" />
                                        <div>
                                            <p className="text-sm text-slate-400">Email</p>
                                            <a
                                                href={`mailto:${supplier.email}`}
                                                className="font-medium text-blue-300 hover:underline"
                                            >
                                                {supplier.email}
                                            </a>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start gap-3">
                                    <Phone className="mt-1 size-5 text-green-400" />
                                    <div>
                                        <p className="text-sm text-slate-400">Téléphone</p>
                                        <div className="space-y-1">
                                            {supplier.phone && (
                                                <p className="font-medium text-slate-200">Fixe: {supplier.phone}</p>
                                            )}
                                            {supplier.mobile && (
                                                <p className="font-medium text-slate-200">Mobile: {supplier.mobile}</p>
                                            )}
                                            {!supplier.phone && !supplier.mobile && (
                                                <p className="text-slate-500">Non renseigné</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {(supplier.address || supplier.city) && (
                                    <div className="flex items-start gap-3">
                                        <MapPin className="mt-1 size-5 text-purple-400" />
                                        <div>
                                            <p className="text-sm text-slate-400">Adresse</p>
                                            <div className="space-y-1">
                                                {supplier.address && (
                                                    <p className="text-slate-200">{supplier.address}</p>
                                                )}
                                                <p className="text-slate-200">
                                                    {supplier.city && `${supplier.city}`}
                                                    {supplier.postal_code && ` ${supplier.postal_code}`}
                                                </p>
                                                <p className="text-slate-300">{supplier.country}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {supplier.website && (
                                    <div className="flex items-start gap-3">
                                        <Globe className="mt-1 size-5 text-cyan-400" />
                                        <div>
                                            <p className="text-sm text-slate-400">Site web</p>
                                            <a
                                                href={supplier.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-medium text-cyan-300 hover:underline"
                                            >
                                                {supplier.website}
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Notes */}
                        {supplier.notes && (
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                                <div className="mb-4 flex items-center gap-2">
                                    <FileText className="size-5 text-amber-300" />
                                    <h2 className="text-lg font-semibold text-white">Notes</h2>
                                </div>
                                <p className="whitespace-pre-line text-slate-300">{supplier.notes}</p>
                            </div>
                        )}

                        {/* Produits du fournisseur */}
                        {supplier.products && supplier.products.length > 0 && (
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                                <div className="mb-4 flex items-center gap-2">
                                    <Package className="size-5 text-amber-300" />
                                    <h2 className="text-lg font-semibold text-white">
                                        Produits ({supplier.products.length})
                                    </h2>
                                </div>
                                <div className="space-y-2">
                                    {supplier.products.map((product) => (
                                        <div
                                            key={product.id}
                                            className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3"
                                        >
                                            <div className="flex items-center gap-3">
                                                <ProductImage src={product.image} name={product.name} thumbnailClass="size-10" />
                                                <div>
                                                    <p className="font-medium text-slate-200">{product.name}</p>
                                                    <p className="text-sm text-slate-400">SKU: {product.sku}</p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0 ml-3">
                                                <p className="font-semibold text-amber-300">
                                                    <Currency amount={product.price} />
                                                </p>
                                                <p className="text-sm text-slate-400">Stock: {product.stock}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Colonne latérale */}
                    <div className="space-y-6">
                        {/* Informations fiscales */}
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                            <h3 className="mb-4 text-sm font-semibold text-white">Informations fiscales</h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs text-slate-400">ICE / N° Fiscal</p>
                                    <p className="mt-1 text-sm font-medium text-slate-200">
                                        {supplier.tax_id || 'Non renseigné'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Statistiques */}
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                            <h3 className="mb-4 text-sm font-semibold text-white">Statistiques</h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs text-slate-400">Produits fournis</p>
                                    <p className="mt-1 text-2xl font-bold text-amber-300">
                                        {supplier.products?.length || 0}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400">Membre depuis</p>
                                    <p className="mt-1 text-sm font-medium text-slate-200">
                                        {new Date(supplier.created_at).toLocaleDateString('fr-FR', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
