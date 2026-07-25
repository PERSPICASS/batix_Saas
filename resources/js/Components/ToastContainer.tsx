import { usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import Toast from './Toast';
import { onToast } from '@/utils/toast';

interface ToastMessage {
    id: number;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
}

export default function ToastContainer() {
    const { flash } = usePage().props as any;
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    // Un compteur en ref, pas en état : l'abonnement aux toasts client ne s'enregistre
    // qu'une fois et fige donc les valeurs qu'il capture. Avec un `nextId` d'état, deux
    // toasts successifs auraient reçu le même identifiant, donc la même clé React — le
    // second ne se serait pas affiché.
    const nextId = useRef(1);

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

    // Les toasts émis par le code client, en plus des messages flash du serveur.
    useEffect(() => onToast(({ type, message }) => addToast(type, message)), []);

    const addToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
        const id = nextId.current++;
        setToasts((prev) => [...prev, { id, type, message }]);
    };

    const removeToast = (id: number) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    return (
        <div className="print:hidden pointer-events-none fixed top-4 right-4 z-50 flex flex-col gap-2">
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
