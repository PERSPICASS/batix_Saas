import { router, usePage, Link } from '@inertiajs/react';
import { useEffect } from 'react';
import { Lock } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { showToast } from '@/utils/toast';

/**
 * Miroir côté interface de EnforceSubscriptionReadOnly.
 *
 * Le serveur refusait déjà les écritures d'un compte expiré, mais l'interface continuait
 * d'afficher des boutons de création parfaitement cliquables : l'utilisateur remplissait
 * un formulaire pour le voir rejeté à l'envoi. Ce garde-fou est monté une seule fois,
 * dans AuthenticatedLayout, et vaut donc pour toutes les pages — y compris celles dont
 * les formulaires ne sont pas recensés.
 *
 * Il n'interdit rien que le serveur n'interdise déjà : c'est une politesse, pas une
 * sécurité. La barrière qui compte reste le middleware.
 */

/**
 * Écritures qui doivent rester possibles, sans quoi le compte serait enfermé. Elles
 * correspondent aux exceptions du middleware, plus celles qui vivent hors du groupe
 * {code_user} : se déconnecter, payer, terminer son inscription.
 */
const ALLOWED = [
    '/logout',
    '/locale',
    '/profile',
    '/plans',
    '/payment',
    '/paddle',
    '/chariow',
    '/create-shop',
    '/lock-screen',
    '/two-factor',
];

const isAllowed = (url: string): boolean => {
    const path = url.replace(/^https?:\/\/[^/]+/, '');

    return ALLOWED.some((allowed) => path.includes(allowed));
};

export default function ReadOnlyAccountGuard() {
    const { readOnlyAccount } = usePage().props as unknown as { readOnlyAccount?: boolean };
    const { t } = useLocale();

    useEffect(() => {
        if (!readOnlyAccount) return;

        return router.on('before', (event) => {
            const visit = event.detail.visit;
            const url = visit.url.toString();

            if (isAllowed(url)) return;

            const isWrite = visit.method !== 'get';
            // Une visite vers un formulaire de création ou d'édition ne mène qu'à un
            // envoi refusé : autant l'arrêter ici, avec l'explication.
            const leadsToAForm = /\/(create|edit|nouveau|nouvelle|modifier)(\/|$|\?)/.test(url);

            if (!isWrite && !leadsToAForm) return;

            showToast('error', t.layout.readOnly.blocked);

            return false;
        });
    }, [readOnlyAccount, t]);

    if (!readOnlyAccount) return null;

    return (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-100 p-4 dark:border-amber-500/30 dark:bg-amber-500/15">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-black/5 p-2 text-amber-600 dark:bg-white/10 dark:text-amber-300">
                        <Lock className="size-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">{t.layout.readOnly.title}</h3>
                        <p className="text-sm text-slate-700 dark:text-amber-100/90">{t.layout.readOnly.body}</p>
                    </div>
                </div>
                <Link
                    href="/plans"
                    className="inline-flex items-center rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
                >
                    {t.layout.readOnly.cta}
                </Link>
            </div>
        </div>
    );
}
