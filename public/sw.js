self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

/* ── Web Push ─────────────────────────────────────────────────────────────
   Fires when the backend sends a push (see services/push_service.py on the
   server) — this is what makes a notification appear even when KotaBites
   isn't open in any tab. Payload shape is set in push_service._build_payload:
   { title, body, url, icon, badge }.
*/
self.addEventListener('push', (event) => {
  let data = { title: 'KotaBites', body: 'You have a new update.', url: '/' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    // Payload wasn't JSON — fall back to plain text if present
    if (event.data) data.body = event.data.text();
  }

  const options = {
    body: data.body,
    icon: data.icon || '/logo-192.png',
    badge: data.badge || '/logo-192.png',
    data: { url: data.url || '/' },
    vibrate: [100, 50, 100],
    tag: data.tag || 'kotabites-notification',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

/* Clicking the notification focuses an existing KotaBites tab if one is
   open (navigating it to the target URL), otherwise opens a new one. */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({ type: 'PUSH_NOTIFICATION_CLICK', url: targetUrl });
          client.focus();
          if ('navigate' in client) client.navigate(targetUrl);
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
