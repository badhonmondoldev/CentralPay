import { z } from 'zod';

export const PaymentRequestCreateSchema = z.object({
  app_id: z.string().uuid().optional(),
  customer_id: z.string().min(1).max(100).default('GUEST'),
  order_id: z.string().min(1).max(100),
  amount: z.coerce.number().positive('Amount must be strictly greater than 0').max(1000000, 'Amount exceeds maximum limit'),
  currency: z.string().min(3).max(5).default('BDT'),
  description: z.string().max(255).optional(),
  payment_source_id: z.string().uuid().optional(),
  expires_in_minutes: z.coerce.number().int().min(5).max(1440).default(60), // 1 hour default
  redirect_url: z.string().url('redirect_url must be a valid absolute URL').optional().nullable(),
  app_name: z.string().max(100).optional(),
});

export const PaymentVerifyInputSchema = z.object({
  payment_id: z.string().min(1, 'Payment ID or reference is required'),
  sender_phone: z.string().regex(/^(\+?88)?01[3-9]\d{8}$/, 'Must be a valid Bangladeshi mobile number (e.g. 017XXXXXXXX)').optional().or(z.literal('')),
  trx_id: z.string().min(4, 'TrxID must be at least 4 characters').max(32).regex(/^[A-Za-z0-9]+$/, 'TrxID must be alphanumeric'),
  provider: z.enum(['bKash', 'Nagad', 'Rocket', 'Upay', 'Custom']).default('bKash'),
});

export const DeviceEventPayloadSchema = z.object({
  sender: z.string().min(2).max(100),
  message_body: z.string().min(5),
  received_at: z.string().datetime().optional().default(() => new Date().toISOString()),
  raw_sms: z.string().optional(),
});

export const RefundInputSchema = z.object({
  payment_id: z.string().uuid('Valid Payment ID required'),
  amount: z.coerce.number().positive('Refund amount must be greater than 0'),
  reason: z.string().min(3, 'A valid reason for refund must be provided').max(500),
});

/**
 * Validates a redirect URL against allowed merchant domains.
 * Prevents open redirect attacks.
 */
export function validateRedirectUrl(urlStr: string | null | undefined, allowedDomains: string[] = []): boolean {
  if (!urlStr) return true; // Optional redirect
  try {
    const parsed = new URL(urlStr);
    // Disallow dangerous protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    // Localhost / standard development is allowed
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      return true;
    }

    // If no specific domain restriction configured for merchant, ensure standard valid web address
    if (!allowedDomains || allowedDomains.length === 0) {
      return parsed.protocol === 'https:' || parsed.hostname === 'localhost';
    }

    // Check against merchant registered allowlist
    const hostname = parsed.hostname.toLowerCase();
    return allowedDomains.some((domain) => {
      const cleanDomain = domain.toLowerCase().trim();
      return hostname === cleanDomain || hostname.endsWith(`.${cleanDomain}`);
    });
  } catch {
    return false;
  }
}
