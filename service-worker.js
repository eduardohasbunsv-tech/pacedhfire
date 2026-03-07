const CACHE_NAME = 'edhpac-v3';
const URLS_TO_CACHE = [
    '/index.html',
    '/manifest.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(URLS_TO_CACHE))
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    // Network first for Firebase/Firestore
    if (event.request.url.includes('firebasejs') ||
        event.request.url.includes('firestore') ||
        event.request.url.includes('googleapis')) {
        event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
        return;
    }
    // Cache first for static assets
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request).then(resp => {
                const clone = resp.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                return resp;
            }))
            .catch(() => caches.match('/index.html'))
    );
});
