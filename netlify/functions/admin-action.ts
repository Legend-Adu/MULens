// netlify/functions/admin-action.ts - Serverless handler for admin approval, rejection, and deletion
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ggblwkqprciadgdxibip.supabase.co';
// Strictly require SUPABASE_SERVICE_ROLE_KEY from server environment ONLY - never fall back to publishable key
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || '';
const BUCKET_NAME = 'mulens-media';

function getAdminClient() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured in server environment variables.');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

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

  // Cryptographic / Secret verification of admin authorization
  const requestAdminSecret = event.headers['x-admin-secret'] || event.headers['X-Admin-Secret'] || (event.headers['authorization'] ? event.headers['authorization'].replace('Bearer ', '') : '');

  if (!ADMIN_SECRET_KEY || requestAdminSecret !== ADMIN_SECRET_KEY) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized: Invalid or missing x-admin-secret header. Admin operations require server-side verification.' })
    };
  }

  try {
    const supabaseAdmin = getAdminClient();
    const payload = JSON.parse(event.body || '{}');
    const { action, memId, approvedBy } = payload;

    if (!memId || !action) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'memId and action are required.' }) };
    }

    const memIdStr = String(memId);

    if (action === 'approve') {
      const { error } = await supabaseAdmin
        .from('memories')
        .update({
          status: 'approved',
          approved_at: Date.now(),
          approved_by: approvedBy || 'Admin'
        })
        .eq('id', memIdStr);

      if (error) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
      }

      return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Memory approved successfully.' }) };
    }

    if (action === 'reject') {
      const { error } = await supabaseAdmin
        .from('memories')
        .update({
          status: 'rejected',
          approved_at: null,
          approved_by: null
        })
        .eq('id', memIdStr);

      if (error) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
      }

      return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Memory rejected.' }) };
    }

    if (action === 'delete') {
      // 1. Fetch memory to find storage objects to delete
      const { data: memRows } = await supabaseAdmin
        .from('memories')
        .select('*')
        .eq('id', memIdStr);

      if (Array.isArray(memRows) && memRows.length > 0) {
        const mem = memRows[0];
        const albumImgs = Array.isArray(mem.album_images) ? mem.album_images : (mem.image_url ? [mem.image_url] : []);
        const storagePathsToDelete: string[] = [];

        albumImgs.forEach((url: string) => {
          if (typeof url === 'string' && url.includes(`/storage/v1/object/public/${BUCKET_NAME}/`)) {
            const path = url.split(`/storage/v1/object/public/${BUCKET_NAME}/`)[1];
            if (path) storagePathsToDelete.push(path);
          }
        });

        if (storagePathsToDelete.length > 0) {
          await supabaseAdmin.storage
            .from(BUCKET_NAME)
            .remove(storagePathsToDelete);
        }
      }

      // 2. Delete DB row
      const { error } = await supabaseAdmin
        .from('memories')
        .delete()
        .eq('id', memIdStr);

      if (error) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
      }

      return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Memory deleted successfully.' }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown action specified.' }) };
  } catch (err: any) {
    console.error('[Admin Action Handler Exception]:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Server error during admin action' })
    };
  }
}
