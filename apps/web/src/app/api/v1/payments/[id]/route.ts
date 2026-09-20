import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const paymentId = params.id;
    const supabase = getAdminSupabase();

    // 1. Fetch Payment Request
    let reqData: any = null;

    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(paymentId)) {
      const { data } = await supabase
        .from('payment_requests')
        .select('*, apps(name, logo_url, allowed_redirect_domains), payment_sources(*)')
        .eq('id', paymentId)
        .maybeSingle();
      reqData = data;
    }

    if (!reqData) {
      const { data: byRef } = await supabase
        .from('payment_requests')
        .select('*, apps(name, logo_url, allowed_redirect_domains), payment_sources(*)')
        .or(`reference.eq.${paymentId},order_id.eq.${paymentId}`)
        .maybeSingle();
      reqData = byRef;
    }

    const requestedAmount = reqData ? Number(reqData.amount) : 500;

    // 2. Smart Payment Source Routing Engine
    // Filters active sources, verifies daily limit has not been exceeded,
    // and checks per-transaction capacity.
    const { data: allSources } = await supabase
      .from('payment_sources')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true });

    let eligibleSources = (allSources || []).filter((s) => {
      const dailyLimit = Number(s.daily_limit || 100000);
      const todayReceived = Number(s.today_received_amount || 0);
      const perTxLimit = Number(s.per_tx_limit || 25000);

      // Check daily limit remaining
      if (todayReceived + requestedAmount > dailyLimit) {
        return false;
      }
      // Check per-transaction limit
      if (requestedAmount > perTxLimit) {
        return false;
      }
      return true;
    });

    // Fallback if all sources exceeded limit, use active sources to avoid blocking payments
    if (eligibleSources.length === 0 && allSources && allSources.length > 0) {
      eligibleSources = allSources;
    }

    const formattedSources = (eligibleSources && eligibleSources.length > 0)
      ? eligibleSources.map((s) => ({
          id: s.id,
          provider: `${s.provider_label} Personal`,
          accountNumber: s.account_number,
          instructions: s.instructions || `Send Money to our ${s.provider_label} personal number using Send Money option.`,
          dailyLimitRemaining: Math.max(0, Number(s.daily_limit || 100000) - Number(s.today_received_amount || 0)),
        }))
      : [
          {
            id: 'src_default_bkash',
            provider: 'bKash Personal',
            accountNumber: '01700000000',
            instructions: 'Send Money to our bKash personal number using Send Money option.',
            dailyLimitRemaining: 100000,
          },
          {
            id: 'src_default_nagad',
            provider: 'Nagad Personal',
            accountNumber: '01800000000',
            instructions: 'Send Money to our Nagad personal number using Send Money option.',
            dailyLimitRemaining: 100000,
          },
        ];

    if (reqData) {
      // Expiration verification
      const isExpired = new Date(reqData.expires_at).getTime() < Date.now();
      const effectiveStatus = isExpired && reqData.status === 'WAITING_PAYMENT' ? 'EXPIRED' : reqData.status;

      return NextResponse.json({
        checkout: {
          id: reqData.id,
          reference: reqData.reference,
          amount: reqData.amount,
          currency: reqData.currency,
          description: reqData.description,
          appName: reqData.apps?.name || 'CentralPay Merchant',
          appLogo: reqData.apps?.logo_url,
          status: effectiveStatus,
          expiresAt: reqData.expires_at,
          paymentSources: formattedSources,
          redirect_url: reqData.redirect_url || 'https://centralpay-xi.vercel.app/dashboard',
        },
      });
    }

    // Default simulation fallback
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
