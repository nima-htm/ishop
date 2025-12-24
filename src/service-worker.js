const CACHE_NAME = 'financial-manager-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/style.css',
  '/src/App.vue',
  '/src/main.js',
  '/src/router.js',
  '/src/views/DashboardView.vue',
  '/src/views/TransactionsView.vue',
  '/src/views/AddTransactionView.vue'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - handle network requests with cache strategy
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/') || event.request.url.includes('transactions')) {
    // Handle API requests with network-first strategy
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response to cache it
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request)
            .then((response) => {
              return response || caches.match('/index.html');
            });
        })
    );
  } else {
    // Handle static assets with cache-first strategy
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          return response || fetch(event.request);
        })
    );
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Listen for message events from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
