import { verifyRole, authError } from '../lib/authorization.js';

export async function handler(event: any) {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  const auth = await verifyRole(event);
  if (auth.ok === false) return authError(auth, headers);
  return { statusCode: 200, headers, body: JSON.stringify({ role: auth.role, aal: auth.user.aal, adminAuthorized: auth.role === 'admin' && auth.user.aal === 'aal2' }) };
}
