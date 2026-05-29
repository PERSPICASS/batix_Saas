export const returnedInventory = {
    fr: {
        title: 'Inventaire des retours',
        columns: {
            date: 'Date',
            product: 'Produit',
            quantity: 'Quantité',
            reason: 'Raison',
            customer: 'Client',
            shop: 'Boutique',
            status: 'Statut',
            actions: 'Actions',
        },
        reasons: {
            defective: 'Défectueux',
            wrong_item: 'Mauvais article',
            not_needed: 'Plus nécessaire',
            other: 'Autre',
        },
        actions: {
            new: 'Nouveau retour',
            view: 'Voir',
            delete: 'Supprimer',
        },
        emptyMessage: 'Aucun retour trouvé',
    },
    en: {
        title: 'Returned inventory',
        columns: {
            date: 'Date',
            product: 'Product',
            quantity: 'Quantity',
            reason: 'Reason',
            customer: 'Customer',
            shop: 'Shop',
            status: 'Status',
            actions: 'Actions',
        },
        reasons: {
            defective: 'Defective',
            wrong_item: 'Wrong item',
            not_needed: 'Not needed',
            other: 'Other',
        },
        actions: {
            new: 'New return',
            view: 'View',
            delete: 'Delete',
        },
        emptyMessage: 'No returns found',
    },
} as const;
