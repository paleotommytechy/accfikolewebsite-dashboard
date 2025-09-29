const CACHE_NAME = 'accf-dashboard-cache-v3';
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
  // We only want to handle GET requests. Ignore others, like Supabase API calls.
  if (event.request.method !== 'GET' || event.request.url.includes('supabase.co')) {
    return;
  }

  // Use a network-first strategy with a fallback for SPA navigation.
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        // 1. Try to fetch from the network first.
        const networkResponse = await fetch(event.request);
        
        // 2. If successful, cache the response and return it.
        if (networkResponse.ok) {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;

      } catch (error) {
        // 3. If the network fails, try to serve from the cache.
        console.log('[Service Worker] Network request failed, trying cache for:', event.request.url);
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // 4. If it's a navigation request and not in cache, serve the app shell.
        // This is the key to fixing the SPA 404 issue.
        if (event.request.mode === 'navigate') {
          console.log('[Service Worker] Serving index.html as fallback for navigation.');
          const appShell = await cache.match('/index.html');
          if (appShell) {
            return appShell;
          }
        }
        
        // 5. If it's another type of asset and not in the cache, the request will fail.
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
