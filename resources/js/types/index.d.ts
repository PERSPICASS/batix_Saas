export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
}

export interface ShopSettings {
    currency: string;
    currency_symbol: string;
    default_tax_rate: number | null;
    invoice_prefix: string | null;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user?: User | null;
    };
    shopSettings?: ShopSettings | null;
};
