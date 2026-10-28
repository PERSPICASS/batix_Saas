import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Link2, Send } from 'lucide-react';
import { useRoute } from '@/utils/route';
import { useLocale } from '@/contexts/LocaleContext';

/**
 * Renvoyer le lien par email, ou en obtenir un pour le transmettre soi-même (WhatsApp).
 * Le lien émis s'affiche dans InvitationLinkModal, que la page doit monter.
 */
export default function InvitationActions({ userId, pending, compact = false }: { userId: number; pending: boolean; compact?: boolean }) {
    const route = useRoute();
    const { t } = useLocale();
    const [busy, setBusy] = useState(false);

    const post = (name: 'users.invitation.send' | 'users.invitation.link') => {
        setBusy(true);
        router.post(route(name, { user: userId }), {}, { preserveScroll: true, onFinish: () => setBusy(false) });
    };

    const button = compact
        ? 'inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-gray-100 disabled:opacity-50 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10'
        : 'inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-gray-100 disabled:opacity-50 dark:border-white/15 dark:bg-transparent dark:text-slate-200 dark:hover:bg-white/5';

    return (
        <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => post('users.invitation.send')} className={button}>
                <Send className="size-3.5" />
                {pending ? t.users.invitation.resend : t.users.invitation.sendReset}
            </button>
            <button type="button" disabled={busy} onClick={() => post('users.invitation.link')} className={button}>
                <Link2 className="size-3.5" />
                {t.users.invitation.link}
            </button>
        </div>
    );
}
