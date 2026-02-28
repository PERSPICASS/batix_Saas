import { Link, usePage, router } from '@inertiajs/react';
import {
    PropsWithChildren,
    ReactNode,
    useEffect,
    useRef,
    useState,
} from 'react';
import {
    BarChart3,
    Building2,
    Boxes,
    Box,
    Calendar,
    ChevronDown,
    ChevronRight,
    ClipboardList,
    Crown,
    FileText,
    Folder,
    FolderTree,
    HardHat,
    History,
    LayoutDashboard,
    Lock,
    LogOut,
    Menu,
    Moon,
    ShoppingCart,
    Settings,
    Store,
    Truck,
    User,
    Users,
    Sun,
    X,
} from 'lucide-react';
import ToastContainer from '@/Components/ToastContainer';

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const page = usePage();
    const user = page.props.auth?.user;
    const routeParams = page.props.routeParams as { code_user: string | null; shop_slug: string | null };
    const shopsFromProps = page.props.shops as Array<{ id: number; name: string; slug: string; is_active: boolean }> || [];
    const activeShopFromProps = page.props.activeShop as { id: number; name: string; slug: string } | null;
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [shopMenuOpen, setShopMenuOpen] = useState(false);
    // Force dark mode
    const [theme, setTheme] = useState<'dark'>('dark');
    const userMenuRef = useRef<HTMLDivElement>(null);
    const shopMenuRef = useRef<HTMLDivElement>(null);

    // Fonction pour vérifier si l'utilisateur peut voir un module
    const canViewModule = (module: string): boolean => {
        // Super admin peut tout voir
        if (user?.role === 'super_admin') {
            return true;
        }

        // Vérifier les permissions de l'utilisateur
        const permission = user?.permissions?.find((p: any) => p.module === module);
        return permission ? permission.can_view : false;
    };

    // Fonction pour vérifier si l'utilisateur est un caissier
    const isCashier = (): boolean => {
        return user?.role === 'cashier' || user?.role === 'caisse';
    };

    // Fonction pour vérifier si l'utilisateur est admin (super_admin ou manager)
    const isAdmin = (): boolean => {
        return user?.role === 'super_admin' || user?.role === 'manager';
    };

    // Déterminer le code_user du compte (du propriétaire)
    const getAccountCode = (): string | null => {
        if (!user) return null;
        
        // Si l'utilisateur est admin_platforme, pas besoin de code_user
        if (user.role === 'admin_platforme') {
            return null;
        }
        
        // Si l'utilisateur est super_admin, c'est son propre code
        if (user.role === 'super_admin') {
            return user.code_user;
        }
        
        // Pour les autres rôles, extraire le code_user de l'URL ou des routeParams
        // L'URL devrait être /{code_user}/quelquechose
        const urlParts = window.location.pathname.split('/').filter(Boolean);
        const codeFromUrl = urlParts[0] || null;
        
        return routeParams.code_user || codeFromUrl;
    };
    
    const accountCode = getAccountCode();

    // Helper pour générer les routes avec le code_user du compte
    const buildRoute = (name: string, params: Record<string, any> = {}) => {
        // Pour admin_platforme, utiliser les routes sans code_user
        if (user?.role === 'admin_platforme') {
            return route(name, params);
        }
        
        if (!accountCode) {
            console.warn('Account code not available for route:', name);
            return '#';
        }
        
        return route(name, {
            code_user: accountCode,
            ...params
        });
    };

    // Si le code_user n'est pas disponible et que ce n'est pas un admin_platforme, afficher un loader
    if (!accountCode && user?.role !== 'admin_platforme') {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-950">
                <div className="text-center">
                    <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-300 border-r-transparent"></div>
                    <p className="text-slate-400">Chargement...</p>
                </div>
            </div>
        );
    }

    // Pour admin_platforme, pas de shops dans le contexte
    const shops = Array.isArray(shopsFromProps) 
        ? shopsFromProps.filter(shop => shop.is_active).map(shop => ({
            id: shop.id.toString(),
            name: shop.name,
            slug: shop.slug,
        }))
        : [];
    
    // Utiliser la boutique active depuis la session (partagée via Inertia)
    const activeShop = activeShopFromProps 
        ? { id: activeShopFromProps.id.toString(), name: activeShopFromProps.name, slug: activeShopFromProps.slug }
        : (shops.length > 0 ? shops[0] : null);


    const handleShopChange = (shopId: string) => {
        // Changer la boutique en visitant l'URL actuelle avec le paramètre shop
        const [currentPath] = page.url.split('?');
        router.visit(`${currentPath}?shop=${shopId}`, {
            preserveState: false, // Recharger pour mettre à jour toutes les données
            preserveScroll: true,
        });
        setShopMenuOpen(false);
    };

    // Always set dark mode
    useEffect(() => {
        document.documentElement.classList.add('dark');
        window.localStorage.setItem('theme', 'dark');
    }, []);

    useEffect(() => {
        const onClickOutside = (event: MouseEvent) => {
            if (
                userMenuRef.current &&
                !userMenuRef.current.contains(event.target as Node)
            ) {
                setUserMenuOpen(false);
            }
            if (
                shopMenuRef.current &&
                !shopMenuRef.current.contains(event.target as Node)
            ) {
                setShopMenuOpen(false);
            }
        };

        window.addEventListener('mousedown', onClickOutside);
        return () => window.removeEventListener('mousedown', onClickOutside);
    }, []);

    const allNavItems = [
        // Admin plateforme (uniquement pour admin_platforme)
        ...(user?.role === 'admin_platforme' ? [
            {
                label: 'Dashboard Plateforme',
                href: route('platform.dashboard'),
                active: route().current('platform.dashboard'),
                icon: Crown,
                module: null,
            },
            {
                label: 'Comptes',
                href: route('platform.accounts'),
                active: route().current('platform.accounts'),
                icon: Users,
                module: null,
            },
            {
                label: 'Boutiques',
                href: route('platform.shops'),
                active: route().current('platform.shops'),
                icon: Store,
                module: null,
            },
            {
                label: 'Plans',
                href: route('platform.subscriptions.index'),
                active: route().current('platform.subscriptions.*'),
                icon: Crown,
                module: null,
            },
            {
                label: 'Abonnements',
                href: route('platform.active-subscriptions'),
                active: route().current('platform.active-subscriptions*'),
                icon: Calendar,
                module: null,
            },
        ] : [
            // Menus normaux pour les autres utilisateurs
            {
                label: 'Dashboard',
                href: buildRoute('dashboard'),
                active: route().current('dashboard'),
                icon: LayoutDashboard,
                module: 'dashboard', // Restreint aux admins
            },
            {
                label: 'Boutiques',
                href: buildRoute('shops.index'),
                active: route().current('shops.*'),
                icon: Store,
                module: 'shops',
            },
            {
                label: 'Produits',
                href: buildRoute('products.index'),
                active: route().current('products.*'),
                icon: Box,
                module: 'products',
            },
            {
                label: 'Categories',
                href: buildRoute('categories.index'),
                active: route().current('categories.*'),
                icon: Folder,
                module: 'categories',
            },
            {
                label: 'Sous categorie',
                href: buildRoute('subcategories.index'),
                active: route().current('subcategories.*'),
                icon: FolderTree,
                module: 'categories',
            },
            {
                label: 'Stocks',
                href: buildRoute('stocks.index'),
                active: route().current('stocks.*'),
                icon: Boxes,
                module: 'stocks',
            },
            {
                label: 'Inventaire',
                href: buildRoute('inventory.index'),
                active: route().current('inventory.*'),
                icon: ClipboardList,
                module: 'inventory',
            },
            {
                label: 'Ventes',
                href: buildRoute('sales.index'),
                active: route().current('sales.*'),
                icon: ShoppingCart,
                module: 'sales',
            },
            {
                label: 'Fournisseurs',
                href: buildRoute('suppliers.index'),
                active: route().current('suppliers.*'),
                icon: Truck,
                module: 'suppliers',
            },
            {
                label: 'Utilisateurs',
                href: buildRoute('users.index'),
                active: route().current('users.*'),
                icon: Users,
                module: 'users',
            },
            {
                label: 'Client',
                href: buildRoute('customers.index'),
                active: route().current('customers.*'),
                icon: User,
                module: 'customers',
            },
            {
                label: 'Factures',
                href: buildRoute('invoices.index'),
                active: route().current('invoices.*'),
                icon: FileText,
                module: 'invoices',
            },
            {
                label: 'Analytics',
                href: buildRoute('analytics.index'),
                active: route().current('analytics.*'),
                icon: BarChart3,
                module: 'analytics', // Restreint aux admins
            },
            // Logs d'activité pour super_admin uniquement
            ...((user as any)?.role === 'super_admin' ? [{
                label: 'Historique',
                href: buildRoute('activity-logs.index'),
                active: route().current('activity-logs.*'),
                icon: History,
                module: null, // Visible seulement pour super_admin
            }] : []),
            ...(user && (user as any).role !== 'admin_platforme'
                ? [{
                label: 'Profil',
                href: buildRoute('profile.edit'),
                active: route().current('profile.*'),
                icon: Settings,
                module: null, // Toujours visible
            }]
                : []),
        ]),
    ];

    // Filtrer les menus selon les permissions
    const navItems = allNavItems.filter(item => {
        if (!item.module) return true; // Toujours afficher si pas de module
        return canViewModule(item.module);
    });

    return (
        <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-28 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl dark:bg-amber-500/15" />
                <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-cyan-500/5 blur-3xl dark:bg-cyan-500/10" />
            </div>

            {mobileSidebarOpen && (
                <button
                    type="button"
                    onClick={() => setMobileSidebarOpen(false)}
                    className="fixed inset-0 z-40 bg-slate-900/50 dark:bg-slate-950/70 lg:hidden"
                    aria-label="Fermer le menu"
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-300 bg-slate-100/95 p-5 backdrop-blur-xl transition-transform duration-300 dark:border-white/10 dark:bg-slate-900/95 lg:translate-x-0 ${
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
                                    Batix SaaS
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Gestion moderne de quincaillerie
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
                                    <ChevronRight className="size-4 opacity-60" />
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
                                    Abonnement
                                </p>
                            </div>
                            <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                                {user ? 'Growth' : 'Starter'}
                            </p>
                            <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">
                                {user
                                    ? '5 boutiques incluses'
                                    : 'Connectez-vous pour voir votre plan'}
                            </p>
                            <Link
                                href="/plans"
                                className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-amber-300 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
                            >
                                Upgrade
                            </Link>
                        </div>
                        )}

                        
                    </div>
                </div>
            </aside>

            <div className="lg:pl-72">
                <header className="sticky top-0 z-30 border-b border-slate-300 bg-slate-100/90 px-4 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80 sm:px-6 lg:px-8">
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
                                        Dashboard
                                    </h1>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Dark mode is always enabled */}
                            
                            {/* Sélecteur de boutique - masqué pour admin_platforme */}
                            {user?.role !== 'admin_platforme' && (
                            <div className="relative" ref={shopMenuRef}>
                                <button
                                    type="button"
                                    onClick={() => setShopMenuOpen((prev) => !prev)}
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-200 px-3 py-2 text-left text-xs text-slate-800 transition hover:bg-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                                    disabled={shops.length === 0}
                                >
                                    <Building2 className="size-4 text-amber-200" />
                                    <span className="hidden sm:block">
                                        <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                                            Boutique active
                                        </span>
                                        <span className="block font-semibold text-slate-900 dark:text-white">
                                            {shops.length > 0 ? activeShop?.name : 'Aucune boutique'}
                                        </span>
                                    </span>
                                    {shops.length > 0 && (
                                        <ChevronDown className="size-4 text-slate-500 dark:text-slate-300" />
                                    )}
                                </button>

                                {shopMenuOpen && shops.length > 0 && (
                                    <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-slate-300 bg-slate-100/95 p-1 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95">
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
                                        <Link
                                            href={buildRoute('shops.index')}
                                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-800 transition hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-white/10"
                                            onClick={() => setShopMenuOpen(false)}
                                        >
                                            <Store className="size-4" />
                                            Gérer mes boutiques
                                        </Link>
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
                                    <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-slate-300 bg-slate-100/95 p-1 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95">
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
                                                            <span>Profil</span>
                                                        </Link>
                                                        <Link
                                                            href={buildRoute('settings.index')}
                                                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-800 transition hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-white/10"
                                                            onClick={() => setUserMenuOpen(false)}
                                                        >
                                                            <Settings className="size-4" />
                                                            <span>Parametres</span>
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
                                                    <span>Verrouiller</span>
                                                </Link>
                                                <Link
                                                    href={route('logout')}
                                                    method="post"
                                                    as="button"
                                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-200 transition hover:bg-rose-300/10"
                                                    onClick={() => setUserMenuOpen(false)}
                                                >
                                                    <LogOut className="size-4" />
                                                    <span>Deconnexion</span>
                                                </Link>
                                            </>
                                        ) : (
                                            <Link
                                                href={route('login')}
                                                className="block rounded-lg px-3 py-2 text-sm text-slate-800 transition hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-white/10"
                                                onClick={() => setUserMenuOpen(false)}
                                            >
                                                Connexion
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
            </div>

            {/* Toast Container */}
            <ToastContainer />
        </div>
    );
}
