// The service worker: keeps every file of the game (and of its engine) so it starts and plays offline, installed or not.
// Online, every request goes to the network (revalidated, so all files are of the same version) and the answer is kept;
// offline, the kept files answer. (Answering from the cache first mixed an old game.js with a new index.html after an
// update.)
const CACHE = 'lop-ear-run-2';
const GAME = ['./', 'index.html', 'game.js', 'art.js', 'song.json', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const engine = await (await fetch('engine/files.json', { cache: 'no-cache' })).json();
    const files = [...GAME, ...engine.map((f) => `engine/${f}`)];
    await (await caches.open(CACHE)).addAll(files.map((f) => new Request(f, { cache: 'no-cache' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const name of await caches.keys()) if (name !== CACHE) await caches.delete(name); // older versions' files
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await fetch(url.href, { cache: 'no-cache', credentials: 'same-origin' });
      if (res.ok) await cache.put(url.pathname, res.clone()); // without the query (?auto), like the match below
      return res;
    } catch {
      return (await cache.match(url.pathname)) || Response.error();
    }
  })());
});
