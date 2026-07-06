import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Table, { TableActionButton, TableActions, TableBadge } from '@/Components/Table';
import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import Currency from '@/Components/Currency';
import { useRoute } from '@/utils/route';
import { useLocale } from '@/contexts/LocaleContext';

interface Shop {
    id: number;
    name: string;
}

interface Customer {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
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
    const route = useRoute();
    const { t } = useLocale();

    const handleDelete = (customer: Customer) => {
        if (confirm(t.customers.deleteConfirm(customer.name))) {
            router.delete(route('customers.destroy', { customer: customer.id }));
        }
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-slate-900 dark:text-white">{t.customers.title}</h1>}>
            <Head title={t.customers.title} />
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        {t.customers.count(customers.data.length)}
                    </p>
                    <Link
                        href={route('customers.create')}
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200"
                    >
                        <Plus className="size-4" /> {t.customers.actions.new}
                    </Link>
                </div>

                <Table
                    data={customers.data}
                    columns={[
                        { key: 'name', label: t.customers.columns.name },
                        { key: 'email', label: t.customers.columns.email },
                        { key: 'phone', label: t.customers.columns.phone },
                        {
                            key: 'total_purchases',
                            label: t.customers.columns.totalPurchases,
                            align: 'right',
                            render: (customer) => <Currency amount={parseFloat(customer.total_purchases)} />,
                        },
                        {
                            key: 'is_active',
                            label: t.customers.columns.status,
                            align: 'center',
                            render: (customer) => (
                                <TableBadge variant={customer.is_active ? 'success' : 'danger'}>
                                    {customer.is_active ? t.customers.status.active : t.customers.status.inactive}
                                </TableBadge>
                            ),
                        },
                        {
                            key: 'shop',
                            label: t.customers.columns.shop,
                            render: (customer) => customer.shop.name,
                        },
                        {
                            key: 'actions',
                            label: t.customers.columns.actions,
                            align: 'right',
                            render: (customer) => (
                                <TableActions>
                                    <Link
                                        href={route('customers.edit', { customer: customer.id })}
                                        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
                                    >
                                        <Pencil className="size-3.5" /> {t.customers.actions.edit}
                                    </Link>
                                    <TableActionButton variant="danger" onClick={() => handleDelete(customer)}>
                                        <Trash2 className="size-3.5" /> {t.customers.actions.delete}
                                    </TableActionButton>
                                </TableActions>
                            ),
                        },
                    ]}
                    emptyMessage={t.customers.emptyMessage}
                />

                {customers.links && (
                    <div className="flex items-center justify-center gap-1">
                        {customers.links.map((link: any, index: number) => (
                            <Link
                                key={index}
                                href={link.url || '#'}
                                className={`rounded-lg px-3 py-2 text-sm ${
                                    link.active
                                        ? 'bg-amber-300 text-slate-950 font-semibold'
                                        : 'border border-gray-300 text-slate-600 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10'
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
