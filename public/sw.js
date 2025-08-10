// TkiezView SW v4 — network-first pour les pages, cache-first pour les assets
const CACHE_NAME = 'tkiezview-v4';
const ASSET_CACHE = [
  '/manifest.webmanifest'
];

function isNavigationRequest(request) {
  return request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html');
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(ASSET_CACHE);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // 1) Pages HTML → network-first (pour voir les maj tout de suite)
  if (isNavigationRequest(req)) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (err) {
        const cached = await caches.match(req);
        if (cached) return cached;
        return caches.match('/');
      }
    })());
    return;
  }

  // 2) Autres GET (assets) → cache-first
  if (req.method === 'GET') {
    event.respondWith((async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      const network = await fetch(req);
      if (network.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, network.clone());
      }
      return network;
    })());
  }
});
