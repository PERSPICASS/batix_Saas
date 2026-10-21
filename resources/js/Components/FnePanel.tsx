import { router } from '@inertiajs/react';
import { AlertTriangle, BadgeCheck, Clock, ExternalLink, RotateCw, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useLocale } from '@/contexts/LocaleContext';

/** Ce que FneDisplay::for() envoie pour une facture ou un avoir présenté à la DGI. */
export interface FneInfo {
    status: 'pending' | 'sending' | 'certified' | 'failed' | 'uncertain';
    reference: string | null;
    verification_url: string | null;
    certified_at: string | null;
    error: string | null;
    retryable: boolean;
    qr: string | null;
}

interface Props {
    fne: FneInfo;
    /** URL de relance (route invoices.fne.retry ou credit-notes.fne.retry). */
    retryUrl: string;
}

/**
 * Le « sticker » FNE d'un document : statut de certification, n° FNE et QR de
 * vérification. Une incertitude (réponse de la DGI perdue) ne se relance qu'après une
 * vérification explicite sur l'espace FNE : relancer un document déjà certifié en
 * créerait un second.
 */
export default function FnePanel({ fne, retryUrl }: Props) {
    const { t, locale } = useLocale();
    const [confirmed, setConfirmed] = useState(false);
    const [processing, setProcessing] = useState(false);

    const retry = () => {
        setProcessing(true);
        router.post(retryUrl, fne.status === 'uncertain' ? { confirmed } : {}, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        });
    };

    const tone = {
        certified: 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10',
        pending: 'border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10',
        sending: 'border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10',
        uncertain: 'border-orange-300 bg-orange-50 dark:border-orange-500/40 dark:bg-orange-500/10',
        failed: 'border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10',
    }[fne.status];

    const Icon = {
        certified: BadgeCheck,
        pending: Clock,
        sending: Clock,
        uncertain: AlertTriangle,
        failed: XCircle,
    }[fne.status];

    return (
        <div className={`rounded-xl border p-4 text-sm print:hidden ${tone}`}>
            <div className="flex flex-wrap items-start gap-4">
                {fne.status === 'certified' && fne.qr && (
                    <img src={fne.qr} alt="QR FNE" className="size-28 shrink-0 rounded bg-white p-1" />
                )}
                <div className="min-w-0 flex-1 space-y-1">
                    <p className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                        <Icon className="size-4 shrink-0" /> {t.fne.status[fne.status]}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t.fne.title}</p>

                    {fne.reference && (
                        <p className="text-slate-700 dark:text-slate-200">
                            {t.fne.reference} : <span className="font-mono font-semibold">{fne.reference}</span>
                        </p>
                    )}
                    {fne.certified_at && (
                        <p className="text-slate-600 dark:text-slate-400">
                            {t.fne.certifiedAt} {new Date(fne.certified_at).toLocaleString(locale === 'en' ? 'en-GB' : 'fr-FR')}
                        </p>
                    )}
                    {fne.verification_url && (
                        <a
                            href={fne.verification_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-amber-700 hover:underline dark:text-amber-300"
                        >
                            {t.fne.verify} <ExternalLink className="size-3" />
                        </a>
                    )}

                    {(fne.status === 'pending' || fne.status === 'sending') && (
                        <p className="text-slate-600 dark:text-slate-400">{t.fne.pendingHelp}</p>
                    )}
                    {fne.status === 'uncertain' && (
                        <p className="text-slate-700 dark:text-slate-300">{t.fne.uncertainHelp}</p>
                    )}
                    {fne.error && fne.status !== 'certified' && (
                        <p className="break-words text-red-700 dark:text-red-300">{fne.error}</p>
                    )}

                    {fne.retryable && (
                        <div className="space-y-2 pt-2">
                            {fne.status === 'uncertain' && (
                                <label className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={confirmed}
                                        onChange={(e) => setConfirmed(e.target.checked)}
                                        className="mt-0.5 rounded border-gray-300"
                                    />
                                    {t.fne.confirmNotOnPortal}
                                </label>
                            )}
                            <button
                                type="button"
                                onClick={retry}
                                disabled={processing || (fne.status === 'uncertain' && !confirmed)}
                                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                            >
                                <RotateCw className="size-4" /> {t.fne.retry}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
