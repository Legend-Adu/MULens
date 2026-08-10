import { createClient } from '@supabase/supabase-js';

function getServerConfig() {
  return {
    supabaseUrl:
      process.env.VITE_SUPABASE_URL ||
      'https://ggblwkqprciadgdxibip.supabase.co',

    serviceRoleKey:
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',

    adminSecretKey:
      process.env.ADMIN_SECRET_KEY || ''
  };
}
const BUCKET_NAME = 'mulens-media';

function getAdminClient() {
  const { supabaseUrl, serviceRoleKey } = getServerConfig();

  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not configured in server environment variables.'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
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
  const { serviceRoleKey, adminSecretKey } = getServerConfig();
  // Ensure server environment is configured for privileged operations
  if (!serviceRoleKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY not configured.' }) };
  }
  if (!adminSecretKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfiguration: ADMIN_SECRET_KEY not configured.' }) };
  }

  const requestAdminSecret = event.headers['x-admin-secret'] || event.headers['X-Admin-Secret'] || (event.headers['authorization'] ? event.headers['authorization'].replace('Bearer ', '') : '');

  if (requestAdminSecret !== adminSecretKey) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized: Invalid or missing x-admin-secret header.' })
    };
  }

  try {
    const supabaseAdmin = getAdminClient();
    const payload = JSON.parse(event.body || '{}');
    const { action, memId, custom } = payload;

    const filePath = 'site-config/potw.json';

    if (action === 'clear') {
      // remove file if exists
      await supabaseAdmin.storage.from(BUCKET_NAME).remove([filePath]);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, cleared: true }) };
    }

    if (action !== 'set') {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown action' }) };
    }

    let potwObj: any = null;

    if (memId) {
      // fetch memory row to use its canonical storage URL
      const { data: rows, error: fetchErr } = await supabaseAdmin.from('memories').select('*').eq('id', String(memId)).limit(1);
      if (fetchErr) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: fetchErr.message }) };
      }
      if (Array.isArray(rows) && rows.length > 0) {
        const row = rows[0];
        const albumImgsRaw = row.album_images || row.albumImages || [];
        const albumImages = Array.isArray(albumImgsRaw) ? albumImgsRaw : (typeof albumImgsRaw === 'string' ? JSON.parse(albumImgsRaw) : []);
        const mainImg = row.image_url || row.imageUrl || (albumImages.length > 0 ? albumImages[0] : '');

        potwObj = {
          type: 'memory',
          memId: String(row.id),
          title: row.title || '',
          imageUrl: mainImg || '',
          author: row.author || null,
          location: row.location || '',
          date: row.date || '',
          badgeLabel: row.badge_label || ''
        };
      } else {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Memory not found' }) };
      }
    } else if (custom && custom.imageUrl) {
      potwObj = { type: 'custom', memId: null, ...custom };
    } else {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'memId or custom.imageUrl is required' }) };
    }

    const buffer = Buffer.from(JSON.stringify(potwObj));

    // upload (upsert)
    const { error: uploadErr } = await supabaseAdmin.storage.from(BUCKET_NAME).upload(filePath, buffer, { upsert: true, contentType: 'application/json' } as any);
    if (uploadErr) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: uploadErr.message }) };
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(filePath);

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, potw: potwObj, publicUrl: publicUrlData?.publicUrl || null }) };
  } catch (err: any) {
    console.error('[Set POTW Handler Exception]:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message || 'Server error' }) };
  }
}
