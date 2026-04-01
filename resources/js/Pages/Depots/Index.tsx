import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Plus, Search, Warehouse, Package, AlertTriangle, Pencil, Eye } from 'lucide-react';
import { useState } from 'react';
import { useRoute } from '@/utils/route';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';
import { router } from '@inertiajs/react';

interface Depot {
    id: number;
    name: string;
    address: string | null;
    city: string | null;
    phone: string | null;
    description: string | null;
    is_active: boolean;
    depot_products_count: number;
    total_stock: number;
    created_at: string;
}

interface Props {
    depots: Depot[];
    filters: { search?: string };
    canCreateDepot: boolean;
    remainingDepots: number;
}

export default function Index({ depots, filters, canCreateDepot = true, remainingDepots = -1 }: Props) {
    const buildRoute = useRoute();
    const [search, setSearch] = useState(filters.search || '');
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(buildRoute('depots.index'), { search }, { preserveState: true, replace: true });
    };

    const handleDelete = () => {
        if (!deleteId) return;
        router.delete(buildRoute('depots.destroy', { depot: deleteId }), {
            onSuccess: () => setDeleteId(null),
        });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Dépôts</h2>}>
            <Head title="Dépôts" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dépôts</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Gérez vos dépôts et approvisionnez vos boutiques
                        </p>
                    </div>
                    {canCreateDepot ? (
                        <Link
                            href={buildRoute('depots.create')}
                            className="inline-flex items-center gap-2 rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
                        >
                            <Plus className="size-4" />
                            Nouveau dépôt
                        </Link>
                    ) : (
                        <div className="group relative">
                            <button
                                disabled
                                className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-400 opacity-60 dark:bg-slate-700 dark:text-slate-500"
                            >
                                <Plus className="size-4" />
                                Nouveau dépôt
                            </button>
                            <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                                {remainingDepots === 0
                                    ? "Votre offre ne permet pas de créer des dépôts."
                                    : "Limite de dépôts atteinte. Passez à un plan supérieur."}
                            </div>
                        </div>
                    )}
                </div>

                {/* Search */}
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Rechercher un dépôt..."
                            className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-4 py-2 text-sm dark:border-white/10 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                        />
                    </div>
                    <button type="submit" className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600">
                        Rechercher
                    </button>
                </form>

                {/* Grid */}
                {depots.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-16 dark:border-white/10">
                        <Warehouse className="size-12 text-slate-300 dark:text-slate-600" />
                        <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">Aucun dépôt</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">Créez votre premier dépôt pour commencer</p>
                        <Link
                            href={buildRoute('depots.create')}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200"
                        >
                            <Plus className="size-4" />
                            Créer un dépôt
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {depots.map(depot => (
                            <div
                                key={depot.id}
                                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-slate-900"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-300/10">
                                            <Warehouse className="size-5 text-amber-600 dark:text-amber-300" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900 dark:text-white">{depot.name}</h3>
                                            {depot.city && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{depot.city}</p>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${depot.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                        {depot.is_active ? 'Actif' : 'Inactif'}
                                    </span>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-3">
                                    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                            <Package className="size-3.5" />
                                            Références
                                        </div>
                                        <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{depot.depot_products_count}</p>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                            <AlertTriangle className="size-3.5" />
                                            Unités en stock
                                        </div>
                                        <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{depot.total_stock}</p>
                                    </div>
                                </div>

                                <div className="mt-4 flex gap-2">
                                    <Link
                                        href={buildRoute('depots.show', { depot: depot.id })}
                                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-200"
                                    >
                                        <Eye className="size-3.5" />
                                        Voir
                                    </Link>
                                    <Link
                                        href={buildRoute('depots.edit', { depot: depot.id })}
                                        className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                                    >
                                        <Pencil className="size-3.5" />
                                    </Link>
                                    <button
                                        onClick={() => setDeleteId(depot.id)}
                                        className="flex items-center justify-center rounded-lg border border-rose-200 px-3 py-1.5 text-xs text-rose-500 hover:bg-rose-50 dark:border-rose-400/20 dark:text-rose-400 dark:hover:bg-rose-400/10"
                                    >
                                        <span className="sr-only">Supprimer</span>
                                        <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ConfirmDeleteModal
                show={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Supprimer le dépôt"
                message="Êtes-vous sûr de vouloir supprimer ce dépôt ? Tout le stock associé sera perdu."
            />
        </AuthenticatedLayout>
    );
}
