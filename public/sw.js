const CACHE_NAME = 'apex-utility-static-v1';
const RUNTIME_CACHE_NAME = 'apex-utility-runtime-v1';

// Assets to cache immediately on SW install
const PRECACHE_ASSETS = [
  '/',
  '/index.html'
];

// Helper to check if a request can be cached by inspecting its URL and protocol
function isCacheable(request) {
  const url = new URL(request.url);
  // Only cache GET requests with HTTP/HTTPS schemes (no chrome-extension, data:, etc.)
  return request.method === 'GET' && (url.protocol === 'http:' || url.protocol === 'https:');
}

// Helper to determine if the request is an API call
function isApiRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/');
}

// Install Event
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching critical application shell');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.error('[Service Worker] Pre-cache failing for some items: ', err);
      });
    })
  );
});

// Activate Event - clean up obsolete caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((allCacheKeys) => {
      return Promise.all(
        allCacheKeys.map((key) => {
          if (key !== CACHE_NAME && key !== RUNTIME_CACHE_NAME) {
            console.log('[Service Worker] Evicting deprecated cache instance:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event Interceptor
self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (!isCacheable(request)) {
    return; // Pass through straight to network
  }

  // Handle server API request exceptions gracefully
  if (isApiRequest(request)) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            error: "You are currently offline. This cloud API service requires a live internet connection.",
            offline: true
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }

  // Caching Strategy: Stale-While-Revalidate for Web Apps / Static Files
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Fetch fresh version in the background
      const networkFetch = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && isCacheable(request)) {
          const cacheToUse = (PRECACHE_ASSETS.includes(new URL(request.url).pathname)) 
            ? CACHE_NAME 
            : RUNTIME_CACHE_NAME;
            
          caches.open(cacheToUse).then((cache) => {
            cache.put(request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch((err) => {
        console.warn('[Service Worker] Failed to update cache resource from network:', err);
      });

      // Return cached copy instantly if found, else wait for network response
      return cachedResponse || networkFetch;
    }).catch(() => {
      // Ultimate fallback to index.html if offline and requested a page render
      if (request.headers.get('accept').includes('text/html')) {
        return caches.match('/index.html') || caches.match('/');
      }
    })
  );
});
