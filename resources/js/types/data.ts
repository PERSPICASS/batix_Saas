import {
    BarChart3,
    Building2,
    HardHat,
    Package,
    ShieldCheck,
    Sparkles,
    Users,
    Zap,
} from 'lucide-react';
import type { FeatureItem, HeroSlide, Locale, PlanView } from './types';

// ─── Animations Framer Motion ──────────────────────────────────────────────
export const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0 },
};

export const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } },
};

// ─── Textes par locale ─────────────────────────────────────────────────────
export const copy = {
    fr: {
        title: 'Batix SaaS | Gestion de quincaillerie plus humaine',
        brandSubtitle: 'Gestion moderne des quincailleries',
        nav: {
            demo: 'Demo',
            features: 'Fonctionnalites',
            pricing: 'Tarifs',
            faq: 'FAQ',
            contact: 'Contact',
        },
        auth: {
            dashboard: 'Dashboard',
            login: 'Connexion',
            trial: 'Essai gratuit',
        },
        hero: {
            badge: 'Concu pour les equipes terrain',
            title: 'Transformez chaque journee en ventes mieux maitrisees.',
            description:
                'Batix fluidifie le comptoir, fiabilise le stock et donne aux gerants une vision claire pour decider vite et bien.',
            primary: 'Demarrer mon essai',
            secondary: 'Voir la video demo',
            helper: 'Sans carte bancaire, prise en main rapide.',
        },
        quickPoints: [
            'Mise en route rapide, sans equipe technique',
            'Support humain reactif par WhatsApp et email',
            'Visibilite en temps reel sur toutes vos boutiques',
        ],
        socialProof: 'Des equipes quincaillerie qui veulent aller plus vite',
        demo: {
            title: 'Voyez Batix en action en 2 minutes',
            description:
                'Une demo claire pour voir comment une vente, un mouvement de stock et un reporting se passent dans la vraie vie.',
            cta: 'Creer mon compte maintenant',
            videoTitle: 'Video demo Batix',
            videoHint: 'Remplacez cette video par votre demo produit finale si besoin.',
            videoUrl: 'https://www.youtube.com/embed/M7lc1UVf-VE',
        },
        stats: [
            { label: 'Boutiques actives', value: '1 250+' },
            { label: 'Temps gagne par semaine', value: '11h' },
            { label: 'Taux de satisfaction equipe', value: '96%' },
        ],
        featuresTitle: 'Ce que vos equipes vont aimer au quotidien',
        pricingTitle: 'Choisissez le plan qui suit votre croissance',
        pricingFallback: 'Aucun plan actif detecte en base. Voici un apercu des offres.',
        planCta: 'Choisir ce plan',
        faqTitle: 'Questions frequentes',
        contact: {
            title: 'Pret a moderniser votre quincaillerie ?',
            description:
                'Passez d une gestion reactive a une gestion sereine avec une plateforme pensee pour des equipes reelles.',
            cta: 'Lancer mon essai gratuit',
        },
        footerText: 'Batix SaaS, une gestion quincaillerie plus simple.',
        langLabel: 'Langue',
    },
    en: {
        title: 'Batix SaaS | More Human Hardware Store Management',
        brandSubtitle: 'Modern hardware store operations',
        nav: {
            demo: 'Demo',
            features: 'Features',
            pricing: 'Pricing',
            faq: 'FAQ',
            contact: 'Contact',
        },
        auth: {
            dashboard: 'Dashboard',
            login: 'Login',
            trial: 'Free trial',
        },
        hero: {
            badge: 'Built for real field teams',
            title: 'Turn daily operations into controlled, profitable growth.',
            description:
                'Batix streamlines checkout, secures stock accuracy, and gives managers the clarity to move faster with confidence.',
            primary: 'Start my free trial',
            secondary: 'Watch demo video',
            helper: 'No credit card required, quick onboarding.',
        },
        quickPoints: [
            'Fast setup with no technical team required',
            'Responsive human support on WhatsApp and email',
            'Real-time visibility across all your stores',
        ],
        socialProof: 'Chosen by hardware teams that want to move faster',
        demo: {
            title: 'See Batix in action in 2 minutes',
            description:
                'A short walkthrough showing checkout, stock movements, and reporting in a real workflow.',
            cta: 'Create my account now',
            videoTitle: 'Batix demo video',
            videoHint: 'Swap this placeholder with your final product demo if needed.',
            videoUrl: 'https://www.youtube.com/embed/M7lc1UVf-VE',
        },
        stats: [
            { label: 'Active stores', value: '1,250+' },
            { label: 'Weekly time saved', value: '11h' },
            { label: 'Team satisfaction rate', value: '96%' },
        ],
        featuresTitle: 'What your team will love every day',
        pricingTitle: 'Pick the plan that scales with your growth',
        pricingFallback: 'No active plans found in database yet. Here is a sample pricing preview.',
        planCta: 'Choose this plan',
        faqTitle: 'Frequently Asked Questions',
        contact: {
            title: 'Ready to modernize your hardware operations?',
            description:
                'Move from reactive operations to a calm, controlled workflow built for real teams.',
            cta: 'Start my free trial',
        },
        footerText: 'Batix SaaS, simpler and more human hardware management.',
        langLabel: 'Language',
    },
};

