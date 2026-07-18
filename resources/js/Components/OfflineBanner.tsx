import { useEffect, useState } from 'react';
import { CloudOff, Wifi } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';

/**
 * Signale que l'application sert des données mises en cache.
 *
 * Sans ce bandeau, le mode hors ligne est dangereux plutôt qu'utile : le service worker
 * rend la dernière version connue d'une page, et un gérant peut lire « stock : 12 » sur
 * un écran figé depuis la veille en le croyant à jour. Une donnée périmée non signalée
 * est pire qu'une page d'erreur.
 */
export default function OfflineBanner() {
    const { t } = useLocale();

    // navigator.onLine n'existe pas pendant le rendu SSR.
    const [online, setOnline] = useState(() =>
        typeof navigator === 'undefined' ? true : navigator.onLine
    );
    const [justRestored, setJustRestored] = useState(false);

    useEffect(() => {
        const goOffline = () => {
            setOnline(false);
            setJustRestored(false);
        };

        const goOnline = () => {
            setOnline(true);
            setJustRestored(true);
        };

        window.addEventListener('offline', goOffline);
        window.addEventListener('online', goOnline);

        return () => {
            window.removeEventListener('offline', goOffline);
            window.removeEventListener('online', goOnline);
        };
    }, []);

    useEffect(() => {
        if (!justRestored) return;

        const timer = setTimeout(() => setJustRestored(false), 4000);

        return () => clearTimeout(timer);
    }, [justRestored]);

    if (online && !justRestored) return null;

    return (
        <div
            // aria-live : un lecteur d'écran doit annoncer le passage hors ligne, qui
            // change ce que l'utilisateur peut faire.
            role="status"
            aria-live="polite"
            className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3 sm:px-4 sm:pb-4"
        >
            <div
                className={`mx-auto flex max-w-2xl items-start gap-3 rounded-xl px-4 py-3 shadow-lg ring-1 ${
                    online
                        ? 'bg-emerald-600 text-white ring-emerald-700'
                        : 'bg-slate-900 text-slate-100 ring-slate-700'
                }`}
            >
                {online ? (
                    <Wifi className="mt-0.5 size-5 shrink-0" />
                ) : (
                    <CloudOff className="mt-0.5 size-5 shrink-0" />
                )}

                <div className="min-w-0">
                    <p className="text-sm font-semibold">
                        {online ? t.layout.offline.restored : t.layout.offline.title}
                    </p>
                    {!online && (
                        <p className="mt-0.5 text-xs leading-relaxed text-slate-300">
                            {t.layout.offline.message}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
