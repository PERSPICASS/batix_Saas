import { fallbackPlansByLocale } from '@/types/data';
import type { Locale, PlanView, SubscriptionPlan } from '@/types/types';

/**
 * Builds the PlanView[] consumed by PricingSection, from either real DB-backed
 * subscription plans or the static fallback (used when zero paid plans are active).
 * Shared between the Home page teaser and the dedicated /tarifs page so the
 * pricing logic (labels, AI Agent bullet, monthly/yearly figures) only lives once.
 */
export function buildPlanViews(subscriptionPlans: SubscriptionPlan[], locale: Locale): { plans: PlanView[]; hasDynamicPlans: boolean } {
    const filtered = subscriptionPlans.filter((plan) => (plan.slug ?? '').toLowerCase().trim() !== 'free');
    const hasDynamicPlans = filtered.length > 0;

    if (!hasDynamicPlans) {
        return { plans: fallbackPlansByLocale[locale], hasDynamicPlans: false };
    }

    const isFr = locale === 'fr';

    const plans = filtered.map((plan) => {
        const subtitle = isFr ? 'par mois' : 'per month';
        const rawEur = plan.price_eur?.trim() || plan.formatted_price?.trim();
        const badge = isFr
            ? plan.shop_limit_text
            : plan.has_unlimited_shops
              ? 'Unlimited stores'
              : `Up to ${plan.max_shops} store${plan.max_shops > 1 ? 's' : ''}`;
        const shopsLabel = plan.has_unlimited_shops
            ? isFr ? 'Boutiques illimitées' : 'Unlimited stores'
            : isFr ? `${plan.max_shops} boutique${plan.max_shops > 1 ? 's' : ''}` : `${plan.max_shops} store${plan.max_shops > 1 ? 's' : ''}`;
        const usersLabel = plan.has_unlimited_users
            ? isFr ? 'Utilisateurs illimités' : 'Unlimited users'
            : isFr ? `${plan.max_users} utilisateur${plan.max_users > 1 ? 's' : ''}` : `${plan.max_users} user${plan.max_users > 1 ? 's' : ''}`;
        const productsLabel = plan.has_unlimited_products
            ? isFr ? 'Produits illimités' : 'Unlimited products'
            : isFr ? `${plan.max_products} produits par boutique` : `${plan.max_products} products per store`;
        const depotsLabel = plan.max_depots === 0
            ? isFr ? 'Sans dépôt' : 'No depot'
            : plan.has_unlimited_depots
              ? isFr ? 'Dépôts illimités' : 'Unlimited depots'
              : isFr ? `${plan.max_depots} dépôt${plan.max_depots > 1 ? 's' : ''}` : `${plan.max_depots} depot${plan.max_depots > 1 ? 's' : ''}`;
        const baseFeatures = isFr
            ? ['Ventes et caisse', 'Gestion des achats', 'Rapports et statistiques']
            : ['Sales and POS', 'Purchase management', 'Reports and analytics'];
        const extraFeatures = Array.isArray(plan.features)
            ? plan.features.filter((f) => f && f.trim().length > 0).slice(0, 2)
            : [];

        const allFeatures = [shopsLabel, usersLabel, productsLabel, depotsLabel, ...baseFeatures, ...extraFeatures];
        if (['growth', 'pro', 'enterprise'].includes(plan.slug)) {
            allFeatures.push(isFr ? 'Agent IA' : 'AI Agent');
        }

        return {
            name: plan.name,
            price_eur: rawEur || `${plan.price} EUR`,
            price_fcfa: plan.price_fcfa,
            price_eur_yearly: plan.price_eur_yearly,
            price_fcfa_yearly: plan.price_fcfa_yearly,
            price_xaf: plan.price,
            price_xaf_yearly: plan.price * 10,
            subtitle,
            badge,
            points: allFeatures,
            highlighted: plan.slug === 'growth',
        };
    });

    return { plans, hasDynamicPlans: true };
}
