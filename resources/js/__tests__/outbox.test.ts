import { describe, expect, it, beforeEach, vi } from 'vitest';

/**
 * La file d'attente en mémoire remplace IndexedDB : ce qu'on veut vérifier est la
 * discipline de la file, pas l'implémentation du navigateur.
 */
const store = new Map<string, any>();

vi.mock('@/offline/db', () => ({
    STORE_OUTBOX: 'outbox',
    isOfflineStorageAvailable: () => true,
    put: async (_s: string, value: any) => {
        store.set(value.client_uuid, value);
    },
    getAll: async () => [...store.values()],
    remove: async (_s: string, key: string) => {
        store.delete(key);
    },
}));

const { enqueue, flush, listQueued, newClientUuid } = await import('@/offline/outbox');

function queuedSale(uuid: string) {
    return {
        client_uuid: uuid,
        shop_id: 1,
        payment_method: 'cash',
        amount_paid: 1000,
        sale_date: '2026-07-18 09:00:00',
        items: [{ product_id: 7, quantity: 1, unit_price: 1000 }],
    };
}

const jsonResponse = (body: unknown, status = 200) =>
    ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;

describe('file d\'attente des ventes hors ligne', () => {
    beforeEach(() => {
        store.clear();
    });

    it('génère des identifiants distincts', () => {
        const ids = new Set(Array.from({ length: 50 }, () => newClientUuid()));

        expect(ids.size).toBe(50);
    });

    it('retire une vente confirmée par le serveur', async () => {
        await enqueue(queuedSale('uuid-1'));

        const fetchImpl = vi.fn(async () =>
            jsonResponse({ results: [{ client_uuid: 'uuid-1', status: 'synced', ticket_number: 'T-1' }] })
        );

        const outcome = await flush('/sync', 'token', fetchImpl as unknown as typeof fetch);

        expect(outcome.synced).toBe(1);
        expect(await listQueued()).toHaveLength(0);
    });

    it('ne perd rien quand le réseau est toujours absent', async () => {
        await enqueue(queuedSale('uuid-1'));

        const fetchImpl = vi.fn(async () => {
            throw new Error('network down');
        });

        const outcome = await flush('/sync', 'token', fetchImpl as unknown as typeof fetch);

        // Une vente encaissée ne disparaît jamais parce que le réseau a lâché.
        expect(outcome.kept).toBe(1);
        expect(await listQueued()).toHaveLength(1);
    });

    it('garde la file intacte et réclame une reconnexion si la session a expiré', async () => {
        await enqueue(queuedSale('uuid-1'));
        await enqueue(queuedSale('uuid-2'));

        const fetchImpl = vi.fn(async () => jsonResponse({}, 419));

        const outcome = await flush('/sync', 'token', fetchImpl as unknown as typeof fetch);

        // SESSION_LIFETIME est à 2 h : un vendeur hors ligne plus longtemps tombe ici.
        expect(outcome.needsLogin).toBe(true);
        expect(outcome.kept).toBe(2);
        expect(await listQueued()).toHaveLength(2);
    });

    it('conserve une vente refusée en la motivant, au lieu de l\'effacer', async () => {
        await enqueue(queuedSale('uuid-1'));

        const fetchImpl = vi.fn(async () =>
            jsonResponse({
                results: [{ client_uuid: 'uuid-1', status: 'rejected', message: 'Stock insuffisant' }],
            })
        );

        const outcome = await flush('/sync', 'token', fetchImpl as unknown as typeof fetch);

        expect(outcome.rejected).toBe(1);

        const [kept] = await listQueued();
        // L'argent a été encaissé au comptoir : effacer la vente en silence la ferait
        // disparaître de la caisse comme du stock, sans que personne ne le sache.
        expect(kept.status).toBe('rejected');
        expect(kept.error).toBe('Stock insuffisant');
    });

    it('ne renvoie pas une vente déjà refusée', async () => {
        await enqueue(queuedSale('uuid-1'));

        const rejecting = vi.fn(async () =>
            jsonResponse({ results: [{ client_uuid: 'uuid-1', status: 'rejected', message: 'Stock insuffisant' }] })
        );
        await flush('/sync', 'token', rejecting as unknown as typeof fetch);

        const second = vi.fn(async () => jsonResponse({ results: [] }));
        await flush('/sync', 'token', second as unknown as typeof fetch);

        // Rien à renvoyer : inutile de harceler le serveur avec une vente qu'il a
        // définitivement refusée, elle attend un arbitrage humain.
        expect(second).not.toHaveBeenCalled();
    });

    it('garde une vente absente de la réponse du serveur', async () => {
        await enqueue(queuedSale('uuid-1'));
        await enqueue(queuedSale('uuid-2'));

        const fetchImpl = vi.fn(async () =>
            jsonResponse({ results: [{ client_uuid: 'uuid-1', status: 'synced', ticket_number: 'T-1' }] })
        );

        const outcome = await flush('/sync', 'token', fetchImpl as unknown as typeof fetch);

        expect(outcome.synced).toBe(1);
        expect(outcome.kept).toBe(1);

        const remaining = await listQueued();
        expect(remaining).toHaveLength(1);
        expect(remaining[0].client_uuid).toBe('uuid-2');
    });

    it('n\'envoie pas les champs locaux au serveur', async () => {
        await enqueue({ ...queuedSale('uuid-1'), label: 'Ciment 50kg', total: 1000 });

        let sentBody: any;
        const fetchImpl = vi.fn(async (_url: string, init: any) => {
            sentBody = JSON.parse(init.body);
            return jsonResponse({ results: [{ client_uuid: 'uuid-1', status: 'synced' }] });
        });

        await flush('/sync', 'token', fetchImpl as unknown as typeof fetch);

        const sent = sentBody.sales[0];
        // La validation serveur est stricte ; un champ local en trop la ferait échouer.
        expect(sent).not.toHaveProperty('status');
        expect(sent).not.toHaveProperty('queued_at');
        expect(sent).not.toHaveProperty('label');
        expect(sent.client_uuid).toBe('uuid-1');
        expect(sent.items).toHaveLength(1);
    });
});
