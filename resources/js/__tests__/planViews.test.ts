import { describe, it, expect } from 'vitest';
import { buildPlanViews } from '@/utils/planViews';
import { fallbackPlansByLocale } from '@/types/data';
import type { SubscriptionPlan } from '@/types/types';

function plan(overrides: Partial<SubscriptionPlan> = {}): SubscriptionPlan {
    return {
        id: 1,
        name: 'Growth',
        slug: 'growth',
        description: '',
        price: 10_000,
        formatted_price: '15 EUR',
        price_eur: '15 EUR',
        price_fcfa: '10 000 FCFA',
        max_shops: 2,
        max_users: 5,
        max_products: 500,
        max_depots: 1,
        features: [],
        shop_limit_text: "Jusqu'à 2 boutiques",
        has_unlimited_shops: false,
        has_unlimited_users: false,
        has_unlimited_products: false,
        has_unlimited_depots: false,
        ...overrides,
    };
}

describe('buildPlanViews — plan selection', () => {
    it('falls back to the static plans when no paid plan is active', () => {
        const { plans, hasDynamicPlans } = buildPlanViews([], 'fr');

        expect(hasDynamicPlans).toBe(false);
        expect(plans).toBe(fallbackPlansByLocale.fr);
    });

    it('drops the free plan, whatever its casing or padding', () => {
        const result = buildPlanViews(
            [plan({ slug: 'free' }), plan({ slug: '  FREE  ' }), plan({ slug: 'growth' })],
            'fr',
        );

        expect(result.hasDynamicPlans).toBe(true);
        expect(result.plans).toHaveLength(1);
    });

    it('falls back when the only plans on offer are free ones', () => {
        const { plans, hasDynamicPlans } = buildPlanViews([plan({ slug: 'free' })], 'en');

        expect(hasDynamicPlans).toBe(false);
        expect(plans).toBe(fallbackPlansByLocale.en);
    });
});

describe('buildPlanViews — pricing', () => {
    it('prices a year at ten months, not twelve', () => {
        const { plans } = buildPlanViews([plan({ price: 10_000 })], 'fr');

        expect(plans[0].price_xaf).toBe(10_000);
        expect(plans[0].price_xaf_yearly).toBe(100_000);
    });

    it('prefers price_eur but falls back to the formatted price, then to a raw figure', () => {
        expect(buildPlanViews([plan({ price_eur: '15 EUR' })], 'fr').plans[0].price_eur).toBe('15 EUR');

        expect(
            buildPlanViews([plan({ price_eur: '   ', formatted_price: '20 EUR' })], 'fr').plans[0].price_eur,
        ).toBe('20 EUR');

        expect(
            buildPlanViews([plan({ price_eur: '', formatted_price: '', price: 10_000 })], 'fr').plans[0].price_eur,
        ).toBe('10000 EUR');
    });
});

describe('buildPlanViews — feature bullets', () => {
    it('offers the AI agent only on the paid tiers that include it', () => {
        for (const slug of ['growth', 'pro', 'enterprise']) {
            const { plans } = buildPlanViews([plan({ slug })], 'fr');
            expect(plans[0].points).toContain('Agent IA');
        }

        const { plans } = buildPlanViews([plan({ slug: 'starter' })], 'fr');
        expect(plans[0].points).not.toContain('Agent IA');
    });

    it('highlights the growth plan only', () => {
        expect(buildPlanViews([plan({ slug: 'growth' })], 'fr').plans[0].highlighted).toBe(true);
        expect(buildPlanViews([plan({ slug: 'pro' })], 'fr').plans[0].highlighted).toBe(false);
    });

    it('pluralises limits and spells out the unlimited ones', () => {
        const { plans } = buildPlanViews([plan({ max_shops: 1, max_users: 5 })], 'fr');
        expect(plans[0].points).toContain('1 boutique');
        expect(plans[0].points).toContain('5 utilisateurs');

        const unlimited = buildPlanViews(
            [plan({ has_unlimited_shops: true, has_unlimited_users: true })],
            'en',
        );
        expect(unlimited.plans[0].points).toContain('Unlimited stores');
        expect(unlimited.plans[0].points).toContain('Unlimited users');
    });

    it('says "no depot" when the plan grants none, rather than "0 depots"', () => {
        expect(buildPlanViews([plan({ max_depots: 0 })], 'fr').plans[0].points).toContain('Sans dépôt');
        expect(buildPlanViews([plan({ max_depots: 0 })], 'en').plans[0].points).toContain('No depot');
    });

    it('keeps at most two custom features and ignores blank ones', () => {
        const { plans } = buildPlanViews(
            [plan({ features: ['  ', 'Support 24/7', 'API', 'Onboarding'] })],
            'fr',
        );

        expect(plans[0].points).toContain('Support 24/7');
        expect(plans[0].points).toContain('API');
        expect(plans[0].points).not.toContain('Onboarding');
    });

    it('tolerates a missing features array', () => {
        const { plans } = buildPlanViews([plan({ features: undefined as unknown as string[] })], 'fr');

        expect(plans[0].points.length).toBeGreaterThan(0);
    });
});

describe('buildPlanViews — locale', () => {
    it('labels the cadence in the requested language', () => {
        expect(buildPlanViews([plan()], 'fr').plans[0].subtitle).toBe('par mois');
        expect(buildPlanViews([plan()], 'en').plans[0].subtitle).toBe('per month');
    });

    it('uses the shop_limit_text badge in French but builds an English one', () => {
        expect(buildPlanViews([plan({ shop_limit_text: "Jusqu'à 2 boutiques" })], 'fr').plans[0].badge)
            .toBe("Jusqu'à 2 boutiques");

        expect(buildPlanViews([plan({ max_shops: 2 })], 'en').plans[0].badge).toBe('Up to 2 stores');
        expect(buildPlanViews([plan({ max_shops: 1 })], 'en').plans[0].badge).toBe('Up to 1 store');
        expect(buildPlanViews([plan({ has_unlimited_shops: true })], 'en').plans[0].badge).toBe('Unlimited stores');
    });
});
