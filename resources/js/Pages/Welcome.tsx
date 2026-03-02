import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import {
    ArrowRight,
    BarChart3,
    Building2,
    Check,
    CircleHelp,
    Clock3,
    HardHat,
    Layers,
    Package,
    ShieldCheck,
    Sparkles,
    Store,
    TrendingUp,
    Users,
    Zap,
} from 'lucide-react';

interface SubscriptionPlan {
    id: number;
    name: string;
    slug: string;
    description: string;
    price: number;
    formatted_price: string;
    price_eur: string;
    price_fcfa: string;
    max_shops: number;
    max_users: number;
    features: string[];
    shop_limit_text: string;
    has_unlimited_shops: boolean;
    has_unlimited_users: boolean;
}

interface WelcomeProps extends PageProps {
    subscriptionPlans: SubscriptionPlan[];
}

type Locale = 'fr' | 'en';

type FeatureItem = {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
};

type PlanItem = {
    name: string;
    price: string;
    subtitle: string;
    badge: string;
    points: string[];
    highlighted?: boolean;
};

const copy = {
    fr: {
        title: 'Batix SaaS | Gestion de quincaillerie',
        brandSubtitle: 'Gestion moderne de quincaillerie',
        nav: {
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
            badge: 'SaaS metier pour quincailleries',
            title: 'Plus de boutiques. Plus de marge. Moins de chaos.',
            description:
                'Batix centralise stock, ventes, equipes et performance. Ton abonnement determine le nombre de boutiques que tu peux gerer, avec une montee en puissance immediate.',
            primary: 'Lancer ma plateforme',
            secondary: 'Voir les abonnements',
        },
        networkCard: {
            title: 'Vue globale reseau',
            live: 'En direct',
            activeStores: 'Boutiques actives',
            revenue: 'CA du jour',
            alerts: 'Alertes stock',
        },
        stats: [
            { label: 'Boutiques gerees', value: '1 250+' },
            { label: 'References stock', value: '2.1M' },
            { label: 'Temps gagne / semaine', value: '11h' },
        ],
        beforeAfter: {
            beforeTitle: 'Avant Batix',
            beforeHeadline: 'Des outils disperses et des erreurs couteuses',
            beforeBullets: [
                'Stocks incoherents entre boutiques',
                'Pilotage manuel des ventes',
                'Decisions sans visibilite fiable',
            ],
            afterTitle: 'Apres Batix',
            afterHeadline: 'Une chaine pilotee en temps reel',
            afterBullets: [
                'Vue unifiee de toutes les boutiques',
                'Automatisation des alertes critiques',
                'Decisions guidees par les indicateurs',
            ],
        },
        featuresTitle: 'Tout ce qu il faut pour piloter ta quincaillerie',
        testimonial: {
            title: 'Temoignage client',
            quote:
                '"En 3 mois, on a ouvert 2 nouvelles boutiques sans recruter de profil administratif supplementaire."',
            author: 'Yacine B., Directeur reseau - Quincaillerie Atlas',
        },
        pricingTitle: 'Un abonnement qui suit la croissance de tes boutiques',
        planCta: 'Commencer',
        faqTitle: 'Questions frequentes',
        contact: {
            title: 'Pret a industrialiser la gestion de ta quincaillerie ?',
            description:
                'Passe d une gestion fragmentee a une plateforme unifiee, concue pour les chaines de quincaillerie en croissance.',
            cta: 'Demarrer mon essai',
        },
        footerText: 'Gestion intelligente de quincailleries.',
        langLabel: 'Langue',
    },
    en: {
        title: 'Batix SaaS | Hardware Store Management',
        brandSubtitle: 'Modern hardware store management',
        nav: {
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
            badge: 'Industry-focused SaaS for hardware stores',
            title: 'More stores. More margin. Less chaos.',
            description:
                'Batix centralizes stock, sales, teams, and performance. Your plan defines how many stores you can manage, with instant scalability.',
            primary: 'Launch my platform',
            secondary: 'See pricing plans',
        },
        networkCard: {
            title: 'Network overview',
            live: 'Live',
            activeStores: 'Active stores',
            revenue: 'Today revenue',
            alerts: 'Stock alerts',
        },
        stats: [
            { label: 'Managed stores', value: '1,250+' },
            { label: 'Stock references', value: '2.1M' },
            { label: 'Time saved / week', value: '11h' },
        ],
        beforeAfter: {
            beforeTitle: 'Before Batix',
            beforeHeadline: 'Scattered tools and expensive mistakes',
            beforeBullets: [
                'Inconsistent stock across stores',
                'Manual sales operations',
                'Decisions with poor visibility',
            ],
            afterTitle: 'After Batix',
            afterHeadline: 'A network managed in real-time',
            afterBullets: [
                'Unified view of all stores',
                'Automated critical alerts',
                'Decisions backed by metrics',
            ],
        },
        featuresTitle: 'Everything you need to run your hardware business',
        testimonial: {
            title: 'Customer story',
            quote:
                '"In 3 months, we opened 2 new stores without hiring extra admin staff."',
            author: 'Yacine B., Network Director - Quincaillerie Atlas',
        },
        pricingTitle: 'Plans that scale with your store network',
        planCta: 'Get started',
        faqTitle: 'Frequently asked questions',
        contact: {
            title: 'Ready to scale your hardware operations?',
            description:
                'Move from fragmented operations to a unified platform built for growing hardware chains.',
            cta: 'Start my trial',
        },
        footerText: 'Smart management for hardware store chains.',
        langLabel: 'Language',
    },
};

