import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { PageProps } from '@/types';
import Table, { TableActions, TableActionButton, TableBadge } from '@/Components/Table';
import { useRoute } from '@/utils/route';
import { useLocale } from '@/contexts/LocaleContext';

interface Subcategory {
    id: number;
    name: string;
    description: string | null;
    is_active: boolean;
    order: number;
    category: {
        id: number;
        name: string;
        shop: {
            id: number;
            name: string;
        };
    };
}

interface Category {
    id: number;
    name: string;
}

export default function SubcategoriesIndex({ subcategories, categories }: PageProps<{ subcategories: Subcategory[], categories: Category[] }>) {
    const route = useRoute();
    const { t } = useLocale();

    const handleDelete = (id: number) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette sous-catégorie ?')) {
            router.delete(route('subcategories.destroy', { sous_category: id }));
        }
    };

    const columns = [
        {
            key: 'name',
            label: 'Nom',
        },
        {
            key: 'category',
            label: 'Catégorie parente',
            render: (subcategory: Subcategory) => subcategory.category.name,
        },
        {
            key: 'shop',
            label: 'Boutique',
            render: (subcategory: Subcategory) => subcategory.category.shop.name,
        },
        {
            key: 'is_active',
            label: 'Statut',
            align: 'center' as const,
            render: (subcategory: Subcategory) => (
                <TableBadge variant={subcategory.is_active ? 'success' : 'danger'}>
                    {subcategory.is_active ? 'Active' : 'Inactive'}
                </TableBadge>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            align: 'right' as const,
            render: (subcategory: Subcategory) => (
                <TableActions>
                    <Link href={route('subcategories.edit', { sous_category: subcategory.id })}>
                        <TableActionButton>
                            <Pencil className="size-3.5" /> {t.common.actions.edit}
                        </TableActionButton>
                    </Link>
                    <TableActionButton
                        variant="danger"
                        onClick={() => handleDelete(subcategory.id)}
                    >
                        <Trash2 className="size-3.5" /> {t.common.actions.delete}
                    </TableActionButton>
                </TableActions>
            ),
        },
    ];

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">Sous-catégories</h1>}>
            <Head title="Sous categories" />
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-300">Gérez les sous-catégories de vos produits.</p>
                    <Link href={route('subcategories.create')} className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200">
                        <Plus className="size-4" /> Nouvelle sous-catégorie
                    </Link>
                </div>

                <Table
                    columns={columns}
                    data={subcategories}
                    emptyMessage="Aucune sous-catégorie. Créez-en une pour commencer."
                />
            </section>
        </AuthenticatedLayout>
    );
}
