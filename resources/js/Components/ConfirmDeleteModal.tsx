import Modal from '@/Components/Modal';
import { AlertTriangle } from 'lucide-react';

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
    title = 'Confirmer la suppression',
    message,
    confirmText = 'Supprimer',
    cancelText = 'Annuler',
    processing = false,
}: ConfirmDeleteModalProps) {
    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <div className="bg-slate-900 p-6">
                <div className="flex items-start gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-red-500/20">
                        <AlertTriangle className="size-6 text-red-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">{title}</h3>
                        <p className="mt-2 text-sm text-slate-300">{message}</p>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={processing}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                    >
                        {processing ? 'Suppression...' : confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
