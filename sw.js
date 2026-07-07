const CACHE_NAME = 'symbimess-cache-v1';

// List of files to save to the user's phone
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    './menu.json'
];

// Step 1: Install the service worker and cache the files
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Step 2: Intercept network requests and serve from cache if available
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return the cached file if we have it, otherwise fetch from the internet
                return response || fetch(event.request);
            })
    );
});