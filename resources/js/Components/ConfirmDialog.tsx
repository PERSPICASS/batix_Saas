import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { AlertTriangle, X } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';

interface ConfirmDialogProps {
    show: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    isProcessing?: boolean;
}

export default function ConfirmDialog({
    show,
    onClose,
    onConfirm,
    title,
    message,
    confirmText,
    cancelText,
    type = 'danger',
    isProcessing = false,
}: ConfirmDialogProps) {
    const { t } = useLocale();

    const resolvedConfirmText = confirmText ?? t.common.confirm.confirmText;
    const resolvedCancelText = cancelText ?? t.common.confirm.cancelText;

    const getIconColor = () => {
        switch (type) {
            case 'danger': return 'bg-red-900/30 border-red-500/30';
            case 'warning': return 'bg-yellow-900/30 border-yellow-500/30';
            case 'info': return 'bg-blue-900/30 border-blue-500/30';
        }
    };

    const getIconTextColor = () => {
        switch (type) {
            case 'danger': return 'text-red-400';
            case 'warning': return 'text-yellow-400';
            case 'info': return 'text-blue-400';
        }
    };

    const getAlertBgColor = () => {
        switch (type) {
            case 'danger': return 'bg-red-900/20 border-red-500/30';
            case 'warning': return 'bg-yellow-900/20 border-yellow-500/30';
            case 'info': return 'bg-blue-900/20 border-blue-500/30';
        }
    };

    const getAlertTextColor = () => {
        switch (type) {
            case 'danger': return 'text-red-200';
            case 'warning': return 'text-yellow-200';
            case 'info': return 'text-blue-200';
        }
    };

    const getConfirmButtonColor = () => {
        switch (type) {
            case 'danger': return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
            case 'warning': return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500';
            case 'info': return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
        }
    };

    return (
        <Transition appear show={show} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl transition-all">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border ${getIconColor()}`}>
                                            <AlertTriangle className={`h-6 w-6 ${getIconTextColor()}`} />
                                        </div>
                                        <Dialog.Title as="h3" className="text-lg font-semibold text-white">
                                            {title}
                                        </Dialog.Title>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="text-slate-400 hover:text-white transition-colors"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className={`rounded-lg border p-4 mb-6 ${getAlertBgColor()}`}>
                                    <p className={`text-sm ${getAlertTextColor()}`}>
                                        {message}
                                    </p>
                                </div>

                                <div className="flex gap-3 justify-end">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        disabled={isProcessing}
                                        className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50"
                                    >
                                        {resolvedCancelText}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onConfirm}
                                        disabled={isProcessing}
                                        className={`rounded-lg px-4 py-2 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 ${getConfirmButtonColor()}`}
                                    >
                                        {isProcessing ? t.common.confirm.processing : resolvedConfirmText}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
