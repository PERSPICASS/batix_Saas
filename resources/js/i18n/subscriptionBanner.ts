export const subscriptionBanner = {
    fr: {
        noSubscription: {
            title: 'Aucun abonnement actif',
            description: 'Vous devez avoir un abonnement actif pour créer des boutiques et des utilisateurs.',
        },
        unlimitedShops: 'Boutiques illimitées',
        unlimitedUsers: 'Utilisateurs illimités',
        shopsUsed: (current: number, max: number) => `${current} / ${max} boutiques utilisées`,
        remaining: (n: number, fem: boolean) => `(${n} restante${fem && n > 1 ? 's' : ''})`,
        usersUsed: (current: number, max: number) => `${current} / ${max} utilisateurs`,
        remainingUsers: (n: number) => `(${n} restant${n > 1 ? 's' : ''})`,
        limitShops: 'Limite de boutiques atteinte. Veuillez mettre à niveau votre abonnement.',
        limitUsers: "Limite d'utilisateurs atteinte. Veuillez mettre à niveau votre abonnement.",
        status: {
            active: 'Actif',
            trial: 'Essai',
        },
    },
    en: {
        noSubscription: {
            title: 'No active subscription',
            description: 'You need an active subscription to create shops and users.',
        },
        unlimitedShops: 'Unlimited shops',
        unlimitedUsers: 'Unlimited users',
        shopsUsed: (current: number, max: number) => `${current} / ${max} shops used`,
        remaining: (n: number, _fem: boolean) => `(${n} remaining)`,
        usersUsed: (current: number, max: number) => `${current} / ${max} users`,
        remainingUsers: (n: number) => `(${n} remaining)`,
        limitShops: 'Shop limit reached. Please upgrade your subscription.',
        limitUsers: 'User limit reached. Please upgrade your subscription.',
        status: {
            active: 'Active',
            trial: 'Trial',
        },
    },
} as const;
