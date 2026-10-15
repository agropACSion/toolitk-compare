const CACHE_NAME = "itk-static-v2";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );

      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Toujours récupérer la dernière version de index.html
  if (
    request.mode === "navigate" ||
    url.pathname.endsWith("/index.html")
  ) {
    event.respondWith(
      fetch(request, { cache: "no-store" }).catch(() =>
        caches.match("/toolitk-compare/index.html")
      )
    );
    return;
  }

  // Pour les autres fichiers : réseau en priorité
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.ok && url.origin === self.location.origin) {
          const copy = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, copy);
          });
        }

        return response;
      })
      .catch(() => caches.match(request))
  );
});
