import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2, Building2, Phone, MapPin, Eye, Search, Filter } from 'lucide-react';
import Table, { TableActions, TableActionButton, TableBadge } from '@/Components/Table';
import { useState, FormEventHandler } from 'react';

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
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');

    const handleFilter: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(
            route('suppliers.index'),
            { search, status },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleDelete = (supplier: Supplier) => {
        if (confirm(`Êtes-vous sûr de vouloir supprimer le fournisseur ${supplier.name} ?`)) {
            router.delete(route('suppliers.destroy', supplier.id));
        }
    };

    const columns = [
        {
            key: 'name',
            label: 'Fournisseur',
            render: (supplier: Supplier) => (
                <div>
                    <div className="flex items-center gap-2">
                        <Building2 className="size-4 text-amber-300" />
                        <span className="font-medium">{supplier.name}</span>
                    </div>
                    {supplier.company_name && (
                        <div className="mt-0.5 text-xs text-slate-400">{supplier.company_name}</div>
                    )}
                </div>
            ),
        },
        {
            key: 'contact',
            label: 'Contact',
            render: (supplier: Supplier) => (
                <div className="space-y-1 text-sm text-slate-300">
                    {supplier.phone && (
                        <div className="flex items-center gap-2">
                            <Phone className="size-3.5" />
                            {supplier.phone}
                        </div>
                    )}
                    {supplier.email && <div className="text-xs text-slate-400">{supplier.email}</div>}
                </div>
            ),
        },
        {
            key: 'location',
            label: 'Localisation',
            render: (supplier: Supplier) => (
                <div className="flex items-center gap-2 text-slate-300">
                    <MapPin className="size-4" />
                    <div>
                        {supplier.city && <div>{supplier.city}</div>}
                        <div className="text-xs text-slate-400">{supplier.country}</div>
                    </div>
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Statut',
            align: 'center' as const,
            render: (supplier: Supplier) => (
                <TableBadge variant={supplier.is_active ? 'success' : 'danger'}>
                    {supplier.is_active ? 'Actif' : 'Inactif'}
                </TableBadge>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            align: 'right' as const,
            render: (supplier: Supplier) => (
                <TableActions>
                    <Link
                        href={route('suppliers.show', supplier.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/10"
                    >
                        <Eye className="size-3.5" /> Voir
                    </Link>
                    <Link
                        href={route('suppliers.edit', supplier.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/10"
                    >
                        <Pencil className="size-3.5" /> Modifier
                    </Link>
                    <TableActionButton variant="danger" onClick={() => handleDelete(supplier)}>
                        <Trash2 className="size-3.5" /> Supprimer
                    </TableActionButton>
                </TableActions>
            ),
        },
    ];

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">Fournisseurs</h1>}>
            <Head title="Fournisseurs" />
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-300">Gérez vos fournisseurs et leurs informations</p>
                    <Link
                        href={route('suppliers.create')}
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200"
                    >
                        <Plus className="size-4" /> Nouveau fournisseur
                    </Link>
                </div>

                {/* Filtres */}
                <form onSubmit={handleFilter} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                            <label htmlFor="search" className="block text-sm font-medium text-slate-200">
                                Recherche
                            </label>
                            <div className="relative mt-1">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    id="search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="block w-full rounded-lg border border-white/15 bg-slate-900/70 py-2 pl-10 pr-3 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                    placeholder="Nom, email, téléphone..."
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-slate-200">
                                Statut
                            </label>
                            <select
                                id="status"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                            >
                                <option value="">Tous</option>
                                <option value="active">Actifs</option>
                                <option value="inactive">Inactifs</option>
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                type="submit"
                                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200"
                            >
                                <Filter className="size-4" /> Filtrer
                            </button>
                        </div>
                    </div>
                </form>

                <Table columns={columns} data={suppliers.data} emptyMessage="Aucun fournisseur trouvé" />

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
            </section>
        </AuthenticatedLayout>
    );
}
