import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminSupabase } from '@/lib/supabase';
import { generatePaymentReference, PaymentRequestCreateSchema, validateRedirectUrl } from '@centralpay/shared';
import { dispatchWebhook } from '@/lib/webhooks';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function GET() {
  try {
    const supabase = getAdminSupabase();

    const { data: requests, error } = await supabase
      .from('payment_requests')
      .select('*, apps(name), payments(status, matched_transaction_id)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ success: false, error: { code: 'DATABASE_ERROR', message: error.message } }, { status: 500 });
    }

    return NextResponse.json({ success: true, payment_requests: requests || [] });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'SYSTEM_ERROR', message: (error as Error).message } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const rateCheck = checkRateLimit(`pay_req:${ip}`, 120, 60000); // 120 requests/minute
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Please slow down.' } },
        { status: 429 }
      );
    }

    const idempotencyKey = request.headers.get('Idempotency-Key');
    const rawBody = await request.json();

    // 1. Strict Schema Validation
    const parseResult = PaymentRequestCreateSchema.safeParse(rawBody);
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

    const {
      amount,
      order_id,
      description,
      customer_id,
      redirect_url,
      app_name = 'CentralPay Merchant',
      expires_in_minutes,
      payment_source_id,
    } = parseResult.data;

    const supabase = getAdminSupabase();

    // 2. Fetch or create app
    let appId: string;
    let allowedDomains: string[] = [];

    const { data: defaultApp } = await supabase
      .from('apps')
      .select('id, slug, allowed_redirect_domains')
      .limit(1)
      .maybeSingle();

    if (defaultApp) {
      appId = defaultApp.id;
      allowedDomains = defaultApp.allowed_redirect_domains || [];
    } else {
      const { data: newApp } = await supabase
        .from('apps')
        .insert({
          name: app_name,
          slug: app_name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          environment: 'LIVE',
          status: 'ACTIVE',
        })
        .select()
        .single();
      appId = newApp?.id || '00000000-0000-0000-0000-000000000001';
    }

    // 3. Open-Redirect Guard
    if (redirect_url && !validateRedirectUrl(redirect_url, allowedDomains)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REDIRECT_URL',
            message: 'The specified redirect_url is not in the registered domain allowlist for this merchant.',
          },
        },
        { status: 400 }
      );
    }

    // 4. Idempotency Handling
    const requestHash = crypto.createHash('sha256').update(JSON.stringify(rawBody)).digest('hex');

    if (idempotencyKey) {
      const { data: existingRecord } = await supabase
        .from('idempotency_records')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();

      if (existingRecord) {
        if (existingRecord.request_hash !== requestHash) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'IDEMPOTENCY_CONFLICT',
                message: 'Idempotency key has already been used with a different request payload.',
              },
            },
            { status: 409 }
          );
        }
        return NextResponse.json(existingRecord.response_body, { status: existingRecord.response_status });
      }
    }

    // 5. Create Payment Request Record
    const reference = generatePaymentReference('PAY');
    const expiresAt = new Date(Date.now() + expires_in_minutes * 60 * 1000).toISOString();

    const { data: paymentReq, error: reqErr } = await supabase
      .from('payment_requests')
      .insert({
        app_id: appId,
        customer_id,
        order_id,
        amount,
        currency: 'BDT',
        reference,
        description: description || `Payment for Order #${order_id}`,
        payment_source_id: payment_source_id || null,
        status: 'WAITING_PAYMENT',
        expires_at: expiresAt,
        redirect_url: redirect_url || null,
        idempotency_key: idempotencyKey || null,
      })
      .select()
      .single();

    if (reqErr || !paymentReq) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: reqErr?.message || 'Failed to create payment' } },
        { status: 500 }
      );
    }

    // 6. Create Initial Payment Entry
    await supabase.from('payments').insert({
      payment_request_id: paymentReq.id,
      app_id: appId,
      customer_id,
      order_id,
      amount,
      currency: 'BDT',
      reference,
      status: 'WAITING_PAYMENT',
      auto_approved: false,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://centralpay-xi.vercel.app';
    const paymentUrl = `${appUrl}/pay/${paymentReq.id}`;
    const universalLink = `${appUrl}/pay/create?amount=${amount}&order_id=${encodeURIComponent(order_id)}&title=${encodeURIComponent(description || '')}${redirect_url ? `&redirect_url=${encodeURIComponent(redirect_url)}` : ''}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(paymentUrl)}`;

    const embedHtml = `<a href="${paymentUrl}" target="_blank" style="background:#55B510; color:#07090D; padding:12px 24px; border-radius:10px; font-weight:800; font-family:sans-serif; text-decoration:none; display:inline-flex; align-items:center; gap:8px; box-shadow:0 4px 15px rgba(85,181,16,0.3);">
  <span>Pay ৳${amount.toFixed(2)} with bKash / Nagad</span>
</a>`;

    const responsePayload = {
      success: true,
      data: {
        paymentId: paymentReq.id,
        reference: paymentReq.reference,
        amount: paymentReq.amount,
        currency: paymentReq.currency,
        status: paymentReq.status,
        expiresAt: paymentReq.expires_at,
        paymentUrl,
        universalLink,
        qrCode: qrUrl,
        embedHtml,
      },
    };

    // Store in idempotency store if key was supplied
    if (idempotencyKey) {
      await supabase.from('idempotency_records').insert({
        idempotency_key: idempotencyKey,
        app_id: appId,
        request_hash: requestHash,
        response_status: 201,
        response_body: responsePayload,
        expires_at: expiresAt,
      });
    }

    // Trigger asynchronous Webhook
    dispatchWebhook(appId, paymentReq.id, 'payment.created', {
      payment_id: paymentReq.id,
      order_id,
      amount,
      currency: 'BDT',
      status: 'WAITING_PAYMENT',
    }).then();

    return NextResponse.json(responsePayload, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'SYSTEM_ERROR', message: (error as Error).message } },
      { status: 500 }
    );
  }
}
