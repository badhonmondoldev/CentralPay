import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import { generatePaymentReference } from '@centralpay/shared';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const amount = parseFloat(searchParams.get('amount') || '500');
    const order_id = searchParams.get('order_id') || `ORD_${Date.now().toString().slice(-6)}`;
    const description = searchParams.get('title') || searchParams.get('desc') || `Payment for Order #${order_id}`;
    const customer_id = searchParams.get('customer_id') || searchParams.get('phone') || 'GUEST';
    const redirect_url = searchParams.get('redirect_url') || searchParams.get('callback_url') || null;
    const app_name = searchParams.get('app_name') || 'CentralPay Merchant';

    if (isNaN(amount) || amount <= 0) {
      return new NextResponse('Invalid payment amount. Must be greater than 0.', { status: 400 });
    }

    const supabase = getAdminSupabase();

    // Check or create default app
    let appId: string;
    const { data: defaultApp } = await supabase.from('apps').select('id, slug').limit(1).maybeSingle();
    if (defaultApp) {
      appId = defaultApp.id;
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

    const reference = generatePaymentReference(app_name.slice(0, 3).toUpperCase());

    // Create real payment request in Supabase
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
      return new NextResponse(`Database error creating payment: ${reqErr?.message}`, { status: 500 });
    }

    // Also initialize corresponding payments record
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

    // 302 Redirect buyer directly to the hosted payment checkout screen
    const checkoutUrl = new URL(`/pay/${paymentReq.id}`, request.url);
    return NextResponse.redirect(checkoutUrl);
  } catch (error) {
    return new NextResponse(`System error: ${(error as Error).message}`, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
