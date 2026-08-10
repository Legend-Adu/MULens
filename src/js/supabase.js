// src/js/supabase.js - Global Supabase Cloud Sync Engine for MULens Media Archive
import { createClient } from '@supabase/supabase-js';
import { imageStoreDB } from './idb.js';

// Supabase Environment Configuration
const SUPABASE_URL = (import.meta.env && import.meta.env.VITE_SUPABASE_URL) || 'https://ggblwkqprciadgdxibip.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = (import.meta.env && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) || 'sb_publishable_YbJ5o3-5JycantNa1AZbMQ_nJKgc5Ih';

export const BUCKET_NAME = 'mulens-media';

// Public Supabase Client (Publishable Key ONLY) - Read-only for approved memories & storage assets
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

// Cache for memories loaded from Supabase Cloud
export let cachedCloudMemories = [];
export let isSupabaseConnected = false;

/**
 * Initialize Supabase connection check for public approved gallery
 */
export async function initSupabase() {
  try {
    const { data, error } = await supabase.from('memories').select('id').eq('status', 'approved').limit(1);
    if (error) {
      console.warn('[Supabase] Public gallery check warning:', error.message);
      isSupabaseConnected = false;
    } else {
      isSupabaseConnected = true;
      console.log('[Supabase] Successfully connected to public gallery on Supabase.');
    }
  } catch (err) {
    console.warn('[Supabase] Initialization network check failed:', err);
    isSupabaseConnected = false;
  }
}

/**
 * Fetch all approved public memories from Supabase Database
 */
export async function fetchMemoriesFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Supabase Fetch Approved Error]:', error.message);
      return [];
    }

    if (!Array.isArray(data)) return [];

    const mapped = data.map(row => mapRowToMemory(row));
    cachedCloudMemories = mapped;
    return mapped;
  } catch (err) {
    console.error('[Supabase Fetch Exception]:', err);
    return [];
  }
}

/**
 * Helper to map DB row object to MULens Memory Object
 */
export function mapRowToMemory(row) {
  if (!row) return null;
  const albumImgsRaw = row.album_images || row.albumImages || [];
  const albumImages = Array.isArray(albumImgsRaw) ? albumImgsRaw : (typeof albumImgsRaw === 'string' ? JSON.parse(albumImgsRaw) : []);
  const mainImg = row.image_url || row.imageUrl || (albumImages.length > 0 ? albumImages[0] : '');

  const tagsRaw = row.tags || [];
  const tags = Array.isArray(tagsRaw) ? tagsRaw : (typeof tagsRaw === 'string' ? JSON.parse(tagsRaw) : []);

  const authorRaw = row.author || {};
  const author = typeof authorRaw === 'object' ? authorRaw : (typeof authorRaw === 'string' ? JSON.parse(authorRaw) : {});

  return {
    id: String(row.id),
    title: row.title || 'Campus Memory',
    description: row.description || '',
    imageUrl: mainImg,
    albumImages: albumImages.length > 0 ? albumImages : [mainImg],
    status: row.status || 'pending',
    category: row.category || 'campus',
    badgeLabel: row.badge_label || row.badgeLabel || 'Campus',
    badgeIcon: row.badge_icon || row.badgeIcon || 'bi-images',
    location: row.location || 'Main Campus',
    date: row.date || 'Recent',
    author: {
      id: author.id || row.owner_id || row.ownerId || null,
      name: author.name || 'Student Photographer',
      role: author.role || 'Contributor',
      avatarUrl: author.avatarUrl || author.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'
    },
    ownerId: row.owner_id || row.ownerId || row.user_id || row.userId || (author ? author.id : null),
    userId: row.user_id || row.userId || row.owner_id || row.ownerId || (author ? author.id : null),
    tags: tags,
    likesCount: typeof row.likes_count === 'number' ? row.likes_count : (row.likesCount || 1),
    aspectRatio: row.aspect_ratio || row.aspectRatio || null,
    aspectRatioClass: row.aspect_ratio_class || row.aspectRatioClass || 'ratio-portrait-4-5',
    createdAt: row.created_at || row.createdAt || Date.now(),
    approvedAt: row.approved_at || row.approvedAt || null,
    approvedBy: row.approved_by || row.approvedBy || null
  };
}