const featuresByLocale: Record<Locale, FeatureItem[]> = {
    fr: [
        {
            title: 'Multi-boutiques par abonnement',
            description:
                'Cree et pilote plusieurs points de vente depuis un seul compte, avec des limites liees a chaque plan.',
            icon: Building2,
        },
        {
            title: 'Stock en temps reel',
            description:
                'Suivi precis des entrees, sorties et alertes de rupture sur l ensemble de tes boutiques.',
            icon: Package,
        },
        {
            title: 'Ventes comptoir ultra rapides',
            description:
                'Encaissement simplifie avec recherche produit instantanee et edition de tickets en quelques clics.',
            icon: Zap,
        },
        {
            title: 'Reporting decisionnel',
            description:
                'Marge, rotation, best-sellers, performance par boutique et par vendeur, tout est centralise.',
            icon: BarChart3,
        },
        {
            title: 'Gestion d equipes et roles',
            description:
                'Donne les bons acces aux gerants, caissiers et magasiniers sans compromettre la securite.',
            icon: Users,
        },
        {
            title: 'Securite et tracabilite',
            description:
                'Historique d actions, controle des remises et journal complet des operations sensibles.',
            icon: ShieldCheck,
        },
    ],
    en: [
        {
            title: 'Multi-store plans',
            description:
                'Create and manage multiple stores from one account, with limits tied to each plan.',
            icon: Building2,
        },
        {
            title: 'Real-time stock',
            description:
                'Track inbound/outbound movements and low-stock alerts across all your stores.',
            icon: Package,
        },
        {
            title: 'Fast point-of-sale',
            description:
                'Faster checkout with instant product search and quick receipt generation.',
            icon: Zap,
        },
        {
            title: 'Decision-focused reporting',
            description:
                'Margins, rotation, best-sellers, and performance by store and salesperson in one place.',
            icon: BarChart3,
        },
        {
            title: 'Team and role management',
            description:
                'Assign the right access to managers, cashiers, and stock clerks safely.',
            icon: Users,
        },
        {
            title: 'Security and traceability',
            description:
                'Action history, discount controls, and complete logs for sensitive operations.',
            icon: ShieldCheck,
        },
    ],
};

