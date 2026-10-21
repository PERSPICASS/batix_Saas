import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import Modal from '@/Components/Modal';
import { useLocale } from '@/contexts/LocaleContext';

/**
 * Partage d'une pièce commerciale par WhatsApp, via un lien `wa.me`.
 *
 * Le message part du téléphone du vendeur, depuis SON numéro — celui que le client
 * reconnaît et rappellera. Pas de compte Meta Business, pas de modèle à faire approuver,
 * pas de coût par message, et ça marche pour toutes les boutiques immédiatement.
 *
 * Un lien wa.me ne transporte que du texte : c'est donc le lien signé du document qui est
 * transmis, et non le PDF lui-même.
 */

/**
 * wa.me n'accepte qu'une suite de chiffres au format international, sans `+`, espaces ni
 * séparateurs — un numéro stocké « +225 07 49 99 22 08 » doit devenir « 2250749992208 ».
 */
export function toWhatsAppNumber(phone: string): string {
    return phone.replace(/\D/g, '');
}

interface Props {
    /** Lien signé vers le document, ce que le client recevra. */
    shareUrl: string;
    /** Message pré-rempli, le lien y étant ajouté. */
    message: string;
    /** Téléphone du client s'il est connu ; sinon le vendeur le saisit. */
    phone?: string | null;
    label?: string;
}

export default function WhatsAppShareButton({ shareUrl, message, phone, label }: Props) {
    const { t } = useLocale();
    const [askingNumber, setAskingNumber] = useState(false);
    const [typedNumber, setTypedNumber] = useState('');

    const open = (rawNumber: string) => {
        const number = toWhatsAppNumber(rawNumber);
        const text = encodeURIComponent(`${message}\n\n${shareUrl}`);

        // `wa.me/<numéro>` ouvre la conversation ; sans numéro, WhatsApp demande à
        // l'utilisateur de choisir un destinataire, ce qui reste utilisable.
        window.open(number ? `https://wa.me/${number}?text=${text}` : `https://wa.me/?text=${text}`, '_blank', 'noopener');
    };

    const handleClick = () => {
        const known = phone ? toWhatsAppNumber(phone) : '';

        // Une vente au comptoir n'a souvent aucun client rattaché, donc aucun numéro :
        // dans ce cas on le demande plutôt que d'ouvrir WhatsApp sans destinataire.
        if (known) {
            open(known);
            return;
        }

        setTypedNumber('');
        setAskingNumber(true);
    };

    return (
        <>
            <button
                type="button"
                onClick={handleClick}
                className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1eb955]"
            >
                <MessageCircle className="size-4" /> {label ?? t.documents.share.whatsapp}
            </button>

            <Modal show={askingNumber} onClose={() => setAskingNumber(false)} maxWidth="sm">
                {/* Le panneau de Modal est en `bg-white` sans variante sombre : c'est au
                    contenu de porter son fond, sinon un titre en `dark:text-white`
                    s'écrit en blanc sur blanc et la fenêtre paraît vide. Contrairement aux
                    autres modales du projet, celle-ci gère les deux thèmes plutôt que de
                    figer le fond sombre. */}
                <div className="space-y-4 bg-white p-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
                    <h2 className="text-lg font-semibold">
                        {t.documents.share.numberTitle}
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        {t.documents.share.numberHelp}
                    </p>
                    <input
                        type="tel"
                        autoFocus
                        value={typedNumber}
                        onChange={(e) => setTypedNumber(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && typedNumber.trim()) {
                                setAskingNumber(false);
                                open(typedNumber);
                            }
                        }}
                        placeholder="+225 07 49 99 22 08"
                        className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setAskingNumber(false)}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
                        >
                            {t.common.actions.cancel}
                        </button>
                        <button
                            type="button"
                            disabled={!typedNumber.trim()}
                            onClick={() => {
                                setAskingNumber(false);
                                open(typedNumber);
                            }}
                            className="rounded-lg bg-[#25D366] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1eb955] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {t.documents.share.send}
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
