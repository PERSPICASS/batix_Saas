export interface Subprocessor {
    name: string;
    role: string;
    data: string;
}

export const subprocessors: Record<'fr' | 'en', Subprocessor[]> = {
    fr: [
        {
            name: 'Google Analytics (Google LLC)',
            role: "Mesure d'audience",
            data: "Données de navigation et cookies, uniquement si vous acceptez les cookies analytiques via notre bandeau de consentement.",
        },
        {
            name: 'Paddle (Paddle.com Market Ltd)',
            role: 'Facturation & paiement par carte',
            data: "Nom, email et données de paiement de l'abonnement. Paddle agit comme revendeur officiel (merchant of record) : nous ne recevons jamais votre numéro de carte complet.",
        },
        {
            name: 'LemonSqueezy',
            role: 'Facturation & paiement par carte',
            data: "Nom, email et données de paiement de l'abonnement, dans les mêmes conditions que Paddle.",
        },
        {
            name: 'PawaPay',
            role: 'Paiement mobile money',
            data: 'Numéro de téléphone et montant de la transaction.',
        },
        {
            name: 'Jèko',
            role: 'Agrégateur de paiement mobile money (Wave, Orange Money, MTN Money, Moov Money)',
            data: 'Numéro de téléphone et montant de la transaction.',
        },
        {
            name: 'Brevo (Sendinblue)',
            role: "Envoi d'emails transactionnels",
            data: 'Adresse email et contenu des notifications : confirmation de compte, factures, réinitialisation de mot de passe.',
        },
        {
            name: 'Hostinger',
            role: "Hébergement de l'infrastructure (serveur applicatif et base de données)",
            data: 'Toutes les données de votre compte et de votre boutique, stockées sur les serveurs de production.',
        },
    ],
    en: [
        {
            name: 'Google Analytics (Google LLC)',
            role: 'Audience measurement',
            data: 'Browsing data and cookies, only if you accept analytics cookies via our consent banner.',
        },
        {
            name: 'Paddle (Paddle.com Market Ltd)',
            role: 'Billing & card payments',
            data: "Name, email and subscription payment data. Paddle acts as the merchant of record: we never receive your full card number.",
        },
        {
            name: 'LemonSqueezy',
            role: 'Billing & card payments',
            data: 'Name, email and subscription payment data, under the same conditions as Paddle.',
        },
        {
            name: 'PawaPay',
            role: 'Mobile money payments',
            data: 'Phone number and transaction amount.',
        },
        {
            name: 'Jèko',
            role: 'Mobile money aggregator (Wave, Orange Money, MTN Money, Moov Money)',
            data: 'Phone number and transaction amount.',
        },
        {
            name: 'Brevo (Sendinblue)',
            role: 'Transactional email delivery',
            data: 'Email address and notification content: account confirmation, invoices, password reset.',
        },
        {
            name: 'Hostinger',
            role: 'Infrastructure hosting (application server and database)',
            data: "All your account and shop data, stored on production servers.",
        },
    ],
};
