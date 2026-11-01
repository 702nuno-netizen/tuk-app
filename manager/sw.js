/* Tuk Manager shell. Scope is the /manager/ directory (GitHub Pages: /tuk-app/manager/). */
const CACHE = 'tuk-manager-shell-v1';
const SHELL = [
  './',
  './index.html',
  './config.js',
  './manifest.webmanifest',
  './css/app.css',
  './js/calc.js',
  './js/format.js',
  './js/i18n.js',
  './js/store.js',
  './js/google.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/favicon-32.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(k => k.startsWith('tuk-manager-') && k !== CACHE).map(k => caches.delete(k))
  )).then(() => self.clients.claim()));
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'claim') self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match(e.request).then(r => r || (e.request.mode === 'navigate' ? caches.match('./index.html') : new Response('', { status: 504, statusText: 'offline' }))))
  );
});
