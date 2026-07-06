export type Locale = 'fr' | 'en';

export type PlanView = {
    name: string;
    price_eur: string;
    price_fcfa?: string;
    price_eur_yearly?: string;
    price_fcfa_yearly?: string;
    /** Raw monthly/yearly price in FCFA (XAF) — the true base currency — used to convert to any displayed currency. Absent for custom-quote plans. */
    price_xaf?: number;
    price_xaf_yearly?: number;
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

export type Testimonial = {
    quote: string;
    name: string;
    role: string;
    location: string;
    /** True until replaced with a real customer quote — never rendered on-page, just a code marker. */
    isPlaceholder?: boolean;
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
    price_eur_yearly?: string;
    price_fcfa_yearly?: string;
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
