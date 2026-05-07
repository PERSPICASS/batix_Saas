import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { a as usePage, L as Link_default, r as router3 } from "../ssr.js";
import { useState, useEffect, useRef } from "react";
import { X, Info, AlertCircle, XCircle, CheckCircle, Crown, Users, Store, Calendar, Settings, TrendingUp, BookOpen, LayoutDashboard, Box, Folder, FolderTree, Boxes, ClipboardList, ShoppingCart, TrendingDown, CreditCard, Truck, User, FileText, BarChart3, History, HardHat, ChevronRight, Menu, Sun, Moon, Warehouse, Building2, ChevronDown, Lock, LogOut } from "lucide-react";
function Toast({ type, message, onClose, duration = 5e3 }) {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);
  const getIcon = () => {
    switch (type) {
      case "success":
        return /* @__PURE__ */ jsx(CheckCircle, { className: "h-5 w-5 text-green-400" });
      case "error":
        return /* @__PURE__ */ jsx(XCircle, { className: "h-5 w-5 text-red-400" });
      case "warning":
        return /* @__PURE__ */ jsx(AlertCircle, { className: "h-5 w-5 text-yellow-400" });
      case "info":
        return /* @__PURE__ */ jsx(Info, { className: "h-5 w-5 text-blue-400" });
    }
  };
  const getStyles = () => {
    switch (type) {
      case "success":
        return "border-green-500/30 bg-green-900/20";
      case "error":
        return "border-red-500/30 bg-red-900/20";
      case "warning":
        return "border-yellow-500/30 bg-yellow-900/20";
      case "info":
        return "border-blue-500/30 bg-blue-900/20";
    }
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-lg border p-4 shadow-lg backdrop-blur-sm transition-all duration-300 ${getStyles()} ${isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}`,
      children: [
        /* @__PURE__ */ jsx("div", { className: "flex-shrink-0", children: getIcon() }),
        /* @__PURE__ */ jsx("p", { className: "flex-1 text-sm font-medium text-white", children: message }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            },
            className: "flex-shrink-0 text-slate-400 hover:text-white transition-colors",
            children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
          }
        )
      ]
    }
  );
}
function ToastContainer() {
  const { flash } = usePage().props;
  const [toasts, setToasts] = useState([]);
  const [nextId, setNextId] = useState(1);
  useEffect(() => {
    if (flash?.success) {
      addToast("success", flash.success);
    }
    if (flash?.error) {
      addToast("error", flash.error);
    }
    if (flash?.warning) {
      addToast("warning", flash.warning);
    }
    if (flash?.info) {
      addToast("info", flash.info);
    }
  }, [flash]);
  const addToast = (type, message) => {
    const id = nextId;
    setNextId(nextId + 1);
    setToasts((prev) => [...prev, { id, type, message }]);
  };
  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };
  return /* @__PURE__ */ jsx("div", { className: "pointer-events-none fixed top-4 right-4 z-50 flex flex-col gap-2", children: toasts.map((toast) => /* @__PURE__ */ jsx(
    Toast,
    {
      type: toast.type,
      message: toast.message,
      onClose: () => removeToast(toast.id)
    },
    toast.id
  )) });
}
function Authenticated({
  header,
  children
}) {
  const page = usePage();
  const user = page.props.auth?.user;
  const routeParams = page.props.routeParams;
  const shopsFromProps = page.props.shops || [];
  const activeShopFromProps = page.props.activeShop;
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [shopMenuOpen, setShopMenuOpen] = useState(false);
  const isPlatformAdmin = user?.role === "admin_platforme";
  const [theme, setTheme] = useState(isPlatformAdmin ? "light" : "dark");
  const userMenuRef = useRef(null);
  const shopMenuRef = useRef(null);
  const canViewModule = (module) => {
    if (user?.role === "super_admin") {
      return true;
    }
    const permission = user?.permissions?.find((p) => p.module === module);
    return permission ? permission.can_view : false;
  };
  const getAccountCode = () => {
    if (!user) return null;
    if (user.role === "admin_platforme") {
      return null;
    }
    if (user.role === "super_admin") {
      return user.code_user;
    }
    const urlParts = (typeof window !== "undefined" ? window.location.pathname : "").split("/").filter(Boolean);
    const codeFromUrl = urlParts[0] || null;
    return routeParams.code_user || codeFromUrl;
  };
  const accountCode = getAccountCode();
  const buildRoute = (name, params = {}) => {
    if (user?.role === "admin_platforme") {
      return route(name, params);
    }
    if (!accountCode) {
      console.warn("Account code not available for route:", name);
      return "#";
    }
    return route(name, {
      code_user: accountCode,
      ...params
    });
  };
  if (!accountCode && user?.role !== "admin_platforme") {
    return /* @__PURE__ */ jsx("div", { className: `flex h-screen items-center justify-center ${theme === "dark" ? "bg-slate-950" : "bg-slate-100"}`, children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-300 border-r-transparent" }),
      /* @__PURE__ */ jsx("p", { className: theme === "dark" ? "text-slate-400" : "text-slate-600", children: "Chargement..." })
    ] }) });
  }
  const shops = Array.isArray(shopsFromProps) ? shopsFromProps.filter((shop) => shop.is_active).map((shop) => ({
    id: shop.id.toString(),
    name: shop.name,
    slug: shop.slug
  })) : [];
  const activeShop = activeShopFromProps ? { id: activeShopFromProps.id.toString(), name: activeShopFromProps.name, slug: activeShopFromProps.slug } : shops.length > 0 ? shops[0] : null;
  const handleShopChange = (shopId) => {
    const [currentPath] = page.url.split("?");
    router3.visit(`${currentPath}?shop=${shopId}`, {
      preserveState: false,
      // Recharger pour mettre à jour toutes les données
      preserveScroll: true
    });
    setShopMenuOpen(false);
  };
  useEffect(() => {
    if (isPlatformAdmin) {
      const savedTheme = window.localStorage.getItem("platform_admin_theme");
      if (savedTheme === "dark" || savedTheme === "light") {
        setTheme(savedTheme);
        return;
      }
      setTheme("light");
      return;
    }
    setTheme("dark");
  }, [isPlatformAdmin]);
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    if (isPlatformAdmin) {
      window.localStorage.setItem("platform_admin_theme", theme);
    }
  }, [theme, isPlatformAdmin]);
  useEffect(() => {
    const onClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      if (shopMenuRef.current && !shopMenuRef.current.contains(event.target)) {
        setShopMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", onClickOutside);
    return () => window.removeEventListener("mousedown", onClickOutside);
  }, []);
  const allNavItems = [
    // Admin plateforme (uniquement pour admin_platforme)
    ...user?.role === "admin_platforme" ? [
      {
        label: "Dashboard Plateforme",
        href: route("platform.dashboard"),
        active: route().current("platform.dashboard"),
        icon: Crown,
        module: null
      },
      {
        label: "Comptes",
        href: route("platform.accounts"),
        active: route().current("platform.accounts"),
        icon: Users,
        module: null
      },
      {
        label: "Boutiques",
        href: route("platform.shops"),
        active: route().current("platform.shops"),
        icon: Store,
        module: null
      },
      {
        label: "Plans",
        href: route("platform.subscriptions.index"),
        active: route().current("platform.subscriptions.*"),
        icon: Crown,
        module: null
      },
      {
        label: "Abonnements",
        href: route("platform.active-subscriptions"),
        active: route().current("platform.active-subscriptions*"),
        icon: Calendar,
        module: null
      },
      {
        label: "Paramètres",
        href: route("platform.settings"),
        active: route().current("platform.settings*"),
        icon: Settings,
        module: null
      },
      {
        label: "MRR & Revenus",
        href: route("platform.mrr"),
        active: route().current("platform.mrr*"),
        icon: TrendingUp,
        module: null
      },
      {
        label: "Blog",
        href: route("platform.blog.index"),
        active: route().current("platform.blog.*"),
        icon: BookOpen,
        module: null
      }
    ] : [
      // Menus normaux pour les autres utilisateurs
      {
        label: "Dashboard",
        href: buildRoute("dashboard"),
        active: route().current("dashboard"),
        icon: LayoutDashboard,
        module: "dashboard"
        // Restreint aux admins
      },
      {
        label: "Boutiques",
        href: buildRoute("shops.index"),
        active: route().current("shops.*"),
        icon: Store,
        module: "shops"
      },
      {
        label: "Produits",
        href: buildRoute("products.index"),
        active: route().current("products.*"),
        icon: Box,
        module: "products"
      },
      {
        label: "Categories",
        href: buildRoute("categories.index"),
        active: route().current("categories.*"),
        icon: Folder,
        module: "categories"
      },
      {
        label: "Sous categorie",
        href: buildRoute("subcategories.index"),
        active: route().current("subcategories.*"),
        icon: FolderTree,
        module: "categories"
      },
      {
        label: "Stocks",
        href: buildRoute("stocks.index"),
        active: route().current("stocks.*"),
        icon: Boxes,
        module: "stocks"
      },
      {
        label: "Inventaire",
        href: buildRoute("inventory.index"),
        active: route().current("inventory.*"),
        icon: ClipboardList,
        module: "inventory"
      },
      {
        label: "Achats",
        href: buildRoute("purchases.index"),
        active: route().current("purchases.*"),
        icon: ShoppingCart,
        module: "purchases"
      },
      {
        label: "Dépenses",
        href: buildRoute("expenses.index"),
        active: route().current("expenses.*"),
        icon: TrendingDown,
        module: "expenses"
      },
      {
        label: "Ventes",
        href: buildRoute("sales.index"),
        active: route().current("sales.*") && !route().current("sales.credits*"),
        icon: ShoppingCart,
        module: "sales"
      },
      {
        label: "Créances",
        href: buildRoute("sales.credits"),
        active: route().current("sales.credits*"),
        icon: CreditCard,
        module: "sales"
      },
      {
        label: "Fournisseurs",
        href: buildRoute("suppliers.index"),
        active: route().current("suppliers.*"),
        icon: Truck,
        module: "suppliers"
      },
      {
        label: "Utilisateurs",
        href: buildRoute("users.index"),
        active: route().current("users.*"),
        icon: Users,
        module: "users"
      },
      {
        label: "Client",
        href: buildRoute("customers.index"),
        active: route().current("customers.*"),
        icon: User,
        module: "customers"
      },
      {
        label: "Factures",
        href: buildRoute("invoices.index"),
        active: route().current("invoices.*"),
        icon: FileText,
        module: "invoices"
      },
      {
        label: "Analytics",
        href: buildRoute("analytics.index"),
        active: route().current("analytics.*"),
        icon: BarChart3,
        module: "analytics"
        // Restreint aux admins
      },
      // Logs d'activité pour super_admin uniquement
      ...user?.role === "super_admin" ? [{
        label: "Historique",
        href: buildRoute("activity-logs.index"),
        active: route().current("activity-logs.*"),
        icon: History,
        module: null
      }] : [],
      // Paramètres pour tous sauf admin_platforme
      ...user && user.role !== "admin_platforme" ? [{
        label: "Paramètres",
        href: buildRoute("settings.index"),
        active: route().current("settings.*"),
        icon: Settings,
        module: null
      }] : [],
      ...user && user.role !== "admin_platforme" ? [{
        label: "Profil",
        href: buildRoute("profile.edit"),
        active: route().current("profile.*"),
        icon: Settings,
        module: null
        // Toujours visible
      }] : []
    ]
  ];
  const navItems = allNavItems.filter((item) => {
    if (!item.module) return true;
    return canViewModule(item.module);
  });
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100", children: [
    /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 -z-10 overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute -top-28 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl dark:bg-amber-500/15" }),
      /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 right-0 h-72 w-72 rounded-full bg-cyan-500/5 blur-3xl dark:bg-cyan-500/10" })
    ] }),
    mobileSidebarOpen && /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: () => setMobileSidebarOpen(false),
        className: "fixed inset-0 z-40 bg-slate-900/50 dark:bg-slate-950/70 lg:hidden",
        "aria-label": "Fermer le menu"
      }
    ),
    /* @__PURE__ */ jsx(
      "aside",
      {
        className: `fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-300 bg-slate-100/95 p-5 backdrop-blur-xl transition-transform duration-300 dark:border-white/10 dark:bg-slate-900/95 lg:translate-x-0 ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}`,
        children: /* @__PURE__ */ jsxs("div", { className: "flex h-full flex-col", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-8 flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs(Link_default, { href: "/", className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-amber-300 p-2 text-slate-950", children: /* @__PURE__ */ jsx(HardHat, { className: "size-5" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.22em] text-amber-600 dark:text-amber-200", children: "BATIX PRO" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: "Gestion moderne de quincaillerie" })
              ] })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setMobileSidebarOpen(false),
                className: "rounded-lg p-2 text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10 lg:hidden",
                children: /* @__PURE__ */ jsx(X, { className: "size-5" })
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "min-h-0 flex-1 space-y-4 overflow-y-auto pr-1", children: /* @__PURE__ */ jsx("nav", { className: "space-y-1", children: navItems.map((item) => /* @__PURE__ */ jsxs(
            Link_default,
            {
              href: item.href,
              className: `group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${item.active ? "bg-amber-300 text-slate-950" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"}`,
              onClick: () => setMobileSidebarOpen(false),
              children: [
                /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsx(item.icon, { className: "size-4" }),
                  item.label
                ] }),
                /* @__PURE__ */ jsx(ChevronRight, { className: "size-4 opacity-60" })
              ]
            },
            item.label
          )) }) }),
          /* @__PURE__ */ jsx("div", { className: "space-y-3 pt-4", children: user?.role === "super_admin" && /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-amber-300/40 bg-gradient-to-br from-amber-200/70 via-orange-200/40 to-transparent p-4 dark:border-amber-200/25 dark:from-amber-300/20 dark:via-orange-300/10", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-amber-700 dark:text-amber-100", children: [
              /* @__PURE__ */ jsx(Crown, { className: "size-4" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-wider", children: "Abonnement" })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "mt-2 text-lg font-bold text-slate-900 dark:text-white", children: user ? "Growth" : "Starter" }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-slate-700 dark:text-slate-300", children: user ? "3 boutiques incluses" : "Connectez-vous pour voir votre plan" }),
            /* @__PURE__ */ jsx(
              Link_default,
              {
                href: "/plans",
                className: "mt-3 inline-flex w-full items-center justify-center rounded-lg bg-amber-300 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200",
                children: "Upgrade"
              }
            )
          ] }) })
        ] })
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "lg:pl-72", children: [
      /* @__PURE__ */ jsx("header", { className: "sticky top-0 z-30 border-b border-slate-300 bg-slate-100/90 px-4 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setMobileSidebarOpen(true),
              className: "rounded-lg border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10 lg:hidden",
              children: /* @__PURE__ */ jsx(Menu, { className: "size-5" })
            }
          ),
          /* @__PURE__ */ jsx("div", { children: header ?? /* @__PURE__ */ jsx("h1", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: "Dashboard" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          isPlatformAdmin && /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => setTheme((current) => current === "dark" ? "light" : "dark"),
              className: "inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-200 px-3 py-2 text-xs text-slate-800 transition hover:bg-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10",
              children: [
                theme === "dark" ? /* @__PURE__ */ jsx(Sun, { className: "size-4 text-amber-300" }) : /* @__PURE__ */ jsx(Moon, { className: "size-4 text-slate-700" }),
                /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: theme === "dark" ? "Mode clair" : "Mode sombre" })
              ]
            }
          ),
          user?.role !== "admin_platforme" && /* @__PURE__ */ jsxs(
            Link_default,
            {
              href: buildRoute("depots.index"),
              className: "inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-200 px-3 py-2 text-xs text-slate-800 transition hover:bg-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10",
              children: [
                /* @__PURE__ */ jsx(Warehouse, { className: "size-4 text-amber-400" }),
                /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "Dépôt" })
              ]
            }
          ),
          user?.role !== "admin_platforme" && /* @__PURE__ */ jsxs("div", { className: "relative", ref: shopMenuRef, children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setShopMenuOpen((prev) => !prev),
                className: "inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-200 px-3 py-2 text-left text-xs text-slate-800 transition hover:bg-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10",
                disabled: shops.length === 0,
                children: [
                  /* @__PURE__ */ jsx(Building2, { className: "size-4 text-amber-200" }),
                  /* @__PURE__ */ jsxs("span", { className: "hidden sm:block", children: [
                    /* @__PURE__ */ jsx("span", { className: "block text-[11px] text-slate-500 dark:text-slate-400", children: "Boutique active" }),
                    /* @__PURE__ */ jsx("span", { className: "block font-semibold text-slate-900 dark:text-white", children: shops.length > 0 ? activeShop?.name : "Aucune boutique" })
                  ] }),
                  shops.length > 0 && /* @__PURE__ */ jsx(ChevronDown, { className: "size-4 text-slate-500 dark:text-slate-300" })
                ]
              }
            ),
            shopMenuOpen && shops.length > 0 && /* @__PURE__ */ jsxs("div", { className: "absolute right-0 z-20 mt-2 w-56 rounded-xl border border-slate-300 bg-slate-100/95 p-1 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95", children: [
              shops.map((shop) => /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => handleShopChange(shop.id),
                  className: `w-full text-left block rounded-lg px-3 py-2 text-sm transition ${shop.id === activeShop?.id ? "bg-amber-300 text-slate-950" : "text-slate-800 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-white/10"}`,
                  children: shop.name
                },
                shop.id
              )),
              /* @__PURE__ */ jsx("hr", { className: "my-1 border-slate-300 dark:border-white/10" }),
              /* @__PURE__ */ jsxs(
                Link_default,
                {
                  href: buildRoute("shops.index"),
                  className: "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-800 transition hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-white/10",
                  onClick: () => setShopMenuOpen(false),
                  children: [
                    /* @__PURE__ */ jsx(Store, { className: "size-4" }),
                    "Gérer mes boutiques"
                  ]
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "relative", ref: userMenuRef, children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setUserMenuOpen((prev) => !prev),
                className: "inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-200 px-3 py-2 text-left text-xs text-slate-800 transition hover:bg-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10",
                children: [
                  /* @__PURE__ */ jsxs("span", { children: [
                    /* @__PURE__ */ jsx("span", { className: "block font-semibold text-amber-600 dark:text-amber-200", children: user?.name ?? "Visiteur" }),
                    /* @__PURE__ */ jsx("span", { className: "block text-[11px] text-slate-500 dark:text-slate-400", children: user?.email ?? "Mode public" })
                  ] }),
                  /* @__PURE__ */ jsx(ChevronDown, { className: "size-4 text-slate-500 dark:text-slate-300" })
                ]
              }
            ),
            userMenuOpen && /* @__PURE__ */ jsx("div", { className: "absolute right-0 z-20 mt-2 w-48 rounded-xl border border-slate-300 bg-slate-100/95 p-1 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95", children: user ? /* @__PURE__ */ jsxs(Fragment, { children: [
              user.role !== "admin_platforme" && /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsxs(
                  Link_default,
                  {
                    href: buildRoute("profile.edit"),
                    className: "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-800 transition hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-white/10",
                    onClick: () => setUserMenuOpen(false),
                    children: [
                      /* @__PURE__ */ jsx(User, { className: "size-4" }),
                      /* @__PURE__ */ jsx("span", { children: "Profil" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  Link_default,
                  {
                    href: buildRoute("settings.index"),
                    className: "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-800 transition hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-white/10",
                    onClick: () => setUserMenuOpen(false),
                    children: [
                      /* @__PURE__ */ jsx(Settings, { className: "size-4" }),
                      /* @__PURE__ */ jsx("span", { children: "Parametres" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsx("div", { className: "my-1 border-t border-slate-300 dark:border-white/10" })
              ] }),
              /* @__PURE__ */ jsxs(
                Link_default,
                {
                  href: route("lock-screen.lock"),
                  method: "post",
                  as: "button",
                  className: "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-amber-300 transition hover:bg-amber-300/10",
                  onClick: () => setUserMenuOpen(false),
                  children: [
                    /* @__PURE__ */ jsx(Lock, { className: "size-4" }),
                    /* @__PURE__ */ jsx("span", { children: "Verrouiller" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                Link_default,
                {
                  href: route("logout"),
                  method: "post",
                  as: "button",
                  className: "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-200 transition hover:bg-rose-300/10",
                  onClick: () => setUserMenuOpen(false),
                  children: [
                    /* @__PURE__ */ jsx(LogOut, { className: "size-4" }),
                    /* @__PURE__ */ jsx("span", { children: "Deconnexion" })
                  ]
                }
              )
            ] }) : /* @__PURE__ */ jsx(
              Link_default,
              {
                href: route("login"),
                className: "block rounded-lg px-3 py-2 text-sm text-slate-800 transition hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-white/10",
                onClick: () => setUserMenuOpen(false),
                children: "Connexion"
              }
            ) })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("main", { className: "px-4 py-6 sm:px-6 lg:px-8", children })
    ] }),
    /* @__PURE__ */ jsx(ToastContainer, {})
  ] });
}
export {
  Authenticated as A
};
