import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const deviceId = request.headers.get('X-CentralPay-Device-ID');

    if (!deviceId) {
      return NextResponse.json({ error: 'MISSING_DEVICE_ID', message: 'X-CentralPay-Device-ID header required' }, { status: 400 });
    }

    const body = await request.json();
    const { battery_level, network_status, app_version, os_version, pending_queue_count } = body;

    const supabase = getAdminSupabase();

    const { data: updatedDevice, error } = await supabase
      .from('devices')
      .update({
        status: 'ONLINE',
        last_heartbeat: new Date().toISOString(),
        battery_level,
        network_status,
        app_version,
        os_version,
        pending_queue_count,
        updated_at: new Date().toISOString(),
      })
      .eq('id', deviceId)
      .select()
      .single();

    if (error || !updatedDevice) {
      return NextResponse.json({ error: 'DEVICE_NOT_FOUND', message: 'Registered device not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      device_id: updatedDevice.id,
      status: updatedDevice.status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'SYSTEM_ERROR', message: (error as Error).message }, { status: 500 });
  }
}
