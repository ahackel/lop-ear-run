// The service worker: keeps every file of the game (and of its engine) so it starts and plays offline, installed or not.
// A request is answered from the cache when it can be, and fetched anew in the background, so an update shows on the
// start after next.
const CACHE = 'lop-ear-run';
const GAME = ['./', 'index.html', 'game.js', 'art.js', 'song.json', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const engine = await (await fetch('engine/files.json')).json();
    await (await caches.open(CACHE)).addAll([...GAME, ...engine.map((f) => `engine/${f}`)]);
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const kept = await cache.match(e.request, { ignoreSearch: true });
    const fresh = fetch(e.request).then((res) => {
      if (res.ok) cache.put(url.pathname, res.clone()); // without the query (?auto), like the match
      return res;
    });
    if (kept) { e.waitUntil(fresh.catch(() => {})); return kept; }
    return fresh;
  })());
});
