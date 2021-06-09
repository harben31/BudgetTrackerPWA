const STATIC_CACHE_NAME = 'static-cache';
const API_DATA_CACHE_NAME = 'api-data-cache';

const STATIC_FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/styles.css',
    '/manifest.webmanifest',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/db.js',
    '/index.js'
];

self.addEventListener('install', evt => {
    evt.waitUntil(
        caches.open(STATIC_CACHE_NAME)
        .then(cache => cache.addAll(STATIC_FILES_TO_CACHE))
    );

    self.skipWaiting();
});

self.addEventListener('activate', evt => {
    evt.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(
                keyList.map(key => {
                    if(key !== STATIC_CACHE_NAME && key !== API_DATA_CACHE_NAME){
                        console.log('Removing old data:', key);
                    }
                })
            );
        })
    );

    self.clients.claim();
});

self.addEventListener('fetch', evt => {

    if (evt.request.url.includes('/api/')) {
        evt.respondWith(
            caches.open(API_DATA_CACHE_NAME)
            .then(cache => {
                return fetch(evt.request)
                    .then(res => {
                        if (res.status === 200) {
                            cache.put(evt.request.url, res.clone())
                        }

                        return res
                    })
                    .catch(err => {
                        console.log('fetch failed. retrieving from cache', err);
                        return caches.match(evt.request);
                    });
            })
            .catch(err => console.log('respondWith promise', err))
        )
        return
    }

    evt.respondWith(
        caches.open(STATIC_CACHE_NAME).then(cache => {
            return cache.match(evt.request).then(res => {
                return res || fetch(evt.request);
            });
        })
    );
});