import { createClient } from '@supabase/supabase-js';

type Identity = { id: string; name: string; department: string; avatar: string; aal: string };
type Failure = { ok: false; status: number; error: string };
type IdentityResult = Failure | { ok: true; user: Identity };
type RoleResult = Failure | { ok: true; user: Identity; role: 'user' | 'admin' };
const fail = (status: number, error: string): Failure => ({ ok: false, status, error });

// Read env at request time, including when Express loads dotenv after imports.
function serverClient() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase server configuration');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

export function hasBearerHeader(event: any): boolean {
  return Object.keys(event.headers || {}).some(k => k.toLowerCase() === 'authorization');
}

export async function verifyIdentity(event: any): Promise<IdentityResult> {
  const entries = Object.entries(event.headers || {}).filter(([k]) => k.toLowerCase() === 'authorization');
  const value = entries.length === 1 ? entries[0][1] : null;
  const match = typeof value === 'string' && /^Bearer ([^\s,]+)$/i.exec(value);
  if (!match) return fail(401, 'A valid Bearer access token is required.');
  const token = match[1];
  try {
    const client = serverClient();
    const { data: claimsData, error: claimsError } = await client.auth.getClaims(token);
    const claims = claimsData?.claims;
    if (claimsError || !claims || claims.role !== 'authenticated' || typeof claims.sub !== 'string') {
      return fail(401, 'Invalid or expired access token.');
    }
    const { data, error } = await client.auth.getUser(token);
    const user = data?.user;
    if (error || !user || user.id !== claims.sub || !user.email_confirmed_at || user.is_anonymous) {
      return fail(401, 'A verified email account is required.');
    }
    const text = (v: unknown, fallback = '') => typeof v === 'string' ? v.trim() || fallback : fallback;
    return { ok: true, user: {
      id: user.id,
      name: text(user.user_metadata?.full_name, 'MULens Member'),
      department: text(user.user_metadata?.department),
      avatar: text(user.user_metadata?.avatar_url),
      aal: claims.aal === 'aal2' ? 'aal2' : 'aal1'
    } };
  } catch {
    return fail(503, 'Authentication service unavailable.');
  }
}

export async function verifyRole(event: any): Promise<RoleResult> {
  const identity = await verifyIdentity(event);
  if (identity.ok === false) return identity;
  try {
    const { data, error } = await serverClient().from('mulens_user_roles')
      .select('role').eq('user_id', identity.user.id).maybeSingle();
    if (error) return fail(503, 'Role verification unavailable.');
    return { ...identity, role: data?.role === 'admin' ? 'admin' : 'user' };
  } catch {
    return fail(503, 'Role verification unavailable.');
  }
}

export async function requireAdmin(event: any): Promise<RoleResult> {
  const auth = await verifyRole(event);
  if (auth.ok === false) return auth;
  if (auth.role !== 'admin') return fail(403, 'Admin role required.');
  if (auth.user.aal !== 'aal2') return fail(403, 'Admin MFA required.');
  return auth;
}

export function authError(auth: Failure, headers: Record<string, string>) {
  return { statusCode: auth.status, headers: { ...headers, 'Cache-Control': 'no-store' }, body: JSON.stringify({ error: auth.error }) };
}
