import Modal from '@/Components/Modal';
import { AlertTriangle } from 'lucide-react';
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
}: ConfirmDeleteModalProps) {
    const { t } = useLocale();

    const resolvedTitle = title ?? t.common.confirm.deleteTitle;
    const resolvedConfirmText = confirmText ?? t.common.actions.delete;
    const resolvedCancelText = cancelText ?? t.common.actions.cancel;

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <div className="bg-white p-6 dark:bg-slate-900">
                <div className="flex items-start gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20">
                        <AlertTriangle className="size-6 text-red-600 dark:text-red-400" />
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
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                    >
                        {processing ? t.common.actions.deleting : resolvedConfirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
