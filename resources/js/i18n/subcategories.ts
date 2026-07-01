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
        emptyMessage: 'No records found',
    },
} as const;
