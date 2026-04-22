import type { ComponentType } from 'react';

export type Locale = 'fr' | 'en';

export type FeatureItem = {
    title: string;
    description: string;
    icon: ComponentType<{ className?: string }>;
};

export type PlanView = {
    name: string;
    price_eur: string;
    price_fcfa: string;
    subtitle: string;
    badge: string;
    points: string[];
    highlighted: boolean;
};

export type HeroSlide = {
    src: string;
    alt: string;
    caption: Record<Locale, { title: string; description: string }>;
};

export interface SubscriptionPlan {
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
    max_products: number;
    max_depots: number;
    features: string[];
    shop_limit_text: string;
    has_unlimited_shops: boolean;
    has_unlimited_users: boolean;
    has_unlimited_products: boolean;
    has_unlimited_depots: boolean;
}
