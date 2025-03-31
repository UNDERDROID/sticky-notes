const CACHE_NAME="sticky-notes+-cache-v1";
const ASSETS_TO_CACHE=[
  "/",
  "/index.html",
  "/db.js",
  "/script.js",
  "/styles.css",
  "/manifest.json",
  "/icons/icon.png"
];

//Install service worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache)=>{
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

//Fetch Requests
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});

//Activate Service Worker & Remove Old Caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name)=> name!==CACHE_NAME).map((name)=> caches.delete(name))
      );
    })
  );
});