// Service worker minimal untuk Mitra Finance 99.
// Sengaja TIDAK melakukan caching agresif agar konten tidak pernah basi (stale).
// Tujuannya hanya memenuhi syarat "installable" (Add to Home Screen / standalone).

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Fetch handler pass-through: biarkan browser menangani request seperti biasa
// (selalu ambil versi terbaru dari jaringan). Handler ini ada hanya agar app
// dianggap installable sebagai PWA.
self.addEventListener('fetch', (event) => {
  // no-op: tidak memanggil event.respondWith(), sehingga browser memakai
  // perilaku jaringan default tanpa cache.
});
