// Илова ўрнатилиши учун минимал service worker: ҳамма нарсани тўғридан-тўғри интернетдан олади.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
