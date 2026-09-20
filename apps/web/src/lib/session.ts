import { getAdminSupabase } from './supabase';

export const AUTH_COOKIE_NAME = 'centralpay_admin_session';

// SHA-256 using standard Web Crypto API (100% compatible with Edge & Node)
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Cryptographically secure token generator using Web Crypto
export function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validates a session token against database-persisted active sessions.
 * Edge-compatible (uses Web Crypto + fetch-based Supabase client).
 */
export async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const tokenHash = await hashToken(token);
    const supabase = getAdminSupabase();

    const { data: session } = await supabase
      .from('admin_sessions')
      .select('id, expires_at, is_revoked, admin_id, admins(is_active, role)')
      .eq('session_token_hash', tokenHash)
      .eq('is_revoked', false)
      .maybeSingle();

    if (!session) return false;

    // Check expiration
    if (new Date(session.expires_at).getTime() < Date.now()) {
      return false;
    }

    // Check admin is active
    if (session.admins && (session.admins as any).is_active === false) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
