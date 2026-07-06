import type { ComponentType } from 'react';
import {
    AlertTriangle,
    ArrowLeftRight,
    Award,
    Bot,
    Boxes,
    ClipboardList,
    CreditCard,
    FileSpreadsheet,
    FileText,
    History,
    Languages,
    LayoutDashboard,
    Layers,
    Lock,
    Mic,
    Percent,
    RefreshCw,
    RotateCcw,
    ScanBarcode,
    ShieldCheck,
    Store,
    TrendingUp,
    Truck,
    UserPlus,
    Users,
    Wallet,
    Warehouse,
    Zap,
} from 'lucide-react';
import type { Locale } from './types';

type Icon = ComponentType<{ className?: string }>;

export interface FeaturePageContent {
    slug: string;
    icon: Icon;
    title: Record<Locale, string>;
    tagline: Record<Locale, string>;
    description: Record<Locale, string>;
    benefits: Record<Locale, { title: string; description: string; icon: Icon }[]>;
}

// Contenu ancré sur les modules réellement implémentés (voir app/Http/Controllers/*
// et app/Models/UserPermission::MODULES) — pas de fonctionnalité inventée.
export const featurePages: FeaturePageContent[] = [
    {
        slug: 'vente-caisse',
        icon: ScanBarcode,
        title: { fr: 'Vente & Caisse', en: 'Sales & POS' },
        tagline: {
            fr: 'Une vente en 30 secondes, même en heure de pointe.',
            en: 'A sale in 30 seconds, even during rush hour.',
        },
        description: {
            fr: "Le comptoir est le cœur de votre quincaillerie. BATIX PRO le rend rapide, fiable et sans erreur — du scan du code-barre à l'encaissement.",
            en: 'The counter is the heart of your hardware store. BATIX PRO makes it fast, reliable and error-free — from barcode scan to checkout.',
        },
        benefits: {
            fr: [
                { title: 'Point de vente rapide', description: 'Recherche produit par nom, code-barre ou référence, ticket généré en quelques secondes.', icon: Zap },
                { title: 'Scan et génération de codes-barres', description: 'Chaque produit peut être scanné ou recevoir un code-barre généré automatiquement.', icon: ScanBarcode },
                { title: 'Prix négociable à la vente', description: "Ajustez le prix d'une ligne au comptoir sans casser votre grille tarifaire.", icon: Percent },
                { title: 'Ventes à crédit et créances', description: 'Suivez les ventes à crédit et les encours par client, sans tableur.', icon: CreditCard },
                { title: 'Gestion des retours', description: "Traitez les retours produits sans reprendre votre inventaire à la main.", icon: RotateCcw },
                { title: 'Devis et précommandes clients', description: 'Émettez un devis ou enregistrez une précommande directement depuis la caisse.', icon: FileText },
                { title: 'Restrictions par rôle caissier', description: 'Un caissier vend, mais ne peut ni annuler ni restaurer une vente sans autorisation.', icon: ShieldCheck },
            ],
            en: [
                { title: 'Fast point of sale', description: 'Find products by name, barcode or reference, generate a receipt in seconds.', icon: Zap },
                { title: 'Barcode scan & generation', description: 'Every product can be scanned or assigned an auto-generated barcode.', icon: ScanBarcode },
                { title: 'Negotiable price at checkout', description: 'Adjust a line price at the counter without breaking your pricing policy.', icon: Percent },
                { title: 'Credit sales & receivables', description: 'Track credit sales and outstanding balances per customer, no spreadsheets.', icon: CreditCard },
                { title: 'Returns management', description: 'Process product returns without redoing your inventory by hand.', icon: RotateCcw },
                { title: 'Customer quotes & pre-orders', description: 'Issue a quote or record a pre-order directly from checkout.', icon: FileText },
                { title: 'Cashier role restrictions', description: 'A cashier can sell, but cannot cancel or restore a sale without authorization.', icon: ShieldCheck },
            ],
        },
    },
    {
        slug: 'stocks-depots',
        icon: Boxes,
        title: { fr: 'Stocks & Dépôts', en: 'Stock & Depots' },
        tagline: {
            fr: 'Vos chiffres du jour, visibles en 10 secondes.',
            en: 'Your daily numbers, visible in 10 seconds.',
        },
        description: {
            fr: "Sachez exactement ce qu'il y a dans chaque boutique et chaque dépôt, en temps réel — sans recompter à la main.",
            en: 'Know exactly what is in every store and depot, in real time — without recounting by hand.',
        },
        benefits: {
            fr: [
                { title: 'Multi-dépôts', description: 'Organisez votre stock par entrepôt, indépendamment de vos boutiques.', icon: Warehouse },
                { title: 'Transferts de stock entre dépôts', description: "Déplacez des produits d'un dépôt à une boutique en quelques clics.", icon: ArrowLeftRight },
                { title: 'Inventaire physique', description: 'Comptez et ajustez le stock réel par rapport au stock théorique.', icon: ClipboardList },
                { title: 'Mouvements de stock détaillés', description: 'Chaque entrée et sortie est tracée et horodatée.', icon: History },
                { title: 'Alertes de stock bas', description: 'Ne manquez plus jamais un réapprovisionnement critique.', icon: AlertTriangle },
                { title: 'Import/export Excel', description: 'Importez votre catalogue produits ou exportez votre stock en un clic.', icon: FileSpreadsheet },
                { title: 'Déclinaisons et attributs produits', description: 'Gérez tailles, couleurs et caractéristiques personnalisées par produit.', icon: Layers },
            ],
            en: [
                { title: 'Multiple depots', description: 'Organize stock by warehouse, independently from your stores.', icon: Warehouse },
                { title: 'Stock transfers between depots', description: 'Move products from a depot to a store in a few clicks.', icon: ArrowLeftRight },
                { title: 'Physical inventory counts', description: 'Count and adjust real stock against theoretical stock.', icon: ClipboardList },
                { title: 'Detailed stock movements', description: 'Every stock entry and exit is tracked and timestamped.', icon: History },
                { title: 'Low-stock alerts', description: 'Never miss a critical replenishment again.', icon: AlertTriangle },
                { title: 'Excel import/export', description: 'Import your product catalog or export your stock in one click.', icon: FileSpreadsheet },
                { title: 'Product variations & attributes', description: 'Manage sizes, colors and custom characteristics per product.', icon: Layers },
            ],
        },
    },
    {
        slug: 'multi-boutiques',
        icon: Store,
        title: { fr: 'Multi-boutiques & Équipe', en: 'Multi-store & Team' },
        tagline: {
            fr: 'Votre équipe sait quoi faire, sans vous appeler.',
            en: 'Your team knows what to do — without calling you.',
        },
        description: {
            fr: 'Pilotez plusieurs points de vente depuis une seule vue, avec des accès précis pour chaque membre de votre équipe.',
            en: 'Run several stores from a single view, with precise access for every team member.',
        },
        benefits: {
            fr: [
                { title: 'Gestion multi-boutiques', description: 'Toutes vos boutiques dans un seul tableau de bord.', icon: Store },
                { title: 'Permissions granulaires', description: 'Chaque module (ventes, stocks, clients...) a ses propres droits par utilisateur.', icon: Lock },
                { title: "Invitations d'équipe", description: 'Ajoutez gérants, vendeurs et caissiers en quelques minutes.', icon: UserPlus },
                { title: 'Rôles adaptés au terrain', description: 'Gérant, vendeur, caissier, magasinier : chacun voit ce dont il a besoin.', icon: Users },
                { title: "Journal d'activité", description: 'Retrouvez qui a fait quoi, et quand, sur toute action sensible.', icon: History },
                { title: 'Authentification à deux facteurs', description: 'Sécurisez les comptes à responsabilité.', icon: ShieldCheck },
                { title: "Verrouillage d'écran", description: 'Protégez un poste de caisse laissé sans surveillance.', icon: Lock },
            ],
            en: [
                { title: 'Multi-store management', description: 'All your stores in a single dashboard.', icon: Store },
                { title: 'Granular permissions', description: 'Each module (sales, stock, customers...) has its own per-user access rights.', icon: Lock },
                { title: 'Team invitations', description: 'Add managers, sellers and cashiers in minutes.', icon: UserPlus },
                { title: 'Roles built for the field', description: 'Manager, seller, cashier, stock clerk: everyone sees only what they need.', icon: Users },
                { title: 'Activity log', description: 'Know who did what, and when, for every sensitive action.', icon: History },
                { title: 'Two-factor authentication', description: 'Secure high-responsibility accounts.', icon: ShieldCheck },
                { title: 'Screen lock', description: 'Protect an unattended checkout station.', icon: Lock },
            ],
        },
    },
    {
        slug: 'rapports',
        icon: FileText,
        title: { fr: 'Rapports & Facturation', en: 'Reports & Invoicing' },
        tagline: {
            fr: 'Des chiffres qui déclenchent des décisions.',
            en: 'Numbers that drive real decisions.',
        },
        description: {
            fr: 'Marge, rotation des produits, chiffre d\'affaires par boutique — et une facturation professionnelle, sans outil tiers.',
            en: 'Margin, product turnover, revenue by store — and professional invoicing, with no third-party tool.',
        },
        benefits: {
            fr: [
                { title: 'Tableau de bord temps réel', description: 'Vos indicateurs clés visibles en permanence.', icon: LayoutDashboard },
                { title: 'Analytique avancée', description: 'Graphiques de ventes, tendances et meilleurs produits.', icon: TrendingUp },
                { title: 'Facturation et devis', description: 'Générez des factures et devis professionnels en quelques secondes.', icon: FileText },
                { title: 'Factures récurrentes', description: 'Automatisez la facturation de vos clients réguliers.', icon: RefreshCw },
                { title: 'Export de rapports Excel', description: 'Exportez vos rapports pour les partager ou les archiver.', icon: FileSpreadsheet },
                { title: 'Gestion des achats fournisseurs', description: 'Bons de commande, réceptions et rapprochement des factures.', icon: Truck },
                { title: 'Suivi des dépenses', description: 'Gardez une vue claire sur les charges de votre activité.', icon: Wallet },
            ],
            en: [
                { title: 'Real-time dashboard', description: 'Your key metrics visible at all times.', icon: LayoutDashboard },
                { title: 'Advanced analytics', description: 'Sales charts, trends and top products.', icon: TrendingUp },
                { title: 'Invoicing and quotes', description: 'Generate professional invoices and quotes in seconds.', icon: FileText },
                { title: 'Recurring invoices', description: 'Automate billing for your regular customers.', icon: RefreshCw },
                { title: 'Excel report exports', description: 'Export your reports to share or archive them.', icon: FileSpreadsheet },
                { title: 'Supplier purchase management', description: 'Purchase orders, deliveries and invoice reconciliation.', icon: Truck },
                { title: 'Expense tracking', description: 'Keep a clear view of your business costs.', icon: Wallet },
            ],
        },
    },
    {
        slug: 'assistant-ia',
        icon: Bot,
        title: { fr: 'Assistant IA', en: 'AI Assistant' },
        tagline: {
            fr: 'Posez la question, obtenez la réponse — pas le rapport.',
            en: 'Ask the question, get the answer — not the report.',
        },
        description: {
            fr: 'Un assistant conversationnel qui connaît vos données du jour : ventes, stock et alertes, directement en langage naturel.',
            en: 'A conversational assistant that knows your daily data: sales, stock and alerts, in plain language.',
        },
        benefits: {
            fr: [
                { title: 'Résumé de ventes instantané', description: 'Demandez votre chiffre d\'affaires, panier moyen ou nombre de ventes du jour.', icon: TrendingUp },
                { title: 'État des stocks en un message', description: 'Interrogez les niveaux de stock sans ouvrir un rapport.', icon: Boxes },
                { title: 'Alertes automatiques', description: 'Ruptures et stocks bas remontés directement dans la conversation.', icon: AlertTriangle },
                { title: 'Meilleurs produits', description: 'Identifiez vos produits les plus vendus sans tableur.', icon: Award },
                { title: 'Dictée vocale', description: 'Posez votre question à l\'oral au lieu de taper — pratique au comptoir, les mains prises.', icon: Mic },
                { title: 'Réponses en français', description: 'Un assistant pensé pour votre équipe terrain, pas pour des développeurs.', icon: Languages },
                { title: 'Inclus dès le plan Growth', description: 'Disponible à partir du plan Growth, ainsi que Pro et Entreprise.', icon: Bot },
            ],
            en: [
                { title: 'Instant sales summary', description: 'Ask for today\'s revenue, average basket or number of sales.', icon: TrendingUp },
                { title: 'Stock levels in one message', description: 'Query stock levels without opening a report.', icon: Boxes },
                { title: 'Automatic alerts', description: 'Out-of-stock and low-stock items surfaced right in the conversation.', icon: AlertTriangle },
                { title: 'Top products', description: 'Identify your best-selling products with no spreadsheet.', icon: Award },
                { title: 'Voice input', description: 'Ask your question out loud instead of typing — handy at the counter, hands full.', icon: Mic },
                { title: 'Answers in French', description: 'An assistant built for your field team, not for developers.', icon: Languages },
                { title: 'Included from the Growth plan', description: 'Available on Growth, Pro and Enterprise plans.', icon: Bot },
            ],
        },
    },
];

export function getFeaturePage(slug: string): FeaturePageContent | undefined {
    return featurePages.find((page) => page.slug === slug);
}
