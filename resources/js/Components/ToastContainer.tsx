import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import Toast from './Toast';

interface ToastMessage {
    id: number;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
}

export default function ToastContainer() {
    const { flash } = usePage().props as any;
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [nextId, setNextId] = useState(1);

    useEffect(() => {
        if (flash?.success) {
            addToast('success', flash.success);
        }
        if (flash?.error) {
            addToast('error', flash.error);
        }
        if (flash?.warning) {
            addToast('warning', flash.warning);
        }
        if (flash?.info) {
            addToast('info', flash.info);
        }
    }, [flash]);

    const addToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
        const id = nextId;
        setNextId(nextId + 1);
        setToasts((prev) => [...prev, { id, type, message }]);
    };

    const removeToast = (id: number) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    return (
        <div className="pointer-events-none fixed top-4 right-4 z-50 flex flex-col gap-2">
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    type={toast.type}
                    message={toast.message}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </div>
    );
}
