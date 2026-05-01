/* Minimal PWA service worker.
   Do not precache "/" — HTML must always come from the network after deploy, or users
   can see a stale theme/layout from an old build. Only static, versioned assets are
   safe to precache; the app shell is not. */
const CACHE = "vq-prod-v4";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(["/manifest.webmanifest"])),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    // Always use the network for documents so new deployments show immediately.
    // (Offline: no stale HTML fallback; better than showing an old design forever.)
    event.respondWith(fetch(event.request));
  }
});
