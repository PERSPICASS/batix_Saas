import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2, Building2, Phone, MapPin, Eye, Search, Filter, Store } from 'lucide-react';
import Table, { TableActions, TableActionButton, TableBadge } from '@/Components/Table';
import { useState, FormEventHandler } from 'react';
import { useRoute } from '@/utils/route';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';
import { useLocale } from '@/contexts/LocaleContext';

interface Shop {
    id: number;
    name: string;
}

interface Supplier {
    id: number;
    name: string;
    company_name: string | null;
    email: string | null;
    phone: string | null;
    mobile: string | null;
    city: string | null;
    country: string;
    is_active: boolean;
    shops: Shop[];
}

interface PaginatedSuppliers {
    data: Supplier[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    suppliers: PaginatedSuppliers;
    filters: {
        search?: string;
        status?: string;
    };
}

export default function SuppliersIndex({ suppliers, filters }: Props) {
    const route = useRoute();
    const { t } = useLocale();

    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [deleteModal, setDeleteModal] = useState<{ show: boolean; supplier: Supplier | null }>({ show: false, supplier: null });
    const [deleting, setDeleting] = useState(false);

    const handleFilter: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(
            route('suppliers.index'),
            { search, status },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleDelete = (supplier: Supplier) => {
        setDeleteModal({ show: true, supplier });
    };

    const confirmDelete = () => {
        if (!deleteModal.supplier) return;
        setDeleting(true);
        router.delete(route('suppliers.destroy', { supplier: deleteModal.supplier.id }), {
            onSuccess: () => {
                setDeleteModal({ show: false, supplier: null });
                setDeleting(false);
            },
            onError: () => setDeleting(false),
        });
    };

    const columns = [
        {
            key: 'name',
            label: t.suppliers.columns.name,
            render: (supplier: Supplier) => (
                <div>
                    <div className="flex items-center gap-2">
                        <Building2 className="size-4 text-amber-300" />
                        <span className="font-medium">{supplier.name}</span>
                    </div>
                    {supplier.company_name && (
                        <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{supplier.company_name}</div>
                    )}
                </div>
            ),
        },
        {
            key: 'contact',
            label: t.suppliers.contact,
            render: (supplier: Supplier) => (
                <div className="space-y-1 text-sm text-slate-300">
                    {supplier.phone && (
                        <div className="flex items-center gap-2">
                            <Phone className="size-3.5" />
                            {supplier.phone}
                        </div>
                    )}
                    {supplier.email && <div className="text-xs text-slate-500 dark:text-slate-400">{supplier.email}</div>}
                </div>
            ),
        },
        {
            key: 'location',
            label: t.suppliers.location,
            render: (supplier: Supplier) => (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <MapPin className="size-4" />
                    <div>
                        {supplier.city && <div>{supplier.city}</div>}
                        <div className="text-xs text-slate-500 dark:text-slate-400">{supplier.country}</div>
                    </div>
                </div>
            ),
        },
        {
            key: 'shops',
            label: t.suppliers.columns.shops,
            render: (supplier: Supplier) => (
                <div className="flex flex-wrap gap-1">
                    {supplier.shops?.map((shop) => (
                        <span
                            key={shop.id}
                            className="inline-flex items-center gap-1 rounded-full bg-slate-700/50 px-2 py-0.5 text-xs text-slate-300"
                        >
                            <Store className="size-3" />
                            {shop.name}
                        </span>
                    ))}
                </div>
            ),
        },
        {
            key: 'status',
            label: t.suppliers.columns.status,
            align: 'center' as const,
            render: (supplier: Supplier) => (
                <TableBadge variant={supplier.is_active ? 'success' : 'danger'}>
                    {supplier.is_active ? t.common.status.active : t.common.status.inactive}
                </TableBadge>
            ),
        },
        {
            key: 'actions',
            label: t.suppliers.columns.actions,
            align: 'right' as const,
            render: (supplier: Supplier) => (
                <TableActions>
                    <Link
                        href={route('suppliers.show', { supplier: supplier.id })}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
                    >
                        <Eye className="size-3.5" /> {t.suppliers.actions.view}
                    </Link>
                    <Link
                        href={route('suppliers.edit', { supplier: supplier.id })}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
                    >
                        <Pencil className="size-3.5" /> {t.suppliers.actions.edit}
                    </Link>
                    <TableActionButton variant="danger" onClick={() => handleDelete(supplier)}>
                        <Trash2 className="size-3.5" /> {t.suppliers.actions.delete}
                    </TableActionButton>
                </TableActions>
            ),
        },
    ];

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-slate-900 dark:text-white">{t.suppliers.title}</h1>}>
            <Head title={t.suppliers.title} />
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-600 dark:text-slate-300">{t.suppliers.subtitle}</p>
                    <Link
                        href={route('suppliers.create')}
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200"
                    >
                        <Plus className="size-4" /> {t.suppliers.actions.new}
                    </Link>
                </div>

                <form onSubmit={handleFilter} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                            <label htmlFor="search" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                {t.common.actions.search}
                            </label>
                            <div className="relative mt-1">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
                                <input
                                    type="text"
                                    id="search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="block w-full rounded-lg border border-white/15 bg-slate-900/70 py-2 pl-10 pr-3 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                    placeholder={t.suppliers.searchPlaceholder}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                {t.common.misc.status}
                            </label>
                            <select
                                id="status"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                            >
                                <option value="">{t.suppliers.filterAll}</option>
                                <option value="active">{t.suppliers.filterActive}</option>
                                <option value="inactive">{t.suppliers.filterInactive}</option>
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                type="submit"
                                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200"
                            >
                                <Filter className="size-4" /> {t.suppliers.filterButton}
                            </button>
                        </div>
                    </div>
                </form>

                <Table columns={columns} data={suppliers.data} emptyMessage={t.suppliers.emptyMessage} />

                {/* Pagination */}
                {suppliers.links && (
                    <div className="flex items-center justify-center gap-1">
                        {suppliers.links.map((link, index) => (
                            <Link
                                key={index}
                                href={link.url || '#'}
                                className={`rounded-lg px-3 py-2 text-sm ${
                                    link.active
                                        ? 'bg-amber-300 text-slate-950 font-semibold'
                                        : 'border border-white/15 text-slate-200 hover:bg-white/10'
                                } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}

                {/* Modal de suppression */}
                <ConfirmDeleteModal
                    show={deleteModal.show}
                    onClose={() => setDeleteModal({ show: false, supplier: null })}
                    onConfirm={confirmDelete}
                    message={t.suppliers.deleteConfirm(deleteModal.supplier?.name ?? '')}
                    processing={deleting}
                />
            </section>
        </AuthenticatedLayout>
    );
}
