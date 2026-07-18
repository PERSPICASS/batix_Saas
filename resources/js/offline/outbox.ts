import { STORE_OUTBOX, getAll, isOfflineStorageAvailable, put, remove } from './db';

/**
 * File d'attente des ventes saisies hors ligne.
 *
 * Règle fondatrice : une vente n'est retirée de la file que sur confirmation explicite
 * du serveur. Tout le reste — perte de réseau, session expirée, onglet fermé, téléphone
 * éteint — la laisse en place. La seule issue acceptable pour de l'argent encaissé est
 * qu'il finisse enregistré ou qu'il reste visible en attente ; jamais qu'il disparaisse.
 */

export type QueuedSaleStatus = 'pending' | 'rejected';

export interface QueuedSaleItem {
    product_id: number;
    quantity: number;
    unit_price: number;
}

export interface QueuedSale {
    client_uuid: string;
    shop_id: number;
    customer_id?: number | null;
    payment_method: string;
    amount_paid: number;
    discount_amount?: number;
    sale_date: string;
    notes?: string | null;
    items: QueuedSaleItem[];
    /** Champs locaux, retirés avant l'envoi au serveur. */
    status: QueuedSaleStatus;
    error?: string | null;
    queued_at: string;
    /** Libellés figés à la saisie, pour afficher la file sans le catalogue. */
    label?: string;
    total?: number;
}

export interface SyncResult {
    client_uuid: string;
    status: 'synced' | 'rejected' | 'failed';
    ticket_number?: string;
    message?: string;
}

export interface FlushOutcome {
    synced: number;
    rejected: number;
    /** Restées en file : à retenter plus tard, rien n'est perdu. */
    kept: number;
    /** Session expirée : l'utilisateur doit se reconnecter pour que la file reparte. */
    needsLogin: boolean;
}

/** Un identifiant stable, généré avant toute tentative d'envoi. */
export function newClientUuid(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
    }

    // Repli pour les navigateurs anciens : suffisant ici, l'unicité n'a besoin d'être
    // garantie que parmi les ventes en attente d'un seul appareil.
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export async function enqueue(sale: Omit<QueuedSale, 'status' | 'queued_at'>): Promise<void> {
    await put(STORE_OUTBOX, {
        ...sale,
        status: 'pending' as const,
        queued_at: new Date().toISOString(),
    });
}

export async function listQueued(): Promise<QueuedSale[]> {
    if (!isOfflineStorageAvailable()) return [];

    const sales = await getAll<QueuedSale>(STORE_OUTBOX);

    return sales.sort((a, b) => a.queued_at.localeCompare(b.queued_at));
}

export async function countPending(): Promise<number> {
    return (await listQueued()).filter((s) => s.status === 'pending').length;
}

/** Retire une vente refusée après arbitrage du gérant. */
export async function discard(clientUuid: string): Promise<void> {
    await remove(STORE_OUTBOX, clientUuid);
}

/** Ce que le serveur accepte : les champs locaux ne lui sont pas envoyés. */
function toPayload(sale: QueuedSale) {
    const { status, error, queued_at, label, total, ...payload } = sale;

    return payload;
}

/**
 * Envoie les ventes en attente et applique les réponses.
 *
 * `syncUrl` vient de Ziggy côté appelant : ce module ne connaît pas les routes.
 */
export async function flush(
    syncUrl: string,
    csrfToken: string,
    fetchImpl: typeof fetch = fetch
): Promise<FlushOutcome> {
    const outcome: FlushOutcome = { synced: 0, rejected: 0, kept: 0, needsLogin: false };

    if (!isOfflineStorageAvailable()) return outcome;

    const pending = (await listQueued()).filter((s) => s.status === 'pending');

    if (pending.length === 0) return outcome;

    let response: Response;

    try {
        response = await fetchImpl(syncUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'same-origin',
            body: JSON.stringify({ sales: pending.map(toPayload) }),
        });
    } catch {
        // Réseau toujours absent : on ne touche à rien, la file repartira plus tard.
        outcome.kept = pending.length;
        return outcome;
    }

    // 401/419 : session expirée pendant que le vendeur était hors ligne. Surtout ne rien
    // supprimer — l'utilisateur se reconnecte et la file repart intacte.
    if (response.status === 401 || response.status === 419) {
        outcome.kept = pending.length;
        outcome.needsLogin = true;
        return outcome;
    }

    if (!response.ok) {
        outcome.kept = pending.length;
        return outcome;
    }

    const body = (await response.json()) as { results?: SyncResult[] };
    const results = body.results ?? [];
    const byUuid = new Map(results.map((r) => [r.client_uuid, r]));

    for (const sale of pending) {
        const result = byUuid.get(sale.client_uuid);

        if (!result || result.status === 'failed') {
            // Absente de la réponse ou échec temporaire : on la garde.
            outcome.kept += 1;
            continue;
        }

        if (result.status === 'synced') {
            await discard(sale.client_uuid);
            outcome.synced += 1;
            continue;
        }

        // Refus définitif (stock insuffisant, boutique inaccessible). On la conserve en
        // la marquant, pour que le gérant voie ce qui n'est pas passé et pourquoi.
        // La supprimer silencieusement effacerait une vente réellement encaissée.
        await put(STORE_OUTBOX, { ...sale, status: 'rejected' as const, error: result.message ?? null });
        outcome.rejected += 1;
    }

    return outcome;
}
