/* Service worker: guarda APENAS a "casca" da app (HTML/CSS/JS/ícones).
   Nunca guarda dados: os pedidos à API (script.google.com) passam sempre pela rede. */
const CACHE = 'voyager-shell-v2';
const SHELL = ['./', 'index.html', 'app.css', 'app.js', 'vendor/chart.umd.min.js', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/favicon-32.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return; // API e terceiros: rede, sem cache
  // Rede primeiro (para receber atualizações), cache só se não houver rede.
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html')))
  );
});
