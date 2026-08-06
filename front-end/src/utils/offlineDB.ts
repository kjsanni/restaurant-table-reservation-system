const DB_NAME = "rtrs-offline";
const DB_VERSION = 1;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("appointments")) {
        db.createObjectStore("appointments", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("clients")) {
        db.createObjectStore("clients", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("services")) {
        db.createObjectStore("services", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("staffShifts")) {
        db.createObjectStore("staffShifts", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("pendingMutations")) {
        const store = db.createObjectStore("pendingMutations", {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("entityType", "entityType", { unique: false });
      }
      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta", { keyPath: "key" });
      }
    };
  });
};

const tx = (
  db: IDBDatabase,
  storeName: string,
  mode: IDBTransactionMode = "readonly"
) => {
  const transaction = db.transaction(storeName, mode);
  return transaction.objectStore(storeName);
};

export const offlineDB = {
  async getAll(storeName: string): Promise<any[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const request = tx(db, storeName).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async get(storeName: string, id: string | number): Promise<any | undefined> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const request = tx(db, storeName).get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async put(storeName: string, item: any): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const request = tx(db, storeName, "readwrite").put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async putBatch(storeName: string, items: any[]): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      for (const item of items) {
        store.put(item);
      }
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },

  async delete(storeName: string, id: string | number): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const request = tx(db, storeName, "readwrite").delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async clear(storeName: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const request = tx(db, storeName, "readwrite").clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async getMeta(key: string): Promise<any> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const request = tx(db, "meta").get(key);
      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
  },

  async setMeta(key: string, value: any): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const request = tx(db, "meta", "readwrite").put({ key, value });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
};
