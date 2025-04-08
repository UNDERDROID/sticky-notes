// const { response } = require("express");

const CACHE_NAME = "sticky-notes-phase3-cache-v5";
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
      return cache.addAll(urlsToCache)
        .then(() => console.log('Cached successfully'))
        .catch(err => console.error('Caching failed:', err));
    })
  );
});

self.addEventListener('activate', event => {
  // Immediately take control of the page
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
 if(event.request.url.includes('/api/')){
  return fetch(event.request);
 }

 event.respondWith(
  caches.match(event.request).then(response=>{
    if(response){
      console.log('Serving from cache:',event.request.url);
      return response
    }

    console.log('Fetching from network:', event.request.url);
    return fetch(event.request);
  })
 )
});

