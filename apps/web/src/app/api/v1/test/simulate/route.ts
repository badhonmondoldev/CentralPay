import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import { SmsParserEngine, evaluateMatchScore, evaluateRisk, signWebhookPayload } from '@centralpay/shared';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action = 'simulate_sms', sender = 'bKash', message_body, payment_id } = body;

    const supabase = getAdminSupabase();

    if (action === 'simulate_sms') {
      const defaultSms = message_body || `You have received Tk 500.00 from 01700000000. Fee Tk 0.00. Balance Tk 10500.00. TrxID ES8K21TX99 at 07/09/2026 10:30. Ref ES8K21.`;

      const parserEngine = new SmsParserEngine();
      const parseResult = parserEngine.parse(sender, defaultSms);

      // Find active payment requests
      const { data: activeReqs } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('status', 'WAITING_PAYMENT')
        .limit(1);

      let matchEval = null;
      let riskEval = null;

      if (activeReqs && activeReqs.length > 0 && parseResult.success) {
        const dummyParsedTx: any = {
          id: 'sim_tx_01',
          sms_event_id: 'sim_sms_01',
          provider: parseResult.provider,
          transaction_id: parseResult.transactionId || 'ES8K21TX99',
          amount: parseResult.amount || 500,
          currency: 'BDT',
          sender_number: parseResult.senderNumber,
          reference_code: parseResult.referenceCode || 'ES8K21',
          timestamp: new Date().toISOString(),
          parser_version: 'v1',
          confidence_score: parseResult.confidenceScore,
          created_at: new Date().toISOString(),
        };

        matchEval = evaluateMatchScore(activeReqs[0], dummyParsedTx);
        riskEval = evaluateRisk({
          isDuplicateTxId: false,
          isDuplicateSms: false,
          isExpiredPayment: false,
          isAmountMismatch: !matchEval.amountMatched,
          isMissingReference: !matchEval.referenceMatched,
          isDeviceRevokedOrOffline: false,
          isSafeModeEnabled: false,
          repeatAttemptCount: 1,
        });
      }

      return NextResponse.json({
        success: true,
        action: 'simulate_sms',
        parsed: parseResult,
        matchEvaluation: matchEval,
        riskEvaluation: riskEval,
      });
    }

    if (action === 'simulate_webhook') {
      const samplePayload = JSON.stringify({
        event: 'payment.completed',
        event_id: `evt_sim_${Date.now()}`,
        payment_id: payment_id || 'PAY_SIM_1001',
        amount: 500,
        currency: 'BDT',
        status: 'COMPLETED',
        timestamp: new Date().toISOString(),
      });

      const timestamp = Math.floor(Date.now() / 1000);
      const secret = 'whsec_test_secret_key_12345';
      const signature = signWebhookPayload(samplePayload, secret, timestamp, `evt_sim_${Date.now()}`);

      return NextResponse.json({
        success: true,
        action: 'simulate_webhook',
        payload: JSON.parse(samplePayload),
        headers: {
          'X-CentralPay-Signature': signature,
          'X-CentralPay-Timestamp': timestamp.toString(),
          'X-CentralPay-Event-ID': `evt_sim_${Date.now()}`,
        },
      });
    }

    return NextResponse.json({ error: 'INVALID_ACTION', message: 'Supported actions: simulate_sms, simulate_webhook' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'SYSTEM_ERROR', message: (error as Error).message }, { status: 500 });
  }
}
