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
const VOICES_FILE_PATH = 'site-config/campus-voices.json';

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

interface CampusVoice {
  id: string;
  userId?: string;
  name: string;
  department?: string;
  batch?: string;
  avatarUrl?: string;
  category: string;
  text: string;
  anonymous: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

interface CampusVoicesConfig {
  version: number;
  updatedAt: string;
  featuredVoiceId: string | null;
  voices: CampusVoice[];
}

async function loadExistingConfig(supabaseAdmin: any): Promise<CampusVoicesConfig> {
  try {
    const { data, error } = await supabaseAdmin.storage.from(BUCKET_NAME).download(VOICES_FILE_PATH);
    if (error || !data) {
      return {
        version: 1,
        updatedAt: new Date().toISOString(),
        featuredVoiceId: null,
        voices: []
      };
    }
    const text = await data.text();
    const parsed = JSON.parse(text || '{}');
    if (parsed && Array.isArray(parsed.voices)) {
      return {
        version: parsed.version || 1,
        updatedAt: parsed.updatedAt || new Date().toISOString(),
        featuredVoiceId: parsed.featuredVoiceId || null,
        voices: parsed.voices
      };
    }
    return {
      version: 1,
      updatedAt: new Date().toISOString(),
      featuredVoiceId: null,
      voices: []
    };
  } catch (e) {
    return {
      version: 1,
      updatedAt: new Date().toISOString(),
      featuredVoiceId: null,
      voices: []
    };
  }
}

async function saveConfigToStorage(supabaseAdmin: any, config: CampusVoicesConfig): Promise<boolean> {
  const buffer = Buffer.from(JSON.stringify(config, null, 2));
  const { error } = await supabaseAdmin.storage.from(BUCKET_NAME).upload(
    VOICES_FILE_PATH,
    buffer,
    { upsert: true, contentType: 'application/json' } as any
  );
  if (error) {
    throw new Error(`Failed to upload campus voices config to storage: ${error.message}`);
  }
  return true;
}

export async function handler(event: any) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-secret',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: JSON.stringify({ status: 'ok' }) };
  }

  // Handle public GET
  if (event.httpMethod === 'GET') {
    try {
      const supabaseAdmin = getAdminClient();
      const config = await loadExistingConfig(supabaseAdmin);
      const isPublic = !event.queryStringParameters || event.queryStringParameters.public === 'true';

      if (isPublic) {
        const approvedVoices = config.voices.filter(v => v.status === 'approved');
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            featuredVoiceId: config.featuredVoiceId,
            voices: approvedVoices
          })
        };
      }

      // If admin GET requested via query, check admin secret header
      const { adminSecretKey } = getServerConfig();
      const reqSecret = event.headers['x-admin-secret'] || event.headers['X-Admin-Secret'] || '';
      if (!adminSecretKey || reqSecret !== adminSecretKey) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Unauthorized: Invalid or missing x-admin-secret header.' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          ...config
        })
      };
    } catch (err: any) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, featuredVoiceId: null, voices: [] })
      };
    }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  let payload: any = {};
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON payload' }) };
  }

  const { action, voiceId } = payload;

  // Handle public get via POST
  if (action === 'get' || action === 'get_public') {
    try {
      const supabaseAdmin = getAdminClient();
      const config = await loadExistingConfig(supabaseAdmin);
      const approvedVoices = config.voices.filter(v => v.status === 'approved');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          featuredVoiceId: config.featuredVoiceId,
          voices: approvedVoices
        })
      };
    } catch (err: any) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, featuredVoiceId: null, voices: [] })
      };
    }
  }

  // All privileged actions require server environment checks and x-admin-secret comparison
  const { serviceRoleKey, adminSecretKey } = getServerConfig();
  if (!serviceRoleKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Campus Voices server is not configured: SUPABASE_SERVICE_ROLE_KEY missing.' })
    };
  }
  if (!adminSecretKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Campus Voices server is not configured: ADMIN_SECRET_KEY missing.' })
    };
  }

  const incomingSecret =
    event.headers['x-admin-secret'] ||
    event.headers['X-Admin-Secret'] ||
    payload.adminSecret ||
    '';

  if (!incomingSecret || incomingSecret !== adminSecretKey) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized: Invalid or missing x-admin-secret header.' })
    };
  }

  try {
    const supabaseAdmin = getAdminClient();
    const config = await loadExistingConfig(supabaseAdmin);

    if (action === 'get_admin') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          ...config
        })
      };
    }

    if (action === 'approve') {
      if (!voiceId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'voiceId is required to approve a voice.' }) };
      }
      const voice = config.voices.find(v => v.id === voiceId);
      if (!voice) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: `Voice ${voiceId} not found.` }) };
      }
      voice.status = 'approved';
      voice.approvedAt = new Date().toISOString();
      voice.approvedBy = 'Admin';
      config.updatedAt = new Date().toISOString();

      await saveConfigToStorage(supabaseAdmin, config);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          action: 'approve',
          voice,
          ...config
        })
      };
    }

    if (action === 'reject') {
      if (!voiceId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'voiceId is required to reject a voice.' }) };
      }
      const voice = config.voices.find(v => v.id === voiceId);
      if (!voice) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: `Voice ${voiceId} not found.` }) };
      }
      voice.status = 'rejected';
      if (config.featuredVoiceId === voiceId) {
        config.featuredVoiceId = null;
      }
      config.updatedAt = new Date().toISOString();

      await saveConfigToStorage(supabaseAdmin, config);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          action: 'reject',
          voice,
          ...config
        })
      };
    }

    if (action === 'delete') {
      if (!voiceId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'voiceId is required to delete a voice.' }) };
      }
      const initialLength = config.voices.length;
      config.voices = config.voices.filter(v => v.id !== voiceId);
      if (config.voices.length === initialLength) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: `Voice ${voiceId} not found.` }) };
      }
      if (config.featuredVoiceId === voiceId) {
        config.featuredVoiceId = null;
      }
      config.updatedAt = new Date().toISOString();

      await saveConfigToStorage(supabaseAdmin, config);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          action: 'delete',
          deletedId: voiceId,
          ...config
        })
      };
    }

    if (action === 'feature') {
      if (!voiceId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'voiceId is required to feature a voice.' }) };
      }
      const voice = config.voices.find(v => v.id === voiceId);
      if (!voice) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: `Voice ${voiceId} not found.` }) };
      }
      if (voice.status !== 'approved') {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Only approved voices can be set as Featured Voice.' }) };
      }
      config.featuredVoiceId = voiceId;
      config.updatedAt = new Date().toISOString();

      await saveConfigToStorage(supabaseAdmin, config);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          action: 'feature',
          featuredVoiceId: voiceId,
          ...config
        })
      };
    }

    if (action === 'unfeature') {
      config.featuredVoiceId = null;
      config.updatedAt = new Date().toISOString();

      await saveConfigToStorage(supabaseAdmin, config);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          action: 'unfeature',
          featuredVoiceId: null,
          ...config
        })
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: `Unknown action: ${action}` })
    };
  } catch (err: any) {
    console.error('[Manage Voices Exception]:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Server error managing campus voices.' })
    };
  }
}
