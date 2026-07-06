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
    /** Court — utilisé aussi comme meta description SEO, ne pas allonger. */
    description: Record<Locale, string>;
    /** Paragraphe plus riche, pour l'affichage sur la page uniquement (pas le SEO). */
    longDescription: Record<Locale, string>;
    benefits: Record<Locale, { title: string; description: string; icon: Icon }[]>;
    /** 3 questions/réponses propres à la fonctionnalité, pour enrichir la page. */
    faqs: Record<Locale, { question: string; answer: string }[]>;
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
        longDescription: {
            fr: "Au comptoir, chaque seconde compte. BATIX PRO est conçu pour qu'un vendeur enregistre une vente sans réfléchir : recherche instantanée du produit, scan ou saisie manuelle du code-barre, ajustement du prix si besoin, puis ticket imprimé ou transmis au client. Que la vente soit payée comptant, à crédit ou via l'acompte d'une pré-commande, tout est enregistré au même endroit — sans tableur, sans cahier, sans double saisie.",
            en: "At the counter, every second counts. BATIX PRO is built so a seller can log a sale without thinking twice: instant product search, barcode scan or manual entry, price adjustment if needed, then a printed or shared receipt. Whether the sale is paid in cash, on credit or through a pre-order deposit, everything is recorded in one place — no spreadsheet, no notebook, no double entry.",
        },
        faqs: {
            fr: [
                { question: 'Puis-je vendre un produit sans code-barre ?', answer: 'Oui — la recherche fonctionne aussi par nom ou référence produit, pratique pour les articles qui n\'ont pas encore d\'étiquette.' },
                { question: 'Un caissier peut-il annuler une vente ?', answer: 'Non, par défaut. Les restrictions par rôle empêchent un caissier d\'annuler ou de restaurer une vente sans validation d\'un gérant ou super admin.' },
                { question: 'Comment gérer un client qui paie en plusieurs fois ?', answer: 'Enregistrez la vente à crédit avec un acompte : le solde restant apparaît automatiquement dans le suivi des créances clients.' },
            ],
            en: [
                { question: 'Can I sell a product without a barcode?', answer: 'Yes — search also works by product name or reference, handy for items that don\'t have a label yet.' },
                { question: 'Can a cashier cancel a sale?', answer: 'Not by default. Role restrictions prevent a cashier from cancelling or restoring a sale without a manager\'s or super admin\'s approval.' },
                { question: 'How do I handle a customer paying in installments?', answer: 'Record the sale as credit with a deposit — the remaining balance automatically appears in customer receivables tracking.' },
            ],
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
        longDescription: {
            fr: "Rien ne coûte plus cher qu'une rupture de stock découverte trop tard — ou un inventaire qui ne correspond plus à la réalité. BATIX PRO centralise vos dépôts et boutiques dans une seule vue : vous savez exactement combien il reste de chaque produit, où il se trouve, et quand il a bougé. Les transferts entre dépôt et boutique se font en quelques clics, les alertes de stock bas se déclenchent avant la rupture, et l'inventaire physique se réconcilie sans recompter à la main.",
            en: "Nothing costs more than a stock-out discovered too late — or an inventory that no longer matches reality. BATIX PRO centralizes your depots and stores in a single view: you know exactly how much of each product is left, where it is, and when it last moved. Transfers between depot and store take a few clicks, low-stock alerts fire before you run out, and physical inventory counts reconcile without recounting by hand.",
        },
        faqs: {
            fr: [
                { question: 'Puis-je avoir plusieurs dépôts pour une seule boutique ?', answer: "Oui, un dépôt est indépendant des boutiques : organisez-le comme vous le souhaitez, puis transférez le stock vers la boutique concernée au besoin." },
                { question: 'Comment savoir si un produit va bientôt manquer ?', answer: 'Les alertes de stock bas se basent sur un seuil que vous définissez par produit, et remontent directement dans votre tableau de bord.' },
                { question: "L'inventaire physique remplace-t-il le stock théorique ?", answer: 'Non — il vous permet de comparer le stock réel compté avec le stock théorique enregistré, et d\'ajuster les écarts.' },
            ],
            en: [
                { question: 'Can I have several depots for a single store?', answer: 'Yes, a depot is independent from stores: organize it however you like, then transfer stock to the relevant store when needed.' },
                { question: 'How do I know a product is about to run out?', answer: 'Low-stock alerts are based on a threshold you set per product, and show up directly on your dashboard.' },
                { question: 'Does physical inventory replace theoretical stock?', answer: 'No — it lets you compare the actual counted stock against the recorded theoretical stock, and adjust any discrepancies.' },
            ],
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
        longDescription: {
            fr: "Dès la deuxième boutique, la question n'est plus « comment vendre » mais « comment garder le contrôle ». BATIX PRO donne une vue unique sur toutes vos boutiques, avec des permissions précises par utilisateur : un caissier ne voit que la caisse, un gérant voit tout sauf les réglages sensibles, et chaque action reste tracée dans un journal d'activité. Ajoutez un nouveau vendeur en quelques minutes, sans craindre qu'il touche à ce qui ne le regarde pas.",
            en: "From your second store onward, the question shifts from \"how do I sell\" to \"how do I stay in control\". BATIX PRO gives you a single view across all your stores, with precise per-user permissions: a cashier only sees the register, a manager sees everything except sensitive settings, and every action stays logged in an activity trail. Add a new seller in minutes, without worrying they'll touch what isn't theirs to touch.",
        },
        faqs: {
            fr: [
                { question: 'Combien de boutiques puis-je gérer ?', answer: 'Cela dépend de votre plan — Starter (1 boutique), Growth (3), Pro (6), Entreprise (illimité).' },
                { question: "Un vendeur peut-il voir les chiffres d'une autre boutique ?", answer: 'Non, sauf si vous lui accordez explicitement cet accès via les permissions par module.' },
                { question: 'Que se passe-t-il si un poste de caisse reste sans surveillance ?', answer: 'Le verrouillage d\'écran protège la session en cours sans déconnecter l\'utilisateur, le temps qu\'il revienne.' },
            ],
            en: [
                { question: 'How many stores can I manage?', answer: 'It depends on your plan — Starter (1 store), Growth (3), Pro (6), Enterprise (unlimited).' },
                { question: "Can a seller see another store's numbers?", answer: 'No, unless you explicitly grant that access through per-module permissions.' },
                { question: 'What happens if a checkout station is left unattended?', answer: "Screen lock protects the current session without logging the user out while they're away." },
            ],
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
        longDescription: {
            fr: "Vendre, c'est une chose ; savoir si vous gagnez de l'argent, c'en est une autre. BATIX PRO transforme vos ventes, achats et dépenses en indicateurs clairs — chiffre d'affaires, marge, meilleurs produits — visibles en temps réel, sans attendre la fin du mois. Et quand un client professionnel demande une facture en bonne et due forme, vous la générez en quelques secondes, avec un suivi des paiements et des relances automatiques pour vos clients réguliers.",
            en: "Selling is one thing; knowing whether you're actually making money is another. BATIX PRO turns your sales, purchases and expenses into clear indicators — revenue, margin, top products — visible in real time, without waiting for month-end. And when a business customer asks for a proper invoice, you generate one in seconds, with payment tracking and automated billing for your regular customers.",
        },
        faqs: {
            fr: [
                { question: 'Puis-je facturer un client sans passer par une vente en caisse ?', answer: 'Oui, la facturation et les devis fonctionnent indépendamment de la caisse, pour vos clients professionnels ou vos commandes sur mesure.' },
                { question: 'Les rapports sont-ils disponibles par boutique ?', answer: 'Oui, vous consultez vos indicateurs boutique par boutique ou consolidés sur l\'ensemble de votre activité.' },
                { question: 'Comment suivre mes dépenses fournisseurs ?', answer: 'Le suivi des achats couvre bons de commande, réceptions et rapprochement des factures, en complément du suivi des dépenses générales.' },
            ],
            en: [
                { question: 'Can I invoice a customer without a POS sale?', answer: 'Yes, invoicing and quotes work independently from the register, for business customers or custom orders.' },
                { question: 'Are reports available per store?', answer: 'Yes, you can view your metrics store by store or consolidated across your whole business.' },
                { question: 'How do I track supplier expenses?', answer: 'Purchase tracking covers purchase orders, deliveries and invoice reconciliation, alongside general expense tracking.' },
            ],
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
        longDescription: {
            fr: "Poser une question et obtenir une réponse immédiate, en langage naturel, plutôt que de fouiller dans un rapport — c'est tout l'intérêt de l'Assistant IA. Demandez votre chiffre d'affaires du jour, vos produits les plus vendus ou l'état de vos stocks, à l'écrit ou à l'oral, et l'assistant répond directement avec vos vraies données, sans configuration ni tableau croisé dynamique. Disponible dès le plan Growth, pensé pour votre équipe terrain — pas pour des développeurs.",
            en: "Asking a question and getting an instant answer in plain language, instead of digging through a report — that's the whole point of the AI Assistant. Ask for today's revenue, your best-selling products or current stock levels, by typing or speaking, and the assistant answers directly with your real data — no setup, no pivot table. Available from the Growth plan onward, built for your field team, not for developers.",
        },
        faqs: {
            fr: [
                { question: "L'assistant a-t-il accès à toutes mes données ?", answer: 'Il répond à partir de vos ventes, votre stock et vos alertes — les données réellement liées à votre activité, rien d\'externe.' },
                { question: 'Dois-je taper ma question ou puis-je parler ?', answer: 'Les deux : la dictée vocale est pratique au comptoir, quand vous avez les mains prises.' },
                { question: "L'assistant est-il inclus dans tous les plans ?", answer: 'Il est disponible à partir du plan Growth, ainsi que Pro et Entreprise.' },
            ],
            en: [
                { question: 'Does the assistant have access to all my data?', answer: 'It answers from your sales, stock and alerts — the data genuinely tied to your business, nothing external.' },
                { question: 'Do I have to type my question, or can I speak?', answer: "Both: voice input is handy at the counter when your hands are full." },
                { question: 'Is the assistant included in every plan?', answer: 'It is available from the Growth plan onward, as well as Pro and Enterprise.' },
            ],
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
