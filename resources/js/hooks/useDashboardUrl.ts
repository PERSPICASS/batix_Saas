import type { PageProps } from '@/types';

/**
 * Resolves the right destination for the public site's "Dashboard" / "Essai gratuit"
 * CTAs depending on the current visitor: guest, platform admin, or logged-in shop user.
 */
export function useDashboardUrl(auth: PageProps['auth']) {
    return () => {
        if (!auth.user) return route('register');
        if (auth.user.role === 'admin_platforme') return route('platform.dashboard');
        if (auth.code_user) return route('dashboard', { code_user: auth.code_user });
        return route('register');
    };
}
