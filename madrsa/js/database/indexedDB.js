/* ==========================================================================
   INDEXEDDB DATABASE MANAGER
   Local database wrapper for high-volume storage
   ========================================================================== */

const DB_NAME = 'MadrasaPerfDB';
const DB_VERSION = 1;

let dbInstance = null;

export async function getDB() {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 1. Classes Store
      if (!db.objectStoreNames.contains('classes')) {
        const classStore = db.createObjectStore('classes', { keyPath: 'id' });
        classStore.createIndex('name', 'name', { unique: false });
        classStore.createIndex('isArchived', 'isArchived', { unique: false });
      }

      // 2. Students Store
      if (!db.objectStoreNames.contains('students')) {
        const studentStore = db.createObjectStore('students', { keyPath: 'id' });
        studentStore.createIndex('classId', 'classId', { unique: false });
        studentStore.createIndex('admissionNumber', 'admissionNumber', { unique: false });
        studentStore.createIndex('name', 'name', { unique: false });
        studentStore.createIndex('isActive', 'isActive', { unique: false });
      }

      // 3. Criteria Store
      if (!db.objectStoreNames.contains('criteria')) {
        const criteriaStore = db.createObjectStore('criteria', { keyPath: 'id' });
        criteriaStore.createIndex('order', 'order', { unique: false });
      }

      // 4. Performance Records Store
      if (!db.objectStoreNames.contains('performanceRecords')) {
        const perfStore = db.createObjectStore('performanceRecords', { keyPath: 'id' });
        perfStore.createIndex('studentId', 'studentId', { unique: false });
        perfStore.createIndex('classId', 'classId', { unique: false });
        perfStore.createIndex('date', 'date', { unique: false });
        perfStore.createIndex('criterionId', 'criterionId', { unique: false });
        perfStore.createIndex('classId_date', ['classId', 'date'], { unique: false });
        perfStore.createIndex('studentId_date', ['studentId', 'date'], { unique: false });
      }

      // 5. Daily Summaries Store
      if (!db.objectStoreNames.contains('dailySummaries')) {
        const summaryStore = db.createObjectStore('dailySummaries', { keyPath: 'id' });
        summaryStore.createIndex('studentId', 'studentId', { unique: false });
        summaryStore.createIndex('classId', 'classId', { unique: false });
        summaryStore.createIndex('date', 'date', { unique: false });
        summaryStore.createIndex('classId_date', ['classId', 'date'], { unique: false });
      }

      // 6. Subjects & Materials Store
      if (!db.objectStoreNames.contains('subjects')) {
        const subStore = db.createObjectStore('subjects', { keyPath: 'id' });
        subStore.createIndex('classId', 'classId', { unique: false });
      }

      if (!db.objectStoreNames.contains('materials')) {
        const matStore = db.createObjectStore('materials', { keyPath: 'id' });
        matStore.createIndex('classId', 'classId', { unique: false });
        matStore.createIndex('date', 'date', { unique: false });
      }

      // 7. Settings Store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('IndexedDB open error:', event.target.error);
      reject(event.target.error);
    };
  });
}

// Generic Helper Utilities for DB operations
export async function dbGetAll(storeName) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function dbGet(storeName, key) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function dbGetByIndex(storeName, indexName, value) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function dbPut(storeName, data) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(data);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function dbPutBatch(storeName, items) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    items.forEach(item => store.put(item));
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

export async function dbDelete(storeName, key) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(key);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

export async function dbClearAll() {
  const db = await getDB();
  const stores = ['classes', 'students', 'criteria', 'performanceRecords', 'dailySummaries', 'subjects', 'materials', 'settings'];
  return new Promise((resolve, reject) => {
    const tx = db.transaction(stores, 'readwrite');
    stores.forEach(s => tx.objectStore(s).clear());
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
