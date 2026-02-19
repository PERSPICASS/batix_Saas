import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    onClose: () => void;
    duration?: number;
}

export default function Toast({ type, message, onClose, duration = 5000 }: ToastProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Animation d'entrée
        setTimeout(() => setIsVisible(true), 10);

        // Auto-fermeture
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300); // Attendre la fin de l'animation
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle className="h-5 w-5 text-green-400" />;
            case 'error':
                return <XCircle className="h-5 w-5 text-red-400" />;
            case 'warning':
                return <AlertCircle className="h-5 w-5 text-yellow-400" />;
            case 'info':
                return <Info className="h-5 w-5 text-blue-400" />;
        }
    };

    const getStyles = () => {
        switch (type) {
            case 'success':
                return 'border-green-500/30 bg-green-900/20';
            case 'error':
                return 'border-red-500/30 bg-red-900/20';
            case 'warning':
                return 'border-yellow-500/30 bg-yellow-900/20';
            case 'info':
                return 'border-blue-500/30 bg-blue-900/20';
        }
    };

    return (
        <div
            className={`pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-lg border p-4 shadow-lg backdrop-blur-sm transition-all duration-300 ${getStyles()} ${
                isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
            }`}
        >
            <div className="flex-shrink-0">{getIcon()}</div>
            <p className="flex-1 text-sm font-medium text-white">{message}</p>
            <button
                onClick={() => {
                    setIsVisible(false);
                    setTimeout(onClose, 300);
                }}
                className="flex-shrink-0 text-slate-400 hover:text-white transition-colors"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}
