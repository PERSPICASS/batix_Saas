/*
 * Service worker BATIX PRO.
 *
 * Objectif de cette étape : rendre le tableau de bord consultable hors ligne sur les
 * pages déjà visitées. La saisie de ventes hors ligne (file d'attente + synchronisation)
 * viendra dans un second temps ; rien ici ne met de requête d'écriture en file.
 *
 * Trois caches distincts, pour pouvoir les invalider séparément :
 *   - STATIC : coquille de l'application, jamais sensible.
 *   - PAGES  : documents HTML des pages visitées.
 *   - DATA   : réponses JSON d'Inertia, qui portent les données métier.
 *
 * PAGES et DATA contiennent les données d'un locataire : ils sont purgés à la
 * déconnexion (voir l'interception de /logout plus bas). Sans cela, le téléphone
 * partagé d'une boutique garderait les données du compte précédent consultables hors
 * ligne après un changement d'utilisateur.
 */

const VERSION = 'v3';

// Seule la coquille est versionnée : elle doit correspondre au build servi, donc être
// remplacée à chaque déploiement.
const STATIC_CACHE = `batix-static-${VERSION}`;

// Pages et données ne le sont PAS, volontairement. Les versionner les faisait supprimer
// à chaque activation d'un nouveau service worker : un vendeur passant hors ligne juste
// après un déploiement perdait son catalogue et ses pages, exactement au moment où il en
// avait besoin. Ce ne sont que des données ; elles sont purgées à la déconnexion.
const PAGES_CACHE = 'batix-pages';
const DATA_CACHE = 'batix-data';

const OWNED_CACHES = [STATIC_CACHE, PAGES_CACHE, DATA_CACHE];
const TENANT_CACHES = [PAGES_CACHE, DATA_CACHE];

const OFFLINE_URL = '/offline.html';

const STATIC_ASSETS = [
    OFFLINE_URL,
    '/favicon.svg',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png',
];

/*
 * Jamais mis en cache : authentification, paiement, administration et API.
 * L'API porte des jetons Sanctum et servira le futur mode hors ligne, qui aura sa
 * propre stratégie — la mettre en cache ici produirait des lectures périmées
 * silencieuses.
 */
const NEVER_CACHE = [
    /^\/login/, /^\/logout/, /^\/register/, /^\/password/, /^\/two-factor/,
    /^\/verification/, /^\/email\/verify/,
    /^\/api\//, /^\/paddle\//, /^\/sanctum\//,
    /^\/platform-admin\//,
];

const isNeverCached = (pathname) => NEVER_CACHE.some((re) => re.test(pathname));

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            // addAll() est atomique : un seul 404 ferait échouer toute l'installation et
            // laisserait l'ancien service worker en place. On tolère donc les échecs
            // unitaires, la coquille n'étant pas critique.
            .then((cache) => Promise.allSettled(STATIC_ASSETS.map((a) => cache.add(a))))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(
                keys.filter((k) => k.startsWith('batix-') && !OWNED_CACHES.includes(k))
                    .map((k) => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    );
});

/** Supprime tout ce qui contient des données de compte. */
async function purgeTenantCaches() {
    await Promise.all(TENANT_CACHES.map((c) => caches.delete(c)));
}

self.addEventListener('message', (event) => {
    if (event.data?.type === 'PURGE_TENANT_CACHES') {
        event.waitUntil(purgeTenantCaches());
    }
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (url.origin !== self.location.origin) return;

    // Déconnexion : on laisse partir la requête, puis on purge. Traité avant le filtre
    // GET ci-dessous, puisque /logout est un POST.
    if (url.pathname.startsWith('/logout')) {
        event.respondWith(
            fetch(request).then(async (response) => {
                await purgeTenantCaches();
                return response;
            })
        );
        return;
    }

    if (request.method !== 'GET') return;
    if (isNeverCached(url.pathname)) return;

    // Assets de build : noms hachés par Vite, donc immuables → cache-first.
    if (url.pathname.startsWith('/build/')) {
        event.respondWith(
            caches.match(request).then((cached) => cached ?? fetch(request).then((res) => {
                if (res.ok) {
                    const clone = res.clone();
                    caches.open(STATIC_CACHE).then((c) => c.put(request, clone));
                }
                return res;
            }))
        );
        return;
    }

    // Requêtes Inertia : même URL que le document HTML mais réponse JSON, d'où un cache
    // séparé — les stocker ensemble ferait servir du JSON à la place d'une page.
    if (request.headers.get('X-Inertia')) {
        event.respondWith(networkFirst(request, DATA_CACHE));
        return;
    }

    if (request.mode === 'navigate' || request.headers.get('Accept')?.includes('text/html')) {
        event.respondWith(networkFirst(request, PAGES_CACHE, OFFLINE_URL));
        return;
    }
});

/**
 * Réseau d'abord, cache en repli.
 *
 * C'est le correctif du défaut de la version précédente : elle tentait un
 * `caches.match()` en repli sans jamais rien écrire dans le cache, si bien que le repli
 * ne pouvait aboutir. Ici, chaque réponse réussie alimente le cache qui la servira hors
 * ligne.
 */
async function networkFirst(request, cacheName, fallbackUrl = null) {
    try {
        const response = await fetch(request);

        if (response.ok) {
            const clone = response.clone();
            caches.open(cacheName).then((cache) => cache.put(request, clone));
        }

        return response;
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) return cached;

        if (fallbackUrl) {
            const offline = await caches.match(fallbackUrl);
            if (offline) return offline;
        }

        throw error;
    }
}
