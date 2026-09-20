import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import { RefundInputSchema } from '@centralpay/shared';
import { dispatchWebhook } from '@/lib/webhooks';

export async function GET() {
  try {
    const supabase = getAdminSupabase();
    const { data: refunds, error } = await supabase
      .from('refunds')
      .select('*, payments(amount, currency, reference, order_id), apps(name)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ success: false, error: { code: 'DATABASE_ERROR', message: error.message } }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: refunds || [] });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'SYSTEM_ERROR', message: (error as Error).message } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    const parseResult = RefundInputSchema.safeParse(rawBody);

    if (!parseResult.success) {
      const issues = (parseResult.error as any).issues || [];
      const errorMsg = issues.map((e: any) => `${e.path?.join('.') || 'field'}: ${e.message}`).join(', ') || parseResult.error.message;
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: errorMsg,
          },
        },
        { status: 400 }
      );
    }

    const { payment_id, amount, reason } = parseResult.data;
    const supabase = getAdminSupabase();

    // 1. Fetch Payment Record
    const { data: payment, error: payErr } = await supabase
      .from('payments')
      .select('*')
      .eq('id', payment_id)
      .maybeSingle();

    if (payErr || !payment) {
      return NextResponse.json(
        { success: false, error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment record not found.' } },
        { status: 404 }
      );
    }

    if (payment.status !== 'COMPLETED' && payment.status !== 'PAID') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATE',
            message: `Only COMPLETED or PAID transactions can be refunded. Current status is '${payment.status}'.`,
          },
        },
        { status: 400 }
      );
    }

    // 2. Check previous refunds on this payment
    const { data: existingRefunds } = await supabase
      .from('refunds')
      .select('amount')
      .eq('payment_id', payment_id)
      .eq('status', 'COMPLETED');

    const totalRefundedSoFar = (existingRefunds || []).reduce((sum, r) => sum + Number(r.amount), 0);
    const maxRefundable = Number(payment.amount) - totalRefundedSoFar;

    if (amount > maxRefundable) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EXCEEDS_REFUNDABLE_AMOUNT',
            message: `Requested refund amount (৳${amount}) exceeds remaining refundable balance (৳${maxRefundable}).`,
          },
        },
        { status: 400 }
      );
    }

    // 3. Create Refund Record
    const { data: refundRecord, error: refErr } = await supabase
      .from('refunds')
      .insert({
        payment_id,
        app_id: payment.app_id,
        amount,
        currency: payment.currency,
        reason,
        status: 'COMPLETED',
        refunded_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (refErr || !refundRecord) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: refErr?.message || 'Failed to record refund.' } },
        { status: 500 }
      );
    }

    // 4. Create Ledger Reversal Entry
    await supabase.from('ledger_entries').insert({
      payment_id,
      app_id: payment.app_id,
      amount: -amount,
      currency: payment.currency,
      type: 'REFUND',
      balance_snapshot: Number(payment.amount) - (totalRefundedSoFar + amount),
      description: `Refund processed: ${reason}`,
    });

    // 5. Update Payment Status if fully refunded
    const isFullyRefunded = totalRefundedSoFar + amount >= Number(payment.amount);
    if (isFullyRefunded) {
      await supabase
        .from('payments')
        .update({ status: 'REFUNDED', updated_at: new Date().toISOString() })
        .eq('id', payment_id);

      await supabase
        .from('payment_requests')
        .update({ status: 'REFUNDED', updated_at: new Date().toISOString() })
        .eq('id', payment.payment_request_id);
    }

    // 6. Trigger Webhook Event
    await dispatchWebhook(payment.app_id, payment.id, 'payment.refunded', {
      refund_id: refundRecord.id,
      payment_id: payment.id,
      order_id: payment.order_id,
      refunded_amount: amount,
      is_fully_refunded: isFullyRefunded,
      reason,
    });

    return NextResponse.json(
      {
        success: true,
        data: refundRecord,
        message: `৳${amount} refund processed successfully.`,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'SYSTEM_ERROR', message: (error as Error).message } },
      { status: 500 }
    );
  }
}