// Plans statiques commentés - maintenant chargés depuis la base de données
/* const plansByLocale: Record<Locale, PlanItem[]> = {
    fr: [
        {
            name: 'Starter',
            price: '29€',
            subtitle: 'par mois',
            badge: '1 boutique',
            points: ['1 point de vente', 'Jusqu a 5 utilisateurs', 'Support standard'],
        },
        {
            name: 'Growth',
            price: '79€',
            subtitle: 'par mois',
            badge: 'Jusqu a 5 boutiques',
            points: ['Multi-boutiques', 'Rapports avances', 'Gestion des roles fine'],
            highlighted: true,
        },
        {
            name: 'Scale',
            price: '149€',
            subtitle: 'par mois',
            badge: 'Boutiques illimitees',
            points: ['Illimite', 'Onboarding prioritaire', 'Support premium'],
        },
    ],
    en: [
        {
            name: 'Starter',
            price: '29€',
            subtitle: 'per month',
            badge: '1 store',
            points: ['1 store', 'Up to 5 users', 'Standard support'],
        },
        {
            name: 'Growth',
            price: '79€',
            subtitle: 'per month',
            badge: 'Up to 5 stores',
            points: ['Multi-store', 'Advanced reports', 'Fine-grained roles'],
            highlighted: true,
        },
        {
            name: 'Scale',
            price: '149€',
            subtitle: 'per month',
            badge: 'Unlimited stores',
            points: ['Unlimited', 'Priority onboarding', 'Premium support'],
        },
    ],
}; */


const faqsByLocale = {
    fr: [
        {
            question: 'Comment fonctionne la limite de boutiques ?',
            answer: 'Chaque abonnement definit un nombre de boutiques actives. Tu peux changer de plan a tout moment.',
        },
        {
            question: 'Puis-je gerer plusieurs utilisateurs par boutique ?',
            answer: 'Oui. Tu assignes des roles precis avec des permissions adaptees a chaque profil.',
        },
        {
            question: 'Le systeme convient-il a une chaine en croissance rapide ?',
            answer: 'Oui, la plateforme est pensee pour scaler sans friction.',
        },
        {
            question: 'Combien de temps pour demarrer ?',
            answer: 'Quelques minutes suffisent pour configurer la premiere boutique.',
        },
    ],
    en: [
        {
            question: 'How do store limits work?',
            answer: 'Each plan defines how many active stores you can run. You can upgrade anytime.',
        },
        {
            question: 'Can I manage multiple users per store?',
            answer: 'Yes. You can assign specific roles and permissions per profile.',
        },
        {
            question: 'Is it fit for fast-growing chains?',
            answer: 'Yes, the platform is designed to scale without friction.',
        },
        {
            question: 'How fast can I get started?',
            answer: 'You can configure your first store in just a few minutes.',
        },
    ],
};

const trustMarksByLocale = {
    fr: ['Quincaillerie Atlas', 'ProFix Materiaux', 'BatiNord Pro', 'EcoTools Market'],
    en: ['Atlas Hardware', 'ProFix Materials', 'BatiNord Pro', 'EcoTools Market'],
};

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0 },
};

const stagger = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0.1,
        },
    },
};

