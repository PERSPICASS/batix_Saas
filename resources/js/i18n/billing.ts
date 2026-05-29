export const billing = {
    fr: {
        title: 'Facturation',
        subscription: {
            title: 'Abonnement',
            status: 'Statut',
            expires: 'Expire le',
            daysLeft: (n: number) => `${n} jour${n > 1 ? 's' : ''} restant${n > 1 ? 's' : ''}`,
            noSubscription: 'Aucun abonnement',
            renew: 'Renouveler',
            upgrade: 'Mettre à niveau',
        },
        invoicesList: {
            title: 'Factures',
            columns: {
                number: 'Numéro',
                plan: 'Plan',
                amount: 'Montant',
                date: 'Date',
                status: 'Statut',
                actions: 'Actions',
            },
            empty: 'Aucune facture',
            download: 'Télécharger',
        },
        deposits: {
            title: 'Dépôts',
            columns: {
                id: 'ID',
                correspondent: 'Correspondant',
                amount: 'Montant',
                date: 'Date',
                status: 'Statut',
            },
        },
        status: {
            active: 'Actif',
            trial: 'Essai',
            expired: 'Expiré',
            pending: 'En attente',
        },
    },
    en: {
        title: 'Billing',
        subscription: {
            title: 'Subscription',
            status: 'Status',
            expires: 'Expires on',
            daysLeft: (n: number) => `${n} day${n > 1 ? 's' : ''} remaining`,
            noSubscription: 'No subscription',
            renew: 'Renew',
            upgrade: 'Upgrade',
        },
        invoicesList: {
            title: 'Invoices',
            columns: {
                number: 'Number',
                plan: 'Plan',
                amount: 'Amount',
                date: 'Date',
                status: 'Status',
                actions: 'Actions',
            },
            empty: 'No invoices',
            download: 'Download',
        },
        deposits: {
            title: 'Deposits',
            columns: {
                id: 'ID',
                correspondent: 'Correspondent',
                amount: 'Amount',
                date: 'Date',
                status: 'Status',
            },
        },
        status: {
            active: 'Active',
            trial: 'Trial',
            expired: 'Expired',
            pending: 'Pending',
        },
    },
} as const;