// ─── Fonctionnalités ───────────────────────────────────────────────────────
export const featuresByLocale: Record<Locale, FeatureItem[]> = {
    fr: [
        {
            title: 'Vente rapide au comptoir',
            description:
                'Recherche produit par nom, code-barre ou référence. Ticket généré en quelques secondes, encaissement sans friction même en heure de pointe.',
            icon: Zap,
        },
        {
            title: 'Stock fiable en temps réel',
            description:
                'Chaque entrée et sortie est tracée instantanément. Alertes de rupture automatiques pour ne jamais manquer un réapprovisionnement critique.',
            icon: Package,
        },
        {
            title: 'Multi-boutiques, une seule vue',
            description:
                'Gérez toutes vos boutiques depuis un tableau de bord central. Comparez les performances, transférez du stock, pilotez à distance.',
            icon: Building2,
        },
        {
            title: 'Rapports qui déclenchent des décisions',
            description:
                "Marge brute, rotation des produits, chiffre d'affaires par boutique et par vendeur — des chiffres utiles, pas du remplissage.",
            icon: BarChart3,
        },
        {
            title: 'Gestion des achats fournisseurs',
            description:
                "Créez vos bons de commande, réceptionnez les livraisons et réconciliez vos factures fournisseurs directement dans l'application.",
            icon: HardHat,
        },
        {
            title: 'Équipe avec les bons accès',
            description:
                'Gérants, vendeurs, magasiniers et caissiers : chaque rôle voit exactement ce dont il a besoin. Rien de plus, rien de moins.',
            icon: Users,
        },
        {
            title: 'Traçabilité et historique complet',
            description:
                'Chaque action sensible est enregistrée : modification de prix, suppression, ajustement de stock. Retrouvez qui a fait quoi et quand.',
            icon: ShieldCheck,
        },
        {
            title: 'Gestion des crédits clients',
            description:
                'Suivez les ventes à crédit, les encours par client et les remboursements sans vous perdre dans des tableaux Excel.',
            icon: Sparkles,
        },
        {
            title: 'Dépôts et transferts de stock',
            description:
                'Organisez votre stock par dépôt, effectuez des transferts entre boutiques et gardez une visibilité complète sur chaque emplacement.',
            icon: Package,
        },
        {
            title: 'Factures et devis clients',
            description:
                'Générez des factures professionnelles, émettez des devis et suivez les statuts de paiement depuis un seul endroit, sans outil tiers.',
            icon: BarChart3,
        },
    ],
    en: [
        {
            title: 'Fast checkout at the counter',
            description:
                'Find products by name, barcode, or reference. Generate receipts in seconds and handle payments without friction, even during rush hours.',
            icon: Zap,
        },
        {
            title: 'Reliable real-time stock',
            description:
                'Every stock movement is tracked instantly. Automatic low-stock alerts so you never miss a critical replenishment.',
            icon: Package,
        },
        {
            title: 'Multi-store, single dashboard',
            description:
                'Manage all your stores from one central view. Compare performance, transfer stock, and oversee operations remotely.',
            icon: Building2,
        },
        {
            title: 'Reports that drive real decisions',
            description:
                'Gross margin, product turnover, revenue by store and by seller — actionable numbers, not just filler data.',
            icon: BarChart3,
        },
        {
            title: 'Supplier purchase management',
            description:
                'Create purchase orders, receive deliveries, and reconcile supplier invoices directly inside the app.',
            icon: HardHat,
        },
        {
            title: 'Team with the right access',
            description:
                'Managers, sellers, stock clerks, and cashiers each see exactly what they need. Nothing more, nothing less.',
            icon: Users,
        },
        {
            title: 'Full traceability and audit trail',
            description:
                'Every sensitive action is logged: price changes, deletions, stock adjustments. Know who did what and when.',
            icon: ShieldCheck,
        },
        {
            title: 'Customer credit tracking',
            description:
                'Monitor credit sales, outstanding balances per customer, and repayments without drowning in spreadsheets.',
            icon: Sparkles,
        },
        {
            title: 'Depots and stock transfers',
            description:
                'Organize stock by depot, move inventory between stores, and maintain full visibility across every location.',
            icon: Package,
        },
        {
            title: 'Invoices and customer quotes',
            description:
                'Generate professional invoices, issue quotes, and track payment statuses in one place — no third-party tool needed.',
            icon: BarChart3,
        },
    ],
};

