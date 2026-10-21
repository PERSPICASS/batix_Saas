import { useCallback, useEffect, useState } from 'react';
import { flush, listQueued, type QueuedSale } from './outbox';
import { isOfflineStorageAvailable } from './db';

/**
 * Relie la file d'attente locale à l'interface de caisse.
 *
 * La synchronisation se déclenche au montage et à chaque retour de réseau. Elle n'est
 * jamais automatique au point de masquer un problème : une session expirée ou une vente
 * refusée est remontée à l'appelant pour être affichée, car ces deux cas demandent une
 * décision humaine.
 */
export function useOfflineSales(syncUrl: string) {
    const [queued, setQueued] = useState<QueuedSale[]>([]);
    const [syncing, setSyncing] = useState(false);
    const [needsLogin, setNeedsLogin] = useState(false);

    const refresh = useCallback(async () => {
        if (!isOfflineStorageAvailable()) return;

        setQueued(await listQueued());
    }, []);

    const syncNow = useCallback(async () => {
        if (!isOfflineStorageAvailable()) return;
        if (typeof navigator !== 'undefined' && !navigator.onLine) return;

        const token = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content');

        if (!token) return;

        setSyncing(true);

        try {
            const outcome = await flush(syncUrl, token);
            setNeedsLogin(outcome.needsLogin);
        } finally {
            setSyncing(false);
            await refresh();
        }
    }, [syncUrl, refresh]);

    useEffect(() => {
        refresh();
        syncNow();

        const onOnline = () => syncNow();
        window.addEventListener('online', onOnline);

        return () => window.removeEventListener('online', onOnline);
    }, [refresh, syncNow]);

    return {
        queued,
        pendingCount: queued.filter((s) => s.status === 'pending').length,
        rejected: queued.filter((s) => s.status === 'rejected'),
        syncing,
        needsLogin,
        syncNow,
        refresh,
    };
}
