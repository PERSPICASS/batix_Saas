import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Package, Calendar, User, MapPin, FileText } from 'lucide-react';

interface Shop {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    sku: string | null;
}

interface User {
    id: number;
    name: string;
}

interface StockMovement {
    id: number;
    type: string;
    quantity: number;
    unit_cost: string | null;
    movement_date: string;
    notes: string | null;
    created_at: string;
    shop: Shop;
    product: Product;
    user: User;
}

interface Props {
    movement: StockMovement;
}

export default function StocksShow({ movement }: Props) {
    const getTypeBadge = (type: string) => {
        const types: Record<string, { label: string; bg: string; text: string }> = {
            in: { label: 'Entrée', bg: 'bg-green-500/20', text: 'text-green-300' },
            out: { label: 'Sortie', bg: 'bg-red-500/20', text: 'text-red-300' },
            transfer: { label: 'Transfert', bg: 'bg-blue-500/20', text: 'text-blue-300' },
            adjustment: { label: 'Ajustement', bg: 'bg-amber-500/20', text: 'text-amber-300' },
            sale: { label: 'Vente', bg: 'bg-purple-500/20', text: 'text-purple-300' },
            return: { label: 'Retour', bg: 'bg-cyan-500/20', text: 'text-cyan-300' },
        };

        const typeInfo = types[type] || types.adjustment;

        return (
            <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${typeInfo.bg} ${typeInfo.text}`}>
                {typeInfo.label}
            </span>
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route('stocks.index')}
                        className="rounded-lg border border-white/15 p-2 text-slate-200 hover:bg-white/5"
                    >
                        <ArrowLeft className="size-5" />
                    </Link>
                    <h1 className="text-xl font-semibold text-white">Détails du mouvement</h1>
                </div>
            }
        >
            <Head title="Détails du mouvement" />

            <div className="mx-auto max-w-3xl space-y-6">
                {/* Header card */}
                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-amber-300/10 via-orange-300/5 to-transparent p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-slate-400">Mouvement de stock</p>
                            <h2 className="mt-1 text-2xl font-bold text-white">#{movement.id}</h2>
                        </div>
                        <div>{getTypeBadge(movement.type)}</div>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg border border-white/15 bg-slate-900/70 p-2">
                                <Calendar className="size-5 text-amber-300" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Date du mouvement</p>
                                <p className="font-medium text-slate-200">
                                    {new Date(movement.movement_date).toLocaleDateString('fr-FR', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="rounded-lg border border-white/15 bg-slate-900/70 p-2">
                                <User className="size-5 text-amber-300" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Créé par</p>
                                <p className="font-medium text-slate-200">{movement.user.name}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Product info */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                        <Package className="size-5 text-amber-300" />
                        Produit
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-slate-400">Nom</span>
                            <span className="font-medium text-slate-200">{movement.product.name}</span>
                        </div>
                        {movement.product.sku && (
                            <div className="flex justify-between">
                                <span className="text-slate-400">SKU</span>
                                <span className="font-mono text-sm text-slate-300">{movement.product.sku}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Movement details */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                        <FileText className="size-5 text-amber-300" />
                        Détails du mouvement
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-slate-400">Boutique</span>
                            <div className="flex items-center gap-2">
                                <MapPin className="size-4 text-slate-400" />
                                <span className="font-medium text-slate-200">{movement.shop.name}</span>
                            </div>
                        </div>

                        <div className="flex justify-between border-t border-white/10 pt-4">
                            <span className="text-slate-400">Quantité</span>
                            <span
                                className={`text-xl font-bold ${
                                    movement.quantity > 0 ? 'text-green-400' : 'text-red-400'
                                }`}
                            >
                                {movement.quantity > 0 ? '+' : ''}
                                {movement.quantity}
                            </span>
                        </div>

                        {movement.unit_cost && (
                            <div className="flex justify-between">
                                <span className="text-slate-400">Coût unitaire</span>
                                <span className="font-medium text-slate-200">
                                    {parseFloat(movement.unit_cost).toLocaleString('fr-FR', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}{' '}
                                    DH
                                </span>
                            </div>
                        )}

                        {movement.unit_cost && (
                            <div className="flex justify-between border-t border-white/10 pt-4">
                                <span className="text-slate-400">Valeur totale</span>
                                <span className="text-lg font-bold text-amber-300">
                                    {(Math.abs(movement.quantity) * parseFloat(movement.unit_cost)).toLocaleString(
                                        'fr-FR',
                                        {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        }
                                    )}{' '}
                                    DH
                                </span>
                            </div>
                        )}

                        {movement.notes && (
                            <div className="border-t border-white/10 pt-4">
                                <p className="mb-2 text-sm text-slate-400">Notes</p>
                                <p className="rounded-lg border border-white/10 bg-slate-900/50 p-3 text-sm text-slate-200">
                                    {movement.notes}
                                </p>
                            </div>
                        )}

                        <div className="border-t border-white/10 pt-4">
                            <p className="text-xs text-slate-500">
                                Créé le{' '}
                                {new Date(movement.created_at).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Link
                        href={route('stocks.index')}
                        className="rounded-lg border border-white/15 px-6 py-2 text-sm font-medium text-slate-200 hover:bg-white/5"
                    >
                        Retour à la liste
                    </Link>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
