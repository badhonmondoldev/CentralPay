import crypto from 'node:crypto';

/**
 * Generates an API key pair for an application.
 * Environment can be 'live' or 'test'.
 * Type can be 'publishable' or 'secret'.
 * Example secret key: cp_live_sec_7a8b9c... or cp_test_sec_1a2b3c...
 * Example publishable key: cp_live_pub_...
 */
export function generateApiKey(env: 'live' | 'test', type: 'secret' | 'publishable'): { key: string; prefix: string; hash: string } {
  const envPrefix = env === 'live' ? 'live' : 'test';
  const typePrefix = type === 'secret' ? 'sec' : 'pub';
  const randomHex = crypto.randomBytes(24).toString('hex');
  
  const key = `cp_${envPrefix}_${typePrefix}_${randomHex}`;
  const prefix = key.substring(0, 16);
  const hash = hashApiKey(key);

  return { key, prefix, hash };
}

/**
 * Creates a SHA-256 hash of an API key for safe storage in the database.
 */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Computes HMAC-SHA256 signature for outgoing webhook payload.
 */
export function signWebhookPayload(payload: string, secret: string, timestamp: number, eventId: string): string {
  const dataToSign = `${timestamp}.${eventId}.${payload}`;
  return crypto.createHmac('sha256', secret).update(dataToSign).digest('hex');
}

/**
 * Verifies incoming webhook signature against calculated signature.
 */
export function verifyWebhookSignature(payload: string, signature: string, secret: string, timestamp: number, eventId: string): boolean {
  const expectedSignature = signWebhookPayload(payload, secret, timestamp, eventId);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

/**
 * Computes a SHA-256 fingerprint for SMS events to ensure duplicate detection.
 * Requirement 18: sender + timestamp + normalized message + device ID -> SHA-256
 */
export function generateSmsFingerprint(sender: string, timestamp: string | number, message: string, deviceId: string): string {
  const normalizedMessage = message.trim().replace(/\s+/g, ' ').toLowerCase();
  const rawInput = `${sender.trim()}|${timestamp}|${normalizedMessage}|${deviceId.trim()}`;
  return crypto.createHash('sha256').update(rawInput).digest('hex');
}

/**
 * Computes HMAC-SHA256 signature for Android device payloads.
 */
export function signDevicePayload(payload: string, deviceSecret: string, timestamp: number, nonce: string): string {
  const dataToSign = `${timestamp}.${nonce}.${payload}`;
  return crypto.createHmac('sha256', deviceSecret).update(dataToSign).digest('hex');
}

/**
 * Verifies Android device payload signature to prevent tampering & replay attacks.
 */
export function verifyDeviceSignature(payload: string, signature: string, deviceSecret: string, timestamp: number, nonce: string): boolean {
  try {
    const expectedSignature = signDevicePayload(payload, deviceSecret, timestamp, nonce);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch {
    return false;
  }
}
