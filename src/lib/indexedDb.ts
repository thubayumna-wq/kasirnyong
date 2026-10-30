import { Product, Category, Unit, Customer, StoreSettings, User, ParkedDraft } from '../types/pos';

const DB_NAME = 'HILALPOS_LOCAL_DB';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

export async function getLocalDb(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Products store with indices
      if (!db.objectStoreNames.contains('products')) {
        const prodStore = db.createObjectStore('products', { keyPath: 'id' });
        prodStore.createIndex('barcode', 'barcode', { unique: false });
        prodStore.createIndex('sku', 'sku', { unique: false });
        prodStore.createIndex('name', 'name', { unique: false });
      }

      // Categories
      if (!db.objectStoreNames.contains('categories')) {
        db.createObjectStore('categories', { keyPath: 'id' });
      }

      // Units
      if (!db.objectStoreNames.contains('units')) {
        db.createObjectStore('units', { keyPath: 'id' });
      }

      // Customers
      if (!db.objectStoreNames.contains('customers')) {
        db.createObjectStore('customers', { keyPath: 'id' });
      }

      // Offline Pending Transactions Queue
      if (!db.objectStoreNames.contains('pending_transactions')) {
        const queueStore = db.createObjectStore('pending_transactions', { keyPath: 'id' });
        queueStore.createIndex('idempotency_key', 'idempotency_key', { unique: true });
        queueStore.createIndex('created_at', 'created_at', { unique: false });
      }

      // Local Synced Transactions Cache
      if (!db.objectStoreNames.contains('synced_transactions')) {
        db.createObjectStore('synced_transactions', { keyPath: 'id' });
      }

      // Parked Cart Drafts
      if (!db.objectStoreNames.contains('parked_drafts')) {
        db.createObjectStore('parked_drafts', { keyPath: 'id' });
      }

      // App Settings & Session Cache
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }

      // Local Sync logs & conflict notes
      if (!db.objectStoreNames.contains('sync_logs')) {
        db.createObjectStore('sync_logs', { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('IndexedDB error', event);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

// Generic transaction helper
async function performTx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T> | void
): Promise<T> {
  const db = await getLocalDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const req = action(store);

    tx.oncomplete = () => {
      if (req && 'result' in req) {
        resolve(req.result as T);
      } else {
        resolve(undefined as unknown as T);
      }
    };

    tx.onerror = () => reject(tx.error);
    if (req) {
      req.onerror = () => reject(req.error);
    }
  });
}

// ---------------- PRODUCTS ----------------
export async function cacheProducts(products: Product[]): Promise<void> {
  const db = await getLocalDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('products', 'readwrite');
    const store = tx.objectStore('products');
    for (const p of products) {
      store.put(p);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getLocalProducts(): Promise<Product[]> {
  const db = await getLocalDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('products', 'readonly');
    const store = tx.objectStore('products');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function findLocalProductByBarcode(barcode: string): Promise<Product | null> {
  if (!barcode) return null;
  const products = await getLocalProducts();
  const clean = barcode.trim().toLowerCase();
  return products.find((p) => p.barcode?.toLowerCase() === clean || p.sku?.toLowerCase() === clean) || null;
}

export async function updateLocalProductStock(productId: string, baseQtyDeducted: number): Promise<void> {
  const db = await getLocalDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('products', 'readwrite');
    const store = tx.objectStore('products');
    const req = store.get(productId);

    req.onsuccess = () => {
      const prod = req.result as Product | undefined;
      if (prod) {
        prod.current_stock -= baseQtyDeducted;
        prod.updated_at = new Date().toISOString();
        store.put(prod);
      }
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

// ---------------- CATEGORIES, UNITS, CUSTOMERS ----------------
export async function cacheMasterData(categories: Category[], units: Unit[], customers: Customer[]): Promise<void> {
  const db = await getLocalDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['categories', 'units', 'customers'], 'readwrite');
    const catStore = tx.objectStore('categories');
    const unitStore = tx.objectStore('units');
    const custStore = tx.objectStore('customers');

    categories.forEach((c) => catStore.put(c));
    units.forEach((u) => unitStore.put(u));
    customers.forEach((cust) => custStore.put(cust));

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getLocalCategories(): Promise<Category[]> {
  const db = await getLocalDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('categories', 'readonly');
    const store = tx.objectStore('categories');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function getLocalUnits(): Promise<Unit[]> {
  const db = await getLocalDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('units', 'readonly');
    const store = tx.objectStore('units');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function getLocalCustomers(): Promise<Customer[]> {
  const db = await getLocalDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('customers', 'readonly');
    const store = tx.objectStore('customers');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

// ---------------- PENDING TRANSACTIONS QUEUE (OFFLINE) ----------------
export async function addPendingOfflineTransaction(transaction: any): Promise<void> {
  const db = await getLocalDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending_transactions', 'readwrite');
    const store = tx.objectStore('pending_transactions');
    store.put({
      ...transaction,
      sync_status: 'PENDING',
      attempts: 0,
      queued_at: new Date().toISOString(),
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingOfflineTransactions(): Promise<any[]> {
  const db = await getLocalDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending_transactions', 'readonly');
    const store = tx.objectStore('pending_transactions');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function removePendingOfflineTransaction(id: string): Promise<void> {
  const db = await getLocalDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending_transactions', 'readwrite');
    const store = tx.objectStore('pending_transactions');
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function updatePendingTransactionError(id: string, errorMessage: string): Promise<void> {
  const db = await getLocalDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending_transactions', 'readwrite');
    const store = tx.objectStore('pending_transactions');
    const req = store.get(id);
    req.onsuccess = () => {
      const item = req.result;
      if (item) {
        item.sync_status = 'FAILED';
        item.last_error = errorMessage;
        item.attempts = (item.attempts || 0) + 1;
        item.last_attempt_at = new Date().toISOString();
        store.put(item);
      }
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

// Cache completed transactions locally for offline reprint and review
export async function cacheTransactionLocally(transaction: any): Promise<void> {
  const db = await getLocalDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('synced_transactions', 'readwrite');
    const store = tx.objectStore('synced_transactions');
    store.put(transaction);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCachedTransactions(): Promise<any[]> {
  const db = await getLocalDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('synced_transactions', 'readonly');
    const store = tx.objectStore('synced_transactions');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

// ---------------- PARKED DRAFTS ----------------
export async function saveParkedDraft(draft: ParkedDraft): Promise<void> {
  const db = await getLocalDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('parked_drafts', 'readwrite');
    const store = tx.objectStore('parked_drafts');
    store.put(draft);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getParkedDrafts(): Promise<ParkedDraft[]> {
  const db = await getLocalDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('parked_drafts', 'readonly');
    const store = tx.objectStore('parked_drafts');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteParkedDraft(id: string): Promise<void> {
  const db = await getLocalDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('parked_drafts', 'readwrite');
    const store = tx.objectStore('parked_drafts');
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ---------------- APP SETTINGS & SESSION CACHE ----------------
export async function saveLocalSetting(key: string, value: any): Promise<void> {
  const db = await getLocalDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('settings', 'readwrite');
    const store = tx.objectStore('settings');
    store.put({ key, value, updated_at: new Date().toISOString() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getLocalSetting<T = any>(key: string): Promise<T | null> {
  const db = await getLocalDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('settings', 'readonly');
    const store = tx.objectStore('settings');
    const req = store.get(key);
    req.onsuccess = () => {
      resolve(req.result ? (req.result.value as T) : null);
    };
    req.onerror = () => reject(req.error);
  });
}
