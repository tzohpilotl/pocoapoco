const CACHE = "job-tracker-shell-v1";
const SHELL = [
  "/",
  "/dist/app.js",
  "/src/app.css",
  "/theme/tokens.css",
  "/theme/components.css",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
