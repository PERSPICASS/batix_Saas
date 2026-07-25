export const subcategories = {
    fr: {
        title: 'Sous-catégories',
        columns: {
            name: 'Nom',
            category: 'Catégorie',
        },
        form: {
            name: 'Nom',
            category: 'Catégorie',
            description: 'Description',
        },
        actions: {
            new: 'Nouvelle sous-catégorie',
            edit: 'Modifier',
            delete: 'Supprimer',
        },
        deleteConfirm: 'Supprimer cette sous-catégorie ? Cette action est irréversible.',
        emptyMessage: 'Aucun {} trouvé'.replace('{}', 'sous-catégories'),
    },
    en: {
        title: 'Subcategories',
        columns: {
            name: 'Name',
            category: 'Category',
        },
        form: {
            name: 'Name',
            category: 'Category',
            description: 'Description',
        },
        actions: {
            new: 'New',
            edit: 'Edit',
            delete: 'Delete',
        },
        deleteConfirm: 'Delete this subcategory? This cannot be undone.',
        emptyMessage: 'No records found',
    },
} as const;
