/* ==========================================================================
   MAIN APPLICATION INITIALIZER
   Bootstrap database, migrations, service worker, offline monitor, and router
   ========================================================================== */

import { getDB } from './database/indexedDB.js';
import { runMigrations } from './database/migrations.js';
import { Router } from './router.js';
import { classRepository } from './repositories/classRepository.js';
import { seedDemoData } from './database/seed.js';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 1. Initialize IndexedDB & Run Schema Migrations
    await getDB();
    await runMigrations();

    // 2. First-Run Setup Check: If 0 classes exist, seed default demo data automatically for instant usability
    const existingClasses = await classRepository.getClasses();
    if (!existingClasses || existingClasses.length === 0) {
      await seedDemoData();
    }

    // 3. Initialize Router
    const mainContainer = document.getElementById('main-container');
    const router = new Router(mainContainer);
    router.init();

    // 4. Register PWA Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./service-worker.js')
        .then(reg => console.log('Service Worker registered successfully:', reg.scope))
        .catch(err => console.warn('Service Worker registration failed:', err));
    }

    // 5. Connection Online/Offline Monitor
    const offlineTag = document.getElementById('offline-tag');
    const updateOnlineStatus = () => {
      if (!offlineTag) return;
      if (navigator.onLine) {
        offlineTag.className = 'offline-badge';
        offlineTag.innerHTML = `<span class="status-dot"></span> Local Mode`;
      } else {
        offlineTag.className = 'offline-badge is-offline';
        offlineTag.innerHTML = `<span class="status-dot"></span> Offline Mode`;
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();

  } catch (err) {
    console.error('App initialization error:', err);
  }
});
