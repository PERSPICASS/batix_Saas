export const freeTrialBanner = {
    fr: {
        title: (days: number) => `Plan Gratuit - Essai ${days} jour${days > 1 ? 's' : ''} restant${days > 1 ? 's' : ''}`,
        urgentText: '⚠️ Votre essai gratuit se termine bientôt. Passez à un plan payant pour continuer à utiliser toutes les fonctionnalités.',
        normalText: 'Profitez de votre essai gratuit ! Vous pouvez créer 1 boutique et 2 utilisateurs.',
        cta: 'Changer de plan',
    },
    en: {
        title: (days: number) => `Free Plan - Trial ${days} day${days > 1 ? 's' : ''} remaining`,
        urgentText: '⚠️ Your free trial is ending soon. Upgrade to a paid plan to keep using all features.',
        normalText: 'Enjoy your free trial! You can create 1 shop and 2 users.',
        cta: 'Change plan',
    },
} as const;
