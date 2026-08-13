"use strict";

const CACHE_PREFIX = "surucu-asistani-";
const CACHE_NAME = `${CACHE_PREFIX}v144-pwa-1`;
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  const scopeUrl = new URL(self.registration.scope);

  // Harita, trafik, hava ve diğer dış servis yanıtlarını önbelleğe alma.
  if (requestUrl.origin !== scopeUrl.origin ||
      !requestUrl.pathname.startsWith(scopeUrl.pathname)) return;

  event.respondWith((async () => {
    try {
      const response = await fetch(event.request);
      if (response && response.ok && response.type === "basic") {
        try {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, response.clone());
        } catch (cacheError) {
          // Önbellek dolu olsa bile çevrimiçi yanıtı kullanıcıya göster.
        }
      }
      return response;
    } catch (error) {
      const cached = await caches.match(event.request);
      if (cached) return cached;

      if (event.request.mode === "navigate") {
        const fallback = await caches.match("./index.html");
        if (fallback) return fallback;
      }

      return new Response("Çevrimdışı", {
        status: 503,
        statusText: "Offline",
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }
  })());
});
