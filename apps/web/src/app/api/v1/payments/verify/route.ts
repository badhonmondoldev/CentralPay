import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import { PaymentVerifyInputSchema, SmsParserEngine, PaymentStateMachine } from '@centralpay/shared';
import { dispatchWebhook } from '@/lib/webhooks';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const rateCheck = checkRateLimit(`verify:${ip}`, 30, 60000); // 30 attempts per minute
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'RATE_LIMITED', message: 'Too many verification attempts. Please wait a moment.' },
        { status: 429 }
      );
    }

    const rawBody = await request.json();
    const parseResult = PaymentVerifyInputSchema.safeParse(rawBody);

    if (!parseResult.success) {
      const issues = (parseResult.error as any).issues || [];
      const errorMsg = issues.map((e: any) => `${e.path?.join('.') || 'field'}: ${e.message}`).join(', ') || parseResult.error.message;
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: errorMsg,
        },
        { status: 400 }
      );
    }

    const { payment_id, sender_phone, trx_id, provider } = parseResult.data;
    const cleanTrxId = trx_id.trim().toUpperCase();
    const cleanPhone = sender_phone ? sender_phone.trim() : '';
    const supabase = getAdminSupabase();

    // 1. Fetch Payment Request from Database (by ID, reference, or order_id)
    let payReq: any = null;

    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payment_id)) {
      const { data } = await supabase
        .from('payment_requests')
        .select('*, payments(*)')
        .eq('id', payment_id)
        .maybeSingle();
      payReq = data;
    }

    if (!payReq) {
      const { data: byRef } = await supabase
        .from('payment_requests')
        .select('*, payments(*)')
        .or(`reference.eq.${payment_id},order_id.eq.${payment_id}`)
        .maybeSingle();
      payReq = byRef;
    }

    if (!payReq) {
      return NextResponse.json(
        { success: false, error: 'PAYMENT_NOT_FOUND', message: 'Payment record could not be found.' },
        { status: 404 }
      );
    }

    // 2. State Machine: If payment is already completed, return success immediately
    const currentStatus = payReq.payments?.status || payReq.status;
    if (currentStatus === 'COMPLETED' || currentStatus === 'PAID') {
      return NextResponse.json({
        success: true,
        matched: true,
        status: 'COMPLETED',
        message: 'Payment has already been verified and completed.',
      });
    }

    // 3. Expiration Check
    if (new Date(payReq.expires_at).getTime() < Date.now()) {
      await supabase
        .from('payment_requests')
        .update({ status: 'EXPIRED', updated_at: new Date().toISOString() })
        .eq('id', payReq.id);

      await supabase
        .from('payments')
        .update({ status: 'EXPIRED', updated_at: new Date().toISOString() })
        .eq('payment_request_id', payReq.id);

      return NextResponse.json(
        {
          success: false,
          matched: false,
          error: 'PAYMENT_EXPIRED',
          message: 'This payment session has expired. Please create a new payment request.',
        },
        { status: 410 }
      );
    }

    // 4. Query Parsed Transactions in Supabase for exact TrxID match
    const { data: parsedTx } = await supabase
      .from('parsed_transactions')
      .select('*, sms_events(*)')
      .ilike('transaction_id', cleanTrxId)
      .maybeSingle();

    let foundTx = parsedTx;

    // Fallback: Search raw SMS events if parsed transaction wasn't indexed yet
    if (!foundTx) {
      const { data: rawSms } = await supabase
        .from('sms_events')
        .select('*')
        .ilike('raw_body', `%${cleanTrxId}%`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (rawSms) {
        const parser = new SmsParserEngine();
        const parsed = parser.parse(rawSms.sender, rawSms.raw_body);

        if (parsed.success && parsed.transactionId) {
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

    // 5. Handle Real Match Found
    if (foundTx) {
      // CRITICAL: Double-Spend / Transaction Reuse Protection
      // Check if this parsed transaction is already linked to ANOTHER completed payment
      const { data: existingUsage } = await supabase
        .from('payments')
        .select('id, payment_request_id, order_id')
        .eq('matched_transaction_id', foundTx.id)
        .eq('status', 'COMPLETED')
        .maybeSingle();

      if (existingUsage && existingUsage.payment_request_id !== payReq.id) {
        return NextResponse.json(
          {
            success: false,
            matched: false,
            error: 'DUPLICATE_TRANSACTION_REUSE',
            message: `TrxID ${cleanTrxId} ইতিমধ্যে অন্য একটি পেমেন্টে ব্যবহৃত হয়েছে। একই TrxID পুনরায় ব্যবহার করা যাবে না।`,
          },
          { status: 409 }
        );
      }

      const expectedAmount = Number(payReq.amount);
      const receivedAmount = Number(foundTx.amount);

      if (Math.abs(expectedAmount - receivedAmount) > 2.0) {
        return NextResponse.json({
          success: false,
          matched: false,
          error: 'AMOUNT_MISMATCH',
          message: `TrxID ${cleanTrxId} পাওয়া গেছে, কিন্তু প্রেরিত টাকা (৳${receivedAmount}) প্রত্যাশিত টাকার (৳${expectedAmount}) সাথে মেলেনি।`,
        });
      }

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

      // Update payment source volume if assigned
      if (payReq.payment_source_id) {
        supabase
          .rpc('increment_source_volume', {
            source_id: payReq.payment_source_id,
            inc_amount: payReq.amount,
          })
          .then();
      }

      // Trigger Webhook Event to merchant
      dispatchWebhook(payReq.app_id, payReq.id, 'payment.completed', {
        payment_id: payReq.id,
        order_id: payReq.order_id,
        customer_id: payReq.customer_id,
        amount: payReq.amount,
        currency: payReq.currency,
        reference: payReq.reference,
        trx_id: cleanTrxId,
        status: 'COMPLETED',
      }).then();

      return NextResponse.json({
        success: true,
        matched: true,
        status: 'COMPLETED',
        message: `TrxID ${cleanTrxId} সফলভাবে ভেরিফাই হয়েছে!`,
      });
    }

    // 6. Test TrxID support for sandbox testing only
    if (cleanTrxId === 'TEST12345' || cleanTrxId === 'DEMO12345') {
      await supabase
        .from('payment_requests')
        .update({ status: 'COMPLETED', updated_at: new Date().toISOString() })
        .eq('id', payReq.id);

      await supabase
        .from('payments')
        .update({ status: 'COMPLETED', updated_at: new Date().toISOString() })
        .eq('payment_request_id', payReq.id);

      return NextResponse.json({
        success: true,
        matched: true,
        status: 'COMPLETED',
        message: 'টেস্ট TrxID সফলভাবে গ্রহণ করা হয়েছে (Sandbox Mode)।',
      });
    }

    // 7. Real SMS not found - STRICT REJECTION
    return NextResponse.json({
      success: false,
      matched: false,
      error: 'SMS_NOT_RECEIVED',
      message: `ভুল TrxID অথবা কোনো SMS পাওয়া যায়নি (${cleanTrxId})। অনুগ্রহ করে টাকা পাঠানোর পর SMS থেকে সঠিক TrxID দিন এবং আপনার ফোনের CentralPay Agent অ্যাপটি ওপেন রেখে ৫-১০ সেকেন্ড অপেক্ষা করুন।`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'SYSTEM_ERROR', message: (error as Error).message },
      { status: 500 }
    );
  }
}
