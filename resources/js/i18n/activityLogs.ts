export const activityLogs = {
    fr: {
        title: 'Historique des activités',
        columns: {
            user: 'Utilisateur',
            action: 'Action',
            subject: 'Objet',
            shop: 'Boutique',
            ip: 'Adresse IP',
            date: 'Date',
            details: 'Détails',
        },
        filters: {
            user: 'Utilisateur',
            action: 'Action',
            type: 'Type',
            dateFrom: 'Du',
            dateTo: 'Au',
            searchPlaceholder: 'Rechercher...',
        },
        emptyMessage: 'Aucune activité trouvée',
        actions: {
            view: 'Voir',
        },
    },
    en: {
        title: 'Activity history',
        columns: {
            user: 'User',
            action: 'Action',
            subject: 'Subject',
            shop: 'Shop',
            ip: 'IP address',
            date: 'Date',
            details: 'Details',
        },
        filters: {
            user: 'User',
            action: 'Action',
            type: 'Type',
            dateFrom: 'From',
            dateTo: 'To',
            searchPlaceholder: 'Search...',
        },
        emptyMessage: 'No activity found',
        actions: {
            view: 'View',
        },
    },
} as const;
