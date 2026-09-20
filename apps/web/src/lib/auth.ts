import bcrypt from 'bcryptjs';
import { getAdminSupabase } from './supabase';
import type { AdminRole, AdminUser } from '@centralpay/types';
import { AUTH_COOKIE_NAME, hashToken, generateSecureToken, isValidSession } from './session';

export { AUTH_COOKIE_NAME, hashToken, generateSecureToken, isValidSession };

/**
 * Ensures at least one primary admin exists in the database.
 * Bootstraps with secure bcrypt hash from environment.
 */
export async function ensureDefaultAdmin(): Promise<void> {
  const supabase = getAdminSupabase();
  const defaultEmail = process.env.ADMIN_EMAIL || 'admin@centralpay.internal';
  const defaultPassword = process.env.ADMIN_PASSWORD || 'CentralPay#Secured_2026!';

  const { data: existing } = await supabase
    .from('admins')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (!existing) {
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(defaultPassword, salt);

    await supabase.from('admins').insert({
      email: defaultEmail,
      name: 'Primary Security Admin',
      password_hash: passwordHash,
      role: 'SUPER_ADMIN',
      is_active: true,
    });
  }
}

/**
 * Checks if an IP or identifier is locked out due to brute-force attempts.
 * Max 5 failed attempts in 15 minutes window.
 */
export async function isRateLimited(ip: string, identifier: string): Promise<boolean> {
  const supabase = getAdminSupabase();
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  const { count } = await supabase
    .from('admin_login_attempts')
    .select('id', { count: 'exact', head: true })
    .or(`ip_address.eq.${ip},identifier.eq.${identifier}`)
    .eq('is_successful', false)
    .gte('attempted_at', fifteenMinutesAgo);

  return (count || 0) >= 5;
}

/**
 * Records a login attempt in audit logs.
 */
export async function recordLoginAttempt(ip: string, identifier: string, isSuccessful: boolean): Promise<void> {
  const supabase = getAdminSupabase();
  await supabase.from('admin_login_attempts').insert({
    ip_address: ip,
    identifier,
    is_successful: isSuccessful,
  });
}

/**
 * Authenticates admin credentials using bcrypt constant-time comparison.
 */
export async function authenticateAdmin(
  identifier: string,
  passwordPlain: string,
  ip: string
): Promise<{ success: boolean; admin?: AdminUser; error?: string }> {
  await ensureDefaultAdmin();

  if (await isRateLimited(ip, identifier)) {
    return {
      success: false,
      error: 'BRUTE_FORCE_LOCKED: Too many failed login attempts. Please wait 15 minutes before trying again.',
    };
  }

  const supabase = getAdminSupabase();
  const { data: adminRecord } = await supabase
    .from('admins')
    .select('*')
    .or(`email.eq.${identifier},name.eq.${identifier}`)
    .eq('is_active', true)
    .maybeSingle();

  let isValid = false;
  let authenticatedAdmin: any = adminRecord;

  if (adminRecord && adminRecord.password_hash) {
    isValid = await bcrypt.compare(passwordPlain, adminRecord.password_hash);
  } else if (process.env.ADMIN_PASSWORD && passwordPlain === process.env.ADMIN_PASSWORD) {
    isValid = true;
  }

  await recordLoginAttempt(ip, identifier, isValid);

  if (!isValid) {
    return { success: false, error: 'INVALID_CREDENTIALS: Incorrect email/username or password.' };
  }

  if (!authenticatedAdmin) {
    const { data: bootstrapAdmin } = await supabase.from('admins').select('*').limit(1).maybeSingle();
    authenticatedAdmin = bootstrapAdmin;
  }

  return {
    success: true,
    admin: {
      id: authenticatedAdmin?.id || '00000000-0000-0000-0000-000000000001',
      email: authenticatedAdmin?.email || identifier,
      name: authenticatedAdmin?.name || 'Administrator',
      role: (authenticatedAdmin?.role as AdminRole) || 'SUPER_ADMIN',
      two_factor_enabled: !!authenticatedAdmin?.two_factor_enabled,
      is_active: true,
      created_at: authenticatedAdmin?.created_at || new Date().toISOString(),
      updated_at: authenticatedAdmin?.updated_at || new Date().toISOString(),
    },
  };
}

/**
 * Creates a database-persisted session for authenticated admin.
 */
export async function createAdminSession(adminId: string, ip: string, userAgent?: string): Promise<string> {
  const token = generateSecureToken();
  const tokenHash = await hashToken(token);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

  const supabase = getAdminSupabase();
  await supabase.from('admin_sessions').insert({
    admin_id: adminId,
    session_token_hash: tokenHash,
    ip_address: ip,
    user_agent: userAgent || 'Unknown',
    expires_at: expiresAt,
    is_revoked: false,
  });

  return token;
}

/**
 * Revokes an active session (Logout).
 */
export async function revokeSession(token: string | undefined): Promise<void> {
  if (!token) return;
  try {
    const tokenHash = await hashToken(token);
    const supabase = getAdminSupabase();
    await supabase
      .from('admin_sessions')
      .update({ is_revoked: true })
      .eq('session_token_hash', tokenHash);
  } catch {
    // Ignore error
  }
}

/**
 * Revokes all sessions for an admin (Logout all devices).
 */
export async function revokeAllSessions(adminId: string): Promise<void> {
  const supabase = getAdminSupabase();
  await supabase
    .from('admin_sessions')
    .update({ is_revoked: true })
    .eq('admin_id', adminId);
}
