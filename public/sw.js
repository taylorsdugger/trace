// Trace · service worker. Minimal app-shell cache so the PWA can install
// cleanly on Android and survive a flaky connection. Network-first for HTML
// and API; cache-first for static assets.

const VERSION = "trace-v1";
const STATIC_CACHE = `${VERSION}-static`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await cache.addAll(["/", "/manifest.json", "/marks/tree-ring.svg"]).catch(() => {});
      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))
      );
      self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Network-first for navigation + API; fall back to cache if offline.
  if (req.mode === "navigate" || url.pathname.startsWith("/api/")) {
    event.respondWith(
      (async () => {
        try {
          return await fetch(req);
        } catch {
          const cache = await caches.open(STATIC_CACHE);
          const cached = await cache.match(req);
          return cached ?? cache.match("/") ?? Response.error();
        }
      })()
    );
    return;
  }

  // Cache-first for static assets.
  event.respondWith(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res.ok && res.type === "basic") cache.put(req, res.clone());
        return res;
      } catch {
        return cached ?? Response.error();
      }
    })()
  );
});
