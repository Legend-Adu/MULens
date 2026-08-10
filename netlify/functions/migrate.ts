// netlify/functions/migrate.ts - Serverless handler for migrating IndexedDB data to Supabase Cloud
import { createClient } from '@supabase/supabase-js';

const BUCKET_NAME = 'mulens-media';

export async function handler(event: any) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: JSON.stringify({ status: 'ok' }) };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  // Read environment variables dynamically at request time
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ggblwkqprciadgdxibip.supabase.co';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const adminSecretEnv = process.env.ADMIN_SECRET_KEY || '';

  // 1. Verify SUPABASE_SERVICE_ROLE_KEY configuration on server
  if (!serviceRoleKey) {
    console.error('[Migrate Error]: SUPABASE_SERVICE_ROLE_KEY environment variable is not configured on the server.');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY environment variable is not set on the server.'
      })
    };
  }

  // 2. Secret verification of admin authorization header if ADMIN_SECRET_KEY is set on server
  const requestAdminSecret = (
    event.headers['x-admin-secret'] ||
    event.headers['X-Admin-Secret'] ||
    (event.headers['authorization'] ? event.headers['authorization'].replace(/^Bearer\s+/i, '') : '') ||
    ''
  ).trim();

  if (adminSecretEnv && requestAdminSecret !== adminSecretEnv) {
    console.warn('[Migrate Auth Warning]: Invalid x-admin-secret header provided.');
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({
        error: 'Unauthorized: Invalid x-admin-secret provided. Admin operations require a matching server secret.'
      })
    };
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // Ensure bucket exists
    try {
      await supabaseAdmin.storage.createBucket(BUCKET_NAME, { public: true });
    } catch (bErr: any) {
      // Bucket may already exist or error ignored
    }

    // Parse payload safely
    let payload: any = {};
    if (typeof event.body === 'string') {
      try {
        payload = JSON.parse(event.body || '{}');
      } catch (parseErr: any) {
        console.error('[Migrate JSON Parse Error]:', parseErr.message);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid migration payload: Failed to parse request JSON body.' })
        };
      }
    } else if (typeof event.body === 'object' && event.body !== null) {
      payload = event.body;
    }

    const { memories } = payload;

    if (!Array.isArray(memories) || memories.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          memoriesProcessed: 0,
          imagesUploaded: 0,
          albumsProcessed: 0,
          failedImages: 0,
          errors: [],
          message: 'No local IndexedDB memories found in batch payload.'
        })
      };
    }

    let memoriesProcessedCount = 0;
    let imagesUploadedCount = 0;
    let albumsProcessedCount = 0;
    let failedImagesCount = 0;
    const errors: string[] = [];

    for (let idx = 0; idx < memories.length; idx++) {
      const mem = memories[idx];
      const memIdStr = String(mem.id || `mem_migrated_${Date.now()}_${idx}`);

      // Prefer albumImages or imageUrl over imageKeys (which contain raw IDB key strings)
      const sourceImages: string[] = (Array.isArray(mem.albumImages) && mem.albumImages.length > 0)
        ? mem.albumImages
        : (mem.imageUrl ? [mem.imageUrl] : (Array.isArray(mem.imageKeys) ? mem.imageKeys : []));

      const albumUrls: string[] = [];
      const isAlbum = sourceImages.length > 1;

      for (let i = 0; i < sourceImages.length; i++) {
        const src = sourceImages[i];
        if (!src) continue;

        if (typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://')) && !src.startsWith('data:')) {
          // Already a public URL - preserve without re-uploading
          albumUrls.push(src);
        } else if (typeof src === 'string' && src.startsWith('data:')) {
          // Convert base64 data URL to Buffer and upload to Supabase Storage
          try {
            const matches = src.match(/^data:([^;]+);base64,(.+)$/);
            const mimeType = matches ? matches[1] : 'image/jpeg';
            const base64Data = matches ? matches[2] : (src.includes(',') ? src.split(',')[1] : src);

            let ext = 'jpg';
            if (mimeType.includes('png')) ext = 'png';
            else if (mimeType.includes('webp')) ext = 'webp';
            else if (mimeType.includes('gif')) ext = 'gif';
            else if (mimeType.includes('svg')) ext = 'svg';

            const buffer = Buffer.from(base64Data, 'base64');
            const fileKey = `${i}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${ext}`;
            const filePath = `memories/${memIdStr}/${fileKey}`;

            const { error: uploadErr } = await supabaseAdmin.storage
              .from(BUCKET_NAME)
              .upload(filePath, buffer, {
                contentType: mimeType,
                cacheControl: '3600000',
                upsert: true
              });

            if (!uploadErr) {
              const { data: publicUrlData } = supabaseAdmin.storage
                .from(BUCKET_NAME)
                .getPublicUrl(filePath);

              if (publicUrlData && publicUrlData.publicUrl) {
                albumUrls.push(publicUrlData.publicUrl);
                imagesUploadedCount++;
              } else {
                albumUrls.push(src);
              }
            } else {
              console.error(`[Migrate Storage Upload Error for ${memIdStr} img ${i}]:`, uploadErr.message);
              failedImagesCount++;
              errors.push(`Memory '${mem.title || memIdStr}' image ${i + 1}: ${uploadErr.message}`);
              albumUrls.push(src);
            }
          } catch (imgErr: any) {
            console.error(`[Migrate Storage Exception for ${memIdStr} img ${i}]:`, imgErr.message);
            failedImagesCount++;
            errors.push(`Memory '${mem.title || memIdStr}' image ${i + 1}: ${imgErr.message}`);
            albumUrls.push(src);
          }
        } else {
          albumUrls.push(src);
        }
      }

      const mainImageUrl = albumUrls[0] || mem.imageUrl || '';
      const albumImagesFinal = albumUrls.length > 0 ? albumUrls : [mainImageUrl];

      const dbPayload = {
        id: memIdStr,
        title: mem.title || 'Campus Memory',
        description: mem.description || '',
        image_url: mainImageUrl,
        album_images: albumImagesFinal,
        status: mem.status || 'approved',
        category: mem.category || 'campus',
        badge_label: mem.badgeLabel || 'Campus',
        badge_icon: mem.badgeIcon || 'bi-images',
        location: mem.location || 'Main Campus',
        date: mem.date || 'Recent',
        author: mem.author || {},
        owner_id: mem.ownerId || mem.userId || (mem.author ? mem.author.id : null) || null,
        user_id: mem.userId || mem.ownerId || (mem.author ? mem.author.id : null) || null,
        tags: Array.isArray(mem.tags) ? mem.tags : [],
        likes_count: typeof mem.likesCount === 'number' ? mem.likesCount : 1,
        aspect_ratio: mem.aspectRatio || null,
        aspect_ratio_class: mem.aspectRatioClass || 'ratio-portrait-4-5',
        created_at: typeof mem.createdAt === 'number' ? mem.createdAt : Date.now(),
        approved_at: mem.approvedAt || (mem.status === 'approved' ? Date.now() : null),
        approved_by: mem.approvedBy || (mem.status === 'approved' ? 'Admin' : null)
      };

      const { error: upsertErr } = await supabaseAdmin
        .from('memories')
        .upsert(dbPayload, { onConflict: 'id' });

      if (upsertErr) {
        console.error(`[Migrate DB Upsert Error for ${memIdStr}]:`, upsertErr.message);
        errors.push(`Memory '${mem.title || memIdStr}' DB update: ${upsertErr.message}`);
      } else {
        memoriesProcessedCount++;
        if (isAlbum) {
          albumsProcessedCount++;
        }
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        memoriesProcessed: memoriesProcessedCount,
        imagesUploaded: imagesUploadedCount,
        albumsProcessed: albumsProcessedCount,
        failedImages: failedImagesCount,
        errors,
        message: `Processed ${memoriesProcessedCount} memories, uploaded ${imagesUploadedCount} images.`
      })
    };
  } catch (err: any) {
    console.error('[Migration Handler Exception]:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Unexpected server exception during migration.' })
    };
  }
}
