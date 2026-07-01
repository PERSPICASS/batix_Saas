import type { Locale } from '@/types/types';
import { common } from './common';
import { nav } from './nav';
import { layout } from './layout';
import { dashboard } from './dashboard';
import { gettingStarted } from './gettingStarted';
import { freeTrialBanner } from './freeTrialBanner';
import { subscriptionBanner } from './subscriptionBanner';
import { customers } from './customers';
import { products } from './products';
import { sales } from './sales';
import { invoices } from './invoices';
import { quotes } from './quotes';
import { purchases } from './purchases';
import { expenses } from './expenses';
import { suppliers } from './suppliers';
import { users } from './users';
import { stocks } from './stocks';
import { inventory } from './inventory';
import { depots } from './depots';
import { categories } from './categories';
import { shops } from './shops';
import { settings } from './settings';
import { analytics } from './analytics';
import { billing } from './billing';
import { activityLogs } from './activityLogs';
import { permissions } from './permissions';
import { profile } from './profile';
import { preorders } from './preorders';
import { returnedInventory } from './returnedInventory';
import { platformAdmin } from './platformAdmin';
import { recurringInvoices } from './recurringInvoices';
import { blog } from './blog';
import { subcategories } from './subcategories';
import { locations } from './locations';
import { paymentMethods } from './paymentMethods';
import { taxRates } from './taxRates';

export const translations = {
    fr: {
        common: common.fr,
        nav: nav.fr,
        layout: layout.fr,
        dashboard: dashboard.fr,
        gettingStarted: gettingStarted.fr,
        freeTrialBanner: freeTrialBanner.fr,
        subscriptionBanner: subscriptionBanner.fr,
        customers: customers.fr,
        products: products.fr,
        sales: sales.fr,
        invoices: invoices.fr,
        quotes: quotes.fr,
        purchases: purchases.fr,
        expenses: expenses.fr,
        suppliers: suppliers.fr,
        users: users.fr,
        stocks: stocks.fr,
        inventory: inventory.fr,
        depots: depots.fr,
        categories: categories.fr,
        shops: shops.fr,
        settings: settings.fr,
        analytics: analytics.fr,
        billing: billing.fr,
        activityLogs: activityLogs.fr,
        permissions: permissions.fr,
        profile: profile.fr,
        preorders: preorders.fr,
        returnedInventory: returnedInventory.fr,
        platformAdmin: platformAdmin.fr,
        recurringInvoices: recurringInvoices.fr,
        blog: blog.fr,
        subcategories: subcategories.fr,
        locations: locations.fr,
        paymentMethods: paymentMethods.fr,
        taxRates: taxRates.fr,
    },
    en: {
        common: common.en,
        nav: nav.en,
        layout: layout.en,
        dashboard: dashboard.en,
        gettingStarted: gettingStarted.en,
        freeTrialBanner: freeTrialBanner.en,
        subscriptionBanner: subscriptionBanner.en,
        customers: customers.en,
        products: products.en,
        sales: sales.en,
        invoices: invoices.en,
        quotes: quotes.en,
        purchases: purchases.en,
        expenses: expenses.en,
        suppliers: suppliers.en,
        users: users.en,
        stocks: stocks.en,
        inventory: inventory.en,
        depots: depots.en,
        categories: categories.en,
        shops: shops.en,
        settings: settings.en,
        analytics: analytics.en,
        billing: billing.en,
        activityLogs: activityLogs.en,
        permissions: permissions.en,
        profile: profile.en,
        preorders: preorders.en,
        returnedInventory: returnedInventory.en,
        platformAdmin: platformAdmin.en,
        recurringInvoices: recurringInvoices.en,
        blog: blog.en,
        subcategories: subcategories.en,
        locations: locations.en,
        paymentMethods: paymentMethods.en,
        taxRates: taxRates.en,
    },
} as const;

export type Translations = typeof translations['fr'] | typeof translations['en'];

export type { Locale };
