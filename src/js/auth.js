
import { supabase, sessionHeaders } from './supabase.js';

// Redirect users back to MULens after email verification.
const getRedirectUrl = () =>
  `${window.location.origin}${window.location.pathname}`;

// Register a real user in Supabase Authentication.
export async function registerWithEmail({
  name,
  email,
  password,
  studentId = '',
  dept = '',
  batch = '',
  avatar = ''
}) {
  if (!name?.trim() || !email?.trim() || !password) {
    throw new Error('Name, email and password are required.');
  }

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      emailRedirectTo: getRedirectUrl(),
      data: {
        full_name: name.trim(),
        student_id: studentId.trim(),
        department: dept.trim(),
        batch: batch.trim(),
        avatar_url: avatar.trim()
      }
    }
  });

  if (error) throw error;

  return {
    user: data.user,
    needsEmailConfirmation: !data.session
  };
}

// Log in using Supabase email/password authentication.
export async function loginWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password
  });

  if (error) throw error;

  return data.user;
}

// Log out from the Supabase session.
export async function logoutFromSupabase() {
  const { error } = await supabase.auth.signOut();

  if (error) throw error;
}

// Get the currently authenticated user.
export async function getAuthenticatedUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) throw error;

  return data.user;
}

// Resend the signup confirmation email.
export async function resendConfirmationEmail(email) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email.trim().toLowerCase(),
    options: {
      emailRedirectTo: getRedirectUrl()
    }
  });

  if (error) throw error;
}

// Watch login, logout and session changes.
export function watchAuthChanges(callback) {
  const { data } = supabase.auth.onAuthStateChange(
    (event, session) => {
      callback(event, session);
    }
  );

  return () => data.subscription.unsubscribe();
}

// Read-only diagnostic: no token or personal data is returned to the caller.
export async function checkServerAuthorization() {
  const response = await fetch('/api/auth-status', {
    headers: await sessionHeaders(false), cache: 'no-store'
  });
  return { status: response.status, ...(await response.json()) };
}

// Read-only diagnostic requests: unknown actions cannot modify records.
export async function testAdminAuthorization() {
  const headers = { 'Content-Type': 'application/json', ...(await sessionHeaders(false)) };
  const results = {};
  for (const endpoint of ['admin-action', 'set-potw', 'manage-events', 'manage-voices']) {
    const response = await fetch(`/api/${endpoint}`, {
      method: 'POST', headers, body: JSON.stringify({ action: '__authorization_probe__' })
    });
    results[endpoint] = response.status;
  }
  return results;
}