export default function Welcome({ auth, subscriptionPlans }: WelcomeProps) {
    const [locale, setLocale] = useState<Locale>('fr');

    // Helper pour générer l'URL du dashboard
    const getDashboardUrl = () => {
        if (!auth.user) {
            return route('register');
        }
        
        // Si l'utilisateur est admin_platforme, rediriger vers le dashboard plateforme
        if (auth.user.role === 'admin_platforme') {
            return route('platform.dashboard');
        }
        
        // Sinon, utiliser le code_user pour les autres rôles
        if (auth.code_user) {
            return route('dashboard', { code_user: auth.code_user });
        }
        
        // Fallback vers register si pas de code_user
        return route('register');
    };

    useEffect(() => {
        const saved = window.localStorage.getItem('landing_locale');
        if (saved === 'fr' || saved === 'en') {
            setLocale(saved);
        }
    }, []);

    useEffect(() => {
        window.localStorage.setItem('landing_locale', locale);
    }, [locale]);

    const t = copy[locale];
    const features = useMemo(() => featuresByLocale[locale], [locale]);
    const faqs = useMemo(() => faqsByLocale[locale], [locale]);
    const trustMarks = useMemo(() => trustMarksByLocale[locale], [locale]);

    // Transformer les plans de la base de données en format adapté à l'affichage
    const plans = useMemo(() => {
        return subscriptionPlans.map((plan, index) => {
            // Déterminer le badge selon la langue
            const badge = locale === 'fr' 
                ? plan.shop_limit_text 
                : (plan.has_unlimited_shops ? 'Unlimited stores' : `Up to ${plan.max_shops} store${plan.max_shops > 1 ? 's' : ''}`);
            
            // Déterminer le sous-titre
            const subtitle = locale === 'fr' ? 'par mois' : 'per month';
            
            // Points à afficher (features du plan)
            const points = plan.features || [];
            
            // Le plan du milieu est mis en avant
            const highlighted = index === 1 && subscriptionPlans.length === 3;

            return {
                name: plan.name,
                price_eur: plan.price_eur,
                price_fcfa: plan.price_fcfa,
                subtitle: subtitle,
                badge: badge,
                points: points,
                highlighted: highlighted,
            };
        });
    }, [subscriptionPlans, locale]);

    return (
        <>
            <Head title={t.title} />

            <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-300 selection:text-slate-900">
                <div className="absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute -top-28 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-amber-500/20 blur-3xl" />
                    <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
                    <div className="absolute right-0 top-1/3 h-72 w-72 rounded-full bg-orange-500/15 blur-3xl" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.09),transparent_35%)]" />
                </div>

                <div className="mx-auto max-w-7xl px-6 pb-20 pt-8 lg:px-8">
                    <header className="fixed left-1/2 top-4 z-50 flex w-[calc(100%-3rem)] max-w-7xl -translate-x-1/2 items-center justify-between rounded-2xl border border-white/10 bg-slate-950/70 px-5 py-4 shadow-2xl backdrop-blur-xl">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-amber-300 p-2 text-slate-950">
                                <HardHat className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold tracking-wide text-amber-200">BATIX SAAS</p>
                                <p className="text-xs text-slate-300">{t.brandSubtitle}</p>
                            </div>
                        </div>

                        <nav className="hidden items-center gap-1 rounded-xl border border-white/10 bg-slate-950/60 p-1 lg:flex">
                            <a href="#features" className="rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">{t.nav.features}</a>
                            <a href="#pricing" className="rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">{t.nav.pricing}</a>
                            <a href="#faq" className="rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">{t.nav.faq}</a>
                            <a href="#contact" className="rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">{t.nav.contact}</a>
                        </nav>

                        <nav className="flex items-center gap-2">
                            <div className="hidden items-center gap-1 rounded-lg border border-white/15 bg-white/5 p-1 sm:flex">
                                <button
                                    type="button"
                                    onClick={() => setLocale('fr')}
                                    className={`rounded-md px-2 py-1 text-xs transition ${
                                        locale === 'fr' ? 'bg-amber-300 text-slate-950' : 'text-slate-300 hover:bg-white/10'
                                    }`}
                                >
                                    FR
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLocale('en')}
                                    className={`rounded-md px-2 py-1 text-xs transition ${
                                        locale === 'en' ? 'bg-amber-300 text-slate-950' : 'text-slate-300 hover:bg-white/10'
                                    }`}
                                >
                                    EN
                                </button>
                            </div>

                            {auth.user ? (
                                <Link href={getDashboardUrl()} className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
                                    {t.auth.dashboard}
                                </Link>
                            ) : (
                                <>
                                    <Link href={route('login')} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10">
                                        {t.auth.login}
                                    </Link>
                                    <Link href={route('register')} className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200">
                                        {t.auth.trial}
                                    </Link>
                                </>
                            )}
                        </nav>
                    </header>

                    <main className="space-y-20 pt-28">
                        <motion.section className="grid gap-10 lg:grid-cols-2 lg:items-center" initial="hidden" animate="show" variants={stagger}>
                            <motion.div variants={fadeUp} transition={{ duration: 0.6 }}>
                                <motion.p className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-200/30 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-amber-200">
                                    <Sparkles className="size-3.5" />
                                    {t.hero.badge}
                                </motion.p>
                                <motion.h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">{t.hero.title}</motion.h1>
                                <motion.p className="mt-6 max-w-xl text-lg text-slate-300">{t.hero.description}</motion.p>

                                <div className="mt-8 flex flex-wrap items-center gap-3">
                                    <Link href={getDashboardUrl()} className="inline-flex items-center gap-2 rounded-xl bg-amber-300 px-5 py-3 font-semibold text-slate-950 transition hover:bg-amber-200">
                                        {t.hero.primary}
                                        <ArrowRight className="size-4" />
                                    </Link>
                                    <a href="#pricing" className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 font-medium text-slate-200 transition hover:bg-white/10">
                                        {t.hero.secondary}
                                    </a>
                                </div>

                                <div className="mt-8 flex flex-wrap gap-2 text-xs text-slate-300">
                                    {trustMarks.map((brand) => (
                                        <span key={brand} className="rounded-full border border-white/15 bg-white/5 px-3 py-1">{brand}</span>
                                    ))}
                                </div>
                            </motion.div>

                            <motion.div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6 backdrop-blur-xl" variants={fadeUp} transition={{ duration: 0.6, delay: 0.15 }}>
                                <div className="mb-6 flex items-center justify-between">
                                    <p className="text-sm font-medium text-slate-300">{t.networkCard.title}</p>
                                    <span className="rounded-full bg-emerald-400/20 px-2 py-1 text-xs font-semibold text-emerald-300">{t.networkCard.live}</span>
                                </div>

                                <div className="space-y-4">
                                    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                                        <p className="text-xs text-slate-400">{t.networkCard.activeStores}</p>
                                        <p className="mt-1 text-2xl font-bold text-white">5 / 5</p>
                                        <div className="mt-3 h-2 rounded-full bg-slate-700"><div className="h-full w-full rounded-full bg-amber-300" /></div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                                            <p className="text-xs text-slate-400">{t.networkCard.revenue}</p>
                                            <p className="mt-1 text-xl font-semibold text-white">14 280€</p>
                                        </div>
                                        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                                            <p className="text-xs text-slate-400">{t.networkCard.alerts}</p>
                                            <p className="mt-1 text-xl font-semibold text-white">12</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.section>

                        <motion.section className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:grid-cols-3" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}>
                            {t.stats.map((item) => (
                                <motion.div key={item.label} className="rounded-2xl bg-slate-900/70 p-5" variants={fadeUp}>
                                    <p className="text-3xl font-bold text-white">{item.value}</p>
                                    <p className="mt-1 text-sm text-slate-300">{item.label}</p>
                                </motion.div>
                            ))}
                        </motion.section>

                        <section className="grid gap-4 lg:grid-cols-2">
                            <article className="rounded-2xl border border-rose-300/20 bg-rose-400/10 p-6">
                                <p className="text-sm font-semibold text-rose-200">{t.beforeAfter.beforeTitle}</p>
                                <h3 className="mt-2 text-xl font-bold text-white">{t.beforeAfter.beforeHeadline}</h3>
                                <ul className="mt-4 space-y-2 text-sm text-slate-200">
                                    {t.beforeAfter.beforeBullets.map((item) => (
                                        <li key={item} className="flex items-center gap-2"><Clock3 className="size-4 text-rose-200" />{item}</li>
                                    ))}
                                </ul>
                            </article>

                            <article className="rounded-2xl border border-emerald-300/30 bg-emerald-400/10 p-6">
                                <p className="text-sm font-semibold text-emerald-200">{t.beforeAfter.afterTitle}</p>
                                <h3 className="mt-2 text-xl font-bold text-white">{t.beforeAfter.afterHeadline}</h3>
                                <ul className="mt-4 space-y-2 text-sm text-slate-100">
                                    {t.beforeAfter.afterBullets.map((item) => (
                                        <li key={item} className="flex items-center gap-2"><TrendingUp className="size-4 text-emerald-200" />{item}</li>
                                    ))}
                                </ul>
                            </article>
                        </section>

                        <motion.section id="features" className="scroll-mt-24" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} variants={stagger}>
                            <div className="mb-8 flex items-center gap-2">
                                <Layers className="size-5 text-amber-200" />
                                <h2 className="text-2xl font-semibold text-white sm:text-3xl">{t.featuresTitle}</h2>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {features.map((feature) => (
                                    <motion.article key={feature.title} className="group rounded-2xl border border-white/10 bg-slate-900/70 p-5 transition hover:-translate-y-1 hover:border-amber-200/40 hover:bg-slate-900" variants={fadeUp} whileHover={{ y: -4 }}>
                                        <div className="mb-4 inline-flex rounded-lg bg-amber-300/15 p-2 text-amber-200"><feature.icon className="size-5" /></div>
                                        <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                                        <p className="mt-2 text-sm text-slate-300">{feature.description}</p>
                                    </motion.article>
                                ))}
                            </div>
                        </motion.section>

                        <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
                            <p className="text-sm font-semibold text-amber-200">{t.testimonial.title}</p>
                            <blockquote className="mt-3 text-2xl font-semibold leading-snug text-white">{t.testimonial.quote}</blockquote>
                            <p className="mt-4 text-sm text-slate-300">{t.testimonial.author}</p>
                        </section>

                        <motion.section id="pricing" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} variants={stagger}>
                            <h2 className="mb-8 text-2xl font-semibold text-white sm:text-3xl">{t.pricingTitle}</h2>
                            <div className="grid gap-4 lg:grid-cols-4">
                                {plans.map((plan) => (
                                    <motion.article key={plan.name} className={`rounded-2xl border p-6 ${plan.highlighted ? 'border-amber-300 bg-amber-300/10' : 'border-white/10 bg-white/5'}`} variants={fadeUp} whileHover={{ y: -5 }}>
                                        <p className="text-sm font-semibold text-amber-200">{plan.badge}</p>
                                        <h3 className="mt-2 text-2xl font-bold text-white">{plan.name}</h3>
                                        <div className="mt-3 space-y-1">
                                            <p className="text-3xl font-bold text-white">{plan.price_eur}</p>
                                            <p className="text-2xl font-semibold text-amber-200">{plan.price_fcfa}</p>
                                        </div>
                                        <p className="mt-2 text-xs text-slate-400">{plan.subtitle}</p>
                                        <ul className="mt-5 space-y-3 text-sm text-slate-200">
                                            {plan.points.map((point) => (
                                                <li key={point} className="flex items-center gap-2"><Check className="size-4 text-emerald-300" />{point}</li>
                                            ))}
                                        </ul>
                                        <Link href={getDashboardUrl()} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200">
                                            {t.planCta}
                                            <ArrowRight className="size-4" />
                                        </Link>
                                    </motion.article>
                                ))}
                            </div>
                        </motion.section>

                        <motion.section id="faq" className="scroll-mt-24" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} variants={stagger}>
                            <div className="mb-6 flex items-center gap-2">
                                <CircleHelp className="size-5 text-amber-200" />
                                <h2 className="text-2xl font-semibold text-white sm:text-3xl">{t.faqTitle}</h2>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                                {faqs.map((faq) => (
                                    <motion.article key={faq.question} className="rounded-2xl border border-white/10 bg-slate-900/70 p-5" variants={fadeUp}>
                                        <h3 className="font-semibold text-white">{faq.question}</h3>
                                        <p className="mt-2 text-sm text-slate-300">{faq.answer}</p>
                                    </motion.article>
                                ))}
                            </div>
                        </motion.section>

                        <motion.section id="contact" className="scroll-mt-24 rounded-3xl border border-white/10 bg-gradient-to-r from-amber-300/20 via-orange-300/15 to-cyan-300/20 p-8 text-center backdrop-blur-xl" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }}>
                            <Store className="mx-auto size-7 text-amber-200" />
                            <h2 className="mt-4 text-3xl font-bold text-white">{t.contact.title}</h2>
                            <p className="mx-auto mt-3 max-w-2xl text-slate-200">{t.contact.description}</p>
                            <Link href={getDashboardUrl()} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-amber-200">
                                {t.contact.cta}
                                <ArrowRight className="size-4" />
                            </Link>
                        </motion.section>
                    </main>

                    <motion.footer className="mt-16 border-t border-white/10 pt-8" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                        <div className="flex flex-col items-center justify-between gap-4 text-sm text-slate-400 md:flex-row">
                            <p>© {new Date().getFullYear()} Batix SaaS. {t.footerText}</p>
                            <div className="flex items-center gap-4">
                                <a href="#features" className="transition hover:text-white">{t.nav.features}</a>
                                <a href="#pricing" className="transition hover:text-white">{t.nav.pricing}</a>
                                <a href="#faq" className="transition hover:text-white">{t.nav.faq}</a>
                                <a href="#contact" className="transition hover:text-white">{t.nav.contact}</a>
                            </div>
                        </div>
                    </motion.footer>
                </div>
            </div>
        </>
    );
}
