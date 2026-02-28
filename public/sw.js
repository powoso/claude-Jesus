const CACHE_NAME = 'daily-walk-v2';
const OFFLINE_URL = '/devotional';

// Pre-cache core app shell
const PRECACHE_URLS = [
  '/',
  '/devotional',
  '/journal',
  '/prayer',
  '/reading',
  '/memory',
  '/gratitude',
  '/growth',
  '/settings',
  '/about',
  '/favicon.svg',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {
        // Individual failures are OK — we'll cache on demand
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip non-http(s) requests
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // Serve from cache when offline
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // For navigation requests, serve the offline page
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Handle notification click — open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow('/devotional');
    })
  );
});

// Handle scheduled notification messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_REMINDER') {
    self.reminderTime = event.data.time;
    self.reminderEnabled = true;
    scheduleNextReminder();
  }
  if (event.data && event.data.type === 'CANCEL_REMINDER') {
    self.reminderEnabled = false;
    if (self.reminderTimeout) {
      clearTimeout(self.reminderTimeout);
      self.reminderTimeout = null;
    }
  }
});

function scheduleNextReminder() {
  if (!self.reminderEnabled || !self.reminderTime) return;
  if (self.reminderTimeout) clearTimeout(self.reminderTimeout);

  const [hours, minutes] = self.reminderTime.split(':').map(Number);
  const now = new Date();
  const target = new Date(now);
  target.setHours(hours, minutes, 0, 0);

  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  const delay = target.getTime() - now.getTime();

  self.reminderTimeout = setTimeout(() => {
    self.registration.showNotification('Daily Walk', {
      body: 'Time for your daily walk with Jesus. Your verse is waiting.',
      icon: '/icon-192.png',
      badge: '/icon-96.png',
      tag: 'daily-reminder',
      renotify: true,
    });
    scheduleNextReminder();
  }, delay);
}
