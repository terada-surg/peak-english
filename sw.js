const CACHE = 'peak-english-v2';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
// Same-origin: network-first, cache only as an offline fallback.
// Cross-origin (Gemini API): untouched.
//
// `cache: 'reload'` is essential: a plain fetch(e.request) is still served from
// the browser's HTTP cache, and GitHub Pages sends max-age=600 — so "network
// first" silently returned a 10-minute-stale page and app updates never landed.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin || e.request.method !== 'GET') return;
  e.respondWith(
    fetch(new Request(e.request.url, {cache: 'reload', credentials: 'same-origin'})).then(r => {
      const copy = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return r;
    }).catch(() => caches.match(e.request).then(m => m || caches.match('./index.html')))
  );
});
