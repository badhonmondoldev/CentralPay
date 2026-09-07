import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const paymentId = params.id;
    const supabase = getAdminSupabase();

    const { data: reqData, error: reqError } = await supabase
      .from('payment_requests')
      .select('*, apps(name, logo_url), payment_sources(*)')
      .eq('id', paymentId)
      .single();

    if (reqError || !reqData) {
      return NextResponse.json({ error: 'MATCH_NOT_FOUND', message: 'Payment request not found' }, { status: 404 });
    }

    // Fetch payment sources available for this app or global
    const { data: sources } = await supabase
      .from('payment_sources')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true });

    const formattedSources = (sources && sources.length > 0)
      ? sources.map((s) => ({
          id: s.id,
          provider: s.provider_label,
          accountNumber: s.account_number,
          instructions: s.instructions || `Send Money using ${s.provider_label} App`,
        }))
      : [
          {
            id: 'src_default_bkash',
            provider: 'bKash Personal',
            accountNumber: '01700000000',
            instructions: 'Send Money to our bKash personal number with the reference code.',
          },
          {
            id: 'src_default_nagad',
            provider: 'Nagad Personal',
            accountNumber: '01800000000',
            instructions: 'Send Money to our Nagad personal number with the reference code.',
          },
        ];

    return NextResponse.json({
      checkout: {
        id: reqData.id,
        reference: reqData.reference,
        amount: reqData.amount,
        currency: reqData.currency,
        description: reqData.description,
        appName: reqData.apps?.name || 'CentralPay Connected App',
        appLogo: reqData.apps?.logo_url,
        status: reqData.status,
        expiresAt: reqData.expires_at,
        paymentSources: formattedSources,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'SYSTEM_ERROR', message: (error as Error).message }, { status: 500 });
  }
}
