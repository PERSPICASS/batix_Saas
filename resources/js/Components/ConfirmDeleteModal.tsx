import Modal from '@/Components/Modal';
import { AlertTriangle, CheckCircle, Send } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';

interface ConfirmDeleteModalProps {
    show: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    processing?: boolean;
    /**
     * Libellé pendant le traitement. Par défaut « Suppression… », ce qui ne convient
     * qu'à une suppression : ce composant sert aussi à confirmer un envoi ou une
     * annulation.
     */
    processingText?: string;
    /** 'danger' (défaut) pour une action destructrice, 'success' pour une action validante, 'send' pour un envoi. */
    tone?: 'danger' | 'success' | 'send';
}

export default function ConfirmDeleteModal({
    show,
    onClose,
    onConfirm,
    title,
    message,
    confirmText,
    cancelText,
    processing = false,
    processingText,
    tone = 'danger',
}: ConfirmDeleteModalProps) {
    const { t } = useLocale();

    const resolvedTitle = title ?? t.common.confirm.deleteTitle;
    const resolvedConfirmText = confirmText ?? t.common.actions.delete;
    const resolvedCancelText = cancelText ?? t.common.actions.cancel;

    const toneClasses = {
        danger: {
            iconWrap: 'bg-red-100 dark:bg-red-500/20',
            icon: 'text-red-600 dark:text-red-400',
            Icon: AlertTriangle,
            button: 'bg-red-600 hover:bg-red-700',
        },
        success: {
            iconWrap: 'bg-emerald-100 dark:bg-emerald-500/20',
            icon: 'text-emerald-600 dark:text-emerald-400',
            Icon: CheckCircle,
            button: 'bg-emerald-600 hover:bg-emerald-700',
        },
        send: {
            iconWrap: 'bg-blue-100 dark:bg-blue-500/20',
            icon: 'text-blue-600 dark:text-blue-400',
            Icon: Send,
            button: 'bg-blue-600 hover:bg-blue-700',
        },
    }[tone];

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <div className="bg-white p-6 dark:bg-slate-900">
                <div className="flex items-start gap-4">
                    <div className={`flex size-12 shrink-0 items-center justify-center rounded-full ${toneClasses.iconWrap}`}>
                        <toneClasses.Icon className={`size-6 ${toneClasses.icon}`} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{resolvedTitle}</h3>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{message}</p>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-gray-100 disabled:opacity-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                    >
                        {resolvedCancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={processing}
                        className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50 ${toneClasses.button}`}
                    >
                        {processing ? (processingText ?? t.common.actions.deleting) : resolvedConfirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
