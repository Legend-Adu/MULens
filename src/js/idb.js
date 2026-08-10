// src/js/idb.js - IndexedDB Binary Storage Engine for MU Media Archive

const DB_NAME = 'MUMediaArchive_IndexedDB';
const DB_VERSION = 1;
const STORE_MEMORIES = 'custom_memories';
const STORE_BLOBS = 'media_blobs';

class ImageStoreDB {
  constructor() {
    this.db = null;
    this.blobUrlCache = new Map(); // blobKey -> objectURL
    this.cachedMemories = [];
    this.isReady = false;
    this.initPromise = null;
  }

  async init() {
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_MEMORIES)) {
          db.createObjectStore(STORE_MEMORIES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_BLOBS)) {
          db.createObjectStore(STORE_BLOBS, { keyPath: 'id' });
        }
      };

      request.onsuccess = async (e) => {
        this.db = e.target.result;
        this.isReady = true;
        // Migrate legacy base64 data from localStorage if exists
        await this.migrateLegacyLocalStorage();
        // Preload memories into memory cache with Object URLs
        await this.reloadMemoryCache();
        resolve(this);
      };

      request.onerror = (e) => {
        console.error('IndexedDB open error:', e.target.error);
        resolve(this);
      };
    });

    return this.initPromise;
  }

  // Convert dataURL to native Blob
  dataURLToBlob(dataurl) {
    if (!dataurl || typeof dataurl !== 'string') return null;
    try {
      const arr = dataurl.split(',');
      if (arr.length < 2) return null;
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    } catch (err) {
      console.warn('Error converting dataURL to blob:', err);
      return null;
    }
  }

  // Convert Blob object to Base64 dataURL
  blobToDataURL(blob) {
    if (!blob || !(blob instanceof Blob)) return Promise.resolve(null);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  }

  // Get raw Blob record by key from STORE_BLOBS
  async getBlob(key) {
    if (!key || typeof key !== 'string') return null;
    if (!this.db) await this.init();
    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction([STORE_BLOBS], 'readonly');
        const store = tx.objectStore(STORE_BLOBS);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  }

  // Save image blob or file into IndexedDB and return its blob key
  async saveBlob(blobOrFile, customKey = null, aspectRatio = null) {
    if (!this.db) await this.init();
    if (!blobOrFile) return null;

    // If it's a web HTTP/HTTPS URL, return as-is
    if (typeof blobOrFile === 'string' && (blobOrFile.startsWith('http://') || blobOrFile.startsWith('https://'))) {
      return blobOrFile;
    }

    const key = customKey || `blob_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    let finalBlob = blobOrFile;

    if (typeof blobOrFile === 'string' && blobOrFile.startsWith('data:')) {
      finalBlob = this.dataURLToBlob(blobOrFile);
      if (!finalBlob) return blobOrFile;
    }

    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction([STORE_BLOBS], 'readwrite');
        const store = tx.objectStore(STORE_BLOBS);

        const record = {
          id: key,
          blob: finalBlob,
          type: finalBlob.type || 'image/jpeg',
          size: finalBlob.size || 0,
          aspectRatio: aspectRatio || null,
          createdAt: Date.now()
        };

        const req = store.put(record);
        req.onsuccess = () => {
          // Generate and cache Object URL immediately
          const objectUrl = URL.createObjectURL(finalBlob);
          this.blobUrlCache.set(key, objectUrl);
          resolve(key);
        };
        req.onerror = (err) => {
          console.error('Error saving blob to IndexedDB:', err);
          resolve(null);
        };
      } catch (err) {
        console.error('Transaction error saving blob:', err);
        resolve(null);
      }
    });
  }

  // Get Object URL for a blob key or HTTP URL synchronously if cached
  getUrlForBlobKey(keyOrUrl) {
    if (!keyOrUrl) return '';
    if (typeof keyOrUrl !== 'string') return '';
    if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://') || keyOrUrl.startsWith('blob:') || keyOrUrl.startsWith('data:')) {
      return keyOrUrl;
    }
    if (this.blobUrlCache.has(keyOrUrl)) {
      return this.blobUrlCache.get(keyOrUrl);
    }
    return '';
  }

  // Get Object URL for a blob key or HTTP URL asynchronously from IndexedDB if not cached
  async resolveBlobUrl(keyOrUrl) {
    if (!keyOrUrl || typeof keyOrUrl !== 'string') return '';
    if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://') || keyOrUrl.startsWith('blob:') || keyOrUrl.startsWith('data:')) {
      return keyOrUrl;
    }
    if (this.blobUrlCache.has(keyOrUrl)) {
      return this.blobUrlCache.get(keyOrUrl);
    }
    if (!this.db) await this.init();
    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction([STORE_BLOBS], 'readonly');
        const store = tx.objectStore(STORE_BLOBS);
        const req = store.get(keyOrUrl);
        req.onsuccess = () => {
          if (req.result && req.result.blob) {
            const objectUrl = URL.createObjectURL(req.result.blob);
            this.blobUrlCache.set(keyOrUrl, objectUrl);
            resolve(objectUrl);
          } else {
            resolve(keyOrUrl);
          }
        };
        req.onerror = () => resolve(keyOrUrl);
      } catch (e) {
        resolve(keyOrUrl);
      }
    });
  }

  // Save full custom memory metadata to IndexedDB
  async saveMemory(memoryData) {
    if (!this.db) await this.init();

    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction([STORE_MEMORIES], 'readwrite');
        const store = tx.objectStore(STORE_MEMORIES);

        // Sanitize memory record: strip massive Base64 from memory metadata record if any slipped in
        const cleanMemory = { ...memoryData };
        if (cleanMemory.imageUrl && cleanMemory.imageUrl.startsWith('data:')) {
          delete cleanMemory.imageUrl;
        }
        if (Array.isArray(cleanMemory.albumImages)) {
          cleanMemory.albumImages = cleanMemory.albumImages.filter(img => typeof img === 'string' && !img.startsWith('data:'));
        }

        const req = store.put(cleanMemory);
        req.onsuccess = async () => {
          await this.reloadMemoryCache();
          resolve(true);
        };
        req.onerror = (err) => {
          console.error('Error saving memory to IndexedDB:', err);
          resolve(false);
        };
      } catch (err) {
        console.error('Transaction error saving memory:', err);
        resolve(false);
      }
    });
  }

  // Get all custom memories from IndexedDB with resolved Object URLs
  async getAllMemories() {
    if (!this.db) await this.init();

    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction([STORE_MEMORIES], 'readonly');
        const store = tx.objectStore(STORE_MEMORIES);
        const req = store.getAll();

        req.onsuccess = async () => {
          const rawMemories = req.result || [];
          // Ensure all blobs have Object URLs created and loaded
          await this.ensureBlobUrlsLoaded(rawMemories);
          const resolved = rawMemories.map(m => this.resolveMemoryUrls(m));
          this.cachedMemories = resolved;
          resolve(resolved);
        };

        req.onerror = () => resolve(this.cachedMemories || []);
      } catch (err) {
        console.error('Error getting memories from IDB:', err);
        resolve(this.cachedMemories || []);
      }
    });
  }

  // Delete memory and associated Blobs from IndexedDB
  async deleteMemory(memId) {
    if (!this.db) await this.init();
    const memIdStr = String(memId);

    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction([STORE_MEMORIES], 'readonly');
        const store = tx.objectStore(STORE_MEMORIES);
        const req = store.get(memIdStr);

        req.onsuccess = () => {
          const memory = req.result;
          if (memory) {
            // Collect all blob keys to delete
            const keysToRemove = [];
            if (Array.isArray(memory.imageKeys)) keysToRemove.push(...memory.imageKeys);
            if (memory.imageUrlKey) keysToRemove.push(memory.imageUrlKey);

            // Remove blobs from STORE_BLOBS
            if (keysToRemove.length > 0) {
              const txBlobs = this.db.transaction([STORE_BLOBS], 'readwrite');
              const blobStore = txBlobs.objectStore(STORE_BLOBS);
              keysToRemove.forEach(k => {
                if (k && !k.startsWith('http') && !k.startsWith('data:')) {
                  blobStore.delete(k);
                  if (this.blobUrlCache.has(k)) {
                    URL.revokeObjectURL(this.blobUrlCache.get(k));
                    this.blobUrlCache.delete(k);
                  }
                }
              });
            }

            // Remove memory record
            const txMem = this.db.transaction([STORE_MEMORIES], 'readwrite');
            const memStore = txMem.objectStore(STORE_MEMORIES);
            memStore.delete(memIdStr);
          }

          this.reloadMemoryCache().then(() => resolve(true));
        };

        req.onerror = () => resolve(false);
      } catch (err) {
        console.error('Error deleting memory from IDB:', err);
        resolve(false);
      }
    });
  }

  // Preload and cache Object URLs for stored Blobs
  async ensureBlobUrlsLoaded(memories) {
    const missingKeys = new Set();
    memories.forEach(mem => {
      const keys = [];
      if (Array.isArray(mem.imageKeys)) keys.push(...mem.imageKeys);
      if (mem.imageUrlKey) keys.push(mem.imageUrlKey);
      keys.forEach(k => {
        if (k && typeof k === 'string' && !k.startsWith('http') && !k.startsWith('data:') && !k.startsWith('blob:') && !this.blobUrlCache.has(k)) {
          missingKeys.add(k);
        }
      });
    });

    if (missingKeys.size === 0) return;

    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction([STORE_BLOBS], 'readonly');
        const store = tx.objectStore(STORE_BLOBS);

        let loaded = 0;
        const total = missingKeys.size;

        missingKeys.forEach(key => {
          const req = store.get(key);
          req.onsuccess = () => {
            if (req.result && req.result.blob) {
              const objectUrl = URL.createObjectURL(req.result.blob);
              this.blobUrlCache.set(key, objectUrl);
            }
            loaded++;
            if (loaded === total) resolve();
          };
          req.onerror = () => {
            loaded++;
            if (loaded === total) resolve();
          };
        });
      } catch (err) {
        console.warn('Error loading blob URLs:', err);
        resolve();
      }
    });
  }

  // Resolve memory blob keys into live Object URLs
  resolveMemoryUrls(mem) {
    if (!mem) return mem;

    let imageUrl = mem.imageUrl || '';
    if (mem.imageUrlKey) {
      imageUrl = this.getUrlForBlobKey(mem.imageUrlKey) || mem.imageUrl || '';
    }

    let albumImages = [];
    if (Array.isArray(mem.imageKeys) && mem.imageKeys.length > 0) {
      albumImages = mem.imageKeys.map(k => this.getUrlForBlobKey(k) || k);
    } else if (Array.isArray(mem.albumImages)) {
      albumImages = mem.albumImages.map(img => {
        if (typeof img === 'string') return this.getUrlForBlobKey(img) || img;
        return img;
      });
    }

    if (!imageUrl && albumImages.length > 0) {
      imageUrl = albumImages[0];
    }

    return {
      ...mem,
      imageUrl: imageUrl,
      albumImages: albumImages.length > 0 ? albumImages : [imageUrl]
    };
  }

  async reloadMemoryCache() {
    this.cachedMemories = await this.getAllMemories();
    return this.cachedMemories;
  }

  // Migration from legacy localStorage base64 strings to IndexedDB Blobs
  async migrateLegacyLocalStorage() {
    try {
      const legacyJson = localStorage.getItem('campuslens_custom_memories');
      if (!legacyJson) return;

      const legacyMemories = JSON.parse(legacyJson);
      if (!Array.isArray(legacyMemories) || legacyMemories.length === 0) return;

      console.log(`Migrating ${legacyMemories.length} legacy memories from localStorage to IndexedDB...`);

      for (const mem of legacyMemories) {
        const imageKeys = [];
        let imageUrlKey = null;

        const imgsToConvert = Array.isArray(mem.albumImages) && mem.albumImages.length > 0
          ? mem.albumImages
          : (mem.imageUrl ? [mem.imageUrl] : []);

        for (let idx = 0; idx < imgsToConvert.length; idx++) {
          const imgStr = imgsToConvert[idx];
          if (imgStr && typeof imgStr === 'string' && imgStr.startsWith('data:')) {
            const blobKey = `blob_migrated_${mem.id || Date.now()}_${idx}`;
            await this.saveBlob(imgStr, blobKey);
            imageKeys.push(blobKey);
            if (idx === 0) imageUrlKey = blobKey;
          } else if (imgStr) {
            imageKeys.push(imgStr);
            if (idx === 0) imageUrlKey = imgStr;
          }
        }

        const updatedMem = {
          ...mem,
          imageUrlKey: imageUrlKey,
          imageKeys: imageKeys,
          imageUrl: (mem.imageUrl && mem.imageUrl.startsWith('data:')) ? '' : mem.imageUrl,
          albumImages: (mem.albumImages || []).map(img => (typeof img === 'string' && img.startsWith('data:')) ? '' : img)
        };

        await this.saveMemory(updatedMem);
      }

      // Clear heavy base64 strings from localStorage to keep it lightweight!
      localStorage.removeItem('campuslens_custom_memories');
      console.log('Legacy memories successfully migrated to IndexedDB. LocalStorage freed.');
    } catch (err) {
      console.warn('Error during legacy memory migration:', err);
    }
  }

  // Get raw un-resolved memory records from IndexedDB
  async getRawMemories() {
    if (!this.db) await this.init();
    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction([STORE_MEMORIES], 'readonly');
        const store = tx.objectStore(STORE_MEMORIES);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch (e) {
        resolve([]);
      }
    });
  }

  // Export complete archive payload including encoded binary Blobs and metadata
  async exportFullArchive() {
    if (!this.db) await this.init();

    const rawMemories = await this.getRawMemories();

    const rawBlobs = await new Promise((resolve) => {
      try {
        const tx = this.db.transaction([STORE_BLOBS], 'readonly');
        const store = tx.objectStore(STORE_BLOBS);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch (e) {
        resolve([]);
      }
    });

    const serializedBlobs = [];
    for (const b of rawBlobs) {
      if (b && b.blob && b.blob instanceof Blob) {
        try {
          const dataUrl = await new Promise((res) => {
            const reader = new FileReader();
            reader.onload = () => res(reader.result);
            reader.onerror = () => res(null);
            reader.readAsDataURL(b.blob);
          });

          if (dataUrl) {
            serializedBlobs.push({
              id: b.id,
              dataUrl: dataUrl,
              type: b.type || b.blob.type || 'image/jpeg',
              size: b.size || b.blob.size || 0,
              aspectRatio: b.aspectRatio || null,
              createdAt: b.createdAt || Date.now()
            });
          }
        } catch (err) {
          console.warn('Error serializing blob:', b.id, err);
        }
      }
    }

    const usersJson = localStorage.getItem('campuslens_users');
    const users = usersJson ? JSON.parse(usersJson) : [];

    const modifiedMemories = JSON.parse(localStorage.getItem('campuslens_modified_memories') || '{}');
    const deletedMemories = JSON.parse(localStorage.getItem('campuslens_deleted_memories') || '[]');
    const potwCustom = JSON.parse(localStorage.getItem('campuslens_potw_custom') || 'null');
    const siteConfig = JSON.parse(localStorage.getItem('campuslens_site_config_override') || 'null');
    const videoStories = JSON.parse(localStorage.getItem('campuslens_video_stories') || '[]');

    const userFavoritesMap = {};
    const userAlbumsMap = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('campuslens_user_favorites_')) {
        const uId = key.replace('campuslens_user_favorites_', '');
        userFavoritesMap[uId] = JSON.parse(localStorage.getItem(key) || '[]');
      }
      if (key && key.startsWith('campuslens_user_albums_')) {
        const uId = key.replace('campuslens_user_albums_', '');
        userAlbumsMap[uId] = JSON.parse(localStorage.getItem(key) || '[]');
      }
    }

    return {
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      app: "MULens",
      users: users,
      media: rawMemories,
      albums: userAlbumsMap,
      blobs: serializedBlobs,
      profileImages: [],
      coverImages: [],
      settings: {
        modifiedMemories: modifiedMemories,
        deletedMemories: deletedMemories,
        potwCustom: potwCustom,
        siteConfig: siteConfig,
        videoStories: videoStories,
        userFavorites: userFavoritesMap
      }
    };
  }

  // Restore payload from backup JSON file safely
  async importFullArchive(archiveData) {
    if (!this.db) await this.init();

    if (!archiveData || typeof archiveData !== 'object') {
      throw new Error('Invalid archive format. Missing core object structure.');
    }

    if (archiveData.app !== 'MULens' && !archiveData.media && !archiveData.blobs) {
      throw new Error('Incompatible archive file. The selected JSON is not a valid MULens backup file.');
    }

    // 1. Restore Blobs to STORE_BLOBS
    const existingBlobKeys = await new Promise((resolve) => {
      try {
        const tx = this.db.transaction([STORE_BLOBS], 'readonly');
        const store = tx.objectStore(STORE_BLOBS);
        const req = store.getAllKeys();
        req.onsuccess = () => resolve(new Set((req.result || []).map(String)));
        req.onerror = () => resolve(new Set());
      } catch (e) {
        resolve(new Set());
      }
    });

    const importedBlobs = Array.isArray(archiveData.blobs) ? archiveData.blobs : [];
    let newBlobsCount = 0;

    for (const blobObj of importedBlobs) {
      if (!blobObj || !blobObj.id || !blobObj.dataUrl) continue;
      const blobKeyStr = String(blobObj.id);

      // Skip duplicate blobs
      if (existingBlobKeys.has(blobKeyStr)) continue;

      const nativeBlob = this.dataURLToBlob(blobObj.dataUrl);
      if (!nativeBlob) continue;

      await new Promise((resolve) => {
        try {
          const tx = this.db.transaction([STORE_BLOBS], 'readwrite');
          const store = tx.objectStore(STORE_BLOBS);
          const record = {
            id: blobObj.id,
            blob: nativeBlob,
            type: blobObj.type || nativeBlob.type || 'image/jpeg',
            size: blobObj.size || nativeBlob.size || 0,
            aspectRatio: blobObj.aspectRatio || null,
            createdAt: blobObj.createdAt || Date.now()
          };
          const req = store.put(record);
          req.onsuccess = () => {
            existingBlobKeys.add(blobKeyStr);
            newBlobsCount++;
            resolve(true);
          };
          req.onerror = () => resolve(false);
        } catch (err) {
          resolve(false);
        }
      });
    }

    // 2. Restore Raw Memories to STORE_MEMORIES
    const existingMemIds = await new Promise((resolve) => {
      try {
        const tx = this.db.transaction([STORE_MEMORIES], 'readonly');
        const store = tx.objectStore(STORE_MEMORIES);
        const req = store.getAllKeys();
        req.onsuccess = () => resolve(new Set((req.result || []).map(String)));
        req.onerror = () => resolve(new Set());
      } catch (e) {
        resolve(new Set());
      }
    });

    const importedMedia = Array.isArray(archiveData.media)
      ? archiveData.media
      : (Array.isArray(archiveData.memories) ? archiveData.memories : []);

    let newMediaCount = 0;

    for (const memObj of importedMedia) {
      if (!memObj || memObj.id === undefined || memObj.id === null) continue;
      const memIdStr = String(memObj.id);

      // Skip duplicate memory items
      if (existingMemIds.has(memIdStr)) continue;

      const cleanMem = { ...memObj };
      if (cleanMem.imageUrl && cleanMem.imageUrl.startsWith('data:')) {
        delete cleanMem.imageUrl;
      }
      if (Array.isArray(cleanMem.albumImages)) {
        cleanMem.albumImages = cleanMem.albumImages.filter(img => typeof img === 'string' && !img.startsWith('data:'));
      }

      await new Promise((resolve) => {
        try {
          const tx = this.db.transaction([STORE_MEMORIES], 'readwrite');
          const store = tx.objectStore(STORE_MEMORIES);
          const req = store.put(cleanMem);
          req.onsuccess = () => {
            existingMemIds.add(memIdStr);
            newMediaCount++;
            resolve(true);
          };
          req.onerror = () => resolve(false);
        } catch (err) {
          resolve(false);
        }
      });
    }

    // 3. Restore User Accounts
    if (Array.isArray(archiveData.users) && archiveData.users.length > 0) {
      const existingUsers = JSON.parse(localStorage.getItem('campuslens_users') || '[]');
      const existingUserEmails = new Set(existingUsers.map(u => (u.email || '').toLowerCase()));
      const existingUserIds = new Set(existingUsers.map(u => String(u.id)));

      let usersAdded = false;
      archiveData.users.forEach(u => {
        if (u && (u.email || u.id)) {
          const uEmail = (u.email || '').toLowerCase();
          const uId = String(u.id);
          if (!existingUserEmails.has(uEmail) && !existingUserIds.has(uId)) {
            existingUsers.push(u);
            if (uEmail) existingUserEmails.add(uEmail);
            if (uId) existingUserIds.add(uId);
            usersAdded = true;
          }
        }
      });

      if (usersAdded) {
        localStorage.setItem('campuslens_users', JSON.stringify(existingUsers));
      }
    }

    // 4. Restore Settings & Overrides
    if (archiveData.settings && typeof archiveData.settings === 'object') {
      const st = archiveData.settings;

      if (st.modifiedMemories && typeof st.modifiedMemories === 'object') {
        const localMod = JSON.parse(localStorage.getItem('campuslens_modified_memories') || '{}');
        let modChanged = false;
        Object.keys(st.modifiedMemories).forEach(mId => {
          if (!localMod[mId]) {
            localMod[mId] = st.modifiedMemories[mId];
            modChanged = true;
          }
        });
        if (modChanged) {
          localStorage.setItem('campuslens_modified_memories', JSON.stringify(localMod));
        }
      }

      if (Array.isArray(st.deletedMemories) && st.deletedMemories.length > 0) {
        const localDel = JSON.parse(localStorage.getItem('campuslens_deleted_memories') || '[]');
        const localDelSet = new Set(localDel.map(String));
        let delChanged = false;
        st.deletedMemories.forEach(dId => {
          if (!localDelSet.has(String(dId))) {
            localDel.push(dId);
            localDelSet.add(String(dId));
            delChanged = true;
          }
        });
        if (delChanged) {
          localStorage.setItem('campuslens_deleted_memories', JSON.stringify(localDel));
        }
      }

      // Note: POTW is managed server-side; do not restore archived POTW into localStorage.

      if (st.siteConfig && !localStorage.getItem('campuslens_site_config_override')) {
        localStorage.setItem('campuslens_site_config_override', JSON.stringify(st.siteConfig));
      }

      if (Array.isArray(st.videoStories) && st.videoStories.length > 0) {
        const localVideos = JSON.parse(localStorage.getItem('campuslens_video_stories') || '[]');
        const localVideoIds = new Set(localVideos.map(v => String(v.id)));
        let videoAdded = false;
        st.videoStories.forEach(v => {
          if (v && v.id && !localVideoIds.has(String(v.id))) {
            localVideos.push(v);
            localVideoIds.add(String(v.id));
            videoAdded = true;
          }
        });
        if (videoAdded) {
          localStorage.setItem('campuslens_video_stories', JSON.stringify(localVideos));
        }
      }

      if (st.userFavorites && typeof st.userFavorites === 'object') {
        Object.keys(st.userFavorites).forEach(uId => {
          const key = `campuslens_user_favorites_${uId}`;
          if (!localStorage.getItem(key)) {
            localStorage.setItem(key, JSON.stringify(st.userFavorites[uId]));
          }
        });
      }
    }

    if (archiveData.albums && typeof archiveData.albums === 'object') {
      Object.keys(archiveData.albums).forEach(uId => {
        const key = `campuslens_user_albums_${uId}`;
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, JSON.stringify(archiveData.albums[uId]));
        }
      });
    }

    await this.reloadMemoryCache();

    return {
      importedBlobsCount: newBlobsCount,
      importedMediaCount: newMediaCount
    };
  }
}

export const imageStoreDB = new ImageStoreDB();
