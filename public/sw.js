const CACHE_NAME = 'batix-v1';

const STATIC_ASSETS = [
    '/',
    '/favicon.svg',
    '/favicon.ico',
    '/manifest.json',
];

// Installation : mise en cache des assets statiques
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

// Activation : suppression des anciens caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch : network-first pour les pages, cache-first pour les assets statiques
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Ignorer les requêtes non-GET et les APIs externes
    if (request.method !== 'GET') return;
    if (!url.origin.startsWith(self.location.origin)) return;

    // Assets de build (JS/CSS) → cache-first
    if (url.pathname.startsWith('/build/')) {
        event.respondWith(
            caches.match(request).then(
                (cached) => cached ?? fetch(request).then((res) => {
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then((c) => c.put(request, clone));
                    return res;
                })
            )
        );
        return;
    }

    // Pages HTML → network-first, fallback cache
    if (request.headers.get('Accept')?.includes('text/html')) {
        event.respondWith(
            fetch(request).catch(() => caches.match(request))
        );
        return;
    }
});
