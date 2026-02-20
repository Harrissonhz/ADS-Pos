// ===== Service Worker ADS-POS =====

const CACHE_NAME = 'ads-pos-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/pages/login.html',
  '/pages/Menu.html',
  '/pages/panel.html',
  '/assets/css/main.css',
  '/assets/css/pos.css',
  '/assets/css/landing.css',
  '/assets/js/supabase-config.js',
  '/assets/js/database.js',
  '/assets/js/auth.js',
  '/assets/img/logo.png',
  '/assets/img/icon-192.png',
  '/assets/img/icon-512.png',
  '/manifest.json'
];

// Instalación: precache del shell de la app
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE).catch(() => undefined))
  );
});

// Activación: limpiar caches viejas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) =>
        Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
            return undefined;
          })
        )
      )
    ])
  );
});

// Estrategias de cache
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Solo manejar solicitudes GET
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // No interferir con llamadas a Supabase (siempre online)
  if (url.hostname.includes('supabase.co')) {
    return;
  }

  // Network First para navegación (HTML)
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
          return networkResponse;
        } catch (_error) {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          return caches.match('/index.html');
        }
      })()
    );
    return;
  }

  // Cache First para recursos estáticos
  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) return cachedResponse;

      try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (_error) {
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      }
    })()
  );
});

