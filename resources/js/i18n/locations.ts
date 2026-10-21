export const locations = {
    fr: {
        title: 'Emplacements',
        columns: {
            name: 'Nom',
        },
        form: {
            name: 'Nom',
            description: 'Description',
        },
        actions: {
            new: 'Nouvel emplacement',
            edit: 'Modifier',
            delete: 'Supprimer',
        },
        emptyMessage: 'Aucun {} trouvé'.replace('{}', 'emplacements'),
    },
    en: {
        title: 'Locations',
        columns: {
            name: 'Name',
        },
        form: {
            name: 'Name',
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
