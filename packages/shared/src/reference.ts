import crypto from 'node:crypto';

/**
 * Generates a short, collision-resistant, human-readable reference code.
 * Example: ES8K21, NB7Q91, GS4M82
 * Format: [App Prefix (2 chars)][4 Random Uppercase Alphanumeric chars (excluding ambiguous I, O, 0, 1)]
 */
export function generatePaymentReference(appSlug?: string): string {
  let prefix = 'CP';
  if (appSlug && appSlug.length >= 2) {
    const sanitized = appSlug.replace(/[^a-zA-Z]/g, '').toUpperCase();
    if (sanitized.length >= 2) {
      prefix = sanitized.substring(0, 2);
    }
  }

  // Safe characters excluding easily confused ones (I, O, 0, 1)
  const charset = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const randomBytes = crypto.randomBytes(4);
  let randomStr = '';
  for (let i = 0; i < 4; i++) {
    const randomIndex = randomBytes[i] % charset.length;
    randomStr += charset[randomIndex];
  }

  return `${prefix}${randomStr}`;
}
