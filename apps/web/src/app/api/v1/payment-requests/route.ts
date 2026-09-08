import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import { generatePaymentReference } from '@centralpay/shared';

export async function GET() {
  try {
    const supabase = getAdminSupabase();

    const { data: requests, error } = await supabase
      .from('payment_requests')
      .select('*, apps(name), payments(status, matched_transaction_id)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: 'DATABASE_ERROR', message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, payment_requests: requests || [] });
  } catch (error) {
    return NextResponse.json({ error: 'SYSTEM_ERROR', message: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, order_id, description, customer_id = 'GUEST', redirect_url, app_name = 'CentralPay Merchant' } = body;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'INVALID_AMOUNT', message: 'Amount must be greater than 0' }, { status: 400 });
    }

    const cleanOrderId = order_id || `ORD_${Date.now().toString().slice(-6)}`;
    const cleanDesc = description || `Payment for Order #${cleanOrderId}`;

    const supabase = getAdminSupabase();

    // Check or create default app
    let appId: string;
    const { data: defaultApp } = await supabase.from('apps').select('id').limit(1).maybeSingle();
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

    const reference = generatePaymentReference('PAY');

    // Create payment request
    const { data: paymentReq, error: reqErr } = await supabase
      .from('payment_requests')
      .insert({
        app_id: appId,
        customer_id,
        order_id: cleanOrderId,
        amount: numAmount,
        currency: 'BDT',
        reference,
        description: cleanDesc,
        status: 'WAITING_PAYMENT',
        expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
        redirect_url: redirect_url || null,
      })
      .select()
      .single();

    if (reqErr || !paymentReq) {
      return NextResponse.json({ error: 'DATABASE_ERROR', message: reqErr?.message }, { status: 500 });
    }

    // Initialize payments table entry
    await supabase.from('payments').insert({
      payment_request_id: paymentReq.id,
      app_id: appId,
      customer_id,
      order_id: cleanOrderId,
      amount: numAmount,
      currency: 'BDT',
      reference,
      status: 'WAITING_PAYMENT',
      auto_approved: false,
    });

    const appUrl = 'https://centralpay-xi.vercel.app';
    const paymentUrl = `${appUrl}/pay/${paymentReq.id}`;
    const universalLink = `${appUrl}/pay/create?amount=${numAmount}&order_id=${encodeURIComponent(cleanOrderId)}&title=${encodeURIComponent(cleanDesc)}${redirect_url ? `&redirect_url=${encodeURIComponent(redirect_url)}` : ''}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(paymentUrl)}`;

    const embedHtml = `<a href="${paymentUrl}" target="_blank" style="background:#55B510; color:#07090D; padding:12px 24px; border-radius:10px; font-weight:800; font-family:sans-serif; text-decoration:none; display:inline-flex; align-items:center; gap:8px; box-shadow:0 4px 15px rgba(85,181,16,0.3);">
  <span>Pay ৳${numAmount.toFixed(2)} with bKash / Nagad</span>
</a>`;

    return NextResponse.json({
      success: true,
      payment_request: paymentReq,
      payment_url: paymentUrl,
      universal_link: universalLink,
      qr_url: qrUrl,
      embed_html: embedHtml,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'SYSTEM_ERROR', message: (error as Error).message }, { status: 500 });
  }
}
