import { describe, expect, it, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * public/sw.js runs in a ServiceWorkerGlobalScope, which no test runner provides, so we
 * evaluate it against a stub scope and drive the captured handlers by hand.
 *
 * This is worth the harness: the previous service worker fell back to `caches.match()`
 * without ever writing a response to the cache, so its offline fallback could never
 * resolve. It looked correct and did nothing — exactly the kind of failure a test has
 * to catch, since you only discover it with no network and a customer waiting.
 */

type Handler = (event: any) => void;

interface Scope {
    handlers: Record<string, Handler>;
    caches: {
        store: Map<string, Map<string, any>>;
        open: (name: string) => Promise<any>;
        match: (request: any) => Promise<any>;
        keys: () => Promise<string[]>;
        delete: (name: string) => Promise<boolean>;
    };
}

function loadServiceWorker(fetchImpl: (request: any) => Promise<any>): Scope {
    const store = new Map<string, Map<string, any>>();

    const cacheFor = (name: string) => {
        if (!store.has(name)) store.set(name, new Map());
        const entries = store.get(name)!;

        return {
            put: async (request: any, response: any) => {
                entries.set(keyOf(request), response);
            },
            match: async (request: any) => entries.get(keyOf(request)),
            add: async () => undefined,
            addAll: async () => undefined,
        };
    };

    const cachesStub = {
        store,
        open: async (name: string) => cacheFor(name),
        match: async (request: any) => {
            for (const entries of store.values()) {
                const hit = entries.get(keyOf(request));
                if (hit) return hit;
            }
            return undefined;
        },
        keys: async () => [...store.keys()],
        delete: async (name: string) => store.delete(name),
    };

    const handlers: Record<string, Handler> = {};

    const self: any = {
        addEventListener: (type: string, handler: Handler) => {
            handlers[type] = handler;
        },
        location: { origin: 'https://batixpro.com' },
        skipWaiting: () => undefined,
        clients: { claim: async () => undefined },
    };
    self.self = self;

    const code = readFileSync(resolve(__dirname, '../../../public/sw.js'), 'utf8');
    // eslint-disable-next-line no-new-func
    new Function('self', 'caches', 'fetch', 'URL', code)(self, cachesStub, fetchImpl, URL);

    return { handlers, caches: cachesStub };
}

const keyOf = (request: any) => (typeof request === 'string' ? request : request.url);

function makeRequest(url: string, init: { method?: string; headers?: Record<string, string>; mode?: string } = {}) {
    const headers = new Map(Object.entries(init.headers ?? {}));

    return {
        url,
        method: init.method ?? 'GET',
        mode: init.mode,
        headers: { get: (name: string) => headers.get(name) ?? null },
    };
}

/** Captures what the handler passed to event.respondWith(), and whether it did. */
function makeEvent(request: any) {
    const event: any = { request, handled: false };
    event.responded = new Promise((resolvePromise) => {
        event.respondWith = (value: any) => {
            event.handled = true;
            resolvePromise(value);
        };
    });
    event.waitUntil = (value: any) => value;

    return event;
}

const okResponse = (body: string) => ({
    ok: true,
    body,
    clone() {
        return { ...this, clone: this.clone };
    },
});

describe('service worker', () => {
    let online: boolean;
    let fetchCalls: string[];

    const fetchImpl = async (request: any) => {
        fetchCalls.push(keyOf(request));
        if (!online) throw new Error('network down');
        return okResponse(`fresh:${keyOf(request)}`);
    };

    beforeEach(() => {
        online = true;
        fetchCalls = [];
    });

    it('stores a visited page so it survives losing the network', async () => {
        const sw = loadServiceWorker(fetchImpl);
        const url = 'https://batixpro.com/dashboard';

        const first = makeEvent(makeRequest(url, { mode: 'navigate' }));
        sw.handlers.fetch(first);
        expect((await (await first.responded)).body).toBe(`fresh:${url}`);

        // Let the cache write settle: networkFirst puts without awaiting.
        await vi.waitFor(async () => {
            expect(await sw.caches.match(makeRequest(url))).toBeTruthy();
        });

        online = false;

        const second = makeEvent(makeRequest(url, { mode: 'navigate' }));
        sw.handlers.fetch(second);

        // The regression that motivated this file: without the cache write above, this
        // resolved to the offline page — or threw — instead of the real dashboard.
        expect((await (await second.responded)).body).toBe(`fresh:${url}`);
    });

    it('falls back to the offline page for a route never visited', async () => {
        const sw = loadServiceWorker(fetchImpl);

        const cache = await sw.caches.open('batix-static-v3');
        await cache.put('/offline.html', okResponse('offline-page'));

        online = false;

        const event = makeEvent(makeRequest('https://batixpro.com/produits', { mode: 'navigate' }));
        sw.handlers.fetch(event);

        expect((await (await event.responded)).body).toBe('offline-page');
    });

    it('keeps Inertia data separate from the HTML of the same URL', async () => {
        const sw = loadServiceWorker(fetchImpl);
        const url = 'https://batixpro.com/dashboard';

        const page = makeEvent(makeRequest(url, { mode: 'navigate' }));
        sw.handlers.fetch(page);
        await page.responded;

        const data = makeEvent(makeRequest(url, { headers: { 'X-Inertia': 'true' } }));
        sw.handlers.fetch(data);
        await data.responded;

        await vi.waitFor(() => {
            // Same URL, two caches. Sharing one would serve JSON where a page belongs.
            expect(sw.caches.store.get('batix-pages')?.has(url)).toBe(true);
            expect(sw.caches.store.get('batix-data')?.has(url)).toBe(true);
        });
    });

    it('never caches authentication or API responses', async () => {
        const sw = loadServiceWorker(fetchImpl);

        for (const path of ['/login', '/api/v1/products', '/platform-admin/shops']) {
            const event = makeEvent(makeRequest(`https://batixpro.com${path}`, { mode: 'navigate' }));
            sw.handlers.fetch(event);

            // The worker must not call respondWith at all here: the request goes
            // straight to the network, so nothing can be served stale later.
            expect(event.handled, `${path} must not be intercepted`).toBe(false);
        }

        expect(sw.caches.store.get('batix-pages')?.size ?? 0).toBe(0);
    });

    it('keeps pages and data when a new version activates', async () => {
        const sw = loadServiceWorker(fetchImpl);

        (await sw.caches.open('batix-pages')).put('https://batixpro.com/ventes/create', okResponse('catalogue'));
        (await sw.caches.open('batix-data')).put('https://batixpro.com/ventes/create', okResponse('produits'));
        // Coquille d'un déploiement précédent : celle-là doit bien disparaître.
        (await sw.caches.open('batix-static-v1')).put('/old', okResponse('vieille coquille'));

        await sw.handlers.activate({ waitUntil: (p: any) => p });
        await vi.waitFor(() => {
            expect(sw.caches.store.has('batix-static-v1')).toBe(false);
        });

        // La régression corrigée : les caches de pages et de données étaient versionnés,
        // donc supprimés à chaque déploiement. Un vendeur passant hors ligne juste après
        // une mise à jour perdait son catalogue.
        expect(sw.caches.store.has('batix-pages')).toBe(true);
        expect(sw.caches.store.has('batix-data')).toBe(true);
    });

    it('purges tenant data on logout but keeps the app shell', async () => {
        const sw = loadServiceWorker(fetchImpl);

        (await sw.caches.open('batix-pages')).put('https://batixpro.com/dashboard', okResponse('page'));
        (await sw.caches.open('batix-data')).put('https://batixpro.com/dashboard', okResponse('data'));
        (await sw.caches.open('batix-static-v3')).put('/offline.html', okResponse('shell'));

        const event = makeEvent(makeRequest('https://batixpro.com/logout', { method: 'POST' }));
        sw.handlers.fetch(event);
        await event.responded;

        await vi.waitFor(() => {
            // A shop's shared phone must not keep the previous account's data readable
            // offline after someone else signs in.
            expect(sw.caches.store.has('batix-pages')).toBe(false);
            expect(sw.caches.store.has('batix-data')).toBe(false);
        });

        expect(sw.caches.store.has('batix-static-v3')).toBe(true);
    });
});