// ─── FAQ ───────────────────────────────────────────────────────────────────
export const faqsByLocale: Record<Locale, { question: string; answer: string }[]> = {
    fr: [
        {
            question: 'Comment fonctionne la limite de boutiques ?',
            answer: 'Chaque abonnement definit un nombre de boutiques actives. Vous pouvez changer de plan a tout moment.',
        },
        {
            question: 'Puis-je gerer plusieurs utilisateurs ?',
            answer: 'Oui. Vous pouvez attribuer des roles precis avec des permissions adaptees.',
        },
        {
            question: 'Combien de temps faut-il pour demarrer ?',
            answer: 'La configuration de la premiere boutique se fait en quelques minutes.',
        },
        {
            question: 'Puis-je avoir une demo accompagnee ?',
            answer: 'Oui, notre equipe peut vous accompagner pour une demonstration personnalisee.',
        },
    ],
    en: [
        {
            question: 'How do store limits work?',
            answer: 'Each plan defines how many active stores you can run. You can change plans anytime.',
        },
        {
            question: 'Can I manage multiple users?',
            answer: 'Yes. You can assign clear role-based permissions for each profile.',
        },
        {
            question: 'How long does onboarding take?',
            answer: 'You can set up your first store in just a few minutes.',
        },
        {
            question: 'Can I request a guided demo?',
            answer: 'Yes, our team can walk you through a tailored live demonstration.',
        },
    ],
};

// ─── Trust marks ───────────────────────────────────────────────────────────
export const trustMarksByLocale: Record<Locale, string[]> = {
    fr: ['Quincaillerie Atlas', 'ProFix Materiaux', 'BatiNord Pro', 'EcoTools Market'],
    en: ['Atlas Hardware', 'ProFix Materials', 'BatiNord Pro', 'EcoTools Market'],
};

