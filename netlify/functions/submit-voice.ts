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

const ALLOWED_CATEGORIES = [
  'Campus Memory',
  'Appreciation',
  'University Life',
  'Club & Events',
  'Suggestion'
];

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

  let payload: any = {};
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON payload' }) };
  }

  const rawText = typeof payload.text === 'string' ? payload.text.trim() : '';
  if (!rawText || rawText.length < 5) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Thought/Voice text must be at least 5 characters long.' })
    };
  }

  if (rawText.length > 400) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Thought/Voice text cannot exceed 400 characters.' })
    };
  }

  let category = typeof payload.category === 'string' ? payload.category.trim() : 'Campus Memory';
  if (!ALLOWED_CATEGORIES.includes(category)) {
    category = 'Campus Memory';
  }

  const anonymous = Boolean(payload.anonymous);
  const rawName = typeof payload.name === 'string' ? payload.name.trim() : '';
  const name = anonymous ? 'Anonymous Student' : (rawName || 'Anonymous Student');
  const department = typeof payload.department === 'string' ? payload.department.trim().substring(0, 50) : '';
  const batch = typeof payload.batch === 'string' ? payload.batch.trim().substring(0, 50) : '';
  const avatarUrl = typeof payload.avatarUrl === 'string' ? payload.avatarUrl.trim() : '';
  const userId = typeof payload.userId === 'string' ? payload.userId.trim() : '';

  // Generate unique ID
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  const uniqueId = `voice_${Date.now()}_${randomSuffix}`;

  const newVoice: CampusVoice = {
    id: uniqueId,
    userId: userId || undefined,
    name: name,
    department: department || undefined,
    batch: batch || undefined,
    avatarUrl: anonymous ? undefined : (avatarUrl || undefined),
    category,
    text: rawText,
    anonymous,
    status: 'pending', // FORCED to pending on public submission
    createdAt: new Date().toISOString()
  };

  const { serviceRoleKey } = getServerConfig();
  if (!serviceRoleKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Campus Voices server is not configured: SUPABASE_SERVICE_ROLE_KEY missing.' })
    };
  }

  try {
    const supabaseAdmin = getAdminClient();
    const currentConfig = await loadExistingConfig(supabaseAdmin);

    // Prepend or append to voices list
    currentConfig.voices.unshift(newVoice);
    currentConfig.updatedAt = new Date().toISOString();

    await saveConfigToStorage(supabaseAdmin, currentConfig);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Your Campus Voice has been submitted for review.',
        voiceId: uniqueId
      })
    };
  } catch (err: any) {
    console.error('[Submit Voice Exception]:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Failed to save campus voice submission.' })
    };
  }
}
