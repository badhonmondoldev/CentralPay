import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import { SmsParserEngine } from '@centralpay/shared';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { payment_id, sender_phone, trx_id, provider = 'bKash' } = body;

    if (!payment_id || !trx_id) {
      return NextResponse.json(
        { success: false, error: 'MISSING_FIELDS', message: 'Payment ID and TrxID are required' },
        { status: 400 }
      );
    }

    const cleanTrxId = trx_id.trim().toUpperCase();
    const cleanPhone = sender_phone ? sender_phone.trim() : '';
    const supabase = getAdminSupabase();

    // 1. Fetch Payment Request from Database
    const { data: payReq, error: reqErr } = await supabase
      .from('payment_requests')
      .select('*, payments(*)')
      .eq('id', payment_id)
      .single();

    if (reqErr || !payReq) {
      return NextResponse.json(
        { success: false, error: 'PAYMENT_NOT_FOUND', message: 'Payment request not found' },
        { status: 404 }
      );
    }

    // If payment is already completed, return success immediately
    if (payReq.status === 'COMPLETED' || payReq.payments?.status === 'COMPLETED') {
      return NextResponse.json({
        success: true,
        matched: true,
        status: 'COMPLETED',
        message: 'Payment has already been verified and completed.',
      });
    }

    // 2. Query Parsed Transactions in Supabase for exact TrxID match
    const { data: parsedTx } = await supabase
      .from('parsed_transactions')
      .select('*, sms_events(*)')
      .ilike('transaction_id', cleanTrxId)
      .maybeSingle();

    let foundTx = parsedTx;

    // 3. Fallback: Search raw SMS events if parsed transaction wasn't indexed yet
    if (!foundTx) {
      const { data: rawSms } = await supabase
        .from('sms_events')
        .select('*')
        .ilike('raw_body', `%${cleanTrxId}%`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (rawSms) {
        // Attempt to parse on the fly
        const parser = new SmsParserEngine();
        const parsed = parser.parse(rawSms.sender, rawSms.raw_body);

        if (parsed.success && parsed.transactionId) {
          // Save to parsed_transactions
          const { data: newParsed } = await supabase
            .from('parsed_transactions')
            .insert({
              sms_event_id: rawSms.id,
              provider: parsed.provider || provider,
              transaction_id: parsed.transactionId,
              amount: parsed.amount || payReq.amount,
              currency: parsed.currency || 'BDT',
              sender_number: parsed.senderNumber || cleanPhone,
              reference_code: parsed.referenceCode,
              timestamp: rawSms.received_at || new Date().toISOString(),
              confidence_score: 95,
            })
            .select()
            .single();

          foundTx = newParsed;
        }
      }
    }

    // 4. Handle Real Match Found
    if (foundTx) {
      // Verify Amount (allow minor rounding tolerances)
      const expectedAmount = Number(payReq.amount);
      const receivedAmount = Number(foundTx.amount);

      if (Math.abs(expectedAmount - receivedAmount) > 2.0) {
        return NextResponse.json({
          success: false,
          matched: false,
          error: 'AMOUNT_MISMATCH',
          message: `TrxID ${cleanTrxId} was found, but amount (Tk ${receivedAmount}) does not match expected amount (Tk ${expectedAmount}).`,
        });
      }

      // Complete payment atomically in database
      const paymentRecordId = payReq.payments?.id;

      if (paymentRecordId) {
        await supabase.rpc('complete_payment_atomically', {
          p_payment_id: paymentRecordId,
          p_matched_transaction_id: foundTx.id,
          p_risk_score: 0,
          p_risk_level: 'LOW',
          p_auto_approved: true,
          p_review_reason: `Customer submitted TrxID ${cleanTrxId} matched with synced SMS`,
        });
      } else {
        // Create payment record and mark completed
        await supabase.from('payments').insert({
          payment_request_id: payReq.id,
          app_id: payReq.app_id,
          customer_id: payReq.customer_id,
          order_id: payReq.order_id,
          amount: payReq.amount,
          currency: payReq.currency,
          reference: payReq.reference,
          status: 'COMPLETED',
          matched_transaction_id: foundTx.id,
          auto_approved: true,
          completed_at: new Date().toISOString(),
        });

        await supabase
          .from('payment_requests')
          .update({ status: 'COMPLETED', updated_at: new Date().toISOString() })
          .eq('id', payReq.id);
      }

      return NextResponse.json({
        success: true,
        matched: true,
        status: 'COMPLETED',
        message: `TrxID ${cleanTrxId} verified successfully via Android Agent SMS sync!`,
      });
    }

    // 5. Test/Demo Mode Fallback for Explicit TEST TrxIDs ONLY
    if (cleanTrxId.startsWith('TEST') || cleanTrxId.startsWith('DEMO')) {
      const paymentRecordId = payReq.payments?.id;
      if (paymentRecordId) {
        await supabase.rpc('complete_payment_atomically', {
          p_payment_id: paymentRecordId,
          p_matched_transaction_id: null,
          p_risk_score: 0,
          p_risk_level: 'LOW',
          p_auto_approved: true,
          p_review_reason: 'Test mode verification',
        });
      } else {
        await supabase.from('payments').insert({
          payment_request_id: payReq.id,
          app_id: payReq.app_id,
          customer_id: payReq.customer_id,
          order_id: payReq.order_id,
          amount: payReq.amount,
          currency: payReq.currency,
          reference: payReq.reference,
          status: 'COMPLETED',
          auto_approved: true,
          completed_at: new Date().toISOString(),
        });

        await supabase
          .from('payment_requests')
          .update({ status: 'COMPLETED', updated_at: new Date().toISOString() })
          .eq('id', payReq.id);
      }

      return NextResponse.json({
        success: true,
        matched: true,
        status: 'COMPLETED',
        message: 'Test TrxID verified in sandbox mode.',
      });
    }

    // 6. No SMS found for Real TrxID
    return NextResponse.json({
      success: false,
      matched: false,
      error: 'SMS_NOT_RECEIVED',
      message: `No SMS found for TrxID '${cleanTrxId}'. Please make sure you sent money to our official number and wait 5-10 seconds for the Android Agent to sync the SMS.`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'SYSTEM_ERROR', message: (error as Error).message },
      { status: 500 }
    );
  }
}
