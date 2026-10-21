export interface Permission {
    id: number;
    user_id: number;
    module: string;
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
}

export interface User {
    id: number;
    name: string;
    email: string;
    code_user: string;
    role: 'super_admin' | 'admin_platforme' | 'manager' | 'cashier' | 'caisse' | 'employee';
    email_verified_at?: string;
    permissions?: Permission[];
    shop?: {
        id: number;
        name: string;
        slug: string;
    };
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
        code_user?: string | null;
    };
    shopSettings?: ShopSettings | null;
    csrf_token?: string;
    whatsapp_number?: string;
    /** Base absolue du site, partagée par HandleInertiaRequests — sert aux URL du balisage SEO. */
    appUrl: string;
};
