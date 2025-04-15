// const { response } = require("express");

const CACHE_NAME = "sticky-notes-phase3-cache-v7";
const urlsToCache = [
  "/",
  "/index.html",
  "/style.css",
  "/script.js",
  "/db.js",
  "/login.html",
  "/register.html",
  "/login-styles.css",
  "/register-styles.css",
  "/auth.js",
  "/manifest.json",
  "/service-worker.js",
  "/icons/icon.png",
  "/screenshots/home.jpg",
  "/screenshots/home2.jpg",
  "/screenshots/login.jpg",
  "https://code.jquery.com/jquery-3.6.0.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jqueryui-touch-punch/0.2.3/jquery.ui.touch-punch.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css",
  "https://code.jquery.com/ui/1.12.1/jquery-ui.js",
  "https://cdnjs.cloudflare.com/ajax/libs/spectrum/1.8.1/spectrum.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/spectrum/1.8.1/spectrum.min.js",
  "https://cdn.jsdelivr.net/npm/sweetalert2@11",
  "https://cdn.jsdelivr.net/npm/toastify-js",
  "https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css"

];

// Skip the secure origin check
self.addEventListener('install', event => {
  // Bypass the default security checks
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Attempting to cache files in development mode...');
      
      // Cache files individually to prevent one failure from breaking everything
      return Promise.allSettled(
        urlsToCache.map(url => 
          cache.add(url)
            .then(() => console.log(`Cached successfully: ${url}`))
            .catch(err => console.error(`Failed to cache ${url}:`, err))
        )
      );
    })
  );
});

self.addEventListener('activate', event => {
  // Clean up old caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('New service worker activated');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', event => {
  // Skip WebSocket connections
  if (event.request.url.includes('/ws')) {
    return;
  }
  
  // Skip API requests and let them go directly to the network
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(error => {
          console.error('API fetch failed:', error);
          return new Response(JSON.stringify({ error: 'Network error' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // For all other requests, try cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Return cached response
          return cachedResponse;
        }
        
        // Not in cache, try network
        return fetch(event.request)
          .then(response => {
            // Don't cache non-successful responses or non-GET requests
            if (!response || response.status !== 200 || event.request.method !== 'GET') {
              return response;
            }

            // Clone the response to cache it and return the original
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                try {
                  cache.put(event.request, responseToCache);
                  console.log(`Cached dynamically: ${event.request.url}`);
                } catch (err) {
                  console.error(`Cache put error for ${event.request.url}:`, err);
                }
              });

            return response;
          })
          .catch(error => {
            console.error(`Network fetch failed for ${event.request.url}:`, error);
            
            // Special handling for HTML requests
            if (event.request.headers.get('Accept').includes('text/html')) {
              return caches.match('/index.html')
                .then(fallbackResponse => {
                  return fallbackResponse || 
                    new Response('<html><body><h1>Offline</h1><p>The app is currently offline.</p></body></html>', {
                      headers: { 'Content-Type': 'text/html' }
                    });
                });
            }
            
            // Special handling for images
            if (event.request.url.match(/\.(jpg|jpeg|png|gif|svg|ico)$/)) {
              return new Response('', { status: 503 });
            }
            
            // Default response
            return new Response('Resource unavailable offline', { status: 503 });
          });
      })
  );
});