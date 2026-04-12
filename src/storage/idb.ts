const DB_NAME = 'nara-narrator-db'
const DB_VERSION = 1
const STORE = 'kv'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'))
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
  })
}

export async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const get = tx.objectStore(STORE).get(key)
    get.onerror = () => reject(get.error)
    get.onsuccess = () => resolve(get.result as T | undefined)
    tx.oncomplete = () => db.close()
  })
}

export async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.onerror = () => reject(tx.error)
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.objectStore(STORE).put(value, key)
  })
}

export async function idbDelete(key: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.onerror = () => reject(tx.error)
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.objectStore(STORE).delete(key)
  })
}
