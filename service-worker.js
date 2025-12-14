
const CACHE_NAME = 'zula-fitflow-v5';
const urlsToCache = [
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    Promise.all([
        self.clients.claim(),
        caches.keys().then((cacheNames) => {
        return Promise.all(
            cacheNames.map((cacheName) => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
                return caches.delete(cacheName);
            }
            })
        );
        })
    ])
  );
});

self.addEventListener('fetch', (event) => {
  // Navigation requests (HTML) - Network First, fall back to Cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(() => {
          return caches.match('./index.html');
        })
    );
    return;
  }

  // Other requests - Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      });
      return cachedResponse || fetchPromise;
    })
  );
});