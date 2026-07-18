/**
 * Accès IndexedDB pour le mode hors ligne.
 *
 * Écrit à la main plutôt qu'avec une bibliothèque : la surface utilisée ici tient en
 * quelques opérations, et une dépendance de plus signifie une reconstruction d'image et
 * un déploiement à chaque mise à jour, sur un projet où le déploiement est déjà le
 * maillon le plus fragile.
 *
 * localStorage ne conviendrait pas : il est synchrone (il gèle l'interface de la caisse
 * pendant l'écriture) et plafonné à quelques mégaoctets, alors qu'un catalogue de
 * quincaillerie dépasse facilement le millier de références.
 */

const DB_NAME = 'batix-offline';
const DB_VERSION = 1;

export const STORE_OUTBOX = 'outbox';
export const STORE_CATALOG = 'catalog';
export const STORE_META = 'meta';

let dbPromise: Promise<IDBDatabase> | null = null;

/** IndexedDB est absent en SSR et dans certains navigateurs en navigation privée. */
export function isOfflineStorageAvailable(): boolean {
    return typeof indexedDB !== 'undefined';
}

function openDatabase(): Promise<IDBDatabase> {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;

            if (!db.objectStoreNames.contains(STORE_OUTBOX)) {
                // client_uuid en clé : c'est le même identifiant qui garantit
                // l'idempotence côté serveur, donc une vente ne peut pas être mise en
                // file deux fois, même si l'utilisateur valide deux fois.
                const outbox = db.createObjectStore(STORE_OUTBOX, { keyPath: 'client_uuid' });
                outbox.createIndex('status', 'status');
            }

            if (!db.objectStoreNames.contains(STORE_CATALOG)) {
                const catalog = db.createObjectStore(STORE_CATALOG, { keyPath: 'id' });
                catalog.createIndex('shop_id', 'shop_id');
            }

            if (!db.objectStoreNames.contains(STORE_META)) {
                db.createObjectStore(STORE_META, { keyPath: 'key' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        // Une autre onglet a demandé une montée de version : on ne bloque pas.
        request.onblocked = () => reject(new Error('IndexedDB bloquée par un autre onglet'));
    });

    // Ne pas mémoriser un échec : le prochain appel doit pouvoir retenter.
    dbPromise.catch(() => {
        dbPromise = null;
    });

    return dbPromise;
}

function run<T>(
    store: string,
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
    return openDatabase().then(
        (db) =>
            new Promise<T>((resolve, reject) => {
                const tx = db.transaction(store, mode);
                const request = operation(tx.objectStore(store));

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
                tx.onabort = () => reject(tx.error);
            })
    );
}

export function put<T>(store: string, value: T): Promise<IDBValidKey> {
    return run(store, 'readwrite', (s) => s.put(value as unknown as any));
}

export function getAll<T>(store: string): Promise<T[]> {
    return run<T[]>(store, 'readonly', (s) => s.getAll() as IDBRequest<T[]>);
}

export function get<T>(store: string, key: IDBValidKey): Promise<T | undefined> {
    return run<T | undefined>(store, 'readonly', (s) => s.get(key) as IDBRequest<T | undefined>);
}

export function remove(store: string, key: IDBValidKey): Promise<undefined> {
    return run<undefined>(store, 'readwrite', (s) => s.delete(key) as IDBRequest<undefined>);
}

export function clear(store: string): Promise<undefined> {
    return run<undefined>(store, 'readwrite', (s) => s.clear() as IDBRequest<undefined>);
}

/** Remplace tout le contenu d'un magasin en une seule transaction. */
export function replaceAll<T>(store: string, values: T[]): Promise<void> {
    return openDatabase().then(
        (db) =>
            new Promise<void>((resolve, reject) => {
                const tx = db.transaction(store, 'readwrite');
                const objectStore = tx.objectStore(store);

                objectStore.clear();
                values.forEach((value) => objectStore.put(value as unknown as any));

                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
                tx.onabort = () => reject(tx.error);
            })
    );
}

/**
 * Efface le catalogue mis en cache, en miroir de la purge des caches du service worker
 * à la déconnexion.
 *
 * La file d'attente (STORE_OUTBOX) est délibérément épargnée. L'effacer à la
 * déconnexion supprimerait des ventes réellement encaissées au comptoir et jamais
 * transmises — de l'argent perdu sans trace. Le compromis est assumé : la vente en
 * attente reste visible pour l'utilisateur suivant sur le même appareil. La frontière
 * de sécurité, elle, tient côté serveur, où la synchronisation vérifie
 * `accessibleShopsQuery()` et refuse une vente destinée à une boutique que le compte
 * connecté ne peut pas voir.
 *
 * Pour purger réellement la file, il faut passer par l'écran de caisse, une fois les
 * ventes envoyées ou arbitrées.
 */
export async function purgeCachedCatalog(): Promise<void> {
    if (!isOfflineStorageAvailable()) return;

    await Promise.all([clear(STORE_CATALOG), clear(STORE_META)]);
}
