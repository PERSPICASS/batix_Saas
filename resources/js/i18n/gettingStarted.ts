export const gettingStarted = {
    fr: {
        title: 'Démarrage rapide',
        progressZero: 'Suivez ces 3 étapes pour lancer votre activité.',
        progressN: (done: number, total: number) => `${done} sur ${total} étapes complétées.`,
        steps: {
            shop: {
                label: 'Créer votre boutique',
                description: 'Configurez votre première boutique pour commencer.',
                cta: 'Créer une boutique',
            },
            product: {
                label: 'Ajouter vos produits',
                description: 'Renseignez votre catalogue de produits et stocks.',
                cta: 'Ajouter un produit',
            },
            sale: {
                label: 'Effectuer une vente',
                description: 'Enregistrez votre première transaction.',
                cta: 'Nouvelle vente',
            },
        },
    },
    en: {
        title: 'Quick start',
        progressZero: 'Follow these 3 steps to launch your business.',
        progressN: (done: number, total: number) => `${done} of ${total} steps completed.`,
        steps: {
            shop: {
                label: 'Create your shop',
                description: 'Set up your first shop to get started.',
                cta: 'Create a shop',
            },
            product: {
                label: 'Add your products',
                description: 'Fill in your product catalog and stock levels.',
                cta: 'Add a product',
            },
            sale: {
                label: 'Make a sale',
                description: 'Record your first transaction.',
                cta: 'New sale',
            },
        },
    },
} as const;
