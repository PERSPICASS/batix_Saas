import { usePage, Link, InertiaLinkProps } from '@inertiajs/react';
import { ReactNode } from 'react';

// Utiliser le route global de Ziggy
const ziggyRoute = route;

/**
 * Interface pour les paramètres de route partagés
 */
export interface RouteParams {
    code_user: string | null;
    shop_slug: string | null;
}

/**
 * Interface pour les props partagées de la page
 */
export interface PageProps {
    routeParams: RouteParams;
    currentShop: {
        id: number;
        name: string;
        slug: string;
    } | null;
    auth: {
        user: any;
        code_user: string | null;
    };
    /** Partagé par HandleInertiaRequests à chaque réponse, comme les champs ci-dessus. */
    appUrl: string;
    [key: string]: any;
}

/**
 * Hook personnalisé pour accéder aux paramètres de route
 */
export function useRouteParams(): RouteParams {
    const { routeParams } = usePage<PageProps>().props;
    return routeParams;
}

/**
 * Hook personnalisé pour accéder à la boutique actuelle
 */
export function useCurrentShop() {
    const { currentShop } = usePage<PageProps>().props;
    return currentShop;
}

/**
 * Hook pour utiliser route dans les composants
 * Retourne une fonction route qui ajoute automatiquement code_user
 * 
 * @returns Fonction route configurée avec le code_user du compte
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const route = useRoute();
 *   
 *   return (
 *     <Link href={route('dashboard')}>Dashboard</Link>
 *   );
 * }
 * ```
 */
export function useRoute() {
    const page = usePage<PageProps>();
    const { routeParams, auth } = page.props;
    
    // Déterminer le code_user (du propriétaire du compte)
    let codeUser = routeParams?.code_user;
    
    // Si pas disponible, essayer de l'extraire de l'utilisateur
    if (!codeUser && auth?.user) {
        if (auth.user.role === 'super_admin') {
            codeUser = auth.user.code_user;
        } else {
            // Extraire de l'URL actuelle
            const urlParts = window.location.pathname.split('/').filter(Boolean);
            codeUser = urlParts[0] || null;
        }
    }
    
    // Retourner une fonction qui utilise le codeUser capturé
    return (name: string, params: Record<string, any> = {}, absolute: boolean = false): string => {
        if (!codeUser) {
            console.warn(`useRoute: code_user not available for route "${name}"`);
            return ziggyRoute(name, params, absolute);
        }
        
        // Fusionner les paramètres
        const allParams = {
            code_user: codeUser,
            ...params
        };
        
        return ziggyRoute(name, allParams, absolute);
    };
}

/**
 * Hook pour créer une fonction userRoute avec les paramètres du contexte actuel
 * Utile pour éviter de répéter useRouteParams dans chaque composant
 * @deprecated Utilisez useRoute() à la place
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *     const buildRoute = useUserRoute();
 *     
 *     return (
 *         <Link href={buildRoute('products.index')}>
 *             Produits
 *         </Link>
 *     );
 * }
 * ```
 */
export function useUserRoute() {
    return useRoute();
}

/**
 * Composant Link personnalisé avec injection automatique des paramètres
 * 
 * @example
 * ```tsx
 * <UserLink route="products.index">
 *     Voir les produits
 * </UserLink>
 * 
 * <UserLink route="products.show" params={{ product: 123 }}>
 *     Voir le produit
 * </UserLink>
 * ```
 */
interface UserLinkProps extends Omit<InertiaLinkProps, 'href'> {
    route: string;
    params?: Record<string, any>;
    children: ReactNode;
}

export function UserLink({ route: routeName, params = {}, children, ...props }: UserLinkProps) {
    const routeBuilder = useRoute();
    const href = routeBuilder(routeName, params);
    
    return (
        <Link href={href} {...props}>
            {children}
        </Link>
    );
}

/**
 * Vérifie si l'utilisateur a accès à une boutique
 */
export function hasShopAccess(): boolean {
    const { currentShop } = usePage<PageProps>().props;
    return currentShop !== null;
}

/**
 * Obtient le code utilisateur actuel
 */
export function getUserCode(): string | null {
    const { auth } = usePage<PageProps>().props;
    return auth.code_user;
}

/**
 * Obtient le slug de la boutique actuelle
 */
export function getShopSlug(): string | null {
    const { currentShop } = usePage<PageProps>().props;
    return currentShop?.slug || null;
}
