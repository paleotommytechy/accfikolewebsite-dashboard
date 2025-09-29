const CACHE_NAME = 'accf-dashboard-cache-v2';
// These are the core files for the app shell.
// More resources will be cached on the fly.
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/index.tsx',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://accfikolewebsite.vercel.app/assets/logo-CsSe79S4.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(APP_SHELL_URLS);
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // We only want to handle GET requests.
    if (event.request.method !== 'GET') {
        return;
    }

    // For Supabase and other API calls, always go to the network.
    if (event.request.url.includes('supabase.co')) {
        return;
    }

    event.respondWith(
        caches.open(CACHE_NAME).then(async (cache) => {
            // Try to get the response from the cache.
            const cachedResponse = await cache.match(event.request);
            
            // Return cached response if found, otherwise fetch from network.
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                // Check if we received a valid response
                if (networkResponse && networkResponse.ok) {
                    const responseToCache = networkResponse.clone();
                    cache.put(event.request, responseToCache);
                }
                return networkResponse;
            }).catch(() => {
                // If the network fails, and we didn't have a cached response,
                // we can return a fallback page or just let the request fail.
            });
            
            return cachedResponse || fetchPromise;
        })
    );
});