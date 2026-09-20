import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import { generatePaymentReference, validateRedirectUrl } from '@centralpay/shared';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function GET(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const rateCheck = checkRateLimit(`pay_create:${ip}`, 60, 60000);
    if (!rateCheck.allowed) {
      return new NextResponse('Too many requests. Please wait a minute before creating new payment sessions.', { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const rawAmount = searchParams.get('amount') || '500';
    const amount = parseFloat(rawAmount);

    if (isNaN(amount) || amount <= 0 || amount > 1000000) {
      return new NextResponse('Invalid payment amount. Must be between ৳1 and ৳1,000,000.', { status: 400 });
    }

    const order_id = (searchParams.get('order_id') || `ORD_${Date.now().toString().slice(-6)}`).slice(0, 100);
    const description = (searchParams.get('title') || searchParams.get('desc') || `Payment for Order #${order_id}`).slice(0, 255);
    const customer_id = (searchParams.get('customer_id') || searchParams.get('phone') || 'GUEST').slice(0, 100);
    const redirect_url = searchParams.get('redirect_url') || searchParams.get('callback_url') || null;
    const app_name = (searchParams.get('app_name') || 'CentralPay Merchant').slice(0, 100);

    const supabase = getAdminSupabase();

    // Check or create default app
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

    // Open-redirect safety verification
    if (redirect_url && !validateRedirectUrl(redirect_url, allowedDomains)) {
      return new NextResponse('Invalid redirect URL. Destination domain is not authorized.', { status: 400 });
    }

    const reference = generatePaymentReference(app_name.slice(0, 3).toUpperCase());

    // Create real authoritative payment request in Supabase
    const { data: paymentReq, error: reqErr } = await supabase
      .from('payment_requests')
      .insert({
        app_id: appId,
        customer_id,
        order_id,
        amount,
        currency: 'BDT',
        reference,
        description,
        status: 'WAITING_PAYMENT',
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
        redirect_url,
      })
      .select()
      .single();

    if (reqErr || !paymentReq) {
      return new NextResponse(`Database error creating payment session: ${reqErr?.message}`, { status: 500 });
    }

    // Initialize corresponding payments record
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

    // 307 Redirect buyer directly to the hosted payment checkout screen
    const checkoutUrl = new URL(`/pay/${paymentReq.id}`, request.url);
    return NextResponse.redirect(checkoutUrl);
  } catch (error) {
    return new NextResponse(`System error: ${(error as Error).message}`, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
