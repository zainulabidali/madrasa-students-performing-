/* ==========================================================================
   PWA SERVICE WORKER
   Offline Cache-First Strategy for Madrasa Student Performance Manager
   ========================================================================== */

const CACHE_NAME = 'madrasa-perf-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './css/responsive.css',
  './js/app.js',
  './js/router.js',
  './js/database/indexedDB.js',
  './js/database/migrations.js',
  './js/database/seed.js',
  './js/repositories/classRepository.js',
  './js/repositories/studentRepository.js',
  './js/repositories/performanceRepository.js',
  './js/repositories/settingsRepository.js',
  './js/repositories/reportRepository.js',
  './js/services/scoringService.js',
  './js/services/rankingService.js',
  './js/services/reportService.js',
  './js/services/whatsappService.js',
  './js/services/backupService.js',
  './js/services/imageReportService.js',
  './js/lib/chart-helper.js',
  './js/components/toast.js',
  './js/components/modal.js',
  './js/components/studentCard.js',
  './js/components/scoreButton.js',
  './js/components/reportTable.js',
  './js/components/rankingCard.js',
  './js/pages/dashboard.js',
  './js/pages/classes.js',
  './js/pages/classDetail.js',
  './js/pages/dailyPerformance.js',
  './js/pages/students.js',
  './js/pages/studentProfile.js',
  './js/pages/reports.js',
  './js/pages/rankings.js',
  './js/pages/settings.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching offline app shell assets...');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Clearing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Offline fallback
        return caches.match('./index.html');
      });
    })
  );
});
