export const customers = {
    fr: {
        title: 'Clients',
        count: (n: number) => `${n} client${n > 1 ? 's' : ''}`,
        columns: {
            name: 'Nom',
            email: 'Email',
            phone: 'Téléphone',
            totalPurchases: 'Total achats',
            status: 'Statut',
            shop: 'Boutique',
            actions: 'Actions',
        },
        actions: {
            new: 'Nouveau client',
            edit: 'Modifier',
            delete: 'Supprimer',
        },
        deleteConfirm: (name: string) => `Êtes-vous sûr de vouloir supprimer le client "${name}" ?`,
        emptyMessage: 'Aucun client trouvé',
        status: {
            active: 'Actif',
            inactive: 'Inactif',
        },
    },
    en: {
        title: 'Customers',
        count: (n: number) => `${n} customer${n > 1 ? 's' : ''}`,
        columns: {
            name: 'Name',
            email: 'Email',
            phone: 'Phone',
            totalPurchases: 'Total purchases',
            status: 'Status',
            shop: 'Shop',
            actions: 'Actions',
        },
        actions: {
            new: 'New customer',
            edit: 'Edit',
            delete: 'Delete',
        },
        deleteConfirm: (name: string) => `Are you sure you want to delete customer "${name}"?`,
        emptyMessage: 'No customers found',
        status: {
            active: 'Active',
            inactive: 'Inactive',
        },
    },
} as const;
