import { PackageManager } from "./package-manager";

const DB_NAME = "ArtifactsCacheDB";
const STORE_NAME = "FileCache";
const DB_VERSION = 1;

export class IndexedDbCache {
  private _dbPromise: Promise<IDBDatabase>;
  private _packageManager = new PackageManager();

  constructor() {
    this._dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(new Error("Failed to open IndexedDB."));
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }

  get packageManager() {
    return this._packageManager;
  }

  async get(key: string): Promise<Uint8Array | string | undefined> {
    const db = await this._dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onerror = () => reject(new Error(`Failed to retrieve from cache: ${key}`));
      request.onsuccess = () => resolve(request.result);
    });
  }

  async set(key: string, value: Uint8Array | string): Promise<void> {
    const db = await this._dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(value, key);

      request.onerror = () => reject(new Error(`Failed to write to cache: ${key}`));
      request.onsuccess = () => resolve();
    });
  }

  async delete(key: string): Promise<void> {
    const db = await this._dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);
      
      request.onerror = () => reject(new Error(`Failed to delete from cache: ${key}`));
      request.onsuccess = () => resolve();
    });
  }

  async clear(): Promise<void> {
    const db = await this._dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onerror = () => reject(new Error("Failed to clear cache."));
      request.onsuccess = () => resolve();
    });
  }
}