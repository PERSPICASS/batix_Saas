export const taxRates = {
    fr: {
        title: 'Taux de taxe',
        columns: {
            name: 'Nom',
            rate: 'Taux',
        },
        form: {
            name: 'Nom',
            rate: 'Taux (%)',
            description: 'Description',
        },
        actions: {
            new: 'Nouveau taux',
            edit: 'Modifier',
            delete: 'Supprimer',
        },
        emptyMessage: 'Aucun {} trouvé'.replace('{}', 'taux de taxe'),
    },
    en: {
        title: 'Tax Rates',
        columns: {
            name: 'Name',
            rate: 'Rate',
        },
        form: {
            name: 'Name',
            rate: 'Rate',
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
