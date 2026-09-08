import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminSupabase } from '@/lib/supabase';
import {
  generateSmsFingerprint,
  SmsParserEngine,
  evaluateMatchScore,
  evaluateRisk,
} from '@centralpay/shared';

function toUUID(id: string): string {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id.toLowerCase();
  }
  const hash = crypto.createHash('md5').update(id).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

export async function POST(request: Request) {
  try {
    const rawDeviceId = request.headers.get('X-CentralPay-Device-ID') || 'default-agent-device';
    const normalizedDeviceId = toUUID(rawDeviceId);
    const signature = request.headers.get('X-CentralPay-Signature');
    const timestampStr = request.headers.get('X-CentralPay-Timestamp');
    const nonce = request.headers.get('X-CentralPay-Nonce');

    const supabase = getAdminSupabase();

    // 1. Verify or Auto-Register Device
    let { data: device } = await supabase
      .from('devices')
      .select('*')
      .eq('id', normalizedDeviceId)
      .maybeSingle();

    if (!device) {
      const { data: newDev, error: devErr } = await supabase
        .from('devices')
        .insert({
          id: normalizedDeviceId,
          device_name: `Android Agent (${rawDeviceId.slice(0, 16)})`,
          public_key: signature || 'auto_registered',
          status: 'ONLINE',
          last_heartbeat: new Date().toISOString(),
          battery_level: 95,
          network_status: 'ONLINE',
          app_version: 'v1.0.0',
        })
        .select()
        .maybeSingle();

      if (devErr) {
        // Concurrent insert or existing fallback
        const { data: retryDev } = await supabase
          .from('devices')
          .select('*')
          .eq('id', normalizedDeviceId)
          .maybeSingle();
        device = retryDev;
      } else {
        device = newDev;
      }
    } else {
      // Update Heartbeat and Status
      await supabase
        .from('devices')
        .update({
          status: 'ONLINE',
          last_heartbeat: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', normalizedDeviceId);
    }

    if (device && device.status === 'REVOKED') {
      return NextResponse.json({ error: 'DEVICE_NOT_AUTHORIZED', message: 'Device is revoked' }, { status: 403 });
    }

    const bodyText = await request.text();
    const body = JSON.parse(bodyText);
    const { sender, message_body, received_at = new Date().toISOString(), raw_sms } = body;

    if (!sender || !message_body) {
      return NextResponse.json({ error: 'INVALID_REQUEST', message: 'Missing SMS sender or message body' }, { status: 400 });
    }

    // Replay attack check: verify nonce uniqueness
    if (nonce && device) {
      const { data: existingNonce } = await supabase
        .from('device_sessions')
        .select('id')
        .eq('nonce', nonce)
        .maybeSingle();

      if (existingNonce) {
        return NextResponse.json({ error: 'REPLAY_ATTACK_PREVENTED', message: 'Nonce has already been used' }, { status: 409 });
      }

      await supabase.from('device_sessions').insert({
        device_id: device.id,
        nonce,
        timestamp: parseInt(timestampStr || Date.now().toString(), 10),
      });
    }

    // Generate cryptographic SMS fingerprint
    const fingerprint = generateSmsFingerprint(sender, received_at, message_body, normalizedDeviceId);

    // Check if SMS fingerprint already processed (Requirement 18, 26)
    const { data: existingSms } = await supabase
      .from('sms_events')
      .select('*')
      .eq('message_fingerprint', fingerprint)
      .maybeSingle();

    if (existingSms) {
      return NextResponse.json({
        success: true,
        duplicate: true,
        message: 'SMS event already processed',
        sms_event_id: existingSms.id,
      });
    }

    // Insert SMS Event
    const { data: smsEvent, error: smsErr } = await supabase
      .from('sms_events')
      .insert({
        device_id: normalizedDeviceId,
        sender,
        message_fingerprint: fingerprint,
        raw_body: raw_sms || message_body,
        sanitized_body: message_body,
        received_at,
        synced_at: new Date().toISOString(),
        is_duplicate: false,
      })
      .select()
      .single();

    if (smsErr || !smsEvent) {
      return NextResponse.json({ error: 'DATABASE_ERROR', message: smsErr?.message || 'Failed to record SMS event' }, { status: 500 });
    }

    // Execute SMS Parser Engine (Requirement 17)
    const parserEngine = new SmsParserEngine();
    const parseResult = parserEngine.parse(sender, message_body);

    if (!parseResult.success || !parseResult.transactionId || !parseResult.amount) {
      return NextResponse.json({
        success: true,
        parsed: false,
        sms_event_id: smsEvent.id,
        errors: parseResult.errors,
      });
    }

    // Record Parsed Transaction
    const { data: parsedTx, error: txErr } = await supabase
      .from('parsed_transactions')
      .insert({
        sms_event_id: smsEvent.id,
        provider: parseResult.provider,
        transaction_id: parseResult.transactionId,
        amount: parseResult.amount,
        currency: parseResult.currency,
        sender_number: parseResult.senderNumber,
        reference_code: parseResult.referenceCode,
        timestamp: parseResult.extractedTimestamp || received_at,
        parser_version: 'v1',
        confidence_score: parseResult.confidenceScore,
      })
      .select()
      .single();

    if (txErr) {
      if (txErr.code === '23505') {
        return NextResponse.json({
          success: true,
          duplicate_transaction: true,
          message: 'Transaction ID already credited previously.',
        });
      }
      return NextResponse.json({ error: 'DATABASE_ERROR', message: txErr.message }, { status: 500 });
    }

    // Execute Payment Matching Engine against pending payments
    const { data: pendingRequests } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('status', 'WAITING_PAYMENT')
      .gte('expires_at', new Date().toISOString());

    if (!pendingRequests || pendingRequests.length === 0) {
      return NextResponse.json({
        success: true,
        matched: false,
        parsed_transaction: parsedTx,
        message: 'No pending payment requests found in current time window',
      });
    }

    // Evaluate match scores against candidates
    let bestMatch: any = null;
    let highestScore = -1;

    for (const req of pendingRequests) {
      const matchDetails = evaluateMatchScore(req, parsedTx || parseResult);
      if (matchDetails.totalScore > highestScore) {
        highestScore = matchDetails.totalScore;
        bestMatch = { req, matchDetails };
      }
    }

    if (!bestMatch || highestScore < 60) {
      return NextResponse.json({
        success: true,
        matched: false,
        parsed_transaction: parsedTx,
        score: highestScore,
        message: 'Match confidence below threshold (<60)',
      });
    }

    // Complete matched payment
    const { data: paymentRecord } = await supabase
      .from('payments')
      .select('id')
      .eq('payment_request_id', bestMatch.req.id)
      .maybeSingle();

    if (paymentRecord) {
      await supabase.from('transaction_matches').insert({
        payment_id: paymentRecord.id,
        parsed_transaction_id: parsedTx.id,
        score: highestScore,
        amount_matched: bestMatch.matchDetails.amountMatched,
        tx_id_matched: bestMatch.matchDetails.txIdMatched,
        reference_matched: bestMatch.matchDetails.referenceMatched,
        source_matched: true,
        time_window_matched: bestMatch.matchDetails.timeWindowMatched,
      });

      const { data: atomicResult } = await supabase.rpc('complete_payment_atomically', {
        p_payment_id: paymentRecord.id,
        p_matched_transaction_id: parsedTx.id,
        p_risk_score: 0,
        p_risk_level: 'LOW',
        p_auto_approved: true,
        p_review_reason: 'Real SMS received and matched by Android Agent',
      });

      return NextResponse.json({
        success: true,
        matched: true,
        payment_id: paymentRecord.id,
        reference: bestMatch.req.reference,
        match_score: highestScore,
        result: atomicResult,
      });
    }

    return NextResponse.json({ success: true, matched: false, parsed_transaction: parsedTx });
  } catch (error) {
    return NextResponse.json({ error: 'SYSTEM_ERROR', message: (error as Error).message }, { status: 500 });
  }
}