/**
 * Submit / Save a memory record via Netlify Server Function (/api/submit)
 */
export async function saveMemoryToSupabase(mem) {
  if (!mem || !mem.id) return false;

  try {
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mem)
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      console.warn('[Server Submit Warning]:', errJson.error || res.statusText);
      return false;
    }

    const json = await res.json();
    return json.success || false;
  } catch (err) {
    console.error('[Server Submit Exception]:', err);
    return false;
  }
}

/**
 * Update memory approval status via Netlify Server Function (/api/admin-action)
 */
export async function updateMemoryStatusInSupabase(memId, status, approvedBy = null, adminSecretKey = null) {
  if (!memId) return false;
  const secretHeader = adminSecretKey || sessionStorage.getItem('mulens_admin_secret') || '';
  try {
    const res = await fetch('/api/admin-action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': secretHeader
      },
      body: JSON.stringify({
        action: status === 'approved' ? 'approve' : (status === 'rejected' ? 'reject' : status),
        memId: String(memId),
        approvedBy: approvedBy
      })
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      console.warn('[Server Admin Action Warning]:', errJson.error || res.statusText);
      return false;
    }

    const json = await res.json();
    return json.success || false;
  } catch (err) {
    console.error('[Server Admin Action Exception]:', err);
    return false;
  }
}

/**
 * Delete a memory via Netlify Server Function (/api/admin-action)
 */
export async function deleteMemoryFromSupabase(memId, adminSecretKey = null) {
  if (!memId) return false;
  const secretHeader = adminSecretKey || sessionStorage.getItem('mulens_admin_secret') || '';
  try {
    const res = await fetch('/api/admin-action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': secretHeader
      },
      body: JSON.stringify({
        action: 'delete',
        memId: String(memId)
      })
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      console.warn('[Server Admin Delete Warning]:', errJson.error || res.statusText);
      return false;
    }

    const json = await res.json();
    return json.success || false;
  } catch (err) {
    console.error('[Server Admin Delete Exception]:', err);
    return false;
  }
}

/**
 * Migrate existing local IndexedDB memories and Blobs to Supabase via Serverless Function (/api/migrate)
 */
