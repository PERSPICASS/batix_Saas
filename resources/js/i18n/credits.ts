export const credits = {
    fr: {
        title: 'Créances',
        columns: {
            customer: 'Client',
            amount: 'Montant',
            dueDate: 'Date d\'échéance',
            status: 'Statut',
            actions: 'Actions',
            date: 'Date',
        },
        status: {
            pending: 'En attente',
            paid: 'Payée',
            overdue: 'En retard',
            cancelled: 'Annulée',
            partial: 'Partielle',
        },
        buttons: {
            new: 'Nouvelle créance',
            markPaid: 'Marquer comme payée',
            sendReminder: 'Envoyer un rappel',
            delete: 'Supprimer',
            edit: 'Modifier',
            view: 'Voir',
        },
        modals: {
            confirmPayment: {
                title: 'Confirmer le paiement',
                description: 'Êtes-vous sûr de marquer cette créance comme payée?',
            },
            sendReminder: {
                title: 'Envoyer un rappel',
                description: 'Un rappel de paiement sera envoyé au client.',
                success: 'Rappel envoyé avec succès',
            },
        },
        messages: {
            noCredits: 'Aucune créance trouvée',
            creditAdded: 'Créance ajoutée avec succès',
            creditUpdated: 'Créance mise à jour avec succès',
            creditDeleted: 'Créance supprimée avec succès',
            paymentMarked: 'Paiement marqué avec succès',
            selectCustomer: 'Veuillez sélectionner un client',
            enterAmount: 'Veuillez entrer un montant',
        },
    },
    en: {
        title: 'Credits',
        columns: {
            customer: 'Customer',
            amount: 'Amount',
            dueDate: 'Due date',
            status: 'Status',
            actions: 'Actions',
            date: 'Date',
        },
        status: {
            pending: 'Pending',
            paid: 'Paid',
            overdue: 'Overdue',
            cancelled: 'Cancelled',
            partial: 'Partial',
        },
        buttons: {
            new: 'New credit',
            markPaid: 'Mark as paid',
            sendReminder: 'Send reminder',
            delete: 'Delete',
            edit: 'Edit',
            view: 'View',
        },
        modals: {
            confirmPayment: {
                title: 'Confirm payment',
                description: 'Are you sure you want to mark this credit as paid?',
            },
            sendReminder: {
                title: 'Send reminder',
                description: 'A payment reminder will be sent to the customer.',
                success: 'Reminder sent successfully',
            },
        },
        messages: {
            noCredits: 'No credits found',
            creditAdded: 'Credit added successfully',
            creditUpdated: 'Credit updated successfully',
            creditDeleted: 'Credit deleted successfully',
            paymentMarked: 'Payment marked successfully',
            selectCustomer: 'Please select a customer',
            enterAmount: 'Please enter an amount',
        },
    },
} as const;
