/**
 * IndexedDB-based image storage for meal photos.
 * 
 * Images are stored as blobs in IndexedDB instead of base64 strings in localStorage.
 * This avoids the ~5-10MB localStorage limit that would be hit after ~20-50 photos.
 * IndexedDB typically allows hundreds of MB to several GB of storage.
 * 
 * Image references in MealLog.imageUrl use the format "idb:<id>" to distinguish
 * from legacy inline "data:" base64 URLs.
 */

const DB_NAME = 'smartcalorie_images';
const DB_VERSION = 1;
const STORE_NAME = 'images';

/** Prefix for IndexedDB image references stored in MealLog.imageUrl */
export const IDB_PREFIX = 'idb:';

/** Check if an imageUrl is an IndexedDB reference */
export const isIdbRef = (url: string | undefined): boolean =>
  !!url && url.startsWith(IDB_PREFIX);

/** Check if an imageUrl is an inline base64 data URL (legacy format) */
export const isDataUrl = (url: string | undefined): boolean =>
  !!url && url.startsWith('data:');

/** Extract the image ID from an "idb:<id>" reference */
export const getIdbKey = (ref: string): string => ref.slice(IDB_PREFIX.length);

/** Open (or create) the IndexedDB database */
const openDB = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

/**
 * Save an image to IndexedDB.
 * @param id Unique key for the image (typically the meal log ID)
 * @param dataUrl The base64 data URL (e.g. "data:image/jpeg;base64,...")
 * @returns The IDB reference string "idb:<id>" to store in MealLog.imageUrl
 */
export const saveImage = async (id: string, dataUrl: string): Promise<string> => {
  const db = await openDB();
  // Convert data URL to Blob for more efficient storage
  const blob = dataUrlToBlob(dataUrl);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(blob, id);
    tx.oncomplete = () => resolve(`${IDB_PREFIX}${id}`);
    tx.onerror = () => reject(tx.error);
  });
};

/**
 * Retrieve an image from IndexedDB as an object URL.
 * @param id The image key
 * @returns A blob URL that can be used as an <img> src, or null if not found
 */
export const getImage = async (id: string): Promise<string | null> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(id);
      request.onsuccess = () => {
        const blob = request.result;
        if (blob) {
          resolve(URL.createObjectURL(blob));
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
};

/**
 * Delete a single image from IndexedDB.
 * @param id The image key
 */
export const deleteImage = async (id: string): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Silently ignore — image may already be gone
  }
};

/**
 * Delete multiple images from IndexedDB.
 * @param ids Array of image keys to delete
 */
export const deleteImages = async (ids: string[]): Promise<void> => {
  if (ids.length === 0) return;
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      ids.forEach(id => store.delete(id));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Silently ignore
  }
};

/**
 * Resolve an imageUrl (either "idb:<id>" or legacy "data:..." or undefined)
 * into a displayable URL.
 * @returns A blob URL, data URL, or null
 */
export const resolveImageUrl = async (imageUrl: string | undefined): Promise<string | null> => {
  if (!imageUrl) return null;
  if (isDataUrl(imageUrl)) return imageUrl; // Legacy inline base64
  if (isIdbRef(imageUrl)) return getImage(getIdbKey(imageUrl));
  return imageUrl; // Unknown format, return as-is
};

/** Convert a data URL to a Blob */
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

/**
 * Migrate a batch of meal logs: move inline base64 images to IndexedDB.
 * Returns updated logs array with imageUrl changed from "data:..." to "idb:<id>".
 * Logs without images or already migrated are returned unchanged.
 */
export const migrateLogsToIdb = async (logs: Array<{ id: string; imageUrl?: string; [key: string]: any }>): Promise<{ updatedLogs: typeof logs; migrated: number }> => {
  let migrated = 0;
  const updatedLogs = [];

  for (const log of logs) {
    if (isDataUrl(log.imageUrl)) {
      try {
        const idbRef = await saveImage(log.id, log.imageUrl!);
        updatedLogs.push({ ...log, imageUrl: idbRef });
        migrated++;
      } catch (e) {
        console.error(`Failed to migrate image for meal ${log.id}:`, e);
        updatedLogs.push(log); // Keep original on failure
      }
    } else {
      updatedLogs.push(log);
    }
  }

  return { updatedLogs, migrated };
};
