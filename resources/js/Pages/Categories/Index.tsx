import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { PageProps } from '@/types';
import Table, { TableActions, TableActionButton, TableBadge, TableColorIndicator } from '@/Components/Table';
import { useRoute } from '@/utils/route';
import { useState } from 'react';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';
import { useLocale } from '@/contexts/LocaleContext';

interface Category {
    id: number;
    name: string;
    description: string | null;
    color: string;
    icon: string | null;
    is_active: boolean;
    order: number;
}

interface Shop {
    id: number;
    name: string;
}

export default function CategoriesIndex({ categories, shops }: PageProps<{ categories: Category[], shops: Shop[] }>) {
    const route = useRoute();
    const { t } = useLocale();
    const [deleteModal, setDeleteModal] = useState<{ show: boolean; category: Category | null }>({ show: false, category: null });
    const [deleting, setDeleting] = useState(false);

    const handleDelete = (category: Category) => {
        setDeleteModal({ show: true, category });
    };

    const confirmDelete = () => {
        if (!deleteModal.category) return;
        setDeleting(true);
        router.delete(route('categories.destroy', { category: deleteModal.category.id }), {
            onSuccess: () => {
                setDeleteModal({ show: false, category: null });
                setDeleting(false);
            },
            onError: () => setDeleting(false),
        });
    };

    const columns = [
        {
            key: 'name',
            label: t.categories.columns.name,
            render: (category: Category) => (
                <TableColorIndicator color={category.color} label={category.name} />
            ),
        },
        {
            key: 'description',
            label: t.categories.columns.description,
            render: (category: Category) => category.description || '-',
        },
        {
            key: 'is_active',
            label: t.common.misc.status,
            align: 'center' as const,
            render: (category: Category) => (
                <TableBadge variant={category.is_active ? 'success' : 'danger'}>
                    {category.is_active ? t.common.status.active : t.common.status.inactive}
                </TableBadge>
            ),
        },
        {
            key: 'actions',
            label: t.categories.columns.actions,
            align: 'right' as const,
            render: (category: Category) => (
                <TableActions>
                    <Link href={route('categories.edit', { category: category.id })}>
                        <TableActionButton>
                            <Pencil className="size-3.5" /> {t.categories.actions.edit}
                        </TableActionButton>
                    </Link>
                    <TableActionButton variant="danger" onClick={() => handleDelete(category)}>
                        <Trash2 className="size-3.5" /> {t.categories.actions.delete}
                    </TableActionButton>
                </TableActions>
            ),
        },
    ];

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">{t.categories.title}</h1>}>
            <Head title={t.categories.title} />
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-300">{t.categories.title}</p>
                    <Link href={route('categories.create')} className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200">
                        <Plus className="size-4" /> {t.categories.actions.new}
                    </Link>
                </div>

                <Table
                    columns={columns}
                    data={categories}
                    emptyMessage={t.categories.emptyMessage}
                />

                <ConfirmDeleteModal
                    show={deleteModal.show}
                    onClose={() => setDeleteModal({ show: false, category: null })}
                    onConfirm={confirmDelete}
                    message={t.categories.deleteConfirm(deleteModal.category?.name ?? '')}
                    processing={deleting}
                />
            </section>
        </AuthenticatedLayout>
    );
}