// ─── Plans de repli ────────────────────────────────────────────────────────
export const fallbackPlansByLocale: Record<Locale, PlanView[]> = {
    fr: [
        {
            name: 'Starter',
            price_eur: '29 EUR',
            price_fcfa: '19 000 FCFA',
            subtitle: 'par mois',
            badge: "Jusqu a 1 boutique",
            points: ['1 boutique', '5 utilisateurs', '5 000 produits', '1 depot', 'Support standard'],
            highlighted: false,
        },
        {
            name: 'Growth',
            price_eur: '79 EUR',
            price_fcfa: '51 800 FCFA',
            subtitle: 'par mois',
            badge: "Jusqu a 5 boutiques",
            points: ['5 boutiques', '20 utilisateurs', '50 000 produits', '5 depots', 'Support prioritaire'],
            highlighted: true,
        },
        {
            name: 'Scale',
            price_eur: '149 EUR',
            price_fcfa: '97 700 FCFA',
            subtitle: 'par mois',
            badge: 'Boutiques illimitees',
            points: ['Boutiques illimitees', 'Utilisateurs illimites', 'Produits illimites', 'Depots illimites', 'Support premium'],
            highlighted: false,
        },
    ],
    en: [
        {
            name: 'Starter',
            price_eur: '29 EUR',
            price_fcfa: '19,000 XOF',
            subtitle: 'per month',
            badge: 'Up to 1 store',
            points: ['1 store', '5 users', '5,000 products', '1 depot', 'Standard support'],
            highlighted: false,
        },
        {
            name: 'Growth',
            price_eur: '79 EUR',
            price_fcfa: '51,800 XOF',
            subtitle: 'per month',
            badge: 'Up to 5 stores',
            points: ['5 stores', '20 users', '50,000 products', '5 depots', 'Priority support'],
            highlighted: true,
        },
        {
            name: 'Scale',
            price_eur: '149 EUR',
            price_fcfa: '97,700 XOF',
            subtitle: 'per month',
            badge: 'Unlimited stores',
            points: ['Unlimited stores', 'Unlimited users', 'Unlimited products', 'Unlimited depots', 'Premium support'],
            highlighted: false,
        },
    ],
};

// ─── Hero slides ───────────────────────────────────────────────────────────
const getHeroCaptionFromPath = (path: string): Record<Locale, { title: string; description: string }> => {
    const key = path.toLowerCase();

    if (key.includes('mature-man') || key.includes('hardware-store')) {
        return {
            fr: {
                title: 'Prenez les bonnes decisions sans attendre la fin de journee',
                description: 'Ventes, stock et marge sont enfin visibles en un coup d oeil, pour piloter avec assurance du matin au soir.',
            },
            en: {
                title: 'Make the right decisions before the day ends',
                description: 'Sales, stock, and margin stay visible in one place, so managers lead with confidence all day long.',
            },
        };
    }

    if (key.includes('young-man') || key.includes('working-at-his-job') || key.includes('shop')) {
        return {
            fr: {
                title: 'Au comptoir, gagnez en vitesse sans perdre en qualite',
                description: 'Chaque encaissement devient plus simple: produit trouve plus vite, stock verifie instantanement, client servi sans friction.',
            },
            en: {
                title: 'At checkout, move faster without losing quality',
                description: 'Every transaction gets smoother: faster product lookup, instant stock confirmation, and less friction for customers.',
            },
        };
    }

    if (key.includes('waiter') || key.includes('happy') || key.includes('portrait-of-one')) {
        return {
            fr: {
                title: 'Remettez l humain au centre de la relation client',
                description: 'Moins de manipulations repetitives, plus de temps utile pour conseiller, rassurer et fideliser vos clients.',
            },
            en: {
                title: 'Put people back at the center of customer service',
                description: 'Less repetitive admin work, more meaningful time to advise, reassure, and retain your customers.',
            },
        };
    }

    return {
        fr: {
            title: 'Faites passer votre quincaillerie a un niveau superieur',
            description: 'Batix relie ventes, stock et equipes dans une interface unique pour accelerer vos operations sans chaos.',
        },
        en: {
            title: 'Take your hardware operations to the next level',
            description: 'Batix connects sales, stock, and team workflows in one interface to scale faster with less chaos.',
        },
    };
};

const heroSlideModules = {
    ...import.meta.glob('/resources/images/resources/*.{png,jpg,jpeg,webp,avif,gif,svg}', { eager: true }),
    ...import.meta.glob('/resources/images/heroes/*.{png,jpg,jpeg,webp,avif,gif,svg}', { eager: true }),
};

export const heroSlides: HeroSlide[] = Object.entries(heroSlideModules)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, module]) => {
        const src = (module as { default: string }).default;
        const filename = path.split('/').pop() ?? 'batix-hero';
        const label = filename.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim();
        return {
            src,
            alt: `Batix hero ${label}`,
            caption: getHeroCaptionFromPath(path),
        };
    });
