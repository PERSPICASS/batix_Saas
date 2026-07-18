import { describe, expect, it, beforeEach, vi } from 'vitest';

const stores: Record<string, Map<any, any>> = {
    catalog: new Map(),
    meta: new Map(),
};

vi.mock('@/offline/db', () => ({
    STORE_CATALOG: 'catalog',
    STORE_META: 'meta',
    isOfflineStorageAvailable: () => true,
    put: async (store: string, value: any) => {
        stores[store].set(value.key ?? value.id, value);
    },
    get: async (store: string, key: any) => stores[store].get(key),
    getAll: async (store: string) => [...stores[store].values()],
    replaceAll: async (store: string, values: any[]) => {
        stores[store].clear();
        values.forEach((v) => stores[store].set(v.id, v));
    },
}));

const { cacheCatalog, catalogLastSync, readCatalog } = await import('@/offline/catalog');

const product = (over: Partial<any> = {}) => ({
    id: 1,
    name: 'Ciment 50kg',
    sku: 'CIM-50',
    selling_price: 5000,
    stock_quantity: 40,
    variations: [],
    ...over,
});

describe('catalogue hors ligne', () => {
    beforeEach(() => {
        stores.catalog.clear();
        stores.meta.clear();
    });

    it('rend les produits dans la forme exacte reçue par l\'écran de caisse', async () => {
        const peinture = product({
            id: 4,
            name: 'Peinture',
            variations: [{ id: 5, name: 'Blanc 5L', sku: 'P-B5', selling_price: 12000, stock_quantity: 3 }],
        });

        await cacheCatalog([peinture], 1);

        // Les déclinaisons restent imbriquées : la liste de la caisse les affiche telles
        // quelles, sans code de rendu distinct pour le mode hors ligne.
        const [cached] = await readCatalog(1);
        expect(cached).toEqual(peinture);
    });

    it('remplace le catalogue au lieu de le compléter', async () => {
        await cacheCatalog([product({ id: 1 }), product({ id: 2, name: 'Fer 8' })], 1);
        await cacheCatalog([product({ id: 1 })], 1);

        // Un produit supprimé côté serveur doit disparaître ici : le proposer encore
        // ferait vendre un article qui n'existe plus.
        expect((await readCatalog(1)).map((p: any) => p.id)).toEqual([1]);
    });

    it('ne rend que les produits de la boutique demandée', async () => {
        await cacheCatalog([product({ id: 1 })], 1);
        stores.catalog.set(99, { id: 99, shop_id: 2, product: product({ id: 99 }) });

        // Sur un compte multi-boutiques, afficher le stock d'un autre point de vente
        // ferait vendre ce qui n'est pas dans le magasin.
        expect((await readCatalog(1)).map((p: any) => p.id)).toEqual([1]);
    });

    it('n\'écrase pas un catalogue existant avec une liste vide', async () => {
        await cacheCatalog([product({ id: 1 })], 1);
        await cacheCatalog([], 1);

        // Une page rendue sans produits ne doit pas vider le catalogue et laisser le
        // vendeur sans rien au comptoir.
        expect(await readCatalog(1)).toHaveLength(1);
    });

    it('horodate la dernière mise à jour', async () => {
        expect(await catalogLastSync()).toBeNull();

        await cacheCatalog([product()], 1);

        expect(await catalogLastSync()).toBeInstanceOf(Date);
    });
});
