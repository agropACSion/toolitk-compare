const CACHE = 'itk-shell-v1';
const APP_SHELL = ['./','./index.html','./manifest.json','./icon.svg'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Network-first for the HTML: when you replace index.html on GitHub,
// the installed PWA fetches the new version automatically when online.
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req).then(response => {
      if (response && response.ok && (url.pathname.endsWith('/index.html') || url.pathname.endsWith('/manifest.json') || url.pathname.endsWith('/icon.svg'))) {
        const copy = response.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return response;
    }).catch(() => caches.match(req).then(cached => cached || caches.match('./index.html')))
  );
});