export async function migrateIndexedDBToSupabase(onProgress = null, adminSecretKey = null) {
  if (!imageStoreDB.db) await imageStoreDB.init();

  const rawMemories = await imageStoreDB.getRawMemories();
  if (!Array.isArray(rawMemories) || rawMemories.length === 0) {
    return {
      success: true,
      memoriesProcessed: 0,
      imagesUploaded: 0,
      albumsProcessed: 0,
      failedImages: 0,
      total: 0,
      message: 'No local IndexedDB memories found to migrate.'
    };
  }

  const total = rawMemories.length;
  const BATCH_SIZE = 2; // Transfer 2 memories per HTTP request payload to avoid serverless HTTP 413 Payload Too Large limits
  const totalBatches = Math.ceil(total / BATCH_SIZE);

  let totalMemoriesProcessed = 0;
  let totalImagesUploaded = 0;
  let totalAlbumsProcessed = 0;
  let totalFailedImages = 0;
  const allErrors = [];

  const secretHeader = adminSecretKey || sessionStorage.getItem('mulens_admin_secret') || '';

  for (let b = 0; b < totalBatches; b++) {
    const startIdx = b * BATCH_SIZE;
    const endIdx = Math.min(startIdx + BATCH_SIZE, total);
    const batchRawMemories = rawMemories.slice(startIdx, endIdx);

    if (onProgress) {
      onProgress(
        startIdx + 1,
        total,
        `Batch ${b + 1} of ${totalBatches}: Preparing items ${startIdx + 1}-${endIdx}...`
      );
    }

    // Convert Blobs for items in this batch only
    const batchPayload = [];
    for (let i = 0; i < batchRawMemories.length; i++) {
      const mem = batchRawMemories[i];
      const currentNum = startIdx + i + 1;
      if (onProgress) {
        onProgress(
          currentNum,
          total,
          `Batch ${b + 1}/${totalBatches}: Reading image Blobs for "${mem.title || mem.id}"`
        );
      }

      const sourceImages = (Array.isArray(mem.imageKeys) && mem.imageKeys.length > 0)
        ? mem.imageKeys
        : ((Array.isArray(mem.albumImages) && mem.albumImages.length > 0) ? mem.albumImages : [mem.imageUrl]);

      const convertedAlbumImages = [];
      for (const src of sourceImages) {
        if (!src) continue;
        if (typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:'))) {
          convertedAlbumImages.push(src);
        } else if (typeof src === 'string' && src.startsWith('blob:')) {
          try {
            const resp = await fetch(src);
            const blob = await resp.blob();
            const dataUrl = await imageStoreDB.blobToDataURL(blob);
            convertedAlbumImages.push(dataUrl || src);
          } catch (e) {
            convertedAlbumImages.push(src);
          }
        } else {
          // Resolve blob key from IndexedDB
          const blobObj = await imageStoreDB.getBlob(src);
          if (blobObj && blobObj.blob) {
            const dataUrl = await imageStoreDB.blobToDataURL(blobObj.blob);
            convertedAlbumImages.push(dataUrl || src);
          } else {
            convertedAlbumImages.push(src);
          }
        }
      }

      batchPayload.push({
        ...mem,
        id: String(mem.id),
        imageUrl: convertedAlbumImages[0] || mem.imageUrl || '',
        albumImages: convertedAlbumImages
      });
    }

    if (onProgress) {
      onProgress(
        endIdx,
        total,
        `Batch ${b + 1}/${totalBatches}: Uploading Blobs to Supabase Storage & Database...`
      );
    }

    const res = await fetch('/api/migrate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': secretHeader
      },
      body: JSON.stringify({ memories: batchPayload })
    });

    let json = {};
    try {
      json = await res.json();
    } catch (e) {
      json = {};
    }

    if (!res.ok) {
      const errorText = json.error || (res.statusText ? `HTTP ${res.status}: ${res.statusText}` : `HTTP ${res.status} Error`);
      throw new Error(`Batch ${b + 1}/${totalBatches} failed: ${errorText}`);
    }

    totalMemoriesProcessed += (json.memoriesProcessed || 0);
    totalImagesUploaded += (json.imagesUploaded || 0);
    totalAlbumsProcessed += (json.albumsProcessed || 0);
    totalFailedImages += (json.failedImages || 0);
    if (Array.isArray(json.errors) && json.errors.length > 0) {
      allErrors.push(...json.errors);
    }
  }

  // Refresh cached approved cloud memories after all batches complete
  await fetchMemoriesFromSupabase();

  const summaryMessage = `Migration result:\nMemories processed: ${totalMemoriesProcessed}\nImages uploaded: ${totalImagesUploaded}\nAlbums processed: ${totalAlbumsProcessed}\nFailed images: ${totalFailedImages}`;

  return {
    success: totalFailedImages === 0,
    memoriesProcessed: totalMemoriesProcessed,
    imagesUploaded: totalImagesUploaded,
    albumsProcessed: totalAlbumsProcessed,
    failedImages: totalFailedImages,
    total,
    errors: allErrors,
    message: summaryMessage
  };
}

/**
 * Unused fallback upload function preserved for reference
 */
export async function uploadMediaToSupabase(fileOrBlobOrUrl) {
  return typeof fileOrBlobOrUrl === 'string' ? fileOrBlobOrUrl : null;
}
