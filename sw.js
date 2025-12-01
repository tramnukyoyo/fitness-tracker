// sw.js - Service Worker für GitHub Pages
const CACHE_NAME = 'fitness-tracker-v1';
const BASE_PATH = '/tramnukyoyo/REPO-NAME/';  // HIER DEIN PFAD!

const urlsToCache = [
  BASE_PATH,
  BASE_PATH + 'index.html',
  BASE_PATH + 'style.css',
  BASE_PATH + 'app.js',
  BASE_PATH + 'manifest.json',
  BASE_PATH + 'icons/icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  // Für GitHub Pages: Relative Pfade korrigieren
  const requestUrl = new URL(event.request.url);
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        
        // Füge Base Path hinzu falls nötig
        let fetchRequest = event.request.clone();
        if (!requestUrl.pathname.startsWith(BASE_PATH)) {
          const newUrl = BASE_PATH + requestUrl.pathname.replace(/^\//, '');
          fetchRequest = new Request(newUrl, event.request);
        }
        
        return fetch(fetchRequest);
      })
  );
});