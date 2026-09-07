import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getAdminSupabase();
    const { data: sources, error } = await supabase
      .from('payment_sources')
      .select('*')
      .order('priority', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'DATABASE_ERROR', message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, sources });
  } catch (error) {
    return NextResponse.json({ error: 'SYSTEM_ERROR', message: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, provider_label, account_number, account_type = 'personal', currency = 'BDT', priority = 1, instructions } = body;

    if (!name || !provider_label || !account_number) {
      return NextResponse.json({ error: 'INVALID_REQUEST', message: 'Name, provider label, and account number required' }, { status: 400 });
    }

    const supabase = getAdminSupabase();
    const { data: newSource, error } = await supabase
      .from('payment_sources')
      .insert({
        name,
        provider_label,
        account_number,
        account_type,
        currency,
        priority,
        instructions: instructions || `Send Money to ${account_number} using ${provider_label}`,
        is_active: true,
      })
      .select()
      .single();

    if (error || !newSource) {
      return NextResponse.json({ error: 'DATABASE_ERROR', message: error?.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, source: newSource }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'SYSTEM_ERROR', message: (error as Error).message }, { status: 500 });
  }
}
