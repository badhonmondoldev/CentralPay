import { getAdminSupabase } from './supabase';
import { signWebhookPayload } from '@centralpay/shared';
import type { WebhookEventType } from '@centralpay/types';

export const RETRY_DELAYS_MS = [
  10 * 1000,        // Attempt 1: 10s
  30 * 1000,        // Attempt 2: 30s
  2 * 60 * 1000,    // Attempt 3: 2m
  10 * 60 * 1000,   // Attempt 4: 10m
];

export async function dispatchWebhook(
  appId: string,
  paymentId: string,
  eventType: WebhookEventType,
  payloadData: Record<string, unknown>
): Promise<{ success: boolean; deliveryId?: string; error?: string }> {
  try {
    const supabase = getAdminSupabase();

    // 1. Fetch application webhook configuration
    const { data: app } = await supabase
      .from('apps')
      .select('id, webhook_url, webhook_secret')
      .eq('id', appId)
      .maybeSingle();

    if (!app || !app.webhook_url) {
      return { success: true }; // No webhook configured for this app
    }

    const eventId = crypto.randomUUID();
    const timestamp = Date.now();
    const secret = app.webhook_secret || process.env.WEBHOOK_SIGNING_SECRET || 'centralpay_default_sec';

    const fullPayload = {
      event_id: eventId,
      event_type: eventType,
      payment_id: paymentId,
      app_id: appId,
      timestamp,
      data: payloadData,
    };

    const payloadString = JSON.stringify(fullPayload);
    const signature = signWebhookPayload(payloadString, secret, timestamp, eventId);

    // 2. Insert into webhook_events outbox
    const { data: eventRecord, error: eventErr } = await supabase
      .from('webhook_events')
      .insert({
        id: eventId,
        app_id: appId,
        payment_id: paymentId,
        event_type: eventType,
        payload: fullPayload,
      })
      .select('id')
      .single();

    if (eventErr || !eventRecord) {
      return { success: false, error: eventErr?.message };
    }

    // 3. Attempt immediate delivery
    let responseCode: number | undefined;
    let responseBody: string | undefined;
    let isSuccess = false;

    try {
      const response = await fetch(app.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'CentralPay-Webhook-Engine/1.0',
          'X-CentralPay-Signature': signature,
          'X-CentralPay-Timestamp': timestamp.toString(),
          'X-CentralPay-Event-Id': eventId,
        },
        body: payloadString,
        signal: AbortSignal.timeout(8000), // 8s timeout
      });

      responseCode = response.status;
      responseBody = (await response.text()).slice(0, 500);
      isSuccess = response.ok;
    } catch (deliveryErr) {
      responseBody = (deliveryErr as Error).message;
    }

    const nextRetryAt = isSuccess
      ? null
      : new Date(Date.now() + RETRY_DELAYS_MS[0]).toISOString();

    const { data: deliveryRecord } = await supabase
      .from('webhook_deliveries')
      .insert({
        webhook_event_id: eventId,
        app_id: appId,
        target_url: app.webhook_url,
        status: isSuccess ? 'SUCCESS' : 'RETRYING',
        attempt_count: 1,
        response_code: responseCode || 0,
        response_body: responseBody,
        signature,
        next_retry_at: nextRetryAt,
        delivered_at: isSuccess ? new Date().toISOString() : null,
      })
      .select('id')
      .single();

    return { success: true, deliveryId: deliveryRecord?.id };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
