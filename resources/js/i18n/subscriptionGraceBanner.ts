export const subscriptionGraceBanner = {
    fr: {
        title: (days: number) => `Abonnement expiré — ${days} jour${days > 1 ? 's' : ''} restant${days > 1 ? 's' : ''} avant restriction`,
        urgentText: "⚠️ Votre abonnement a expiré. Renouvelez rapidement pour ne pas perdre l'accès à la création de boutiques, utilisateurs, produits et dépôts.",
        normalText: "Votre abonnement a expiré, mais vous gardez un accès complet pendant une période de grâce. Renouvelez pour éviter toute interruption.",
        cta: 'Renouveler mon abonnement',
    },
    en: {
        title: (days: number) => `Subscription expired — ${days} day${days > 1 ? 's' : ''} left before restriction`,
        urgentText: '⚠️ Your subscription has expired. Renew soon to avoid losing access to creating shops, users, products, and depots.',
        normalText: 'Your subscription has expired, but you keep full access during a grace period. Renew to avoid any interruption.',
        cta: 'Renew my subscription',
    },
} as const;
