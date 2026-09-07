import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import { generatePaymentReference, hashApiKey } from '@centralpay/shared';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const idempotencyKey = request.headers.get('Idempotency-Key');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'DEVICE_NOT_AUTHORIZED', message: 'Missing or invalid Authorization header' }, { status: 401 });
    }

    const apiKey = authHeader.substring(7);
    const keyHash = hashApiKey(apiKey);

    const supabase = getAdminSupabase();

    // Verify API Key
    const { data: keyRecord, error: keyError } = await supabase
      .from('api_keys')
      .select('app_id, environment, is_active')
      .eq('key_hash', keyHash)
      .single();

    if (keyError || !keyRecord || !keyRecord.is_active) {
      return NextResponse.json({ error: 'INVALID_API_KEY', message: 'API Key is invalid or revoked' }, { status: 401 });
    }

    const body = await request.json();
    const { app_id, customer_id, order_id, amount, currency = 'BDT', description, redirect_url, expires_in_minutes = 30 } = body;

    if (!customer_id || !order_id || !amount || amount <= 0) {
      return NextResponse.json({ error: 'INVALID_REQUEST', message: 'Missing required payment fields: customer_id, order_id, amount' }, { status: 400 });
    }

    // Handle Idempotency Key check (Requirement 39)
    if (idempotencyKey) {
      const { data: existingRequest } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .single();

      if (existingRequest) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        return NextResponse.json({
          success: true,
          idempotent: true,
          payment: existingRequest,
          paymentUrl: `${appUrl}/pay/${existingRequest.id}`,
        });
      }
    }

    // Fetch App Slug for unique reference prefix
    const { data: appData } = await supabase
      .from('apps')
      .select('slug')
      .eq('id', keyRecord.app_id)
      .single();

    const reference = generatePaymentReference(appData?.slug || 'CP');
    const expiresAt = new Date(Date.now() + expires_in_minutes * 60 * 1000).toISOString();

    // Insert Payment Request
    const { data: paymentReq, error: reqError } = await supabase
      .from('payment_requests')
      .insert({
        app_id: keyRecord.app_id,
        customer_id,
        order_id,
        amount,
        currency,
        reference,
        description: description || `Payment for order #${order_id}`,
        status: 'WAITING_PAYMENT',
        expires_at: expiresAt,
        redirect_url,
        idempotency_key: idempotencyKey,
      })
      .select()
      .single();

    if (reqError || !paymentReq) {
      return NextResponse.json({ error: 'DATABASE_ERROR', message: reqError?.message || 'Failed to create payment request' }, { status: 500 });
    }

    // Create Initial Payment Record
    await supabase.from('payments').insert({
      payment_request_id: paymentReq.id,
      app_id: keyRecord.app_id,
      customer_id,
      order_id,
      amount,
      currency,
      reference,
      status: 'WAITING_PAYMENT',
      risk_score: 0,
      risk_level: 'LOW',
      auto_approved: false,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    return NextResponse.json({
      success: true,
      payment: paymentReq,
      paymentUrl: `${appUrl}/pay/${paymentReq.id}`,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'SYSTEM_ERROR', message: (error as Error).message }, { status: 500 });
  }
}
