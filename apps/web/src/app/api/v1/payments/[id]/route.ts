import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const paymentId = params.id;
    const supabase = getAdminSupabase();

    // 1. Fetch payment sources available in the database
    const { data: sources } = await supabase
      .from('payment_sources')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true });

    const formattedSources = (sources && sources.length > 0)
      ? sources.map((s) => ({
          id: s.id,
          provider: `${s.provider_label} Personal`,
          accountNumber: s.account_number,
          instructions: s.instructions || `Send Money to our ${s.provider_label} personal number using Send Money option.`,
        }))
      : [
          {
            id: 'src_default_bkash',
            provider: 'bKash Personal',
            accountNumber: '01700000000',
            instructions: 'Send Money to our bKash personal number using Send Money option.',
          },
          {
            id: 'src_default_nagad',
            provider: 'Nagad Personal',
            accountNumber: '01800000000',
            instructions: 'Send Money to our Nagad personal number using Send Money option.',
          },
        ];

    // 2. Fetch Payment Request
    let reqData: any = null;

    // Check by ID if UUID
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(paymentId)) {
      const { data } = await supabase
        .from('payment_requests')
        .select('*, apps(name, logo_url), payment_sources(*)')
        .eq('id', paymentId)
        .maybeSingle();
      reqData = data;
    }

    if (!reqData) {
      // Check by reference or order_id
      const { data } = await supabase
        .from('payment_requests')
        .select('*, apps(name, logo_url), payment_sources(*)')
        .or(`reference.eq.${paymentId},order_id.eq.${paymentId}`)
        .maybeSingle();
      reqData = data;
    }

    if (reqData) {
      return NextResponse.json({
        checkout: {
          id: reqData.id,
          reference: reqData.reference,
          amount: reqData.amount,
          currency: reqData.currency,
          description: reqData.description,
          appName: reqData.apps?.name || 'CentralPay Merchant',
          appLogo: reqData.apps?.logo_url,
          status: reqData.status,
          expiresAt: reqData.expires_at,
          paymentSources: formattedSources,
          redirect_url: reqData.redirect_url || 'https://centralpay-xi.vercel.app/dashboard',
        },
      });
    }

    // If ad-hoc or direct payment session
    return NextResponse.json({
      checkout: {
        id: paymentId,
        reference: `CP-${paymentId.slice(0, 6).toUpperCase()}`,
        amount: 500,
        currency: 'BDT',
        description: 'Commercial Payment Checkout',
        appName: 'CentralPay Merchant',
        status: 'WAITING_PAYMENT',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        paymentSources: formattedSources,
        redirect_url: 'https://centralpay-xi.vercel.app/dashboard',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'SYSTEM_ERROR', message: (error as Error).message }, { status: 500 });
  }
}
