import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { L as Link_default } from "../ssr.js";
import { Zap, Package, Building2, BarChart3, HardHat, Users, ShieldCheck, Sparkles, Percent } from "lucide-react";
import { motion } from "framer-motion";
const portraitOfMatureManStandingInHardwareStore20260324080015Utc = "/build/assets/portrait-of-mature-man-standing-in-hardware-store-2026-03-24-08-00-15-utc-C2P4g0NC.jpg";
const __vite_glob_1_0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: portraitOfMatureManStandingInHardwareStore20260324080015Utc
}, Symbol.toStringTag, { value: "Module" }));
const portraitOfOneHappyYoungHispanicWaiterStandi20260109114545Utc = "/build/assets/portrait-of-one-happy-young-hispanic-waiter-standi-2026-01-09-11-45-45-utc-3chlJtKi.jpg";
const __vite_glob_1_1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: portraitOfOneHappyYoungHispanicWaiterStandi20260109114545Utc
}, Symbol.toStringTag, { value: "Module" }));
const shotOfAYoungManWorkingAtHisJobInAShop20260325024326Utc = "/build/assets/shot-of-a-young-man-working-at-his-job-in-a-shop-2026-03-25-02-43-26-utc-CWnmBJwC.jpg";
const __vite_glob_1_2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: shotOfAYoungManWorkingAtHisJobInAShop20260325024326Utc
}, Symbol.toStringTag, { value: "Module" }));
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.18, delayChildren: 0.1 } }
};
const copy = {
  fr: {
    title: "BATIX PRO | Gestion de quincaillerie plus humaine",
    brandSubtitle: "Gestion moderne des quincailleries",
    seo: {
      description: "BATIX PRO est le logiciel de gestion de quincaillerie pensé pour les équipes terrain. Ventes, stock, achats fournisseurs et rapports en temps réel. Essai gratuit 14 jours, sans carte bancaire.",
      keywords: "logiciel quincaillerie, gestion stock quincaillerie, caisse quincaillerie, logiciel vente comptoir, gestion boutique, BATIX PRO, SaaS quincaillerie, gestion multi-boutiques",
      ogImage: "/og-image.jpg"
    },
    nav: {
      demo: "Démo",
      features: "Fonctionnalités",
      pricing: "Tarifs",
      faq: "FAQ",
      contact: "Contact",
      blog: "Blog"
    },
    auth: {
      dashboard: "Dashboard",
      login: "Connexion",
      trial: "Essai gratuit"
    },
    hero: {
      badge: "Conçu pour les équipes terrain",
      title: "Transformez chaque journée en ventes mieux maîtrisées.",
      description: "BATIX PRO fluidifie le comptoir, fiabilise le stock et donne aux gérants une vision claire pour décider vite et bien.",
      primary: "Démarrer mon essai",
      secondary: "Voir la vidéo démo",
      helper: "Sans carte bancaire · Prêt en 5 min · Support WhatsApp inclus"
    },
    quickPoints: [
      "Mise en route rapide, sans équipe technique",
      "Support humain réactif par WhatsApp et email",
      "Visibilité en temps réel sur toutes vos boutiques"
    ],
    socialProof: "Pourquoi nous faire confiance",
    promises: [
      { icon: "Zap", value: "< 10 min", label: "Pour faire votre première vente" },
      { icon: "MessageCircle", value: "< 2h", label: "Temps de réponse support WhatsApp" },
      { icon: "ShieldCheck", value: "14 jours", label: "Essai gratuit, sans carte bancaire" }
    ],
    trustReasons: [
      "Conçu spécifiquement pour les quincailleries",
      "Aucune compétence technique requise pour démarrer",
      "Vos données vous appartiennent, exportables à tout moment",
      "Support par WhatsApp et email"
    ],
    demo: {
      title: "Voyez BATIX PRO en action en 2 minutes",
      description: "Une démo claire pour voir comment une vente, un mouvement de stock et un reporting se passent dans la vraie vie.",
      cta: "Créer mon compte maintenant",
      videoTitle: "Vidéo démo BATIX PRO",
      videoHint: "Remplacez cette vidéo par votre démo produit finale si besoin.",
      videoUrl: "https://www.youtube.com/embed/M7lc1UVf-VE",
      sectionTitle: "Apprenez en regardant",
      sectionSubtitle: "Des courtes vidéos pour maîtriser chaque étape, à votre rythme."
    },
    videoFaqs: [
      {
        id: "compte",
        question: "Comment créer son compte et configurer sa boutique ?",
        duration: "1 min",
        url: "https://www.youtube.com/embed/M7lc1UVf-VE"
      },
      {
        id: "produits",
        question: "Comment ajouter et organiser ses produits ?",
        duration: "2 min",
        url: "https://www.youtube.com/embed/M7lc1UVf-VE"
      },
      {
        id: "vente",
        question: "Comment enregistrer une vente au comptoir ?",
        duration: "1 min 30",
        url: "https://www.youtube.com/embed/M7lc1UVf-VE"
      },
      {
        id: "achats",
        question: "Comment gérer ses achats et réceptions fournisseurs ?",
        duration: "2 min",
        url: "https://www.youtube.com/embed/M7lc1UVf-VE"
      },
      {
        id: "rapports",
        question: "Comment consulter ses rapports et statistiques ?",
        duration: "1 min 30",
        url: "https://www.youtube.com/embed/M7lc1UVf-VE"
      }
    ],
    stats: [
      { label: "Première vente", value: "< 10 min" },
      { label: "Support WhatsApp", value: "< 2h" },
      { label: "Essai gratuit", value: "14 j" }
    ],
    featuresTitle: "Ce que vos équipes vont aimer au quotidien",
    pricingLabel: "Tarifs",
    pricingTitle: "Choisissez le plan qui suit votre croissance",
    pricingFallback: "Aucun plan actif détecté en base. Voici un aperçu des offres.",
    planCta: "Choisir ce plan",
    faqTitle: "Questions fréquentes",
    contact: {
      title: "Prêt à moderniser votre quincaillerie ?",
      description: "Passez d'une gestion réactive à une gestion sereine avec une plateforme pensée pour des équipes réelles.",
      cta: "Lancer mon essai gratuit",
      form: {
        heading: "Une question ? Écrivez-nous.",
        subheading: "On vous répond sous 24h.",
        name: "Votre nom",
        email: "Votre email",
        subject: "Sujet",
        subjectPlaceholder: "Ex : Demande de démo, question sur les tarifs…",
        messagePlaceholder: "Décrivez votre besoin ou posez votre question…",
        submit: "Envoyer le message",
        sending: "Envoi en cours…",
        successTitle: "Message envoyé !",
        successText: "Nous vous répondrons sous 24h.",
        errorText: "Une erreur est survenue. Réessayez ou contactez-nous par WhatsApp.",
        contactInfo: "Ou contactez-nous directement"
      }
    },
    footerText: "BATIX PRO, une gestion quincaillerie plus simple.",
    langLabel: "Langue"
  },
  en: {
    title: "BATIX PRO | More Human Hardware Store Management",
    brandSubtitle: "Modern hardware store operations",
    seo: {
      description: "BATIX PRO is the hardware store management software built for real field teams. Sales, stock, supplier purchases and real-time reports. Free 14-day trial, no credit card required.",
      keywords: "hardware store software, inventory management, POS hardware store, store management software, BATIX PRO, SaaS hardware, multi-store management",
      ogImage: "/og-image.jpg"
    },
    nav: {
      demo: "Demo",
      features: "Features",
      pricing: "Pricing",
      faq: "FAQ",
      contact: "Contact",
      blog: "Blog"
    },
    auth: {
      dashboard: "Dashboard",
      login: "Login",
      trial: "Free trial"
    },
    hero: {
      badge: "Built for real field teams",
      title: "Turn daily operations into controlled, profitable growth.",
      description: "BATIX PRO streamlines checkout, secures stock accuracy, and gives managers the clarity to move faster with confidence.",
      primary: "Start my free trial",
      secondary: "Watch demo video",
      helper: "No credit card · Ready in 5 min · WhatsApp support included"
    },
    quickPoints: [
      "Fast setup with no technical team required",
      "Responsive human support on WhatsApp and email",
      "Real-time visibility across all your stores"
    ],
    socialProof: "Why trust us",
    promises: [
      { icon: "Zap", value: "< 10 min", label: "To make your first sale" },
      { icon: "MessageCircle", value: "< 2h", label: "WhatsApp support response time" },
      { icon: "ShieldCheck", value: "14 days", label: "Free trial, no credit card needed" }
    ],
    trustReasons: [
      "Built specifically for hardware stores",
      "No technical skills required to get started",
      "Your data is yours — exportable anytime",
      "Human support in French and English via WhatsApp and email"
    ],
    demo: {
      title: "See BATIX PRO in action in 2 minutes",
      description: "A short walkthrough showing checkout, stock movements, and reporting in a real workflow.",
      cta: "Create my account now",
      videoTitle: "BATIX PRO demo video",
      videoHint: "Swap this placeholder with your final product demo if needed.",
      videoUrl: "https://www.youtube.com/embed/M7lc1UVf-VE",
      sectionTitle: "Learn by watching",
      sectionSubtitle: "Short videos to master every step, at your own pace."
    },
    videoFaqs: [
      {
        id: "account",
        question: "How do I create my account and set up my store?",
        duration: "1 min",
        url: "https://www.youtube.com/embed/M7lc1UVf-VE"
      },
      {
        id: "products",
        question: "How do I add and organize my products?",
        duration: "2 min",
        url: "https://www.youtube.com/embed/M7lc1UVf-VE"
      },
      {
        id: "sale",
        question: "How do I record a sale at checkout?",
        duration: "1 min 30",
        url: "https://www.youtube.com/embed/M7lc1UVf-VE"
      },
      {
        id: "purchases",
        question: "How do I manage supplier orders and deliveries?",
        duration: "2 min",
        url: "https://www.youtube.com/embed/M7lc1UVf-VE"
      },
      {
        id: "reports",
        question: "How do I read my reports and analytics?",
        duration: "1 min 30",
        url: "https://www.youtube.com/embed/M7lc1UVf-VE"
      }
    ],
    stats: [
      { label: "First sale", value: "< 10 min" },
      { label: "WhatsApp support", value: "< 2h" },
      { label: "Free trial", value: "14 days" }
    ],
    featuresTitle: "What your team will love every day",
    pricingLabel: "Pricing",
    pricingTitle: "Pick the plan that scales with your growth",
    pricingFallback: "No active plans found in database yet. Here is a sample pricing preview.",
    planCta: "Choose this plan",
    faqTitle: "Frequently Asked Questions",
    contact: {
      title: "Ready to modernize your hardware operations?",
      description: "Move from reactive operations to a calm, controlled workflow built for real teams.",
      cta: "Start my free trial",
      form: {
        heading: "Got a question? Write to us.",
        subheading: "We reply within 24 hours.",
        name: "Your name",
        email: "Your email",
        subject: "Subject",
        subjectPlaceholder: "E.g. Demo request, pricing question…",
        messagePlaceholder: "Describe your need or ask your question…",
        submit: "Send message",
        sending: "Sending…",
        successTitle: "Message sent!",
        successText: "We will get back to you within 24 hours.",
        errorText: "Something went wrong. Please try again or reach us via WhatsApp.",
        contactInfo: "Or contact us directly"
      }
    },
    footerText: "BATIX PRO, simpler and more human hardware management.",
    langLabel: "Language"
  }
};
const featuresByLocale = {
  fr: [
    {
      title: "Vente rapide au comptoir",
      description: "Recherche produit par nom, code-barre ou référence. Ticket généré en quelques secondes, encaissement sans friction même en heure de pointe.",
      icon: Zap
    },
    {
      title: "Stock fiable en temps réel",
      description: "Chaque entrée et sortie est tracée instantanément. Alertes de rupture automatiques pour ne jamais manquer un réapprovisionnement critique.",
      icon: Package
    },
    {
      title: "Multi-boutiques, une seule vue",
      description: "Gérez toutes vos boutiques depuis un tableau de bord central. Comparez les performances, transférez du stock, pilotez à distance.",
      icon: Building2
    },
    {
      title: "Rapports qui déclenchent des décisions",
      description: "Marge brute, rotation des produits, chiffre d'affaires par boutique et par vendeur — des chiffres utiles, pas du remplissage.",
      icon: BarChart3
    },
    {
      title: "Gestion des achats fournisseurs",
      description: "Créez vos bons de commande, réceptionnez les livraisons et réconciliez vos factures fournisseurs directement dans l'application.",
      icon: HardHat
    },
    {
      title: "Équipe avec les bons accès",
      description: "Gérants, vendeurs, magasiniers et caissiers : chaque rôle voit exactement ce dont il a besoin. Rien de plus, rien de moins.",
      icon: Users
    },
    {
      title: "Traçabilité et historique complet",
      description: "Chaque action sensible est enregistrée : modification de prix, suppression, ajustement de stock. Retrouvez qui a fait quoi et quand.",
      icon: ShieldCheck
    },
    {
      title: "Gestion des crédits clients",
      description: "Suivez les ventes à crédit, les encours par client et les remboursements sans vous perdre dans des tableaux Excel.",
      icon: Sparkles
    },
    {
      title: "Dépôts et transferts de stock",
      description: "Organisez votre stock par dépôt, effectuez des transferts entre boutiques et gardez une visibilité complète sur chaque emplacement.",
      icon: Package
    },
    {
      title: "Factures et devis clients",
      description: "Générez des factures professionnelles, émettez des devis et suivez les statuts de paiement depuis un seul endroit, sans outil tiers.",
      icon: BarChart3
    },
    {
      title: "Promotions et prix flexibles",
      description: "Appliquez des remises par produit, catégorie ou période, sans casser votre politique tarifaire ni vos marges.",
      icon: Percent
    }
  ],
  en: [
    {
      title: "Fast checkout at the counter",
      description: "Find products by name, barcode, or reference. Generate receipts in seconds and handle payments without friction, even during rush hours.",
      icon: Zap
    },
    {
      title: "Reliable real-time stock",
      description: "Every stock movement is tracked instantly. Automatic low-stock alerts so you never miss a critical replenishment.",
      icon: Package
    },
    {
      title: "Multi-store, single dashboard",
      description: "Manage all your stores from one central view. Compare performance, transfer stock, and oversee operations remotely.",
      icon: Building2
    },
    {
      title: "Reports that drive real decisions",
      description: "Gross margin, product turnover, revenue by store and by seller — actionable numbers, not just filler data.",
      icon: BarChart3
    },
    {
      title: "Supplier purchase management",
      description: "Create purchase orders, receive deliveries, and reconcile supplier invoices directly inside the app.",
      icon: HardHat
    },
    {
      title: "Team with the right access",
      description: "Managers, sellers, stock clerks, and cashiers each see exactly what they need. Nothing more, nothing less.",
      icon: Users
    },
    {
      title: "Full traceability and audit trail",
      description: "Every sensitive action is logged: price changes, deletions, stock adjustments. Know who did what and when.",
      icon: ShieldCheck
    },
    {
      title: "Customer credit tracking",
      description: "Monitor credit sales, outstanding balances per customer, and repayments without drowning in spreadsheets.",
      icon: Sparkles
    },
    {
      title: "Depots and stock transfers",
      description: "Organize stock by depot, move inventory between stores, and maintain full visibility across every location.",
      icon: Package
    },
    {
      title: "Invoices and customer quotes",
      description: "Generate professional invoices, issue quotes, and track payment statuses in one place — no third-party tool needed.",
      icon: BarChart3
    },
    {
      title: "Flexible pricing and promotions",
      description: "Apply discounts by product, category, or period without breaking your pricing policy or your margins.",
      icon: Percent
    }
  ]
};
const faqsByLocale = {
  fr: [
    {
      question: "Comment fonctionne la limite de boutiques ?",
      answer: "Chaque abonnement définit un nombre de boutiques actives. Vous pouvez changer de plan à tout moment, sans perdre vos données."
    },
    {
      question: "Je ne suis pas technique, est-ce que je vais m'en sortir ?",
      answer: "Oui. BATIX PRO est conçu pour des équipes terrain, pas pour des informaticiens. La prise en main prend moins d'une journée et notre équipe vous accompagne par WhatsApp."
    },
    {
      question: "Est-ce que ça marche sans internet ?",
      answer: "Une connexion est nécessaire pour synchroniser les données en temps réel entre vos boutiques. En cas de coupure brève, les opérations en cours sont conservées."
    },
    {
      question: "Puis-je gérer plusieurs utilisateurs et vendeurs ?",
      answer: "Oui. Vous définissez des rôles précis : gérant, vendeur, caissier, magasinier. Chaque profil voit uniquement ce dont il a besoin."
    },
    {
      question: "Combien de temps faut-il pour démarrer ?",
      answer: "La configuration de la première boutique se fait en quelques minutes. Vous pouvez faire votre première vente le jour même."
    },
    {
      question: "Qu'est-ce qui se passe si je veux annuler ?",
      answer: "Vous annulez quand vous voulez, sans frais ni engagement. Vos données restent exportables pendant 30 jours après l'annulation."
    },
    {
      question: "Puis-je avoir une démo accompagnée ?",
      answer: "Oui, notre équipe peut vous faire une démonstration personnalisée par visio ou WhatsApp, selon votre disponibilité."
    },
    {
      question: "Est-ce que mes données sont sécurisées ?",
      answer: "Vos données sont hébergées sur des serveurs sécurisés, sauvegardées automatiquement chaque jour et exportables à tout moment au format Excel ou PDF."
    }
  ],
  en: [
    {
      question: "How do store limits work?",
      answer: "Each plan defines how many active stores you can run. You can upgrade or downgrade anytime without losing your data."
    },
    {
      question: "I'm not technical — will I manage?",
      answer: "Absolutely. BATIX PRO is built for field teams, not IT staff. Onboarding takes less than a day, and our team supports you directly on WhatsApp."
    },
    {
      question: "Does it work without internet?",
      answer: "An internet connection is needed to sync data in real time across stores. During brief outages, ongoing operations are preserved locally."
    },
    {
      question: "Can I manage multiple users and sellers?",
      answer: "Yes. You assign clear roles: manager, seller, cashier, stock clerk. Each profile only sees what they need."
    },
    {
      question: "How long does onboarding take?",
      answer: "You can set up your first store in minutes and make your first sale the same day."
    },
    {
      question: "What happens if I want to cancel?",
      answer: "Cancel anytime, no fees, no commitment. Your data stays exportable for 30 days after cancellation."
    },
    {
      question: "Can I request a guided demo?",
      answer: "Yes, our team can walk you through a personalized demo by video call or WhatsApp, at your convenience."
    },
    {
      question: "Is my data secure?",
      answer: "Your data is hosted on secure servers, automatically backed up daily, and exportable anytime in Excel or PDF format."
    }
  ]
};
const trustMarksByLocale = {
  fr: [],
  en: []
};
const fallbackPlansByLocale = {
  fr: [
    {
      name: "Starter",
      price_eur: "29 EUR",
      subtitle: "par mois",
      badge: "Jusqu'à 1 boutique",
      points: ["1 boutique", "5 utilisateurs", "5 000 produits", "1 dépôt", "Support standard"],
      highlighted: false
    },
    {
      name: "Growth",
      price_eur: "79 EUR",
      subtitle: "par mois",
      badge: "Jusqu'à 5 boutiques",
      points: ["5 boutiques", "20 utilisateurs", "50 000 produits", "5 dépôts", "Support prioritaire"],
      highlighted: true
    },
    {
      name: "Scale",
      price_eur: "149 EUR",
      subtitle: "par mois",
      badge: "Boutiques illimitées",
      points: ["Boutiques illimitées", "Utilisateurs illimités", "Produits illimités", "Dépôts illimités", "Support premium"],
      highlighted: false
    }
  ],
  en: [
    {
      name: "Starter",
      price_eur: "29 EUR",
      subtitle: "per month",
      badge: "Up to 1 store",
      points: ["1 store", "5 users", "5,000 products", "1 depot", "Standard support"],
      highlighted: false
    },
    {
      name: "Growth",
      price_eur: "79 EUR",
      subtitle: "per month",
      badge: "Up to 5 stores",
      points: ["5 stores", "20 users", "50,000 products", "5 depots", "Priority support"],
      highlighted: true
    },
    {
      name: "Scale",
      price_eur: "149 EUR",
      subtitle: "per month",
      badge: "Unlimited stores",
      points: ["Unlimited stores", "Unlimited users", "Unlimited products", "Unlimited depots", "Premium support"],
      highlighted: false
    }
  ]
};
const getHeroCaptionFromPath = (path) => {
  const key = path.toLowerCase();
  if (key.includes("mature-man") || key.includes("hardware-store")) {
    return {
      fr: {
        title: "Vos chiffres du jour, visibles en 10 secondes.",
        description: "Plus besoin d'attendre la fermeture pour savoir où vous en êtes. Ventes, marges et stock s'affichent en direct, depuis n'importe où."
      },
      en: {
        title: "Your daily numbers, visible in 10 seconds.",
        description: "No more waiting until closing time to know where you stand. Sales, margins and stock update live, from anywhere."
      }
    };
  }
  if (key.includes("young-man") || key.includes("working-at-his-job") || key.includes("shop")) {
    return {
      fr: {
        title: "Une vente en 30 secondes, même en heure de pointe.",
        description: "Scannez, encaissez, passez au suivant. BATIX PRO élimine les files d'attente et les erreurs de caisse une bonne fois pour toutes."
      },
      en: {
        title: "A sale in 30 seconds, even during rush hour.",
        description: "Scan, collect, next customer. BATIX PRO eliminates checkout queues and register errors once and for all."
      }
    };
  }
  if (key.includes("waiter") || key.includes("happy") || key.includes("portrait-of-one")) {
    return {
      fr: {
        title: "Votre équipe sait quoi faire, sans vous appeler.",
        description: "Chaque vendeur voit ses tâches, ses produits, ses ventes. Vous gérez moins d'urgences, ils travaillent mieux en autonomie."
      },
      en: {
        title: "Your team knows what to do — without calling you.",
        description: "Every seller sees their tasks, products, and sales. You handle fewer emergencies, they work with more confidence."
      }
    };
  }
  return {
    fr: {
      title: "Gérez tout, depuis votre téléphone.",
      description: "Boutiques, stock, équipes et rapports réunis dans une seule application. Simple à prendre en main, puissant au quotidien."
    },
    en: {
      title: "Run everything from your phone.",
      description: "Stores, stock, teams and reports in one app. Easy to get started, powerful every day."
    }
  };
};
const heroSlideModules = {
  .../* @__PURE__ */ Object.assign({}),
  .../* @__PURE__ */ Object.assign({ "/resources/images/heroes/portrait-of-mature-man-standing-in-hardware-store-2026-03-24-08-00-15-utc.jpg": __vite_glob_1_0, "/resources/images/heroes/portrait-of-one-happy-young-hispanic-waiter-standi-2026-01-09-11-45-45-utc.jpg": __vite_glob_1_1, "/resources/images/heroes/shot-of-a-young-man-working-at-his-job-in-a-shop-2026-03-25-02-43-26-utc.jpg": __vite_glob_1_2 })
};
const heroSlides = Object.entries(heroSlideModules).sort(([a], [b]) => a.localeCompare(b)).map(([path, module]) => {
  const src = module.default;
  const filename = path.split("/").pop() ?? "batix-hero";
  const label = filename.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ").trim();
  return {
    src,
    alt: `Batix hero ${label}`,
    caption: getHeroCaptionFromPath(path)
  };
});
function WelcomeHeader({ locale, setLocale, scrolled, getDashboardUrl, isAuthenticated }) {
  const t = copy[locale];
  return /* @__PURE__ */ jsx("header", { className: `z-50 w-full py-3 transition-all duration-300 ${scrolled ? "fixed top-0 bg-[#efe7db] shadow-md backdrop-blur-sm" : "relative bg-[#efe7db]/95"}`, children: /* @__PURE__ */ jsxs("div", { className: "mx-auto flex w-full max-w-7xl items-center justify-between px-6 lg:px-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-amber-300 p-2 text-slate-900", children: /* @__PURE__ */ jsx(HardHat, { className: "size-5" }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-bold tracking-wide text-slate-900", children: "BATIX PRO" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-600", children: t.brandSubtitle })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("nav", { className: "hidden items-center gap-1 p-1 lg:flex", children: [
      ["demo", "features", "pricing", "faq", "contact"].map((key) => /* @__PURE__ */ jsx(
        "a",
        {
          href: `#${key}`,
          className: "rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-amber-300 hover:text-slate-900",
          children: t.nav[key]
        },
        key
      )),
      /* @__PURE__ */ jsx(
        "a",
        {
          href: "#blog",
          className: "rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-amber-300 hover:text-slate-900",
          children: t.nav.blog ?? "Blog"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("nav", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx("div", { className: "hidden items-center gap-1 rounded-lg border border-[#d8cfbe] bg-[#f4ede2] p-1 sm:flex", "aria-label": t.langLabel, children: ["fr", "en"].map((l) => /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => setLocale(l),
          className: `rounded-md px-2 py-1 text-xs transition ${locale === l ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`,
          children: l.toUpperCase()
        },
        l
      )) }),
      isAuthenticated ? /* @__PURE__ */ jsx(Link_default, { href: getDashboardUrl(), className: "rounded-lg border border-[#d8cfbe] px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-[#e9dfd0]", children: t.auth.dashboard }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Link_default, { href: route("login"), className: "rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100", children: t.auth.login }),
        /* @__PURE__ */ jsx(Link_default, { href: route("register"), className: "rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-amber-300", children: t.auth.trial })
      ] })
    ] })
  ] }) });
}
function WelcomeFooter({ footerText, nav }) {
  return /* @__PURE__ */ jsx(
    motion.footer,
    {
      className: "mt-0 border-t border-slate-800 bg-slate-900 py-8",
      initial: { opacity: 0 },
      whileInView: { opacity: 1 },
      viewport: { once: true },
      transition: { duration: 0.6 },
      children: /* @__PURE__ */ jsxs("div", { className: "mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-sm text-slate-600 md:flex-row lg:px-8", children: [
        /* @__PURE__ */ jsxs("p", { children: [
          "© ",
          (/* @__PURE__ */ new Date()).getFullYear(),
          " BATIX PRO. ",
          footerText
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsx("a", { href: "#demo", className: "transition hover:text-slate-900", children: nav.demo }),
          /* @__PURE__ */ jsx("a", { href: "#features", className: "transition hover:text-slate-900", children: nav.features }),
          /* @__PURE__ */ jsx("a", { href: "#pricing", className: "transition hover:text-slate-900", children: nav.pricing }),
          /* @__PURE__ */ jsx("a", { href: "#faq", className: "transition hover:text-slate-900", children: nav.faq }),
          /* @__PURE__ */ jsx("a", { href: "#contact", className: "transition hover:text-slate-900", children: nav.contact })
        ] })
      ] })
    }
  );
}
export {
  WelcomeHeader as W,
  WelcomeFooter as a,
  featuresByLocale as b,
  faqsByLocale as c,
  copy as d,
  fallbackPlansByLocale as e,
  fadeUp as f,
  heroSlides as h,
  stagger as s,
  trustMarksByLocale as t
};
