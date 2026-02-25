import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { PageProps } from '@/types';
import Table, { TableActions, TableActionButton, TableBadge, TableColorIndicator } from '@/Components/Table';
import { useRoute } from '@/utils/route';
import { useState } from 'react';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';

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
            label: 'Nom',
            render: (category: Category) => (
                <TableColorIndicator color={category.color} label={category.name} />
            ),
        },
        {
            key: 'description',
            label: 'Description',
            render: (category: Category) => category.description || '-',
        },
        {
            key: 'is_active',
            label: 'Statut',
            align: 'center' as const,
            render: (category: Category) => (
                <TableBadge variant={category.is_active ? 'success' : 'danger'}>
                    {category.is_active ? 'Active' : 'Inactive'}
                </TableBadge>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            align: 'right' as const,
            render: (category: Category) => (
                <TableActions>
                    <Link href={route('categories.edit', { category: category.id })}>
                        <TableActionButton>
                            <Pencil className="size-3.5" /> Modifier
                        </TableActionButton>
                    </Link>
                    <TableActionButton
                        variant="danger"
                        onClick={() => handleDelete(category)}
                    >
                        <Trash2 className="size-3.5" /> Supprimer
                    </TableActionButton>
                </TableActions>
            ),
        },
    ];

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">Catégories</h1>}>
            <Head title="Categories" />
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-300">Gérez les catégories de vos produits.</p>
                    <Link href={route('categories.create')} className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200">
                        <Plus className="size-4" /> Nouvelle catégorie
                    </Link>
                </div>

                <Table
                    columns={columns}
                    data={categories}
                    emptyMessage="Aucune catégorie. Créez-en une pour commencer."
                />

                {/* Modal de suppression */}
                <ConfirmDeleteModal
                    show={deleteModal.show}
                    onClose={() => setDeleteModal({ show: false, category: null })}
                    onConfirm={confirmDelete}
                    message={`Êtes-vous sûr de vouloir supprimer la catégorie "${deleteModal.category?.name}" ?`}
                    processing={deleting}
                />
            </section>
        </AuthenticatedLayout>
    );
}
