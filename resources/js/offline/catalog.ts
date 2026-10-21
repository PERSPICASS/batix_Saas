import { STORE_CATALOG, STORE_META, get, getAll, isOfflineStorageAvailable, put, replaceAll } from './db';

/**
 * Catalogue produits conservé sur l'appareil.
 *
 * Alimenté par les produits que la page caisse reçoit déjà à chaque affichage en ligne :
 * pas d'endpoint supplémentaire à écrire, à autoriser ni à maintenir.
 *
 * Les produits sont stockés dans la forme exacte où l'interface les consomme, avec leurs
 * déclinaisons imbriquées. Les aplatir aurait imposé de reconstruire l'arborescence à la
 * lecture, donc de dupliquer l'affichage de la liste pour le mode hors ligne.
 *
 * Ce magasin double le cache du service worker, qui garde lui aussi la réponse Inertia de
 * la page. La différence tient à la durée de vie : le cache est indexé par URL et lié à la
 * page visitée, tandis que celui-ci survit indépendamment et reste lisible depuis
 * n'importe quel écran.
 */

const LAST_SYNC_KEY = 'catalog_last_sync';

interface CachedEntry {
    id: number;
    shop_id: number;
    product: unknown;
}

/**
 * Remplace le catalogue local en une seule transaction, plutôt qu'un vidage suivi
 * d'écritures : un produit supprimé côté serveur doit disparaître ici aussi, et une
 * interruption ne doit pas laisser un catalogue à moitié écrit.
 */
export async function cacheCatalog(products: any[], shopId: number): Promise<void> {
    if (!isOfflineStorageAvailable()) return;

    // Une page rendue sans produits (erreur, chargement partiel) ne doit pas vider le
    // catalogue et laisser le vendeur sans rien au comptoir.
    if (products.length === 0) return;

    await replaceAll<CachedEntry>(
        STORE_CATALOG,
        products.map((product) => ({ id: product.id, shop_id: shopId, product }))
    );
    await put(STORE_META, { key: LAST_SYNC_KEY, value: new Date().toISOString() });
}

/** Rend les produits dans la forme attendue par l'écran de caisse. */
export async function readCatalog(shopId: number): Promise<any[]> {
    if (!isOfflineStorageAvailable()) return [];

    const entries = await getAll<CachedEntry>(STORE_CATALOG);

    // Filtré par boutique : sur un compte multi-boutiques, présenter le stock d'un autre
    // point de vente ferait vendre ce qui n'est pas dans le magasin.
    return entries.filter((e) => e.shop_id === shopId).map((e) => e.product);
}

export async function catalogLastSync(): Promise<Date | null> {
    if (!isOfflineStorageAvailable()) return null;

    const row = await get<{ key: string; value: string }>(STORE_META, LAST_SYNC_KEY);

    return row ? new Date(row.value) : null;
}
