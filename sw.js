const CACHE_NAME = 'accf-dashboard-cache-v4';
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
  // Ignore non-GET requests and Supabase API calls.
  if (event.request.method !== 'GET' || event.request.url.includes('supabase.co')) {
    return;
  }

  // Use a cache-first strategy for all assets.
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // 1. Try to get the response from the cache.
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse) {
        // If found, return it.
        return cachedResponse;
      }

      // 2. If not in cache, fetch from the network.
      try {
        const networkResponse = await fetch(event.request);
        
        // 3. Cache the new response and return it.
        // This condition ensures we only cache valid responses.
        if (networkResponse && networkResponse.status === 200) {
           cache.put(event.request, networkResponse.clone());
        } else if (event.request.url.startsWith('https://esm.sh/')) {
           // Also cache CDN dependencies which might not have standard response types
           cache.put(event.request, networkResponse.clone());
        }

        return networkResponse;
      } catch (error) {
        // 4. If network fails and it's a navigation request, serve the SPA fallback.
        console.log('[Service Worker] Network request failed for:', event.request.url);
        if (event.request.mode === 'navigate') {
          const appShell = await cache.match('/index.html');
          if (appShell) {
            return appShell;
          }
        }
        // For other assets, the fetch will fail if not in cache, which is expected offline behavior.
        return new Response('Content not available offline.', {
          status: 404,
          statusText: 'Not Found',
          headers: { 'Content-Type': 'text/plain' },
        });
      }
    })
  );
});


// --- PUSH NOTIFICATION LOGIC ---

self.addEventListener('push', (event) => {
    let data = {};
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            console.error('Push event data is not valid JSON', e);
            data = { body: event.data.text() };
        }
    }

    const title = data.title || 'New Notification';
    const options = {
        body: data.body || 'You have a new update.',
        icon: data.icon || 'https://accfikolewebsite.vercel.app/assets/logo-CsSe79S4.jpg',
        badge: 'https://accfikolewebsite.vercel.app/assets/logo-CsSe79S4.jpg',
        data: {
            url: data.url || '/'
        }
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;
            
            // Check if there's already a window open with the same URL.
            for (const client of clientList) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            
            // If not, open a new window.
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});