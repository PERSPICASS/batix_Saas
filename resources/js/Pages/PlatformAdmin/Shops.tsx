import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Search, Store, Power, User, Package } from 'lucide-react';
import Table, { TableActions, TableBadge } from '@/Components/Table';
import { useState } from 'react';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';
import { useLocale } from '@/contexts/LocaleContext';

interface Owner {
    id: number;
    name: string;
    email: string;
    code_user: string;
}

interface Shop {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
    address: string | null;
    city: string | null;
    owner: Owner;
    created_at: string;
}

interface PaginatedShops {
    data: Shop[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    shops: PaginatedShops;
    filters: {
        search?: string;
        status?: string;
    };
}

export default function PlatformAdminShops({ shops, filters }: Props) {
    const { t } = useLocale();
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [confirmToggle, setConfirmToggle] = useState<number | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('platform.shops'),
            { search: searchTerm, status: filters.status },
            { preserveState: true }
        );
    };

    const handleStatusFilter = (status: string) => {
        router.get(
            route('platform.shops'),
            { search: filters.search, status },
            { preserveState: true }
        );
    };

    const toggleShopStatus = (shopId: number) => {
        router.post(
            route('platform.shops.toggle', shopId),
            {},
            {
                preserveScroll: true,
                onSuccess: () => setConfirmToggle(null),
            }
        );
    };

    const columns = [
        {
            key: 'name',
            label: 'Boutique',
            render: (shop: Shop) => (
                <div>
                    <p className="font-medium text-white">{shop.name}</p>
                    <p className="text-xs text-slate-400">/{shop.slug}</p>
                    {shop.address && (
                        <p className="mt-1 text-xs text-slate-500">
                            {shop.address}, {shop.city}
                        </p>
                    )}
                </div>
            ),
        },
        {
            key: 'owner',
            label: 'Propriétaire',
            render: (shop: Shop) => (
                <div>
                    <p className="font-medium text-white">{shop.owner.name}</p>
                    <p className="text-xs text-slate-400">{shop.owner.email}</p>
                    <p className="text-xs text-slate-500">Code: {shop.owner.code_user}</p>
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Statut',
            render: (shop: Shop) => (
                <TableBadge variant={shop.is_active ? 'success' : 'danger'}>
                    {shop.is_active ? 'Active' : 'Inactive'}
                </TableBadge>
            ),
        },
        {
            key: 'created_at',
            label: 'Créée le',
            render: (shop: Shop) => (
                <span className="text-sm text-slate-400">{shop.created_at}</span>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (shop: Shop) => (
                <TableActions>
                    <Link
                        href={route('platform.shops.products', shop.id)}
                        className="rounded-lg p-2 text-blue-300 transition hover:bg-blue-500/10"
                        title="Voir les produits"
                    >
                        <Package className="size-4" />
                    </Link>
                    <button
                        type="button"
                        onClick={() => setConfirmToggle(shop.id)}
                        className={`rounded-lg p-2 transition ${
                            shop.is_active
                                ? 'text-red-300 hover:bg-red-500/10'
                                : 'text-emerald-300 hover:bg-emerald-500/10'
                        }`}
                        title={shop.is_active ? 'Désactiver' : 'Activer'}
                    >
                        <Power className="size-4" />
                    </button>
                </TableActions>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-white">Gestion des boutiques</h1>
                    <Link
                        href={route('platform.dashboard')}
                        className="text-sm text-amber-300 hover:text-amber-200"
                    >
                        ← Retour au dashboard
                    </Link>
                </div>
            }
        >
            <Head title="Boutiques - Admin Plateforme" />

            <div className="space-y-6">
                {/* Filtres et recherche */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <form onSubmit={handleSearch} className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Rechercher par nom, slug ou propriétaire..."
                                    className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-300/20"
                                />
                            </div>
                        </form>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => handleStatusFilter('')}
                                className={`rounded-lg px-3 py-2 text-sm transition ${
                                    !filters.status
                                        ? 'bg-amber-300 text-slate-950'
                                        : 'border border-white/10 text-slate-300 hover:bg-white/5'
                                }`}
                            >
                                Toutes
                            </button>
                            <button
                                type="button"
                                onClick={() => handleStatusFilter('active')}
                                className={`rounded-lg px-3 py-2 text-sm transition ${
                                    filters.status === 'active'
                                        ? 'bg-amber-300 text-slate-950'
                                        : 'border border-white/10 text-slate-300 hover:bg-white/5'
                                }`}
                            >
                                Actives
                            </button>
                            <button
                                type="button"
                                onClick={() => handleStatusFilter('inactive')}
                                className={`rounded-lg px-3 py-2 text-sm transition ${
                                    filters.status === 'inactive'
                                        ? 'bg-amber-300 text-slate-950'
                                        : 'border border-white/10 text-slate-300 hover:bg-white/5'
                                }`}
                            >
                                Inactives
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats rapides */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                        <p className="text-sm text-slate-400">Total boutiques</p>
                        <p className="mt-1 text-2xl font-bold text-white">{shops.total}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                        <p className="text-sm text-slate-400">Sur cette page</p>
                        <p className="mt-1 text-2xl font-bold text-white">{shops.data.length}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                        <p className="text-sm text-slate-400">Page actuelle</p>
                        <p className="mt-1 text-2xl font-bold text-white">
                            {shops.current_page} / {shops.last_page}
                        </p>
                    </div>
                </div>

                {/* Table */}
                <Table
                    columns={columns}
                    data={shops.data}
                    emptyMessage="Aucune boutique trouvée."
                />
            </div>

            {/* Modal de confirmation */}
            {confirmToggle && (
                <ConfirmDeleteModal
                    show={true}
                    onClose={() => setConfirmToggle(null)}
                    onConfirm={() => toggleShopStatus(confirmToggle)}
                    title="Changer le statut de la boutique"
                    message={t.common.messages.confirmDelete || "Êtes-vous sûr"} de vouloir changer le statut de cette boutique ?"
                />
            )}
        </AuthenticatedLayout>
    );
}
