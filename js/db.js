// ============================
// IndexedDB Module
// ============================

const DB_NAME = 'FitnessTrackerDB';
const DB_VERSION = 1;
const STORE_NAME = 'images';

let db = null;

export function initIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('IndexedDB Fehler:', event.target.error);
            resolve();
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('IndexedDB geladen');
            resolve();
        };

        request.onupgradeneeded = (event) => {
            db = event.target.result;

            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('entryId', 'entryId', { unique: false });
                console.log('Images Store erstellt');
            }
        };
    });
}

export function getDB() {
    return db;
}

export async function saveImageToDB(entryId, imageIndex, imageData) {
    return new Promise((resolve, reject) => {
        if (!db) {
            resolve(null);
            return;
        }

        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const imageId = `${entryId}_${imageIndex}`;

        const request = store.put({
            id: imageId,
            entryId: entryId,
            imageIndex: imageIndex,
            data: imageData,
            timestamp: Date.now()
        });

        request.onsuccess = () => resolve(imageId);
        request.onerror = (event) => {
            console.error('Bild speichern fehlgeschlagen:', event.target.error);
            reject(event.target.error);
        };
    });
}

export async function loadImagesForEntry(entryId) {
    return new Promise((resolve) => {
        if (!db) {
            resolve([]);
            return;
        }

        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('entryId');

        const request = index.getAll(entryId);

        request.onsuccess = (event) => {
            const images = event.target.result
                .sort((a, b) => a.imageIndex - b.imageIndex)
                .map(img => ({
                    id: img.id,
                    data: img.data,
                    thumbnail: img.data
                }));
            resolve(images);
        };

        request.onerror = () => resolve([]);
    });
}

export async function deleteImagesForEntry(entryId) {
    return new Promise((resolve) => {
        if (!db) {
            resolve();
            return;
        }

        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('entryId');

        const request = index.openCursor(entryId);

        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                cursor.delete();
                cursor.continue();
            } else {
                resolve();
            }
        };

        request.onerror = () => resolve();
    });
}

export async function getImageById(imageId) {
    return new Promise((resolve) => {
        if (!db) {
            resolve(null);
            return;
        }

        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);

        const request = store.get(imageId);

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = () => resolve(null);
    });
}

export async function getAllImages() {
    return new Promise((resolve) => {
        if (!db) {
            resolve([]);
            return;
        }

        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);

        const request = store.getAll();

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = () => resolve([]);
    });
}

export async function importImages(images) {
    if (!db || !images || images.length === 0) return;

    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    for (const img of images) {
        store.put(img);
    }
}
