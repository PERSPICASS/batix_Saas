import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Search, Users, Store, Power, Package } from 'lucide-react';
import Table, { TableActions, TableActionButton, TableBadge } from '@/Components/Table';
import { useState } from 'react';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';
import { useLocale } from '@/contexts/LocaleContext';

interface Account {
    id: number;
    name: string;
    email: string;
    code_user: string;
    is_active: boolean;
    shops_count: number;
    products_count: number;
    created_at: string;
}

interface PaginatedAccounts {
    data: Account[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    accounts: PaginatedAccounts;
    filters: {
        search?: string;
        status?: string;
    };
}

export default function PlatformAdminAccounts({ accounts, filters }: Props) {
    const { t } = useLocale();
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [confirmToggle, setConfirmToggle] = useState<number | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('platform.accounts'),
            { search: searchTerm, status: filters.status },
            { preserveState: true }
        );
    };

    const handleStatusFilter = (status: string) => {
        router.get(
            route('platform.accounts'),
            { search: filters.search, status },
            { preserveState: true }
        );
    };

    const toggleAccountStatus = (accountId: number) => {
        router.post(
            route('platform.accounts.toggle', accountId),
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
            label: 'Compte',
            render: (account: Account) => (
                <div>
                    <p className="font-medium text-slate-900 dark:text-white">{account.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{account.email}</p>
                    <p className="mt-1 text-xs text-slate-500">Code: {account.code_user}</p>
                </div>
            ),
        },
        {
            key: 'shops_count',
            label: 'Boutiques',
            render: (account: Account) => (
                <div className="flex items-center gap-2 text-amber-300">
                    <Store className="size-4" />
                    <span className="font-semibold">{account.shops_count}</span>
                </div>
            ),
        },
        {
            key: 'products_count',
            label: 'Produits',
            render: (account: Account) => (
                <div className="flex items-center gap-2 text-blue-300">
                    <Package className="size-4" />
                    <span className="font-semibold">{account.products_count}</span>
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Statut',
            render: (account: Account) => (
                <TableBadge variant={account.is_active ? 'success' : 'danger'}>
                    {account.is_active ? 'Actif' : 'Inactif'}
                </TableBadge>
            ),
        },
        {
            key: 'created_at',
            label: 'Créé le',
            render: (account: Account) => (
                <span className="text-sm text-slate-500 dark:text-slate-400">{account.created_at}</span>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (account: Account) => (
                <TableActions>
                    <button
                        type="button"
                        onClick={() => setConfirmToggle(account.id)}
                        className={`rounded-lg p-2 transition ${
                            account.is_active
                                ? 'text-red-300 hover:bg-red-500/10'
                                : 'text-emerald-300 hover:bg-emerald-500/10'
                        }`}
                        title={account.is_active ? 'Désactiver' : 'Activer'}
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
                    <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Gestion des comptes</h1>
                    <Link
                        href={route('platform.dashboard')}
                        className="text-sm text-amber-300 hover:text-amber-200"
                    >
                        ← Retour au dashboard
                    </Link>
                </div>
            }
        >
            <Head title="Comptes - Admin Plateforme" />

            <div className="space-y-6">
                {/* Filtres et recherche */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <form onSubmit={handleSearch} className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Rechercher par nom, email ou code..."
                                    className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-300/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-slate-500"
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
                                Tous
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
                                Actifs
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
                                Inactifs
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats rapides */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Total comptes</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{accounts.total}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Sur cette page</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{accounts.data.length}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Page actuelle</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                            {accounts.current_page} / {accounts.last_page}
                        </p>
                    </div>
                </div>

                {/* Table */}
                <Table
                    columns={columns}
                    data={accounts.data}
                    emptyMessage="Aucun compte trouvé."
                />
            </div>

            {/* Modal de confirmation */}
            {confirmToggle && (
                <ConfirmDeleteModal
                    show={true}
                    onClose={() => setConfirmToggle(null)}
                    onConfirm={() => toggleAccountStatus(confirmToggle)}
                    title="Changer le statut du compte"
                    message="Êtes-vous sûr de vouloir changer le statut de ce compte ? Cela affectera l'accès à toutes ses boutiques."
                />
            )}
        </AuthenticatedLayout>
    );
}
