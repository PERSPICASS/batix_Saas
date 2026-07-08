import { Link, usePage, router } from '@inertiajs/react';
import {
    PropsWithChildren,
    ReactNode,
    useEffect,
    useRef,
    useState,
} from 'react';
import {
    AlertTriangle,
    BarChart3,
    BookOpen,
    Building2,
    Boxes,
    Box,
    Calendar,
    ChevronDown,
    ChevronRight,
    ClipboardList,
    CreditCard,
    Crown,
    FileText,
    Folder,
    FolderTree,
    HardHat,
    History,
    Key,
    LayoutDashboard,
    Lock,
    LogOut,
    Menu,
    Monitor,
    Moon,
    Receipt,
    ShoppingCart,
    Settings,
    Shield,
    Store,
    Truck,
    User,
    Users,
    Sun,
    TrendingDown,
    TrendingUp,
    Warehouse,
    X,
} from 'lucide-react';
import ToastContainer from '@/Components/ToastContainer';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import AiChatWidget from '@/Components/AiChatWidget';
import { useLocale } from '@/contexts/LocaleContext';

type ThemePreference = 'light' | 'dark' | 'system';
const THEME_STORAGE_KEY = 'batix_theme_preference';

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const page = usePage();
    const { t } = useLocale();
    const user = page.props.auth?.user;
    const routeParams = page.props.routeParams as { code_user: string | null; shop_slug: string | null };
    const shopsFromProps = page.props.shops as Array<{ id: number; name: string; slug: string; is_active: boolean }> || [];
    const activeShopFromProps = page.props.activeShop as { id: number; name: string; slug: string } | null;
    const lowStockCount = (page.props.lowStockCount as number | null) ?? 0;

    const subscription = page.props.subscription as {
        plan_name: string | null;
        has_subscription: boolean;
        expires_at: string | null;
        status: string | null;
        has_ai_assistant: boolean;
    } | null;

    const daysUntilExpiry = subscription?.expires_at
        ? Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;
    const showExpiryBanner = daysUntilExpiry !== null && daysUntilExpiry <= 7 && user?.role === 'super_admin';
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [shopMenuOpen, setShopMenuOpen] = useState(false);
    const isPlatformAdmin = user?.role === 'admin_platforme';
    const isSuperAdmin = user?.role === 'super_admin';
    const [themePreference, setThemePreference] = useState<ThemePreference>('system');
    const [systemPrefersDark, setSystemPrefersDark] = useState(() =>
        typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    );
    const isDark = themePreference === 'dark' || (themePreference === 'system' && systemPrefersDark);
    const [themeMenuOpen, setThemeMenuOpen] = useState(false);
    const themeMenuRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const shopMenuRef = useRef<HTMLDivElement>(null);

    const canViewModule = (module: string): boolean => {
        if (user?.role === 'super_admin') return true;
        const permission = user?.permissions?.find((p: any) => p.module === module);
        return permission ? permission.can_view : false;
    };

    const isCashier = (): boolean => {
        return user?.role === 'cashier' || user?.role === 'caisse';
    };

    const isAdmin = (): boolean => {
        return user?.role === 'super_admin' || user?.role === 'manager';
    };

    const getAccountCode = (): string | null => {
        if (!user) return null;
        if (user.role === 'admin_platforme') return null;
        if (user.role === 'super_admin') return user.code_user;
        const urlParts = (typeof window !== 'undefined' ? window.location.pathname : '').split('/').filter(Boolean);
        const codeFromUrl = urlParts[0] || null;
        return routeParams.code_user || codeFromUrl;
    };

    const accountCode = getAccountCode();

    const buildRoute = (name: string, params: Record<string, any> = {}) => {
        if (user?.role === 'admin_platforme') return route(name, params);
        if (!accountCode) {
            console.warn('Account code not available for route:', name);
            return '#';
        }
        return route(name, { code_user: accountCode, ...params });
    };

    if (!accountCode && user?.role !== 'admin_platforme') {
        return (
            <div className={`flex h-screen items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
                <div className="text-center">
                    <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-300 border-r-transparent"></div>
                    <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>{t.layout.loading}</p>
                </div>
            </div>
        );
    }

    const shops = Array.isArray(shopsFromProps)
        ? shopsFromProps.filter(shop => shop.is_active).map(shop => ({
            id: shop.id.toString(),
            name: shop.name,
            slug: shop.slug,
        }))
        : [];

    const activeShop = activeShopFromProps
        ? { id: activeShopFromProps.id.toString(), name: activeShopFromProps.name, slug: activeShopFromProps.slug }
        : (shops.length > 0 ? shops[0] : null);

    const handleShopChange = (shopId: string) => {
        const [currentPath] = page.url.split('?');
        router.visit(`${currentPath}?shop=${shopId}`, {
            preserveState: false,
            preserveScroll: true,
        });
        setShopMenuOpen(false);
    };

    // Charge la préférence sauvegardée (une seule fois, tous rôles confondus).
    useEffect(() => {
        const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
            setThemePreference(saved);
        }
    }, []);

    // Suit le thème du système en direct tant que la préférence est "system".
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches);
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
    }, [isDark]);

    useEffect(() => {
        window.localStorage.setItem(THEME_STORAGE_KEY, themePreference);
    }, [themePreference]);

    useEffect(() => {
        const onClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
            if (shopMenuRef.current && !shopMenuRef.current.contains(event.target as Node)) {
                setShopMenuOpen(false);
            }
            if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
                setThemeMenuOpen(false);
            }
        };
        window.addEventListener('mousedown', onClickOutside);
        return () => window.removeEventListener('mousedown', onClickOutside);
    }, []);

    const allNavItems = [
        ...(user?.role === 'admin_platforme' ? [
            {
                label: t.nav.platformDashboard,
                href: route('platform.dashboard'),
                active: route().current('platform.dashboard'),
                icon: Crown,
                module: null,
            },
            {
                label: t.nav.accounts,
                href: route('platform.accounts'),
                active: route().current('platform.accounts'),
                icon: Users,
                module: null,
            },
            {
                label: t.nav.shops,
                href: route('platform.shops'),
                active: route().current('platform.shops'),
                icon: Store,
                module: null,
            },
            {
                label: t.nav.plans,
                href: route('platform.subscriptions.index'),
                active: route().current('platform.subscriptions.*'),
                icon: Crown,
                module: null,
            },
            {
                label: t.nav.subscriptions,
                href: route('platform.active-subscriptions'),
                active: route().current('platform.active-subscriptions*'),
                icon: Calendar,
                module: null,
            },
            {
                label: t.nav.settings,
                href: route('platform.settings'),
                active: route().current('platform.settings*'),
                icon: Settings,
                module: null,
            },
            {
                label: t.nav.mrr,
                href: route('platform.mrr'),
                active: route().current('platform.mrr*'),
                icon: TrendingUp,
                module: null,
            },
            {
                label: t.nav.charges,
                href: route('platform.fixed-costs.index'),
                active: route().current('platform.fixed-costs.*'),
                icon: CreditCard,
                module: null,
            },
            {
                label: t.nav.blog,
                href: route('platform.blog.index'),
                active: route().current('platform.blog.*'),
                icon: BookOpen,
                module: null,
            },
        ] : [
            {
                label: t.nav.dashboard,
                href: buildRoute('dashboard'),
                active: route().current('dashboard'),
                icon: LayoutDashboard,
                module: null,
            },
            {
                label: t.nav.shops,
                href: buildRoute('shops.index'),
                active: route().current('shops.*'),
                icon: Store,
                module: 'shops',
            },
            {
                label: t.nav.products,
                href: buildRoute('products.index'),
                active: route().current('products.*'),
                icon: Box,
                module: 'products',
                badge: lowStockCount > 0 ? lowStockCount : null,
            },
            {
                label: t.nav.categories,
                href: buildRoute('categories.index'),
                active: route().current('categories.*'),
                icon: Folder,
                module: 'categories',
            },
            {
                label: t.nav.subcategories,
                href: buildRoute('subcategories.index'),
                active: route().current('subcategories.*'),
                icon: FolderTree,
                module: 'categories',
            },
            {
                label: t.nav.stocks,
                href: buildRoute('stocks.index'),
                active: route().current('stocks.*'),
                icon: Boxes,
                module: 'stocks',
            },
            {
                label: t.nav.inventory,
                href: buildRoute('inventory.index'),
                active: route().current('inventory.*'),
                icon: ClipboardList,
                module: 'inventory',
            },
            {
                label: t.nav.purchases,
                href: buildRoute('purchases.index'),
                active: route().current('purchases.*'),
                icon: ShoppingCart,
                module: 'purchases',
            },
            {
                label: t.nav.expenses,
                href: buildRoute('expenses.index'),
                active: route().current('expenses.*'),
                icon: TrendingDown,
                module: 'expenses',
            },
            {
                label: t.nav.sales,
                href: buildRoute('sales.index'),
                active: route().current('sales.*') && !route().current('sales.credits*'),
                icon: ShoppingCart,
                module: 'sales',
            },
            {
                label: t.nav.credits,
                href: buildRoute('sales.credits'),
                active: route().current('sales.credits*'),
                icon: CreditCard,
                module: 'credits',
            },
            ...(isCashier() ? [] : [{
                label: t.nav.returnedInventory,
                href: buildRoute('returned-inventory.index'),
                active: route().current('returned-inventory.*'),
                icon: ClipboardList,
                module: 'returned_inventory',
            }]),
            {
                label: t.nav.suppliers,
                href: buildRoute('suppliers.index'),
                active: route().current('suppliers.*'),
                icon: Truck,
                module: 'suppliers',
            },
            {
                label: t.nav.users,
                href: buildRoute('users.index'),
                active: route().current('users.*'),
                icon: Users,
                module: 'users',
            },
            ...(isAdmin() ? [{
                label: t.nav.permissions,
                href: buildRoute('permissions.index'),
                active: route().current('permissions.*'),
                icon: Shield,
                module: null,
            }] : []),
            {
                label: t.nav.customers,
                href: buildRoute('customers.index'),
                active: route().current('customers.*'),
                icon: User,
                module: 'customers',
            },
            {
                label: t.nav.quotes,
                href: buildRoute('quotes.index'),
                active: route().current('quotes.*'),
                icon: Receipt,
                module: 'quotes',
            },
            ...(isCashier() ? [] : [{
                label: t.nav.preorders,
                href: buildRoute('preorders.index'),
                active: route().current('preorders.*'),
                icon: Calendar,
                module: 'preorders',
            }]),
            ...(isCashier() ? [] : [{
                label: t.nav.recurringInvoices,
                href: buildRoute('recurring-invoices.index'),
                active: route().current('recurring-invoices.*'),
                icon: Receipt,
                module: 'recurring_invoices',
            }]),
            ...(isCashier() ? [] : [{
                label: t.nav.invoices,
                href: buildRoute('invoices.index'),
                active: route().current('invoices.*'),
                icon: FileText,
                module: 'invoices',
            }]),
            {
                label: t.nav.analytics,
                href: buildRoute('analytics.index'),
                active: route().current('analytics.*'),
                icon: BarChart3,
                module: 'analytics',
            },
            {
                label: t.nav.history,
                href: buildRoute('activity-logs.index'),
                active: route().current('activity-logs.*'),
                icon: History,
                module: 'activity_logs',
            },
            {
                label: t.nav.settings,
                href: buildRoute('settings.index'),
                active: route().current('settings.*'),
                icon: Settings,
                module: 'settings',
            },
            ...(isSuperAdmin ? [{
                label: t.apiTokens.title,
                href: buildRoute('api-tokens.index'),
                active: route().current('api-tokens.*'),
                icon: Key,
                module: null,
            }] : []),
            ...(user && (user as any).role !== 'admin_platforme'
                ? [{
                label: t.nav.profile,
                href: buildRoute('profile.edit'),
                active: route().current('profile.*'),
                icon: Settings,
                module: null,
            }]
            : []),
            ...(isCashier() ? [] : [{
                label: t.nav.billing,
                href: buildRoute('billing.index'),
                active: route().current('billing.*'),
                icon: Receipt,
                module: null,
            }]),
        ]),
    ];

    const navItems = allNavItems.filter(item => {
        if (!item.module) return true;
        return canViewModule(item.module);
    });

    return (
        <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-28 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl dark:bg-amber-500/15" />
                <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-cyan-500/5 blur-3xl dark:bg-cyan-500/10" />
            </div>

            {mobileSidebarOpen && (
                <button
                    type="button"
                    onClick={() => setMobileSidebarOpen(false)}
                    className="fixed inset-0 z-40 bg-slate-900/50 dark:bg-slate-950/70 lg:hidden"
                    aria-label={t.layout.closeMenu}
                />
            )}

            <aside
                className={`print:hidden fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-200 bg-white/95 p-5 backdrop-blur-xl transition-transform duration-300 dark:border-white/10 dark:bg-slate-900/95 lg:translate-x-0 ${
                    mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex h-full flex-col">
                    <div className="mb-8 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="rounded-lg bg-amber-300 p-2 text-slate-950">
                                <HardHat className="size-5" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-600 dark:text-amber-200">
                                    BATIX PRO
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {t.layout.brandSubtitle}
                                </p>
                            </div>
                        </Link>
                        <button
                            type="button"
                            onClick={() => setMobileSidebarOpen(false)}
                            className="rounded-lg p-2 text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10 lg:hidden"
                        >
                            <X className="size-5" />
                        </button>
                    </div>

                    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
                        <nav className="space-y-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
                                        item.active
                                            ? 'bg-amber-300 text-slate-950'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
                                    }`}
                                    onClick={() => setMobileSidebarOpen(false)}
                                >
                                    <span className="flex items-center gap-3">
                                        <item.icon className="size-4" />
                                        {item.label}
                                    </span>
                                    {(item as any).badge ? (
                                        <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                            {(item as any).badge}
                                        </span>
                                    ) : (
                                        <ChevronRight className="size-4 opacity-60" />
                                    )}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    <div className="space-y-3 pt-4">
                        {user?.role === 'super_admin' && (
                        <div className="rounded-xl border border-amber-300/40 bg-gradient-to-br from-amber-200/70 via-orange-200/40 to-transparent p-4 dark:border-amber-200/25 dark:from-amber-300/20 dark:via-orange-300/10">
                            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-100">
                                <Crown className="size-4" />
                                <p className="text-xs font-semibold uppercase tracking-wider">
                                    {t.layout.subscription.title}
                                </p>
                            </div>
                            <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                                {subscription?.plan_name ?? t.layout.subscription.noPlan}
                            </p>
                            <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">
                                {subscription?.has_subscription
                                    ? t.layout.subscription.active
                                    : t.layout.subscription.noActive}
                            </p>
                            <Link
                                href="/plans"
                                className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-amber-300 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
                            >
                                {t.layout.subscription.upgrade}
                            </Link>
                        </div>
                        )}
                    </div>
                </div>
            </aside>

            <div className="lg:pl-72 print:pl-0">
                <header className="print:hidden sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setMobileSidebarOpen(true)}
                                className="rounded-lg border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10 lg:hidden"
                            >
                                <Menu className="size-5" />
                            </button>
                            <div>
                                {header ?? (
                                    <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                                        {t.nav.dashboard}
                                    </h1>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <LanguageSwitcher />

                            <div className="relative" ref={themeMenuRef}>
                                <button
                                    type="button"
                                    onClick={() => setThemeMenuOpen((prev) => !prev)}
                                    aria-label={t.layout.theme.label}
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 transition hover:bg-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                                >
                                    {themePreference === 'system' ? (
                                        <Monitor className="size-4 text-slate-600 dark:text-slate-300" />
                                    ) : isDark ? (
                                        <Moon className="size-4 text-slate-700 dark:text-slate-200" />
                                    ) : (
                                        <Sun className="size-4 text-amber-500" />
                                    )}
                                    <span className="hidden sm:inline">
                                        {themePreference === 'system' ? t.layout.theme.system : themePreference === 'dark' ? t.layout.theme.dark : t.layout.theme.light}
                                    </span> 
                                    <ChevronDown className="size-3.5 text-slate-500 dark:text-slate-400" />
                                </button> 

                                {themeMenuOpen && (
                                    <div className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-slate-200 bg-white/95 p-1 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95">
                                        {(
                                            [
                                                { value: 'light', label: t.layout.theme.light, icon: Sun },
                                                { value: 'dark', label: t.layout.theme.dark, icon: Moon },
                                                { value: 'system', label: t.layout.theme.system, icon: Monitor },
                                            ] as { value: ThemePreference; label: string; icon: typeof Sun }[]
                                        ).map((option) => (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => {
                                                    setThemePreference(option.value);
                                                    setThemeMenuOpen(false);
                                                }}
                                                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                                                    themePreference === option.value
                                                        ? 'bg-amber-300/10 text-amber-600 dark:text-amber-300'
                                                        : 'text-slate-800 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-white/10'
                                                }`}
                                            >
                                                <option.icon className="size-4" />
                                                <span>{option.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {lowStockCount > 0 && user?.role !== 'admin_platforme' && (
                                <Link
                                    href={buildRoute('products.index') + '?status=low_stock'}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/20"
                                >
                                    <AlertTriangle className="size-3.5" />
                                    <span className="hidden sm:inline">{t.layout.lowStock(lowStockCount)}</span>
                                    <span className="sm:hidden">{lowStockCount}</span>
                                </Link>
                            )}

                            {user?.role === 'super_admin' && (
                                <Link
                                    href={buildRoute('billing.index')}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300/40 bg-amber-300/10 px-3 py-2 text-xs font-semibold text-amber-600 transition hover:bg-amber-300/20 dark:border-amber-300/30 dark:text-amber-300"
                                >
                                    <Crown className="size-3.5" />
                                    <span className="hidden sm:inline">
                                        {subscription?.plan_name ?? t.layout.subscription.noPlan}
                                    </span>
                                </Link>
                            )}

                            {user?.role !== 'admin_platforme' && isSuperAdmin && (
                                <Link
                                    href={buildRoute('depots.index')}
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 transition hover:bg-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                                >
                                    <Warehouse className="size-4 text-amber-400" />
                                    <span className="hidden sm:inline">{t.layout.depot}</span>
                                </Link>
                            )}

                            {user?.role !== 'admin_platforme' && (
                            <div className="relative" ref={shopMenuRef}>
                                <button
                                    type="button"
                                    onClick={() => isSuperAdmin && setShopMenuOpen((prev) => !prev)}
                                    className={`relative inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition ${
                                        isSuperAdmin && shops.length > 0
                                            ? 'border-slate-300 bg-white text-slate-800 hover:bg-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 cursor-pointer'
                                            : 'border-slate-400 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-500 cursor-not-allowed'
                                    }`}
                                    disabled={shops.length === 0 || !isSuperAdmin}
                                >
                                    <Building2 className="size-4 text-amber-200" />
                                    <span className="hidden sm:block">
                                        <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                                            {t.layout.activeShop}
                                        </span>
                                        <span className="block font-semibold text-slate-900 dark:text-white">
                                            {shops.length > 0 ? activeShop?.name : t.layout.noShop}
                                        </span>
                                    </span>
                                    {shops.length > 0 && (
                                        <ChevronDown className="size-4 text-slate-500 dark:text-slate-300" />
                                    )}
                                </button>

                                {shopMenuOpen && shops.length > 0 && isSuperAdmin && (
                                    <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95">
                                        {shops.map((shop) => (
                                            <button
                                                key={shop.id}
                                                type="button"
                                                onClick={() => handleShopChange(shop.id)}
                                                className={`w-full text-left block rounded-lg px-3 py-2 text-sm transition ${
                                                    shop.id === activeShop?.id
                                                        ? 'bg-amber-300 text-slate-950'
                                                        : 'text-slate-800 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-white/10'
                                                }`}
                                            >
                                                {shop.name}
                                            </button>
                                        ))}
                                        <hr className="my-1 border-slate-300 dark:border-white/10" />
                                        {isSuperAdmin ? (
                                            <Link
                                                href={buildRoute('shops.index')}
                                                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-800 transition hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-white/10"
                                                onClick={() => setShopMenuOpen(false)}
                                            >
                                                <Store className="size-4" />
                                                {t.layout.manageShops}
                                            </Link>
                                        ) : (
                                            <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 dark:text-slate-600 cursor-not-allowed">
                                                <Store className="size-4" />
                                                {t.layout.manageShops}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            )}

                            <div className="relative" ref={userMenuRef}>
                                <button
                                    type="button"
                                    onClick={() => setUserMenuOpen((prev) => !prev)}
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-200 px-3 py-2 text-left text-xs text-slate-800 transition hover:bg-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                                >
                                    <span>
                                        <span className="block font-semibold text-amber-600 dark:text-amber-200">
                                            {user?.name ?? 'Visiteur'}
                                        </span>
                                        <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                                            {user?.email ?? 'Mode public'}
                                        </span>
                                    </span>
                                    <ChevronDown className="size-4 text-slate-500 dark:text-slate-300" />
                                </button>

                                {userMenuOpen && (
                                    <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-slate-200 bg-white/95 p-1 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95">
                                        {user ? (
                                            <>
                                                {user.role !== 'admin_platforme' && (
                                                    <>
                                                        <Link
                                                            href={buildRoute('profile.edit')}
                                                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-800 transition hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-white/10"
                                                            onClick={() => setUserMenuOpen(false)}
                                                        >
                                                            <User className="size-4" />
                                                            <span>{t.layout.userMenu.profile}</span>
                                                        </Link>
                                                        {canViewModule('settings') && (
                                                            <Link
                                                                href={buildRoute('settings.index')}
                                                                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-800 transition hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-white/10"
                                                                onClick={() => setUserMenuOpen(false)}
                                                            >
                                                                <Settings className="size-4" />
                                                                <span>{t.layout.userMenu.settings}</span>
                                                            </Link>
                                                        )}
                                                        <Link
                                                            href={buildRoute('two-factor.index')}
                                                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-800 transition hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-white/10"
                                                            onClick={() => setUserMenuOpen(false)}
                                                        >
                                                            <Shield className="size-4" />
                                                            <span>Authentification 2FA</span>
                                                        </Link>
                                                        <div className="my-1 border-t border-slate-300 dark:border-white/10"></div>
                                                    </>
                                                )}
                                                <Link
                                                    href={route('lock-screen.lock')}
                                                    method="post"
                                                    as="button"
                                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-amber-300 transition hover:bg-amber-300/10"
                                                    onClick={() => setUserMenuOpen(false)}
                                                >
                                                    <Lock className="size-4" />
                                                    <span>{t.layout.userMenu.lock}</span>
                                                </Link>
                                                <Link
                                                    href={route('logout')}
                                                    method="post"
                                                    as="button"
                                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-200 transition hover:bg-rose-300/10"
                                                    onClick={() => setUserMenuOpen(false)}
                                                >
                                                    <LogOut className="size-4" />
                                                    <span>{t.layout.userMenu.logout}</span>
                                                </Link>
                                            </>
                                        ) : (
                                            <Link
                                                href={route('login')}
                                                className="block rounded-lg px-3 py-2 text-sm text-slate-800 transition hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-white/10"
                                                onClick={() => setUserMenuOpen(false)}
                                            >
                                                {t.layout.userMenu.login}
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {showExpiryBanner && (
                        <div className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm sm:px-6 lg:px-8 ${
                            daysUntilExpiry! <= 1
                                ? 'bg-rose-500/20 border-t border-rose-500/30 text-rose-300'
                                : 'bg-amber-400/15 border-t border-amber-400/25 text-amber-300'
                        }`}>
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="size-4 shrink-0" />
                                <span className="font-medium">
                                    {daysUntilExpiry! <= 0
                                        ? t.layout.expiryBanner.expired
                                        : daysUntilExpiry === 1
                                        ? t.layout.expiryBanner.tomorrow
                                        : t.layout.expiryBanner.days(daysUntilExpiry!)}
                                </span>
                            </div>
                            <Link
                                href={buildRoute('billing.index')}
                                className={`shrink-0 rounded-lg px-3 py-1 text-xs font-semibold transition ${
                                    daysUntilExpiry! <= 1
                                        ? 'bg-rose-500/30 hover:bg-rose-500/50 text-rose-200'
                                        : 'bg-amber-400/20 hover:bg-amber-400/35 text-amber-200'
                                }`}
                            >
                                {t.layout.expiryBanner.renew}
                            </Link>
                        </div>
                    )}
                </header>

                <main className="px-4 py-6 print:p-0 sm:px-6 lg:px-8">{children}</main>
            </div>

            <div className="print:hidden">
                <ToastContainer />
                {!isPlatformAdmin && (
                    <AiChatWidget
                        codeUser={routeParams.code_user ?? ''}
                        hasAccess={subscription?.has_ai_assistant ?? false}
                    />
                )}
            </div>
        </div>
    );
}
