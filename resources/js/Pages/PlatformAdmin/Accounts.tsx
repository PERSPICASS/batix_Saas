import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Search, Store, Power, Package, FlaskConical } from 'lucide-react';
import Table, { TableActions, TableBadge } from '@/Components/Table';
import { useState } from 'react';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';
import PaginationLinks from '@/Components/PaginationLinks';
import { useLocale } from '@/contexts/LocaleContext';
import { fmtDate } from '@/utils/platformFormat';

interface Account {
    id: number;
    name: string;
    email: string;
    code_user: string;
    is_active: boolean;
    is_demo: boolean;
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
    const { t, locale } = useLocale();
    const tr = t.platformAdmin.accounts;
    const common = t.platformAdmin.common;
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [confirmToggle, setConfirmToggle] = useState<Account | null>(null);
    const [processing, setProcessing] = useState(false);

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

    const toggleAccountStatus = (account: Account) => {
        router.post(
            route('platform.accounts.toggle', account.id),
            {},
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => {
                    setProcessing(false);
                    setConfirmToggle(null);
                },
            }
        );
    };

    // Compte démo : exclu des chiffres de la plateforme, sans autre effet.
    const toggleDemo = (account: Account) => {
        router.post(route('platform.accounts.toggle-demo', account.id), {}, { preserveScroll: true });
    };

    const filterButton = (value: string, label: string) => (
        <button
            type="button"
            onClick={() => handleStatusFilter(value)}
            className={`rounded-lg px-3 py-2 text-sm transition ${
                (filters.status || '') === value
                    ? 'bg-amber-300 text-slate-950'
                    : 'border border-gray-300 text-slate-600 hover:bg-gray-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5'
            }`}
        >
            {label}
        </button>
    );

    const columns = [
        {
            key: 'name',
            label: tr.columns.account,
            render: (account: Account) => (
                <div>
                    <Link
                        href={route('platform.accounts.show', account.id)}
                        className="font-medium text-slate-900 hover:text-amber-600 hover:underline dark:text-white dark:hover:text-amber-300"
                    >
                        {account.name}
                    </Link>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{account.email}</p>
                    <p className="mt-1 text-xs text-slate-500">{common.code}: {account.code_user}</p>
                </div>
            ),
        },
        {
            key: 'shops_count',
            label: tr.columns.shops,
            render: (account: Account) => (
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-300">
                    <Store className="size-4" />
                    <span className="font-semibold">{account.shops_count}</span>
                </div>
            ),
        },
        {
            key: 'products_count',
            label: tr.columns.products,
            render: (account: Account) => (
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-300">
                    <Package className="size-4" />
                    <span className="font-semibold">{account.products_count}</span>
                </div>
            ),
        },
        {
            key: 'status',
            label: common.status,
            render: (account: Account) => (
                <div className="flex flex-wrap items-center gap-1">
                    <TableBadge variant={account.is_active ? 'success' : 'danger'}>
                        {account.is_active ? common.active : tr.suspended}
                    </TableBadge>
                    {account.is_demo && (
                        <span title={tr.demoHint}>
                            <TableBadge variant="warning">{tr.demo}</TableBadge>
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'created_at',
            label: common.createdAt,
            render: (account: Account) => (
                <span className="text-sm text-slate-500 dark:text-slate-400">{fmtDate(account.created_at, locale)}</span>
            ),
        },
        {
            key: 'actions',
            label: common.actions,
            render: (account: Account) => (
                <TableActions>
                    <button
                        type="button"
                        onClick={() => toggleDemo(account)}
                        className={`rounded-lg p-2 transition hover:bg-amber-500/10 ${
                            account.is_demo ? 'text-amber-600 dark:text-amber-300' : 'text-slate-400'
                        }`}
                        title={account.is_demo ? tr.unmarkDemo : tr.markDemo}
                    >
                        <FlaskConical className="size-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setConfirmToggle(account)}
                        className={`rounded-lg p-2 transition ${
                            account.is_active
                                ? 'text-red-500 hover:bg-red-500/10 dark:text-red-300'
                                : 'text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-300'
                        }`}
                        title={account.is_active ? common.suspend : common.reactivate}
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
                    <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{tr.title}</h1>
                    <Link
                        href={route('platform.dashboard')}
                        className="text-sm text-amber-600 hover:text-amber-500 dark:text-amber-300 dark:hover:text-amber-200"
                    >
                        {common.backToDashboard}
                    </Link>
                </div>
            }
        >
            <Head title={tr.headTitle} />

            <div className="space-y-6">
                <div className="rounded-xl border border-gray-200 bg-white p-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <form onSubmit={handleSearch} className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={tr.searchPlaceholder}
                                    className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-300/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-slate-500"
                                />
                            </div>
                        </form>

                        <div className="flex gap-2">
                            {filterButton('', common.all)}
                            {filterButton('active', tr.filterActive)}
                            {filterButton('inactive', tr.filterSuspended)}
                            {filterButton('demo', tr.filterDemo)}
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                        <p className="text-sm text-slate-500 dark:text-slate-400">{tr.total}</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{accounts.total}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                        <p className="text-sm text-slate-500 dark:text-slate-400">{common.onThisPage}</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{accounts.data.length}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                        <p className="text-sm text-slate-500 dark:text-slate-400">{common.currentPage}</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                            {accounts.current_page} / {accounts.last_page}
                        </p>
                    </div>
                </div>

                <Table columns={columns} data={accounts.data} emptyMessage={tr.empty} />

                <PaginationLinks links={accounts.links} />
            </div>

            <ConfirmDeleteModal
                show={confirmToggle !== null}
                onClose={() => setConfirmToggle(null)}
                onConfirm={() => confirmToggle && toggleAccountStatus(confirmToggle)}
                title={confirmToggle?.is_active ? tr.confirmSuspendTitle : tr.confirmReactivateTitle}
                message={
                    confirmToggle
                        ? confirmToggle.is_active
                            ? tr.confirmSuspend(confirmToggle.name)
                            : tr.confirmReactivate(confirmToggle.name)
                        : ''
                }
                confirmText={confirmToggle?.is_active ? common.suspend : common.reactivate}
                processingText={confirmToggle?.is_active ? common.suspend : common.reactivate}
                tone={confirmToggle?.is_active ? 'danger' : 'success'}
                processing={processing}
            />
        </AuthenticatedLayout>
    );
}
