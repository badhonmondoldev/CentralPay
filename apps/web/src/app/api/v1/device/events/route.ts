import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import {
  generateSmsFingerprint,
  SmsParserEngine,
  evaluateMatchScore,
  evaluateRisk,
} from '@centralpay/shared';

export async function POST(request: Request) {
  try {
    const deviceId = request.headers.get('X-CentralPay-Device-ID');
    const signature = request.headers.get('X-CentralPay-Signature');
    const timestampStr = request.headers.get('X-CentralPay-Timestamp');
    const nonce = request.headers.get('X-CentralPay-Nonce');

    if (!deviceId) {
      return NextResponse.json({ error: 'DEVICE_NOT_AUTHORIZED', message: 'Missing device ID header' }, { status: 401 });
    }

    const supabase = getAdminSupabase();

    // Verify Device Registration
    const { data: device, error: devError } = await supabase
      .from('devices')
      .select('*')
      .eq('id', deviceId)
      .single();

    if (devError || !device || device.status === 'REVOKED') {
      return NextResponse.json({ error: 'DEVICE_NOT_AUTHORIZED', message: 'Device is unverified or revoked' }, { status: 403 });
    }

    const bodyText = await request.text();
    const body = JSON.parse(bodyText);
    const { sender, message_body, received_at = new Date().toISOString(), raw_sms } = body;

    if (!sender || !message_body) {
      return NextResponse.json({ error: 'INVALID_REQUEST', message: 'Missing SMS sender or message body' }, { status: 400 });
    }

    // Replay attack check: verify nonce uniqueness
    if (nonce) {
      const { data: existingNonce } = await supabase
        .from('device_sessions')
        .select('id')
        .eq('nonce', nonce)
        .single();

      if (existingNonce) {
        return NextResponse.json({ error: 'REPLAY_ATTACK_PREVENTED', message: 'Nonce has already been used' }, { status: 409 });
      }

      await supabase.from('device_sessions').insert({
        device_id: deviceId,
        nonce,
        timestamp: parseInt(timestampStr || Date.now().toString(), 10),
      });
    }

    // Generate cryptographic SMS fingerprint
    const fingerprint = generateSmsFingerprint(sender, received_at, message_body, deviceId);

    // Check if SMS fingerprint already processed (Requirement 18, 26)
    const { data: existingSms } = await supabase
      .from('sms_events')
      .select('*')
      .eq('message_fingerprint', fingerprint)
      .single();

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
        device_id: deviceId,
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

    // Execute Payment Matching Engine (Requirement 24)
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

    // Evaluate Risk Engine (Requirement 27)
    const { data: systemSettings } = await supabase.from('system_settings').select('*').single();

    const riskEval = evaluateRisk({
      isDuplicateTxId: false,
      isDuplicateSms: false,
      isExpiredPayment: new Date(bestMatch.req.expires_at).getTime() < Date.now(),
      isAmountMismatch: !bestMatch.matchDetails.amountMatched,
      isMissingReference: !bestMatch.matchDetails.referenceMatched,
      isDeviceRevokedOrOffline: device.status === 'OFFLINE' || device.status === 'REVOKED',
      isSafeModeEnabled: systemSettings?.safe_mode_enabled || false,
      repeatAttemptCount: 1,
    });

    // Record Transaction Match
    const { data: paymentRecord } = await supabase
      .from('payments')
      .select('id')
      .eq('payment_request_id', bestMatch.req.id)
      .single();

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

      // Execute Atomic Payment Completion & Webhook Outbox Creation
      const autoApprove = highestScore >= 90 && !riskEval.requiresManualReview && (systemSettings?.auto_approval_enabled ?? true);

      const { data: atomicResult, error: atomicErr } = await supabase.rpc('complete_payment_atomically', {
        p_payment_id: paymentRecord.id,
        p_matched_transaction_id: parsedTx.id,
        p_risk_score: riskEval.riskScore,
        p_risk_level: riskEval.riskLevel,
        p_auto_approved: autoApprove,
        p_review_reason: riskEval.flags.join('; '),
      });

      return NextResponse.json({
        success: true,
        matched: true,
        payment_id: paymentRecord.id,
        reference: bestMatch.req.reference,
        match_score: highestScore,
        risk_evaluation: riskEval,
        result: atomicResult || atomicErr,
      });
    }

    return NextResponse.json({ success: true, matched: false });
  } catch (error) {
    return NextResponse.json({ error: 'SYSTEM_ERROR', message: (error as Error).message }, { status: 500 });
  }
}
