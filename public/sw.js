// TkiezView SW v2 — network-first pour les pages, cache-first pour les assets
const CACHE_NAME = 'tkiezview-v2';
const ASSET_CACHE = [
  '/manifest.webmanifest'
];

// Utilitaire: est-ce une navigation (HTML) ?
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

// Pages: network-first ; Assets GET: cache-first
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // 1) Pages HTML → network-first pour voir les mises à jour
  if (isNavigationRequest(req)) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        // Optionnel: on peut mettre en cache la dernière page visitée
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (err) {
        const cached = await caches.match(req);
        if (cached) return cached;
        // Dernier recours: page d’accueil en cache s’il y en a une
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
