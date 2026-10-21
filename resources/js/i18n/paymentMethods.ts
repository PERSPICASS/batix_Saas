export const paymentMethods = {
    fr: {
        title: 'Méthodes de paiement',
        columns: {
            name: 'Nom',
        },
        form: {
            name: 'Nom',
            description: 'Description',
        },
        actions: {
            new: 'Nouvelle méthode',
            edit: 'Modifier',
            delete: 'Supprimer',
        },
        emptyMessage: 'Aucun {} trouvé'.replace('{}', 'méthodes de paiement'),
    },
    en: {
        title: 'Payment Methods',
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
