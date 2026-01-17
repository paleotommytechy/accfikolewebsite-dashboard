
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

if (workbox) {
  console.log('Workbox is loaded');

  // 1. Precache the App Shell
  // Note: In a production build, these would be injected with hashes.
  workbox.precaching.precacheAndRoute([
    { url: '/index.html', revision: '1' },
    { url: '/manifest.json', revision: '1' },
  ]);

  // 2. Cache CSS, JS, and Web Workers with Stale-While-Revalidate
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'style' || 
                     request.destination === 'script' || 
                     request.destination === 'worker',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'assets-cache',
    })
  );

  // 3. Cache Images with Cache-First Strategy
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: 'image-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        }),
      ],
    })
  );

  // 4. Cache Google Fonts
  workbox.routing.registerRoute(
    ({ url }) => url.origin === 'https://fonts.googleapis.com' || 
                 url.origin === 'https://fonts.gstatic.com',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'google-fonts',
    })
  );

  // 5. Background Sync for Prayer Requests and Messages
  const bgSyncPlugin = new workbox.backgroundSync.BackgroundSyncPlugin('failed-requests-queue', {
    maxRetentionTime: 24 * 60 // Retry for max 24 Hours
  });

  workbox.routing.registerRoute(
    ({ url }) => url.pathname.includes('/rest/v1/prayer_requests') || 
                 url.pathname.includes('/rest/v1/messages'),
    new workbox.strategies.NetworkOnly({
      plugins: [bgSyncPlugin]
    }),
    'POST'
  );

  // 6. SPA Routing: Fallback to index.html for navigation requests
  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    async () => {
      const cache = await caches.open(workbox.precaching.getCacheKeyForURL('/index.html'));
      return (await cache.match('/index.html')) || fetch('/index.html');
    }
  );

} else {
  console.log('Workbox failed to load');
}

// Push Notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'ACCF Ikole', body: 'New update available!' };
  const options = {
    body: data.body,
    icon: 'https://accfikolewebsite.vercel.app/assets/logo-CsSe79S4.jpg',
    badge: 'https://accfikolewebsite.vercel.app/assets/logo-CsSe79S4.jpg',
    data: { url: data.url || '/' }
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
