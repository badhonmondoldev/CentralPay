import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const sourceId = params.id;
    const body = await request.json();
    const { name, provider_label, account_number, account_type, priority, is_active, instructions } = body;

    const supabase = getAdminSupabase();
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };

    if (name !== undefined) updateData.name = name;
    if (provider_label !== undefined) updateData.provider_label = provider_label;
    if (account_number !== undefined) updateData.account_number = account_number;
    if (account_type !== undefined) updateData.account_type = account_type;
    if (priority !== undefined) updateData.priority = priority;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (instructions !== undefined) updateData.instructions = instructions;

    const { data: updatedSource, error } = await supabase
      .from('payment_sources')
      .update(updateData)
      .eq('id', sourceId)
      .select()
      .single();

    if (error || !updatedSource) {
      return NextResponse.json({ error: 'DATABASE_ERROR', message: error?.message || 'Payment source not found' }, { status: 500 });
    }

    return NextResponse.json({ success: true, source: updatedSource });
  } catch (error) {
    return NextResponse.json({ error: 'SYSTEM_ERROR', message: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const sourceId = params.id;
    const supabase = getAdminSupabase();

    const { error } = await supabase.from('payment_sources').delete().eq('id', sourceId);

    if (error) {
      return NextResponse.json({ error: 'DATABASE_ERROR', message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deleted: sourceId });
  } catch (error) {
    return NextResponse.json({ error: 'SYSTEM_ERROR', message: (error as Error).message }, { status: 500 });
  }
}
