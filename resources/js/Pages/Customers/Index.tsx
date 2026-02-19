import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Table, { TableActionButton, TableActions, TableBadge } from '@/Components/Table';
import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';

interface Shop {
    id: number;
    name: string;
}

interface Customer {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    city: string | null;
    total_purchases: string;
    is_active: boolean;
    shop: Shop;
}

interface PaginatedData {
    data: Customer[];
    links: any;
    meta: any;
}

interface Props {
    customers: PaginatedData;
}

export default function CustomersIndex({ customers }: Props) {
    const handleDelete = (customer: Customer) => {
        if (confirm(`Êtes-vous sûr de vouloir supprimer le client "${customer.name}" ?`)) {
            router.delete(route('customers.destroy', customer.id));
        }
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">Clients</h1>}>
            <Head title="Clients" />
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-300">
                        {customers.data.length} client{customers.data.length > 1 ? 's' : ''}
                    </p>
                    <Link
                        href={route('customers.create')}
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200"
                    >
                        <Plus className="size-4" /> Nouveau client
                    </Link>
                </div>

                <Table
                    data={customers.data}
                    columns={[
                        { key: 'name', label: 'Nom' },
                        { key: 'email', label: 'Email' },
                        { key: 'phone', label: 'Téléphone' },
                        { key: 'city', label: 'Ville' },
                        {
                            key: 'total_purchases',
                            label: 'Total achats',
                            align: 'right',
                            render: (customer) => `${parseFloat(customer.total_purchases).toFixed(2)} €`,
                        },
                        {
                            key: 'is_active',
                            label: 'Statut',
                            align: 'center',
                            render: (customer) => (
                                <TableBadge variant={customer.is_active ? 'success' : 'danger'}>
                                    {customer.is_active ? 'Actif' : 'Inactif'}
                                </TableBadge>
                            ),
                        },
                        {
                            key: 'shop',
                            label: 'Boutique',
                            render: (customer) => customer.shop.name,
                        },
                        {
                            key: 'actions',
                            label: 'Actions',
                            align: 'right',
                            render: (customer) => (
                                <TableActions>
                                    <Link
                                        href={route('customers.edit', customer.id)}
                                        className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/10"
                                    >
                                        <Pencil className="size-3.5" /> Modifier
                                    </Link>
                                    <TableActionButton variant="danger" onClick={() => handleDelete(customer)}>
                                        <Trash2 className="size-3.5" /> Supprimer
                                    </TableActionButton>
                                </TableActions>
                            ),
                        },
                    ]}
                    emptyMessage="Aucun client trouvé"
                />

                {/* Pagination */}
                {customers.links && (
                    <div className="flex items-center justify-center gap-1">
                        {customers.links.map((link: any, index: number) => (
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
