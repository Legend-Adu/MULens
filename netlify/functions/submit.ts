import { verifyIdentity, authError } from '../lib/authorization.js';
// netlify/functions/submit.ts - Serverless handler for memory submissions
import { createClient } from '@supabase/supabase-js';

// Strictly require SUPABASE_SERVICE_ROLE_KEY from server environment ONLY - never fall back to publishable key
const BUCKET_NAME = 'mulens-media';

function getAdminClient() {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://ggblwkqprciadgdxibip.supabase.co';
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured on the server.');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export async function handler(event: any) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: JSON.stringify({ status: 'ok' }) };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const identity = await verifyIdentity(event);
  if (identity.ok === false) return authError(identity, headers);

  try {
    const supabaseAdmin = getAdminClient();
    const memoryData = JSON.parse(event.body || '{}');

    if (!memoryData || !memoryData.title) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid memory data submitted.' }) };
    }

    const memId = memoryData.id || `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    if (typeof memId !== 'string' || !/^[A-Za-z0-9_-]{1,100}$/.test(memId)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid memory ID.' }) };
    }
    const { data: existing, error: lookupError } = await supabaseAdmin.from('memories').select('id').eq('id', memId).maybeSingle();
    if (lookupError) return { statusCode: 503, headers, body: JSON.stringify({ error: 'Unable to check memory ID.' }) };
    if (existing) return { statusCode: 409, headers, body: JSON.stringify({ error: 'Memory ID already exists.' }) };
    const sourceImages = Array.isArray(memoryData.albumImages) && memoryData.albumImages.length > 0
      ? memoryData.albumImages
      : [memoryData.imageUrl];

    const albumUrls: string[] = [];

    for (let i = 0; i < sourceImages.length; i++) {
      const src = sourceImages[i];
      if (!src) continue;

      if (typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://')) && !src.startsWith('data:')) {
        albumUrls.push(src);
      } else if (typeof src === 'string' && src.startsWith('data:')) {
        try {
          const matches = src.match(/^data:(image\/(?:jpeg|png|webp|gif|avif));base64,([A-Za-z0-9+/=]+)$/i);
          if (!matches) continue;
          const mimeType = matches[1].toLowerCase();
          const base64Data = matches[2];
          const ext = mimeType.split('/')[1] || 'jpg';
          const buffer = Buffer.from(base64Data, 'base64');

          const filePath = `memories/${memId}/${i}_${Date.now()}.${ext}`;
          const { error: uploadErr } = await supabaseAdmin.storage
            .from(BUCKET_NAME)
            .upload(filePath, buffer, {
              contentType: mimeType,
              cacheControl: '360000',
              upsert: false
            });

          if (!uploadErr) {
            const { data: publicUrlData } = supabaseAdmin.storage
              .from(BUCKET_NAME)
              .getPublicUrl(filePath);
            albumUrls.push(publicUrlData.publicUrl);
          }
        } catch (err) {
          console.error('[Submit Storage Error]:', err);
        }
      }
    }

    if (!albumUrls.length) return { statusCode: 400, headers, body: JSON.stringify({ error: 'No valid photos were uploaded.' }) };
    const mainImageUrl = albumUrls[0];
    const albumImagesFinal = albumUrls.length > 0 ? albumUrls : [mainImageUrl];

    // Enforce pending status and server timestamp on new submissions
    const dbPayload = {
      id: String(memId),
      title: memoryData.title || 'Campus Memory',
      description: memoryData.description || '',
      image_url: mainImageUrl,
      album_images: albumImagesFinal,
      status: 'pending', // FORCED to pending for new submission
      category: memoryData.category || 'campus',
      badge_label: memoryData.badgeLabel || 'Campus',
      badge_icon: memoryData.badgeIcon || 'bi-images',
      location: memoryData.location || 'Main Campus',
      date: memoryData.date || 'Recent',
      author: { id: identity.user.id, name: identity.user.name, role: 'Student Creator', avatarUrl: identity.user.avatar },
      owner_id: identity.user.id,
      user_id: identity.user.id,
      tags: Array.isArray(memoryData.tags) ? memoryData.tags : [],
      likes_count: 1,
      aspect_ratio: memoryData.aspectRatio || null,
      aspect_ratio_class: memoryData.aspectRatioClass || 'ratio-portrait-4-5',
      created_at: Date.now(),
      approved_at: null,
      approved_by: null
    };

    const { error: insertErr } = await supabaseAdmin
      .from('memories')
      .insert(dbPayload);

    if (insertErr) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: insertErr.message }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        memory: {
          ...memoryData,
          ownerId: identity.user.id,
          userId: identity.user.id,
          author: dbPayload.author,
          id: String(memId),
          imageUrl: mainImageUrl,
          albumImages: albumImagesFinal,
          status: 'pending',
          createdAt: dbPayload.created_at
        }
      })
    };
  } catch (err: any) {
    console.error('[Submit Handler Exception]:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Server error during submission' })
    };
  }
}
