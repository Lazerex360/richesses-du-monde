/**
 * Service Worker — Richesses du Monde
 * Stratégie : network-first + cache fallback pour assets statiques.
 */
const CACHE = 'rdm-v2';

const PRECACHE = [
  '/',
  '/css/style.css',
  '/css/cinematic.css',
  '/css/improvements.css',
  '/js/client.js',
  '/js/i18n.js',
  '/js/rules.js',
  '/js/dice3d.js',
  '/icon.svg',
  '/manifest.json',
];

/* ── Install : mise en cache des assets critiques ─── */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

/* ── Activate : suppression des anciens caches ────── */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* ── Fetch : network-first, cache fallback ────────── */
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  /* Ignorer : WebSocket, API, POST, cross-origin CDN */
  if (
    e.request.method !== 'GET'
    || url.pathname.startsWith('/api/')
    || url.host !== self.location.host
  ) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        /* Mettre en cache les réponses 200 OK */
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
