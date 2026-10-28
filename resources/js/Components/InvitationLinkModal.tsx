import { usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { Check, Copy, MessageCircle } from 'lucide-react';
import Modal from '@/Components/Modal';
import { useLocale } from '@/contexts/LocaleContext';

interface InvitationLink {
    url: string;
    name: string;
    pending: boolean;
}

/**
 * Le lien d'invitation (ou de nouveau mot de passe) que le serveur vient d'émettre, à
 * copier ou à envoyer par WhatsApp. Il n'arrive qu'une fois, en message flash : le
 * serveur n'en garde que l'empreinte et ne peut pas le réafficher.
 */
export default function InvitationLinkModal() {
    const { t } = useLocale();
    const { flash } = usePage().props as { flash?: { invitationLink?: InvitationLink | null } };
    const [link, setLink] = useState<InvitationLink | null>(null);
    const [copied, setCopied] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Dépendance sur l'objet : chaque nouveau lien est un nouvel objet, même pour la même personne.
    useEffect(() => {
        if (flash?.invitationLink) {
            setLink(flash.invitationLink);
            setCopied(false);
        }
    }, [flash?.invitationLink]);

    if (!link) return null;

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(link.url);
        } catch {
            // Presse-papiers refusé (navigateur ancien) : on sélectionne, l'utilisateur copie.
            inputRef.current?.select();
            return;
        }
        setCopied(true);
    };

    const message = link.pending
        ? t.users.invitation.whatsappText(link.name, link.url)
        : t.users.invitation.whatsappResetText(link.name, link.url);

    return (
        <Modal show onClose={() => setLink(null)} maxWidth="md">
            <div className="space-y-4 p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t.users.invitation.modalTitle(link.name)}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">{t.users.invitation.modalHint}</p>

                <input
                    ref={inputRef}
                    readOnly
                    value={link.url}
                    onFocus={(e) => e.target.select()}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-xs text-slate-700 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                />

                <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                        type="button"
                        onClick={copy}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5"
                    >
                        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                        {copied ? t.users.invitation.copied : t.users.invitation.copy}
                    </button>
                    <a
                        href={`https://wa.me/?text=${encodeURIComponent(message)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500"
                    >
                        <MessageCircle className="size-4" />
                        {t.users.invitation.whatsapp}
                    </a>
                </div>

                <div className="flex justify-end">
                    <button type="button" onClick={() => setLink(null)} className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                        {t.users.invitation.close}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
