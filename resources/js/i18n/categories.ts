export const categories = {
    fr: {
        title: 'Catégories',
        subcategoriesTitle: 'Sous-catégories',
        columns: {
            name: 'Nom',
            description: 'Description',
            productsCount: 'Produits',
            shop: 'Boutique',
            parent: 'Catégorie parente',
            actions: 'Actions',
        },
        actions: {
            new: 'Nouvelle catégorie',
            newSub: 'Nouvelle sous-catégorie',
            edit: 'Modifier',
            delete: 'Supprimer',
        },
        emptyMessage: 'Aucune catégorie trouvée',
        emptySubMessage: 'Aucune sous-catégorie trouvée',
        deleteConfirm: (name: string) => `Êtes-vous sûr de vouloir supprimer la catégorie "${name}" ?`,
    },
    en: {
        title: 'Categories',
        subcategoriesTitle: 'Subcategories',
        columns: {
            name: 'Name',
            description: 'Description',
            productsCount: 'Products',
            shop: 'Shop',
            parent: 'Parent category',
            actions: 'Actions',
        },
        actions: {
            new: 'New category',
            newSub: 'New subcategory',
            edit: 'Edit',
            delete: 'Delete',
        },
        emptyMessage: 'No categories found',
        emptySubMessage: 'No subcategories found',
        deleteConfirm: (name: string) => `Are you sure you want to delete category "${name}"?`,
    },
} as const;
