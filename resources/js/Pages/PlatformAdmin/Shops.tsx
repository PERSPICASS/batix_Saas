import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Search, Power, Package } from 'lucide-react';
import Table, { TableActions, TableBadge } from '@/Components/Table';
import { useState } from 'react';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';
import PaginationLinks from '@/Components/PaginationLinks';
import { useLocale } from '@/contexts/LocaleContext';
import { fmtDate } from '@/utils/platformFormat';

interface Owner {
    id: number | null;
    name: string | null;
    email: string | null;
    code_user: string | null;
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
    const { t, locale } = useLocale();
    const tr = t.platformAdmin.shops;
    const common = t.platformAdmin.common;
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [confirmToggle, setConfirmToggle] = useState<Shop | null>(null);
    const [processing, setProcessing] = useState(false);

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

    const toggleShopStatus = (shop: Shop) => {
        router.post(
            route('platform.shops.toggle', shop.id),
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
            label: tr.columns.shop,
            render: (shop: Shop) => (
                <div>
                    <p className="font-medium text-slate-900 dark:text-white">{shop.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">/{shop.slug}</p>
                    {shop.address && (
                        <p className="mt-1 text-xs text-slate-500">
                            {[shop.address, shop.city].filter(Boolean).join(', ')}
                        </p>
                    )}
                </div>
            ),
        },
        {
            key: 'owner',
            label: tr.columns.owner,
            render: (shop: Shop) => (
                <div>
                    <p className="font-medium text-slate-900 dark:text-white">{shop.owner.name ?? common.unknown}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{shop.owner.email}</p>
                    {shop.owner.code_user && (
                        <p className="text-xs text-slate-500">{common.code}: {shop.owner.code_user}</p>
                    )}
                </div>
            ),
        },
        {
            key: 'status',
            label: common.status,
            render: (shop: Shop) => (
                <TableBadge variant={shop.is_active ? 'success' : 'danger'}>
                    {shop.is_active ? common.activeFem : tr.suspended}
                </TableBadge>
            ),
        },
        {
            key: 'created_at',
            label: common.createdAtFem,
            render: (shop: Shop) => (
                <span className="text-sm text-slate-500 dark:text-slate-400">{fmtDate(shop.created_at, locale)}</span>
            ),
        },
        {
            key: 'actions',
            label: common.actions,
            render: (shop: Shop) => (
                <TableActions>
                    <Link
                        href={route('platform.shops.products', shop.id)}
                        className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-500/10 dark:text-blue-300"
                        title={tr.viewProducts}
                    >
                        <Package className="size-4" />
                    </Link>
                    <button
                        type="button"
                        onClick={() => setConfirmToggle(shop)}
                        className={`rounded-lg p-2 transition ${
                            shop.is_active
                                ? 'text-red-500 hover:bg-red-500/10 dark:text-red-300'
                                : 'text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-300'
                        }`}
                        title={shop.is_active ? common.suspend : common.reactivate}
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
                            {filterButton('', common.allFem)}
                            {filterButton('active', tr.filterActive)}
                            {filterButton('inactive', tr.filterSuspended)}
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                        <p className="text-sm text-slate-500 dark:text-slate-400">{tr.total}</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{shops.total}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                        <p className="text-sm text-slate-500 dark:text-slate-400">{common.onThisPage}</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{shops.data.length}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                        <p className="text-sm text-slate-500 dark:text-slate-400">{common.currentPage}</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                            {shops.current_page} / {shops.last_page}
                        </p>
                    </div>
                </div>

                <Table columns={columns} data={shops.data} emptyMessage={tr.empty} />

                <PaginationLinks links={shops.links} />
            </div>

            <ConfirmDeleteModal
                show={confirmToggle !== null}
                onClose={() => setConfirmToggle(null)}
                onConfirm={() => confirmToggle && toggleShopStatus(confirmToggle)}
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
