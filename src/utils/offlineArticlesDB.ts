import { Article } from '../data/articles';

const DB_NAME = 'apex-utility-offline-articles';
const STORE_NAME = 'articles';
const DB_VERSION = 1;

/**
 * Initializes and returns the IndexedDB instance.
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Helper to convert an image URL to a Blob or DataURL for offline storage.
 * Gracefully returns null if network fails or CORS blocks it.
 */
async function fetchImageAsBlob(url: string): Promise<Blob | null> {
  try {
    const response = await fetch(url, { mode: 'cors', credentials: 'omit' });
    if (!response.ok) return null;
    return await response.blob();
  } catch (error) {
    console.warn('Failed to fetch article cover image for offline storage:', error);
    return null;
  }
}

/**
 * Saves an article and its optional cover image blob to IndexedDB.
 */
export async function saveArticleForOffline(article: Article, imageUrl: string): Promise<void> {
  const db = await openDB();
  const imageBlob = await fetchImageAsBlob(imageUrl);

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const record = {
      id: article.id,
      article,
      imageBlob,
      savedAt: new Date().toISOString(),
    };

    const request = store.put(record);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Removes an article from IndexedDB.
 */
export async function deleteArticleFromOffline(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Checks if an article is saved for offline.
 */
export async function isArticleSavedOffline(id: string): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(!!request.result);
      };

      request.onerror = () => {
        resolve(false);
      };
    });
  } catch (e) {
    return false;
  }
}

/**
 * Retrieves a list of all saved article IDs.
 */
export async function getSavedArticleIds(): Promise<string[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAllKeys();

      request.onsuccess = () => {
        resolve((request.result as string[]) || []);
      };

      request.onerror = () => {
        resolve([]);
      };
    });
  } catch (e) {
    return [];
  }
}

/**
 * Retrieves a single saved article record, with its local cover image blob URL if saved.
 */
export async function getOfflineArticle(id: string): Promise<{ article: Article, localCoverUrl?: string } | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }

        let localCoverUrl: string | undefined;
        if (result.imageBlob instanceof Blob) {
          try {
            localCoverUrl = URL.createObjectURL(result.imageBlob);
          } catch (err) {
            console.error('Failed to create object URL for image blob', err);
          }
        }

        resolve({
          article: result.article,
          localCoverUrl,
        });
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (e) {
    return null;
  }
}

/**
 * Retrieves all saved offline articles.
 */
export async function getAllOfflineArticles(): Promise<{ article: Article, localCoverUrl?: string, savedAt: string }[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const records = request.result || [];
        const mapped = records.map((r: any) => {
          let localCoverUrl: string | undefined;
          if (r.imageBlob instanceof Blob) {
            try {
              localCoverUrl = URL.createObjectURL(r.imageBlob);
            } catch (err) {
              // Ignore
            }
          }
          return {
            article: r.article,
            localCoverUrl,
            savedAt: r.savedAt || new Date().toISOString(),
          };
        });
        resolve(mapped);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (e) {
    return [];
  }
}
