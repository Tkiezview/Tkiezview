// TkiezView minimal service worker (cache-first for static assets)
const CACHE_NAME = 'tkiezview-v1';
const OFFLINE_URLS = [
  '/',
  '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(OFFLINE_URLS);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  event.respondWith((async () => {
    try {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      const network = await fetch(event.request);
      if (event.request.method === 'GET' && network.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, network.clone());
      }
      return network;
    } catch (err) {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      return caches.match('/');
    }
  })());
});
