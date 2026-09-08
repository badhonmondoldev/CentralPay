export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'badhon#2006';
const AUTH_SECRET = process.env.CENTRALPAY_ENCRYPTION_KEY || 'default_super_secret_auth_key_2026';
export const AUTH_COOKIE_NAME = 'centralpay_admin_session';

export async function generateSessionToken(): Promise<string> {
  const data = new TextEncoder().encode(`admin:${ADMIN_PASSWORD}:${AUTH_SECRET}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const expected = await generateSessionToken();
  return token === expected;
}
